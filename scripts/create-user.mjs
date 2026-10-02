// Usage (on the VPS):  docker compose exec app node scripts/create-user.mjs <email>
// Type the password, press Enter, then Ctrl+D. It is hashed immediately and never stored in plain text.
import postgres from 'postgres';
import { hashPassword } from '../src/lib/auth/password.mjs';

const email = (process.argv[2] ?? '').trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('usage: node scripts/create-user.mjs <email>   (password on stdin)');
  process.exit(1);
}

let password = '';
for await (const chunk of process.stdin) password += chunk;
password = password.replace(/\r?\n$/, '');
if (password.length < 8) {
  console.error('password must be at least 8 characters');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);
try {
  const passwordHash = await hashPassword(password);
  const [row] = await sql`
    INSERT INTO users (email, password_hash, email_verified_at)
    VALUES (${email}, ${passwordHash}, now())
    ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          email_verified_at = COALESCE(users.email_verified_at, now())
    RETURNING (xmax = 0) AS inserted`;
  console.log(row.inserted ? `created ${email}` : `updated password for ${email}`);
} finally {
  await sql.end();
}
