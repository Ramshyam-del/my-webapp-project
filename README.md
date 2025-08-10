# Quantex - Cryptocurrency Exchange Platform

A modern cryptocurrency exchange platform built with Next.js, Express.js, and Supabase.

## Quick Start

### Option 1: Use the PowerShell Script (Recommended)
```powershell
powershell -ExecutionPolicy Bypass -File start_servers.ps1
```

### Option 2: Manual Start
1. Start Backend Server:
   ```bash
   cd backend
   npm start
   ```

2. Start Frontend Server (in a new terminal):
   ```bash
   npm run dev
   ```

## Server URLs
 - **Frontend**: http://localhost:3000
 - **Backend**: http://localhost:4001

## Environment configuration

Create `.env.local` and `backend/.env` with these keys:

```
# frontend
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:4001

# backend
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
BACKEND_PORT=4001
CORS_ORIGIN=http://localhost:3000
COINMARKETCAP_API_KEY=optional
NODE_ENV=production
```

Never commit real keys. Use the provided `.env.example` files for placeholders.

Git ignore rules must block env files:

```
.env
.env.*
backend/.env
```

Key rotation:
- Rotate in Supabase Dashboard → Settings → API
- Update new keys in your envs; redeploy backend and frontend

Admin creation:
- Prefer Supabase Auth UI to create admin; then in SQL: `update users set role='admin' where email = $1;`
- Or run: `ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/set-admin.js`

Ensure admin profile row exists:
- Run: `ADMIN_EMAIL=... node scripts/ensure-admin-user.js`
  - Resolves auth UID for ADMIN_EMAIL
  - Upserts `public.users` with id=UID, role='admin', status='active'

Login verification contract:
- Client: sign in via Supabase, then call `GET /api/admin/me` with `Authorization: Bearer <access_token>`
- Server: verifies token (or Supabase cookies), fetches profile by auth UID
- Responses:
  - 200 `{ ok: true, user }` only if `role='admin'`
  - 403 `{ ok: false, code: 'not_admin', message: 'Not an admin' }`
  - 401 `{ ok: false, code: 'unauthorized' }`

## Features
- Real-time cryptocurrency price data via CoinMarketCap API
- User authentication with Supabase
- Admin panel for system management
- Mobile-responsive design
- Real-time configuration updates

## Troubleshooting

### If API calls fail:
1. Ensure both servers are running
2. Check that backend is on port 4001
3. Check that frontend is on port 3000
4. Verify environment variables are set in `.env.local`

### If servers won't start:
1. Kill existing Node.js processes: `taskkill /f /im node.exe`
2. Run the PowerShell script again

## Environment Variables
Make sure `.env.local` contains:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `COINMARKETCAP_API_KEY`
- `BACKEND_PORT=4001`