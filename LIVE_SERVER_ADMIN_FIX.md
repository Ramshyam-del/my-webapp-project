# Live Server Admin Access Troubleshooting Guide

## Problem
Admin login works on localhost but fails on live server with credentials:
- Email: `ramshyamgopalhari@gmail.com`
- Password: `@Million2026`

## Common Causes & Solutions

### 1. Environment Variables Not Set on Live Server ⚠️ MOST COMMON

**Symptoms:**
- "Failed to access" error
- "Database not configured" error
- 503 Service Unavailable

**Solution:**
Your live server must have these environment variables:

```bash
# Frontend Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Backend Environment Variables (if separate)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
BACKEND_API_KEY=your_backend_api_key_here
```

**How to Fix:**

#### Railway:
1. Go to your project dashboard
2. Click "Variables" tab
3. Add each variable above
4. Redeploy

#### Vercel:
1. Go to Project Settings → Environment Variables
2. Add each variable
3. Redeploy

#### VPS/Custom Server:
1. Create `.env` file in project root:
   ```bash
   nano .env
   ```
2. Add all variables
3. Restart servers:
   ```bash
   pm2 restart all
   ```

---

### 2. Admin User Not Created in Production Database

**Symptoms:**
- "User not found" error
- "Access denied" error
- Login shows "Invalid credentials"

**Solution:**

#### Option A: Using Diagnostic Script (RECOMMENDED)
```bash
# On your live server
node scripts/diagnose-live-admin.js
```

This will tell you exactly what's wrong.

#### Option B: Create Admin User Manually
```bash
# Set environment variables first, then:
node scripts/create-admin-live.js
```

#### Option C: Using Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to "Authentication" → "Users"
4. Check if `ramshyamgopalhari@gmail.com` exists
5. If not, click "Add User" → Create with password
6. Go to "Table Editor" → "users" table
7. Find the user by email
8. Update `role` column to `'admin'`
9. Update `status` column to `'active'`

---

### 3. CORS Configuration Blocking Requests

**Symptoms:**
- Login appears to work but immediately fails
- Console shows CORS errors
- "Network request failed" errors

**Solution:**

Edit `backend/server.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',           // Local development
    'https://your-domain.com',          // Your live frontend domain
    'https://www.your-domain.com'       // www subdomain
  ],
  credentials: true
}));
```

Then redeploy backend.

---

### 4. Backend Not Running or Not Accessible

**Symptoms:**
- "Cannot connect to server" error
- Timeout errors
- 502 Bad Gateway

**Solution:**

#### Check if backend is running:
```bash
# On your server
curl http://localhost:4001/api/admin/health
# Should return: {"ok":true}
```

#### If not running:
```bash
# Start backend
cd backend
pm2 start server.js --name quantex-backend

# Or manually
node server.js
```

#### Check from internet:
```bash
curl https://your-domain.com/api/admin/health
```

If this fails, check:
- Nginx/Apache configuration
- Firewall rules
- Port forwarding
- SSL certificate

---

### 5. Different Supabase Project in Production

**Symptoms:**
- Login works but shows "User not found"
- Database appears empty
- Different data than localhost

**Solution:**

You might be using a different Supabase project for production. Check:

```bash
# Run this on live server
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

If it's different from localhost:
1. You need to create the admin user in the production Supabase
2. Run: `node scripts/create-admin-live.js`
3. Or manually create via Supabase dashboard

---

### 6. Password Hash Mismatch

**Symptoms:**
- "Invalid credentials" error
- Everything else checks out

**Solution:**

The password might need to be reset:

```bash
# Using Supabase Dashboard:
# 1. Go to Authentication → Users
# 2. Find ramshyamgopalhari@gmail.com
# 3. Click "..." → "Reset Password"
# 4. Set new password: @Million2026

# Or using script:
node scripts/change-admin-password.js ramshyamgopalhari@gmail.com @Million2026
```

---

## Step-by-Step Debugging Process

### Step 1: Check Environment Variables
```bash
# On your live server
cd /path/to/your/project
node -e "console.log({
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
  service: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'
})"
```

**Expected Output:**
```json
{
  url: "https://your-project.supabase.co",
  anon: "SET",
  service: "SET"
}
```

### Step 2: Run Diagnostic Script
```bash
node scripts/diagnose-live-admin.js
```

This will check:
- ✅ Environment variables
- ✅ Database connection
- ✅ Admin user exists
- ✅ User role is 'admin'
- ✅ Supabase Auth setup
- ✅ Login flow works
- ✅ Backend API accessible

### Step 3: Check Browser Console
Open browser DevTools (F12) on your live site:
1. Go to `/admin/login`
2. Try to log in
3. Check Console tab for errors
4. Check Network tab for failed requests

Look for:
- 🔴 CORS errors
- 🔴 401 Unauthorized
- 🔴 403 Forbidden
- 🔴 500 Internal Server Error

### Step 4: Check Backend Logs
```bash
# If using PM2
pm2 logs quantex-backend --lines 50

# If using systemd
journalctl -u quantex-backend -n 50

# If running manually
# Check terminal output
```

Look for:
- `❌ [AUTH] No authentication token found`
- `❌ [AUTH] Token validation failed`
- `❌ [AUTH] Profile lookup failed`
- `❌ [ADMIN] User is not admin`

---

## Quick Fix Commands

### Reset Everything
```bash
# 1. Ensure environment variables are set
export NEXT_PUBLIC_SUPABASE_URL="your_url"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your_key"
export SUPABASE_SERVICE_ROLE_KEY="your_service_key"

# 2. Recreate admin user
node scripts/create-admin-live.js

# 3. Restart servers
pm2 restart all

# 4. Test
curl http://localhost:4001/api/admin/health
```

### Test Login from Command Line
```bash
# Create test-live-login.js
cat > test-live-login.js << 'EOF'
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

supabase.auth.signInWithPassword({
  email: 'ramshyamgopalhari@gmail.com',
  password: '@Million2026'
}).then(({ data, error }) => {
  if (error) {
    console.error('❌ Login failed:', error.message);
  } else {
    console.log('✅ Login successful!');
    console.log('User:', data.user.email);
    console.log('Token:', data.session.access_token.substring(0, 30) + '...');
  }
});
EOF

# Run test
node test-live-login.js
```

---

## Prevention Checklist

For future deployments, ensure:

- [ ] All environment variables are set before deploying
- [ ] Admin user is created in production database
- [ ] CORS allows your production domain
- [ ] Backend is running and accessible
- [ ] SSL certificates are valid
- [ ] Firewall allows necessary ports
- [ ] Database migrations are applied
- [ ] .env files are NOT committed to git (use .env.example)

---

## Contact Support

If none of these solutions work:

1. Run the diagnostic script and save output:
   ```bash
   node scripts/diagnose-live-admin.js > diagnosis.txt 2>&1
   ```

2. Check backend logs:
   ```bash
   pm2 logs quantex-backend --lines 100 > backend-logs.txt
   ```

3. Check browser console errors (F12 → Console → screenshot)

4. Provide:
   - Hosting platform (Railway/Vercel/VPS)
   - Error message exactly as shown
   - diagnosis.txt
   - backend-logs.txt
   - Browser console screenshot

---

## Security Notes

⚠️ **IMPORTANT:**
- Never commit passwords or API keys to git
- Change default admin password after first login
- Use strong passwords in production
- Enable 2FA for admin accounts when possible
- Regularly rotate API keys
- Monitor access logs

---

## Related Files

- `/scripts/diagnose-live-admin.js` - Diagnostic tool
- `/scripts/create-admin-live.js` - Create admin user
- `/scripts/change-admin-password.js` - Reset password
- `/backend/middleware/requireAdmin.js` - Authentication logic
- `/backend/routes/admin.js` - Admin API routes
- `/pages/admin/login.js` - Admin login page
