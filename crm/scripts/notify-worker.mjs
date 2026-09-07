/**
 * Drains the notification outbox.
 *
 *   node scripts/notify-worker.mjs           one pass, then exit
 *   node scripts/notify-worker.mjs --loop    stay up, poll every 30s
 *
 * Run it from SQL Server Agent, Task Scheduler or a systemd timer. It is
 * deliberately a separate process from the web app: a delivery that hangs on a
 * slow provider must not hold a request thread, and restarting the worker must
 * not restart the CRM.
 *
 * Claiming is done with an UPDATE ... OUTPUT that flips PENDING to SENDING in
 * one statement, so two workers racing cannot both take the same row. That
 * matters the first time someone starts a second copy "just to catch up" and
 * every customer gets two messages.
 *
 * No provider is configured yet. Rather than pretend, an unconfigured channel
 * leaves its rows PENDING and the worker says so. Marking them SENT would lose
 * the messages permanently and look like success.
 */
import { connect } from "./_conn.mjs";

const loop = process.argv.includes("--loop");
const BATCH = 25;
const MAX_ATTEMPTS = 5;
const POLL_MS = 30_000;

class NotConfigured extends Error {
  constructor(what) {
    super(`not configured: ${what}`);
    this.notConfigured = true;
  }
}

/**
 * Channel adapters. Each returns a provider message id on success, or throws.
 * They refuse rather than fake — filling one in means replacing the throw with
 * the provider's call, not removing a pretence.
 */
const adapters = {
  async WHATSAPP(n) {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    if (!token || !phoneId) throw new NotConfigured("WHATSAPP_TOKEN / WHATSAPP_PHONE_ID");

    // Outside a 24-hour customer-service window only an approved template will
    // deliver, which is why TemplateName exists on the row at all.
    const body = n.TemplateName
      ? {
          messaging_product: "whatsapp",
          to: n.Recipient,
          type: "template",
          template: {
            name: n.TemplateName,
            language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en" },
            components: n.TemplateArgs
              ? [
                  {
                    type: "body",
                    parameters: Object.values(JSON.parse(n.TemplateArgs)).map((v) => ({
                      type: "text",
                      text: String(v),
                    })),
                  },
                ]
              : undefined,
          },
        }
      : {
          messaging_product: "whatsapp",
          to: n.Recipient,
          type: "text",
          text: { body: n.Body },
        };

    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.error?.message || `HTTP ${res.status}`);
    return json?.messages?.[0]?.id ?? null;
  },

  async EMAIL() {
    if (!process.env.SMTP_HOST) throw new NotConfigured("SMTP_HOST");
    // Sending SMTP needs a mail library, and choosing one before the host,
    // credentials and sending domain exist would be guessing at the config.
    throw new NotConfigured("SMTP transport not implemented; set SMTP_* and add the adapter");
  },

  async SMS() {
    if (!process.env.SMS_API_KEY) throw new NotConfigured("SMS_API_KEY");
    throw new NotConfigured("SMS gateway not implemented; set SMS_* and add the adapter");
  },
};

const { pool, cfg } = await connect();
console.log(`worker connected to ${cfg.database} on ${cfg.server}`);

async function pass() {
  const claimed = (
    await pool.request().input("n", BATCH).query(`
      UPDATE TOP (@n) dbo.Notifications
      SET Status = 'SENDING', Attempts = Attempts + 1
      OUTPUT INSERTED.Id, INSERTED.Channel, INSERTED.Kind, INSERTED.Recipient,
             INSERTED.Subject, INSERTED.Body, INSERTED.TemplateName,
             INSERTED.TemplateArgs, INSERTED.Attempts
      WHERE Status = 'PENDING' AND ScheduledFor <= SYSUTCDATETIME()
    `)
  ).recordset;

  let sent = 0;
  let failed = 0;
  let deferred = 0;

  for (const n of claimed) {
    try {
      const providerId = await adapters[n.Channel](n);
      await pool
        .request()
        .input("id", n.Id)
        .input("pid", providerId ?? null).query(`
          UPDATE dbo.Notifications
          SET Status = 'SENT', SentAt = SYSUTCDATETIME(), ProviderId = @pid, LastError = NULL
          WHERE Id = @id
        `);
      sent++;
    } catch (e) {
      // An unconfigured channel is not a delivery failure — the message stays
      // deliverable once credentials exist. Returning it to PENDING with its
      // attempt count rolled back keeps the queue honest, instead of burning
      // five retries against a provider that was never wired up.
      const giveUp = !e.notConfigured && n.Attempts >= MAX_ATTEMPTS;
      await pool
        .request()
        .input("id", n.Id)
        .input("err", String(e.message).slice(0, 600))
        .input("status", giveUp ? "FAILED" : "PENDING")
        .input("rollback", e.notConfigured ? 1 : 0).query(`
          UPDATE dbo.Notifications
          SET Status = @status,
              LastError = @err,
              Attempts = CASE WHEN @rollback = 1 THEN Attempts - 1 ELSE Attempts END,
              -- exponential backoff: 1, 4, 9, 16, 25 minutes
              ScheduledFor = CASE WHEN @status = 'PENDING'
                                  THEN DATEADD(MINUTE, POWER(Attempts, 2), SYSUTCDATETIME())
                                  ELSE ScheduledFor END
          WHERE Id = @id
        `);
      if (giveUp) failed++;
      else deferred++;
    }
  }
  return { sent, failed, deferred };
}

try {
  do {
    const r = await pass();
    if (r.sent || r.failed || r.deferred) {
      console.log(
        `${new Date().toISOString()}  sent ${r.sent}  failed ${r.failed}  deferred ${r.deferred}`
      );
    }
    if (loop) await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  } while (loop);
} catch (e) {
  console.error(`worker stopped: ${e.message}`);
  process.exitCode = 1;
} finally {
  if (!loop) await pool.close();
}
