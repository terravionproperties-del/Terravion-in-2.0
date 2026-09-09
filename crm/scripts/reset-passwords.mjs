import Database from 'better-sqlite3';
import { hash } from '@node-rs/argon2';

const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1, algorithm: 2 };

async function resetPasswords() {
  const db = new Database('/var/www/terravion-in/crm/crm.sqlite3');
  const password = process.env.SEED_ADMIN_PASSWORD || 'VeRa!1627';
  const hashVal = await hash(password, ARGON);

  console.log('Hashed password for:', password);

  const emails = [
    'admin@terravionproperties.in',
    'terravionproperties@gmail.com'
  ];

  const stmt = db.prepare(`
    INSERT INTO users (id, email, name, password_hash, role, is_active, failed_attempts, locked_until)
    VALUES (lower(hex(randomblob(16))), @email, @name, @hash, 'ADMIN', 1, 0, NULL)
    ON CONFLICT(email) DO UPDATE SET
      password_hash = excluded.password_hash,
      is_active = 1,
      failed_attempts = 0,
      locked_until = NULL
  `);

  for (const email of emails) {
    const name = email.includes('admin@') ? 'Terravion Admin' : 'Terravion Properties';
    stmt.run({ email, name, hash: hashVal });
    console.log(`Updated ${email} with password: ${password}`);
  }

  const users = db.prepare('SELECT id, email, name, role, is_active, failed_attempts FROM users').all();
  console.log('Current users:', users);
  db.close();
}

resetPasswords().catch(console.error);
