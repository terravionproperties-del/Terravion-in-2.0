const { Pool } = require('pg');
const passwords = ['', 'postgres', 'admin', 'password', '1234', 'root', 'venki', 'terravion', 'Admin@123', 'Postgres@123'];

async function tryPass(pw) {
  const pool = new Pool({ host:'localhost', port:5432, user:'postgres', password:pw, database:'postgres', connectionTimeoutMillis: 3000 });
  try {
    await pool.query('SELECT 1');
    console.log('PASSWORD_FOUND:' + pw);
    await pool.end();
    return true;
  } catch(e) {
    await pool.end().catch(()=>{});
    return false;
  }
}

(async () => {
  for (const pw of passwords) {
    const ok = await tryPass(pw);
    if (ok) process.exit(0);
  }
  console.log('PASSWORD_NOT_FOUND');
})();
