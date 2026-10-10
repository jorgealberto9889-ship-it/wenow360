import { execSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import bcrypt from "bcryptjs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as s from "../db/schema";

// Uso: npm run admin:create -- correo@dominio.com [owner]
// Sin «owner» la cuenta es del equipo del cliente (rol staff: no ve «Dueño · Consumo»). Con «owner» es super_admin (Órbita Digital).
async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes("@")) throw new Error("Indica el correo: npm run admin:create -- correo@dominio.com");

  const role = process.argv[3] === "owner" ? ("super_admin" as const) : ("staff" as const);
  const password = process.env.ADMIN_PASSWORD ?? (await ask("Contraseña (mínimo 12 caracteres): "));
  if (password.length < 12) throw new Error("La contraseña debe tener al menos 12 caracteres.");

  const db = drizzle(
    createClient({ url: process.env.TURSO_DATABASE_URL!, authToken: process.env.TURSO_AUTH_TOKEN || undefined }),
  );
  const passwordHash = await bcrypt.hash(password, 12);
  await db
    .insert(s.adminUsers)
    .values({ email, passwordHash, role })
    .onConflictDoUpdate({ target: s.adminUsers.email, set: { passwordHash, active: true } });
  console.log(`Admin listo: ${email} (${role === "super_admin" ? "dueño" : "equipo"})`);
}

async function ask(q: string): Promise<string> {
  stdout.write(q);
  // La terminal deja de mostrar lo que se escribe; Enter y borrar funcionan normal.
  const tty = stdin.isTTY;
  if (tty) execSync("stty -echo", { stdio: "inherit" });
  try {
    const rl = createInterface({ input: stdin, terminal: false });
    const answer = await rl.question("");
    rl.close();
    return answer;
  } finally {
    if (tty) execSync("stty echo", { stdio: "inherit" });
    stdout.write("\n");
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
