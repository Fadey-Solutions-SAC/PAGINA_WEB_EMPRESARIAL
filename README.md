# Fadey Solutions S.A.C.

Landing + panel admin, academia YouTube y API de pagos PNG.

## Stack

- **Frontend (Vercel):** Vite + React + React Router
- **API (Render):** Express + Prisma + **SQLite en Disk** (igual que Resto FADEY)

## Desarrollo local

1. Copia variables:

```bash
cp .env.example .env
```

2. Instala y crea la BD (archivo local, sin Docker):

```bash
npm install
npx prisma db push
```

3. En dos terminales:

```bash
npm run dev:api
npm run dev
```

- Sitio: `http://localhost:5173`
- API: `http://localhost:3002` (si el 3001 lo usa Resto FADEY)
- Acceder: `/login`
- Admin: solo contraseña (`ADMIN_PASSWORD` en `.env`)

## Flujos

| Acción | Dónde |
|--------|--------|
| Registro desde contacto | `POST /api/leads` (formulario `#contacto`) |
| Admin vincula por web service | `/admin` → pega URL → consulta restaurante → genera usuario |
| Web service envía pago PNG | `POST /api/ingest/payments` con header `X-Api-Key` |
| Admin aprueba / rechaza pagos | `/admin` → Pagos |
| Cliente ve academia | `/academia` |

## Despliegue

### Render (API + Disk SQLite)

**No necesitas PostgreSQL.** Solo el Web Service + Disk:

| KEY | VALUE |
|-----|--------|
| `DB_PATH` | `/data/fadey.db` |
| `UPLOADS_DIR` | `/data/uploads` |
| `DATA_DIR` | `/data` |
| `CORS_ORIGIN` | `https://fadeysolutions.pe,https://www.fadeysolutions.pe` |
| `ADMIN_PASSWORD` | tu contraseña admin |
| `API_INGEST_SECRET` | tu secreto |
| `JWT_SECRET` | Generate |

**Disk:** name `fadey-data`, mount `/data`, 1 GB.

**Start command:** `npx prisma db push && npm run start`

Puedes borrar `DATABASE_URL` si la tenías (ya no se usa Postgres).

### Vercel (frontend)

1. Importa el mismo repo.
2. Build: `npm run build` · Output: `dist`
3. Env: `VITE_API_URL=https://fadey-solutions-pe.onrender.com`

## Seguridad

- No subas `.env` ni `data/*.db` al repo.
- La contraseña admin vive solo en variables de entorno de Render / `.env` local.
