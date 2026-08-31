import type { PaymentStatus } from "@prisma/client";
import { FADEY_POLICY_SUSPENSION_MESSAGE } from "./policySuspension.js";
import {
  assertWebServiceUrlExclusive,
  normalizeWebServiceUrl,
} from "./webServiceUrl.js";

export type PosNotifyResult = {
  ok: boolean;
  skipped?: boolean;
  status?: number;
  error?: string;
  message?: string;
};

type PosUserRef = {
  id: string;
  licenseKey: string;
  webServiceUrl: string | null;
  restaurantData?: unknown;
};

export function computeNextExpiration(period: string) {
  const match = String(period || "").match(/^(\d{4})-(\d{2})/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const lastDayOfPeriod = new Date(year, month, 0);
    lastDayOfPeriod.setMonth(lastDayOfPeriod.getMonth() + 1);
    return lastDayOfPeriod.toISOString().slice(0, 10);
  }
  const fallback = new Date();
  fallback.setMonth(fallback.getMonth() + 1);
  return fallback.toISOString().slice(0, 10);
}

function ingestSecret() {
  return String(
    process.env.API_INGEST_SECRET || process.env.API_SECRET_KEY || "",
  ).trim();
}

export function collectPosBaseUrls(user: PosUserRef): string[] {
  const url = normalizeWebServiceUrl(user.webServiceUrl);
  return url ? [url] : [];
}

async function postPosLicenseConfirm(
  baseUrl: string,
  body: Record<string, unknown>,
  secret: string,
): Promise<PosNotifyResult> {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secret}`,
    "X-Api-Key": secret,
  };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(`${baseUrl}/api/license/confirm`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      });
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try {
        data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
      } catch {
        data = { raw: text.slice(0, 200) };
      }

      if (res.ok) {
        return {
          ok: true,
          status: res.status,
          message: String(data.message || "POS confirmó la licencia"),
        };
      }

      const error = String(data.error || text || `HTTP ${res.status}`).slice(
        0,
        300,
      );
      console.warn("[pos-notify]", baseUrl, res.status, error);
      if (attempt === 0 && res.status >= 500) continue;
      return { ok: false, status: res.status, error };
    } catch (err) {
      const error =
        err instanceof Error ? err.message : "No se pudo contactar al POS";
      console.warn("[pos-notify]", baseUrl, error);
      if (attempt === 0) continue;
      return { ok: false, error };
    }
  }

  return { ok: false, error: "No se pudo confirmar con el POS" };
}

export async function notifyPosPolicyStatus(
  user: PosUserRef,
  active: boolean,
): Promise<PosNotifyResult> {
  const secret = ingestSecret();
  const urls = collectPosBaseUrls(user);

  if (!urls.length) {
    return {
      ok: false,
      skipped: true,
      error: "El cliente no tiene webServiceUrl vinculado",
    };
  }

  const exclusive = await assertWebServiceUrlExclusive(user.id, urls[0]);
  if (!exclusive.ok) {
    return {
      ok: false,
      skipped: true,
      error: `${exclusive.error}. Corrige la URL en el panel antes de activar/desactivar.`,
    };
  }

  if (!secret) {
    return {
      ok: false,
      skipped: true,
      error: "API_INGEST_SECRET no configurado en Render",
    };
  }

  const body = {
    clientId: user.licenseKey || user.id,
    status: active ? "active" : "suspended",
    message: active ? undefined : FADEY_POLICY_SUSPENSION_MESSAGE,
  };

  let lastError = "No se pudo contactar al POS";
  for (const baseUrl of urls) {
    const result = await postPosLicenseConfirm(baseUrl, body, secret);
    if (result.ok) return { ...result, message: result.message || body.message };
    lastError = result.error || lastError;
  }

  return {
    ok: false,
    error: `${lastError}. URLs probadas: ${urls.join(", ")}`,
  };
}

export async function notifyPosPaymentDecision(
  user: PosUserRef,
  status: "approved" | "rejected",
  options?: { expirationDate?: string; paymentId?: string; period?: string },
): Promise<PosNotifyResult> {
  const secret = ingestSecret();
  const urls = collectPosBaseUrls(user);

  if (!urls.length) {
    return {
      ok: false,
      skipped: true,
      error: "El cliente no tiene webServiceUrl vinculado",
    };
  }

  const exclusive = await assertWebServiceUrlExclusive(user.id, urls[0]);
  if (!exclusive.ok) {
    return {
      ok: false,
      skipped: true,
      error: `${exclusive.error}. Corrige la URL en el panel.`,
    };
  }

  if (!secret) {
    return {
      ok: false,
      skipped: true,
      error: "API_INGEST_SECRET no configurado en Render",
    };
  }

  const expirationDate =
    options?.expirationDate ||
    (status === "approved" && options?.period
      ? computeNextExpiration(options.period)
      : undefined);

  const body = {
    clientId: user.licenseKey || user.id,
    status,
    expirationDate,
    paymentId: options?.paymentId,
    period: options?.period,
  };

  let lastError = "No se pudo contactar al POS";
  for (const baseUrl of urls) {
    const result = await postPosLicenseConfirm(baseUrl, body, secret);
    if (result.ok) return result;
    lastError = result.error || lastError;
  }

  return { ok: false, error: lastError };
}

export function posNotifyUserMessage(result: PosNotifyResult, status: PaymentStatus) {
  if (result.ok) {
    return status === "approved"
      ? "Pago aprobado y POS desbloqueado al instante"
      : "Rechazo enviado al POS";
  }
  if (result.skipped) {
    return `Pago ${status === "approved" ? "aprobado" : "actualizado"} en central, pero: ${result.error}`;
  }
  return `Pago ${status === "approved" ? "aprobado" : "actualizado"} en central. El POS no confirmó: ${result.error}`;
}

export function posPolicyNotifyUserMessage(
  result: PosNotifyResult,
  active: boolean,
) {
  if (result.ok) {
    return active
      ? "Usuario activado y POS desbloqueado"
      : "Usuario desactivado y POS bloqueado al instante";
  }
  if (result.skipped) {
    return active
      ? "Usuario activado en central, pero: " + result.error
      : "Usuario desactivado en central, pero: " + result.error;
  }
  return (
    (active ? "Usuario activado" : "Usuario desactivado") +
    " en central. El POS no confirmó: " +
    result.error
  );
}
