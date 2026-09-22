const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function apiUrl(path: string) {
  return `${API_URL}${path}`;
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      ...rest,
      headers: {
        ...(rest.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new Error(
      "No se pudo conectar con el servidor. Revisa VITE_API_URL y CORS.",
    );
  }
  const raw = await res.text();
  const looksHtml = raw.trimStart().startsWith("<");
  let data: unknown = {};
  if (raw && !looksHtml) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = {};
    }
  }
  if (looksHtml) {
    throw new Error(
      res.ok
        ? "El servidor devolvió una página web en vez de JSON. Revisa VITE_API_URL (debe ser la API de Render)."
        : `El servidor respondió ${res.status} con una página web. Revisa la URL de la API.`,
    );
  }
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "Error de servidor");
  }
  return data as T;
}
