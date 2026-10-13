import { Router, type Request, type Response } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { CredentialStatus, EmploymentStatus, Prisma } from "@prisma/client";
import { prisma, uploadsDir } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { sendApiError } from "../utils/errors.js";
import { qrPng, qrSvg } from "../utils/qr.js";
import {
  absoluteUploadUrl,
  collaboratorPublicUrl,
} from "../utils/siteUrl.js";

const AREAS = [
  "Administración",
  "Comercial",
  "Desarrollo",
  "Operaciones",
  "Soporte",
  "Gerencia",
] as const;

const IMAGE_MIME: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/pjpeg": ".jpg",
  "image/webp": ".webp",
};

const photoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(uploadsDir, "collaborators");
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = IMAGE_MIME[String(file.mimetype || "").toLowerCase()] || ".jpg";
      cb(null, `${Date.now()}-${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_MIME[String(file.mimetype || "").toLowerCase()]) cb(null, true);
    else cb(new Error("Solo se permiten fotografías PNG, JPG o WEBP"));
  },
});

function clip(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

function parseDate(value: unknown) {
  const raw = clip(value, 40);
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function validDni(value: string) {
  return /^\d{8}$/.test(value);
}

function validPhone(value: string) {
  if (!value) return true;
  return /^\+?\d{6,15}$/.test(value.replace(/[\s-]/g, ""));
}

function validPhotoPath(value: string) {
  return /^\/uploads\/collaborators\/[A-Za-z0-9._-]+$/.test(value);
}

function validEmail(value: string) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export const publicCollaboratorLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

function deriveCredentialStatus(
  employment: EmploymentStatus,
  expiresAt: Date | null,
): CredentialStatus {
  if (employment === "inactive") return "inactiva";
  if (expiresAt && expiresAt.getTime() < Date.now()) return "vencida";
  return "vigente";
}

function toAdmin(row: {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  dni: string;
  personalPhone: string | null;
  photoPath: string;
  position: string;
  area: string;
  hiredAt: Date;
  employmentStatus: EmploymentStatus;
  corporateEmail: string | null;
  corporatePhone: string | null;
  issuedAt: Date;
  expiresAt: Date | null;
  credentialStatus: CredentialStatus;
  createdAt: Date;
  updatedAt: Date;
}, req: Request) {
  return {
    id: row.id,
    code: row.code,
    firstName: row.firstName,
    lastName: row.lastName,
    dni: row.dni,
    personalPhone: row.personalPhone,
    photoUrl: absoluteUploadUrl(req, row.photoPath),
    position: row.position,
    area: row.area,
    hiredAt: row.hiredAt.toISOString().slice(0, 10),
    employmentStatus: row.employmentStatus,
    corporateEmail: row.corporateEmail,
    corporatePhone: row.corporatePhone,
    issuedAt: row.issuedAt.toISOString().slice(0, 10),
    expiresAt: row.expiresAt ? row.expiresAt.toISOString().slice(0, 10) : null,
    credentialStatus: deriveCredentialStatus(row.employmentStatus, row.expiresAt),
    publicUrl: collaboratorPublicUrl(row.code),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toPublic(row: {
  code: string;
  firstName: string;
  lastName: string;
  photoPath: string;
  position: string;
  area: string;
  employmentStatus: EmploymentStatus;
  issuedAt: Date;
  expiresAt: Date | null;
  updatedAt: Date;
}, req: Request) {
  const credentialStatus = deriveCredentialStatus(row.employmentStatus, row.expiresAt);
  return {
    code: row.code,
    firstName: row.firstName,
    lastName: row.lastName,
    fullName: `${row.firstName} ${row.lastName}`.trim(),
    photoUrl: absoluteUploadUrl(req, row.photoPath),
    position: row.position,
    area: row.area,
    employmentStatus: row.employmentStatus,
    credentialStatus,
    issuedAt: row.issuedAt.toISOString().slice(0, 10),
    expiresAt: row.expiresAt ? row.expiresAt.toISOString().slice(0, 10) : null,
    updatedAt: row.updatedAt.toISOString(),
    publicUrl: collaboratorPublicUrl(row.code),
  };
}

async function nextCode() {
  const rows = await prisma.collaborator.findMany({ select: { code: true } });
  let max = 0;
  for (const row of rows) {
    const n = Number(String(row.code).replace(/\D/g, ""));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `FS-${String(max + 1).padStart(3, "0")}`;
}

async function audit(collaboratorId: string, action: string, detail = "") {
  await prisma.collaboratorAudit.create({
    data: { collaboratorId, action, detail: clip(detail, 400) },
  });
}

function readBody(req: Request) {
  return (req.body && typeof req.body === "object" ? req.body : {}) as Record<
    string,
    unknown
  >;
}

export const collaboratorsRouter = Router();

collaboratorsRouter.get("/areas", requireAdmin, (_req, res) => {
  res.json({ areas: [...AREAS] });
});

collaboratorsRouter.get("/", requireAdmin, async (req, res) => {
  try {
    const q = clip(req.query.q, 80).toLowerCase();
    const area = clip(req.query.area, 60);
    const status = clip(req.query.status, 20);
    const where: Prisma.CollaboratorWhereInput = {};
    if (area) where.area = area;
    if (status === "active" || status === "inactive") {
      where.employmentStatus = status;
    }
    if (q) {
      where.OR = [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { code: { contains: q } },
        { position: { contains: q } },
        { dni: { contains: q } },
      ];
    }
    const rows = await prisma.collaborator.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.json({ collaborators: rows.map((row) => toAdmin(row, req)) });
  } catch (err) {
    sendApiError(res, err);
  }
});

collaboratorsRouter.get("/:id/audits", requireAdmin, async (req, res) => {
  try {
    const id = clip(req.params.id, 40);
    const audits = await prisma.collaboratorAudit.findMany({
      where: { collaboratorId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({
      audits: audits.map((item) => ({
        id: item.id,
        action: item.action,
        detail: item.detail,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    sendApiError(res, err);
  }
});

collaboratorsRouter.get("/:id/qr.svg", requireAdmin, async (req, res) => {
  try {
    const row = await prisma.collaborator.findUnique({
      where: { id: clip(req.params.id, 40) },
      select: { code: true },
    });
    if (!row) {
      res.status(404).json({ error: "Colaborador no encontrado" });
      return;
    }
    const svg = await qrSvg(collaboratorPublicUrl(row.code));
    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${row.code}-qr.svg"`,
    );
    res.send(svg);
  } catch (err) {
    sendApiError(res, err);
  }
});

collaboratorsRouter.get("/:id/qr.png", requireAdmin, async (req, res) => {
  try {
    const row = await prisma.collaborator.findUnique({
      where: { id: clip(req.params.id, 40) },
      select: { code: true },
    });
    if (!row) {
      res.status(404).json({ error: "Colaborador no encontrado" });
      return;
    }
    const png = await qrPng(collaboratorPublicUrl(row.code));
    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${row.code}-qr.png"`,
    );
    res.send(png);
  } catch (err) {
    sendApiError(res, err);
  }
});

collaboratorsRouter.post("/photo", requireAdmin, (req, res) => {
  photoUpload.single("photo")(req, res, (err: unknown) => {
    if (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : "No se pudo subir la foto",
      });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "Sube una fotografía" });
      return;
    }
    const rel = `/uploads/collaborators/${req.file.filename}`;
    res.status(201).json({ url: rel, absoluteUrl: absoluteUploadUrl(req, rel) });
  });
});

collaboratorsRouter.post("/", requireAdmin, async (req, res) => {
  try {
    const body = readBody(req);
    const firstName = clip(body.firstName, 80);
    const lastName = clip(body.lastName, 80);
    const dni = clip(body.dni, 12).replace(/\D/g, "");
    const position = clip(body.position, 80);
    const area = clip(body.area, 60);
    const photoPath = clip(body.photoPath, 220);
    const hiredAt = parseDate(body.hiredAt) || new Date();
    const issuedAt = parseDate(body.issuedAt) || new Date();
    const expiresAt = parseDate(body.expiresAt);
    const personalPhone = clip(body.personalPhone, 20) || null;
    const corporateEmail = clip(body.corporateEmail, 120) || null;
    const corporatePhone = clip(body.corporatePhone, 20) || null;
    const employmentStatus: EmploymentStatus =
      clip(body.employmentStatus, 20) === "inactive" ? "inactive" : "active";

    if (!firstName || !lastName || !position || !area || !photoPath) {
      res.status(400).json({
        error: "Completa nombres, apellidos, cargo, área y fotografía",
      });
      return;
    }
    if (!validPhotoPath(photoPath)) {
      res.status(400).json({ error: "La fotografía no es válida" });
      return;
    }
    if (!validDni(dni)) {
      res.status(400).json({ error: "El DNI debe tener 8 dígitos" });
      return;
    }
    if (!validEmail(corporateEmail || "")) {
      res.status(400).json({ error: "Correo corporativo no válido" });
      return;
    }
    if (!validPhone(personalPhone || "") || !validPhone(corporatePhone || "")) {
      res.status(400).json({ error: "Teléfono no válido" });
      return;
    }

    const duplicate = await prisma.collaborator.findFirst({
      where: { dni },
      select: { id: true },
    });
    if (duplicate) {
      res.status(409).json({ error: "Ya existe un colaborador con ese DNI" });
      return;
    }

    const code = await nextCode();
    const row = await prisma.collaborator.create({
      data: {
        code,
        firstName,
        lastName,
        dni,
        personalPhone,
        photoPath,
        position,
        area,
        hiredAt,
        employmentStatus,
        corporateEmail,
        corporatePhone,
        issuedAt,
        expiresAt,
        credentialStatus: deriveCredentialStatus(employmentStatus, expiresAt),
      },
    });
    await audit(row.id, "create", `Alta ${code}`);
    res.status(201).json({ collaborator: toAdmin(row, req) });
  } catch (err) {
    sendApiError(res, err);
  }
});

collaboratorsRouter.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const id = clip(req.params.id, 40);
    const existing = await prisma.collaborator.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Colaborador no encontrado" });
      return;
    }
    const body = readBody(req);
    const data: Prisma.CollaboratorUpdateInput = {};
    const changes: string[] = [];

    if (body.firstName !== undefined) {
      const firstName = clip(body.firstName, 80);
      if (!firstName) {
        res.status(400).json({ error: "Los nombres son obligatorios" });
        return;
      }
      data.firstName = firstName;
      changes.push("nombres");
    }
    if (body.lastName !== undefined) {
      const lastName = clip(body.lastName, 80);
      if (!lastName) {
        res.status(400).json({ error: "Los apellidos son obligatorios" });
        return;
      }
      data.lastName = lastName;
      changes.push("apellidos");
    }
    if (body.dni !== undefined) {
      const dni = clip(body.dni, 12).replace(/\D/g, "");
      if (!validDni(dni)) {
        res.status(400).json({ error: "El DNI debe tener 8 dígitos" });
        return;
      }
      const other = await prisma.collaborator.findFirst({
        where: { dni, NOT: { id } },
        select: { id: true },
      });
      if (other) {
        res.status(409).json({ error: "Ya existe un colaborador con ese DNI" });
        return;
      }
      data.dni = dni;
      changes.push("DNI");
    }
    if (body.personalPhone !== undefined) {
      const personalPhone = clip(body.personalPhone, 20);
      if (!validPhone(personalPhone)) {
        res.status(400).json({ error: "Teléfono personal no válido" });
        return;
      }
      data.personalPhone = personalPhone || null;
      changes.push("teléfono personal");
    }
    if (body.photoPath !== undefined && clip(body.photoPath, 220)) {
      const photoPath = clip(body.photoPath, 220);
      if (!validPhotoPath(photoPath)) {
        res.status(400).json({ error: "La fotografía no es válida" });
        return;
      }
      data.photoPath = photoPath;
      changes.push("fotografía");
    }
    if (body.position !== undefined) {
      const position = clip(body.position, 80);
      if (!position) {
        res.status(400).json({ error: "El cargo es obligatorio" });
        return;
      }
      data.position = position;
      changes.push("cargo");
    }
    if (body.area !== undefined) {
      const area = clip(body.area, 60);
      if (!area) {
        res.status(400).json({ error: "El área es obligatoria" });
        return;
      }
      data.area = area;
      changes.push("área");
    }
    if (body.hiredAt !== undefined) {
      data.hiredAt = parseDate(body.hiredAt) || existing.hiredAt;
      changes.push("fecha de incorporación");
    }
    if (body.corporateEmail !== undefined) {
      const corporateEmail = clip(body.corporateEmail, 120);
      if (!validEmail(corporateEmail)) {
        res.status(400).json({ error: "Correo corporativo no válido" });
        return;
      }
      data.corporateEmail = corporateEmail || null;
      changes.push("correo corporativo");
    }
    if (body.corporatePhone !== undefined) {
      const corporatePhone = clip(body.corporatePhone, 20);
      if (!validPhone(corporatePhone)) {
        res.status(400).json({ error: "Teléfono corporativo no válido" });
        return;
      }
      data.corporatePhone = corporatePhone || null;
      changes.push("teléfono corporativo");
    }
    if (body.issuedAt !== undefined) {
      data.issuedAt = parseDate(body.issuedAt) || existing.issuedAt;
      changes.push("emisión");
    }
    if (body.expiresAt !== undefined) {
      data.expiresAt = parseDate(body.expiresAt);
      changes.push("vencimiento");
    }
    if (body.employmentStatus !== undefined) {
      data.employmentStatus =
        clip(body.employmentStatus, 20) === "inactive" ? "inactive" : "active";
      changes.push("estado laboral");
    }

    const nextEmployment =
      (data.employmentStatus as EmploymentStatus | undefined) ||
      existing.employmentStatus;
    const nextExpiry =
      data.expiresAt === undefined
        ? existing.expiresAt
        : (data.expiresAt as Date | null);
    data.credentialStatus = deriveCredentialStatus(nextEmployment, nextExpiry);

    const row = await prisma.collaborator.update({ where: { id }, data });
    await audit(
      id,
      nextEmployment === "inactive" && existing.employmentStatus === "active"
        ? "deactivate"
        : "update",
      changes.join(", ") || "actualización",
    );
    res.json({ collaborator: toAdmin(row, req) });
  } catch (err) {
    sendApiError(res, err);
  }
});

export async function publicCollaborator(req: Request, res: Response) {
  try {
    const code = clip(req.params.code, 20).toUpperCase();
    const row = await prisma.collaborator.findUnique({ where: { code } });
    if (!row) {
      res.status(404).json({ error: "Credencial no encontrada" });
      return;
    }
    res.json({ collaborator: toPublic(row, req) });
  } catch (err) {
    sendApiError(res, err);
  }
}
