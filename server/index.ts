import "dotenv/config";
import express from "express";
import cors from "cors";
import { dbPath, prisma, uploadsDir } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { leadsRouter } from "./routes/leads.js";
import { usersRouter } from "./routes/users.js";
import { paymentsRouter } from "./routes/payments.js";
import { coursesRouter } from "./routes/courses.js";
import { progressRouter } from "./routes/progress.js";
import { ingestRouter } from "./routes/ingest.js";
import { adminStatsRouter } from "./routes/adminStats.js";
import { themeRouter } from "./routes/theme.js";
import { sendApiError } from "./utils/errors.js";
import fs from "node:fs";

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
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = fs.existsSync(dbPath);
  }
  res.json({
    ok: true,
    db: dbOk,
    dbPath,
    engine: "sqlite",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/users", usersRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/progress", progressRouter);
app.use("/api/ingest", ingestRouter);
app.use("/api/admin", adminStatsRouter);
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

app.listen(port, () => {
  console.log(`Fadey API listening on http://localhost:${port}`);
  console.log(`SQLite: ${dbPath}`);
  console.log(`Uploads: ${uploadsDir}`);
});
