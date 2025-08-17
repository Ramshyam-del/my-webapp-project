# Admin Authentication System - Test Guide

## Environment Setup

### 1. Environment Variables

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Backend (backend/.env):**
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
BACKEND_PORT=4001
CORS_ORIGIN=http://localhost:3000
```

### 2. Database Setup

Ensure your Supabase `users` table has the correct structure:
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Make a user admin:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your_admin_email@example.com';
```

## Starting the Application

### PowerShell Commands

```powershell
# Terminal 1: Start Backend
cd backend
node server.js

# Terminal 2: Start Frontend
npm run dev
```

### Verification Commands

```powershell
# Check if backend is running
Invoke-WebRequest -Uri "http://localhost:4001/api/health" -Method GET

# Expected response:
# {
#   "status": "ok",
#   "ts": "2024-01-01T12:00:00.000Z",
#   "uptime": 123.456,
#   "environment": "development"
# }
```

## API Testing

### 1. Health Check (No Auth Required)

```powershell
Invoke-WebRequest -Uri "http://localhost:4001/api/health" -Method GET
```

### 2. Unauthorized Access (Should Return 401)

```powershell
Invoke-WebRequest -Uri "http://localhost:4001/api/admin/me" -Method GET
```

Expected response:
```json
{
  "ok": false,
  "code": "unauthorized",
  "message": "No authentication token provided"
}
```

### 3. Invalid Token (Should Return 401)

```powershell
Invoke-WebRequest -Uri "http://localhost:4001/api/admin/me" -Method GET -Headers @{
  "Authorization" = "Bearer invalid_token_here"
}
```

Expected response:
```json
{
  "ok": false,
  "code": "unauthorized",
  "message": "Invalid authentication token"
}
```

### 4. Valid Admin Token (Should Return 200)

First, get a valid token:
1. Open browser → http://localhost:3000/admin/login
2. Login with admin credentials
3. Open DevTools → Console
4. Run: `localStorage.getItem("sb-access-token")`
5. Copy the token

Then test:
```powershell
$token = "your_copied_token_here"
Invoke-WebRequest -Uri "http://localhost:4001/api/admin/me" -Method GET -Headers @{
  "Authorization" = "Bearer $token"
}
```

Expected response:
```json
{
  "ok": true,
  "user": {
    "id": "user-uuid",
    "email": "admin@example.com",
    "role": "admin",
    "status": "active"
  }
}
```

### 5. Get Users (Admin Only)

```powershell
Invoke-WebRequest -Uri "http://localhost:4001/api/admin/users" -Method GET -Headers @{
  "Authorization" = "Bearer $token"
}
```

Expected response:
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "user-uuid",
        "email": "user@example.com",
        "role": "user",
        "status": "active",
        "created_at": "2024-01-01T12:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

## Browser Testing

### 1. Admin Login Flow

1. Navigate to http://localhost:3000/admin/login
2. Login with admin credentials
3. Should redirect to http://localhost:3000/admin
4. Dashboard should display with user info and navigation cards

### 2. Admin Dashboard

1. Verify dashboard loads without infinite spinner
2. Check that user email is displayed
3. Test navigation to Users, Withdrawals, and Win/Loss tabs
4. Verify sign out button works

### 3. Users Tab

1. Click "View Users" or navigate to http://localhost:3000/admin/users
2. Should display users table
3. Test role/status dropdown changes
4. Verify changes persist after refresh

### 4. Withdrawals Tab

1. Navigate to http://localhost:3000/admin/users?tab=withdrawals
2. Should display withdrawals table
3. Test approve/reject buttons for pending withdrawals

### 5. Win/Loss Tab

1. Navigate to http://localhost:3000/admin/users?tab=winloss
2. Should display metrics and pending trades
3. Test Win/Loss buttons for pending trades

### 6. Unauthorized Access

1. Login with non-admin account
2. Navigate to http://localhost:3000/admin
3. Should redirect to login page
4. Should show "Not an admin user" error

### 7. No Session

1. Clear browser storage
2. Navigate to http://localhost:3000/admin
3. Should redirect to login page

## Error Scenarios

### 1. Backend Down

1. Stop backend server
2. Navigate to admin pages
3. Should show error banner with retry option

### 2. Invalid Token

1. Manually edit localStorage token to invalid value
2. Refresh admin page
3. Should redirect to login

### 3. Network Timeout

1. Set very slow network in DevTools
2. Admin requests should timeout after 10 seconds
3. Should show timeout error

## Production Testing

### Environment Variables

Update for production:
```bash
# Frontend
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com

# Backend
CORS_ORIGIN=https://your-frontend-domain.com
```

### SSL/HTTPS

Ensure both frontend and backend use HTTPS in production.

### Database

1. Use production Supabase project
2. Ensure RLS policies are configured correctly
3. Verify admin users have correct role

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check token validity and Supabase credentials
2. **403 Forbidden**: Verify user has admin role in database
3. **CORS Errors**: Check CORS_ORIGIN setting matches frontend URL
4. **Network Errors**: Verify backend is running on correct port

### Debug Commands

```powershell
# Check backend logs
Get-Process -Name "node" | Where-Object {$_.ProcessName -eq "node"}

# Test Supabase connection
node -e "require('dotenv').config({path:'./backend/.env'}); console.log('SUPABASE_URL:', !!process.env.SUPABASE_URL, 'SERVICE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)"

# Check frontend environment
node -e "console.log('BACKEND_URL:', process.env.NEXT_PUBLIC_BACKEND_URL)"
```

### Logs to Monitor

- Backend console: Authentication errors, API requests
- Frontend console: Network errors, redirects
- Browser Network tab: Request/response details
