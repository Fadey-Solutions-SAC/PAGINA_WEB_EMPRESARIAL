import type { PaymentStatus } from "@prisma/client";

export type PosNotifyResult = {
  ok: boolean;
  skipped?: boolean;
  status?: number;
  error?: string;
  message?: string;
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

export async function notifyPosPaymentDecision(
  user: { id: string; licenseKey: string; webServiceUrl: string | null },
  status: "approved" | "rejected",
  options?: { expirationDate?: string; paymentId?: string; period?: string },
): Promise<PosNotifyResult> {
  const baseUrl = String(user.webServiceUrl || "").replace(/\/+$/, "");
  const secret = String(
    process.env.API_INGEST_SECRET || process.env.API_SECRET_KEY || "",
  ).trim();

  if (!baseUrl) {
    return {
      ok: false,
      skipped: true,
      error: "El cliente no tiene webServiceUrl vinculado",
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

      const error = String(data.error || text || `HTTP ${res.status}`).slice(0, 300);
      console.warn("[payments] POS confirm:", res.status, error);
      if (attempt === 0 && res.status >= 500) continue;
      return { ok: false, status: res.status, error };
    } catch (err) {
      const error =
        err instanceof Error ? err.message : "No se pudo contactar al POS";
      console.warn("[payments] POS confirm error:", error);
      if (attempt === 0) continue;
      return { ok: false, error };
    }
  }

  return { ok: false, error: "No se pudo confirmar con el POS" };
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
