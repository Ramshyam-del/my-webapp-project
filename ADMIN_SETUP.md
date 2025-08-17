# Admin Authentication Setup Guide

## Quick Start

### 1. Environment Setup

Create `backend/.env` with:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
BACKEND_PORT=4001
CORS_ORIGIN=http://localhost:3000
```

### 2. Start Backend
```bash
npm run start:backend
```

### 3. Start Frontend
```bash
npm run dev
```

### 4. Make User Admin
Run this SQL in Supabase SQL Editor:
```sql
update public.users
set role = 'admin'
where email = 'YOUR_ADMIN_EMAIL';
```

## Verification Commands

### Backend Health Check
```powershell
Invoke-WebRequest -Uri "http://localhost:4001/api/health" -Method GET
```

### Admin Authentication Test (No Token)
```powershell
Invoke-WebRequest -Uri "http://localhost:4001/api/admin/me" -Method GET
```
Expected: `{"ok":false,"code":"unauthorized","message":"No authentication token provided"}`

### Admin Authentication Test (With Token)
```powershell
$token="<JWT_FROM_SUPABASE_LOGIN>"
Invoke-WebRequest -Uri "http://localhost:4001/api/admin/me" -Headers @{ Authorization="Bearer $token" } -Method GET
```

### Using Verification Script
1. Get JWT token from browser: `localStorage.getItem("sb-access-token")`
2. Run: `node scripts/verify-admin.js <JWT_TOKEN>`

## Frontend Testing

1. Visit: http://localhost:3000/admin/login
2. Login with admin credentials
3. Should redirect to /admin dashboard
4. Admin users page should load data

## Troubleshooting

### Backend Won't Start
- Check `backend/.env` exists with correct values
- Ensure port 4001 is not in use
- Check console for missing environment variables

### Admin Access Denied
- Verify user exists in `public.users` table
- Ensure `role = 'admin'` in database
- Check JWT token is valid and not expired

### Frontend Loading Forever
- Check browser console for errors
- Verify backend is running on port 4001
- Check CORS settings match frontend URL

## Production Notes

- Don't expose `SUPABASE_SERVICE_ROLE_KEY` to frontend
- Use environment variables for all secrets
- Set up proper CORS origins for production domains
- Use PM2 or similar for process management
