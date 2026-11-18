// Membuat (atau memulihkan) akun superadmin. Jalankan: npm run db:seed
import postgres from "postgres";
import bcrypt from "bcryptjs";

async function main() {
  const url = process.env.DATABASE_URL;
  const username = (process.env.SEED_ADMIN_USERNAME ?? "admin").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME ?? "Administrator";
  if (!url) throw new Error("DATABASE_URL belum diatur");
  if (!password || password.length < 10) throw new Error("SEED_ADMIN_PASSWORD wajib diisi, minimal 10 karakter");

  const sql = postgres(url, { prepare: false });
  const hash = await bcrypt.hash(password, 12);
  await sql`
    insert into users (username, name, jabatan, role, password_hash)
    values (${username}, ${name}, 'Administrator', 'superadmin', ${hash})
    on conflict (username) do update set password_hash = ${hash}, active = true, role = 'superadmin'
  `;
  console.log(`Akun superadmin "${username}" siap dipakai.`);
  await sql.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
