import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const schemaPath = path.join(import.meta.dirname, "schema.prisma");
const envPath = path.join(root, ".env");

const fromEnv = process.env.DATABASE_URL?.trim();
const url = fromEnv || "file:./prisma/dev.db";
if (!fromEnv) {
  process.env.DATABASE_URL = url;
}

const provider = /^postgres(ql)?:\/\//i.test(url) ? "postgresql" : "sqlite";

let schema = fs.readFileSync(schemaPath, "utf8");
const next = schema.replace(
  /provider\s*=\s*"(sqlite|postgresql)"/,
  `provider = "${provider}"`,
);
if (next !== schema) {
  fs.writeFileSync(schemaPath, next);
}

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(
    envPath,
    [
      `# Local default. Vercel/Postgres: set DATABASE_URL in the host, do not commit secrets.`,
      `DATABASE_URL="${url}"`,
      `SESSION_SECRET="next-up-local-dev-only"`,
      "",
    ].join("\n"),
  );
}

console.log(`Prisma provider ${provider}`);
