import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "node:fs";
import { dbPath, prisma, uploadsDir } from "./db.js";
import { ensureSqliteSchema } from "./ensureSqlite.js";
import { authRouter } from "./routes/auth.js";
import { leadsRouter } from "./routes/leads.js";
import { usersRouter } from "./routes/users.js";
import { paymentsRouter } from "./routes/payments.js";
import { posPaymentsRouter } from "./routes/posPayments.js";
import { coursesRouter } from "./routes/courses.js";
import { progressRouter } from "./routes/progress.js";
import { ingestRouter } from "./routes/ingest.js";
import { compatRouter } from "./routes/compat.js";
import { adminStatsRouter } from "./routes/adminStats.js";
import { financeRouter } from "./routes/finance.js";
import { themeRouter } from "./routes/theme.js";
import { sendApiError } from "./utils/errors.js";

const app = express();
const port = Number(process.env.PORT || 3001);

const origins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (
        !origin ||
        origins.includes(origin) ||
        origins.includes("*") ||
        origin.endsWith(".vercel.app") ||
        origin === "https://fadeysolutions.pe" ||
        origin === "https://www.fadeysolutions.pe"
      ) {
        cb(null, true);
        return;
      }
      cb(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", async (_req, res) => {
  let dbOk = false;
  let tablesOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
    await prisma.lead.findFirst({ take: 1 });
    tablesOk = true;
  } catch {
    dbOk = fs.existsSync(dbPath);
  }
  res.json({
    ok: true,
    db: dbOk,
    tables: tablesOk,
    dbPath,
    engine: "sqlite",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/users", usersRouter);
app.use("/api", compatRouter);
app.use("/api/payments", posPaymentsRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/progress", progressRouter);
app.use("/api/ingest", ingestRouter);
app.use("/api/admin", adminStatsRouter);
app.use("/api/admin/finance", financeRouter);
app.use("/api/theme", themeRouter);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    sendApiError(res, err);
  },
);

async function boot() {
  try {
    const result = await ensureSqliteSchema();
    if (result.pushed) {
      console.log("[fadey-api] Tablas creadas en el Disk.");
    }
  } catch (err) {
    console.error("[fadey-api] No se pudo preparar SQLite:", err);
  }

  app.listen(port, () => {
    console.log(`Fadey API listening on http://localhost:${port}`);
    console.log(`SQLite: ${dbPath}`);
    console.log(`Uploads: ${uploadsDir}`);
  });
}

boot();
