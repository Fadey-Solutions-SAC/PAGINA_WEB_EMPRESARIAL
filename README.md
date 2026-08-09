# Fadey Solutions S.A.C.

Landing + panel admin, academia YouTube y API de pagos PNG.

## Stack

- **Frontend (Vercel):** Vite + React + React Router
- **API + BD (Render):** Express + Prisma + PostgreSQL + disco para PNG

## Desarrollo local

1. Copia variables:

```bash
cp .env.example .env
```

2. Levanta PostgreSQL:

```bash
docker compose up -d
```

3. Instala y prepara BD:

```bash
npm install
npx prisma migrate dev --name init
```

4. En dos terminales:

```bash
npm run dev:api
npm run dev
```

- Sitio: `http://localhost:5173`
- API: `http://localhost:3001`
- Acceder: `/login`
- Admin: solo contraseña (valor de `ADMIN_PASSWORD` en `.env`)

## Flujos

| Acción | Dónde |
|--------|--------|
| Registro desde contacto | `POST /api/leads` (formulario `#contacto`) |
| Admin vincula por web service | `/admin` → pega URL → consulta restaurante → genera usuario, contraseña e **ID de cliente/licencia** |
| Admin vincula manual | `/admin` → pestaña Manual / registro |
| Web service envía pago PNG | `POST /api/ingest/payments` con header `X-Api-Key` + `userId` (ID de cliente) |
| Admin aprueba / rechaza pagos | `/admin` → Pagos |
| Cliente ve academia | `/academia` (solo módulos de sus productos) |

### Vincular por URL del web service

1. En Admin → **Vincular por web service**.
2. Pega la URL base del cliente (ej. `https://mi-resto.onrender.com`).
3. **Consultar restaurante**: el API pide datos a estos paths (el primero que responda gana):
   - `GET /api/fadey/restaurant`
   - `GET /fadey/restaurant`
   - `GET /api/restaurant`
   - `GET /api/local`
4. Respuesta esperada (JSON):

```json
{
  "name": "Restaurante Miraflores",
  "ruc": "20123456789",
  "email": "contacto@ejemplo.com",
  "phone": "999999999",
  "address": "Av. Ejemplo 123"
}
```

5. Genera **usuario**, **contraseña** e **ID de cliente / licencia**. Ese ID se usa para enviar y aprobar pagos.

### Ingest de pago (ejemplo)

```bash
curl -X POST "$API_URL/api/ingest/payments" \
  -H "X-Api-Key: $API_INGEST_SECRET" \
  -F "userId=UUID_DEL_CLIENTE" \
  -F "clientName=Nombre Cliente" \
  -F "period=2026-08" \
  -F "receipt=@comprobante.png"
```

También acepta `clientId` o `licenseKey` en lugar de `userId`. El pago queda **pending** hasta que lo apruebes en Admin.

## Despliegue

### Render (API + Postgres)

1. Conecta el repo en Render (Blueprint `render.yaml`) o crea Web Service + PostgreSQL.
2. Define env: `ADMIN_PASSWORD`, `API_INGEST_SECRET`, `CORS_ORIGIN` (URL de Vercel), `JWT_SECRET`.
3. Disco montado en `/opt/render/project/src/uploads`.

### Vercel (frontend)

1. Importa el mismo repo.
2. Build: `npm run build` · Output: `dist`
3. Env: `VITE_API_URL=https://TU-API.onrender.com`

## Seguridad

- No subas `.env` al repo.
- La contraseña admin vive solo en variables de entorno de Render / `.env` local.
