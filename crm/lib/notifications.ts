import { query, queryOne } from "@/lib/db";

export type NotificationChannel = "WHATSAPP" | "EMAIL" | "SMS";
export type NotificationKind = "FOLLOW_UP" | "SITE_VISIT" | "PAYMENT" | "TASK" | "BOOKING";

export interface NewNotification {
  channel: NotificationChannel;
  kind: NotificationKind;
  recipient: string;
  body: string;
  subject?: string | null;
  templateName?: string | null;
  templateArgs?: Record<string, unknown> | null;
  leadId?: string | null;
  scheduledFor?: Date | null;
}

export async function enqueue(n: NewNotification): Promise<string | null> {
  const recipient = n.recipient?.trim();
  if (!recipient) return null;

  if (n.channel === "EMAIL" && !recipient.includes("@")) return null;
  if (n.channel !== "EMAIL" && !/^\+?\d{8,15}$/.test(recipient.replace(/[\s-]/g, ""))) {
    return null;
  }

  const rows = await query<{ Id: string }>`
    INSERT INTO notifications
      (channel, kind, recipient, subject, body, template_name, template_args, lead_id, scheduled_for)
    VALUES
      (${n.channel}, ${n.kind}, ${recipient}, ${n.subject ?? null}, ${n.body},
       ${n.templateName ?? null},
       ${n.templateArgs ? JSON.stringify(n.templateArgs) : null},
       ${n.leadId ?? null},
       ${n.scheduledFor ?? new Date()})
    RETURNING id AS Id
  `;
  return rows[0]?.Id ?? null;
}

export async function scheduleFollowUp(leadId: string, at: Date): Promise<string | null> {
  const lead = await queryOne<{
    Name: string;
    Reference: string;
    OwnerEmail: string | null;
  }>`
    SELECT l.name AS Name, l.reference AS Reference, u.email AS OwnerEmail
    FROM leads l
    LEFT JOIN users u ON u.id = l.owner_id
    WHERE l.id = ${leadId}
  `;
  if (!lead?.OwnerEmail) return null;

  return enqueue({
    channel: "EMAIL",
    kind: "FOLLOW_UP",
    recipient: lead.OwnerEmail,
    subject: `Follow up: ${lead.Name} (${lead.Reference})`,
    body: `You set a follow-up on ${lead.Name}, ${lead.Reference}, for ${at.toLocaleString("en-IN")}.`,
    leadId,
    scheduledFor: at,
  });
}

export async function outboxSummary() {
  return queryOne<{
    Pending: number;
    Failed: number;
    SentToday: number;
    Overdue: number;
  }>`
    SELECT
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS Pending,
      SUM(CASE WHEN status = 'FAILED'  THEN 1 ELSE 0 END) AS Failed,
      SUM(CASE WHEN status = 'SENT' AND strftime('%Y-%m-%d', sent_at) = strftime('%Y-%m-%d', datetime('now'))
               THEN 1 ELSE 0 END) AS SentToday,
      SUM(CASE WHEN status = 'PENDING' AND scheduled_for < datetime('now')
               THEN 1 ELSE 0 END) AS Overdue
    FROM notifications
  `;
}

export function channelReadiness(): Record<NotificationChannel, string | null> {
  return {
    WHATSAPP:
      process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID
        ? null
        : "WHATSAPP_TOKEN and WHATSAPP_PHONE_ID not set",
    EMAIL: process.env.SMTP_HOST ? null : "SMTP_HOST not set",
    SMS: process.env.SMS_API_KEY ? null : "SMS_API_KEY not set",
  };
}
