import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const dbPath = path.resolve(process.env.DB_PATH || path.join("data", "fadey.db"));
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const databaseUrl = `file:${dbPath.replace(/\\/g, "/")}`;
process.env.DATABASE_URL = databaseUrl;

console.log(`[fadey-api] SQLite → ${databaseUrl}`);

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
      shell: true,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

try {
  await run("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"]);
  await run("npx", ["tsx", "server/index.ts"]);
} catch (err) {
  console.error(err);
  process.exit(1);
}
