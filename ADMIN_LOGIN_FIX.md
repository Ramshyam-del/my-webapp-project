# Quick Fix: Admin Login Not Working After /admin/operate Changes

## What Changed
We added cross-browser wallet synchronization to `/admin/operate` which uses the `configSync` utility. This might be causing issues on your live server.

## Quick Fix Applied ✅
- Added error handling to `configSync` calls in `/admin/operate`
- Wrapped broadcasts in try-catch blocks
- Made sync non-blocking (continues even if sync fails)

## Vercel Environment Variables Checklist

Go to your Vercel dashboard → Project → Settings → Environment Variables and ensure these are set:

### Required Variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://ishprhrmvubfzohvqqxz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_BACKEND_URL=https://your-railway-app.up.railway.app
```

## Railway Environment Variables Checklist

Go to your Railway dashboard → Project → Variables and ensure these are set:

### Required Variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://ishprhrmvubfzohvqqxz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
PORT=4001
NODE_ENV=production
```

### Optional (if you set them):
```bash
ADMIN_EMAIL=ramshyamgopalhari@gmail.com
ADMIN_PASSWORD=@Million2026
```

## Steps to Fix

### 1. Redeploy with Fixed Code
```bash
# Commit the fix
git add pages/admin/operate.js
git commit -m "fix: add error handling to configSync in admin operate"
git push origin main
```

Vercel will auto-deploy when you push.

### 2. Check Railway Backend
```bash
# View Railway logs
railway logs

# Look for errors like:
# - "Supabase not configured"
# - "Database connection failed"  
# - "Missing environment variable"
```

### 3. Test Admin Login
```bash
# Run test script with your live URLs
LIVE_FRONTEND_URL=https://your-app.vercel.app \
NEXT_PUBLIC_SUPABASE_URL=your_url \
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
NEXT_PUBLIC_BACKEND_URL=https://your-railway.up.railway.app \
node scripts/test-live-admin-login.js
```

### 4. If Still Not Working - Recreate Admin User

```bash
# Set your environment variables
export NEXT_PUBLIC_SUPABASE_URL="your_url"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your_key"
export SUPABASE_SERVICE_ROLE_KEY="your_service_key"
export ADMIN_EMAIL="ramshyamgopalhari@gmail.com"
export ADMIN_PASSWORD="@Million2026"

# Run admin creation script
node scripts/create-admin-live.js
```

## Common Errors & Solutions

### Error: "Failed to access"
**Cause:** Backend not accessible or CORS issue
**Solution:**
1. Check Railway is running: `railway status`
2. Check backend URL in Vercel: Should match Railway deployment URL
3. Update CORS in `backend/server.js`:
   ```javascript
   app.use(cors({
     origin: [
       'https://your-vercel-app.vercel.app',
       'https://your-vercel-app-*.vercel.app' // Preview deployments
     ],
     credentials: true
   }));
   ```

### Error: "User not found"
**Cause:** Admin user doesn't exist in production Supabase
**Solution:** Run `node scripts/create-admin-live.js`

### Error: "Invalid credentials"
**Cause:** Wrong password or user doesn't exist in Supabase Auth
**Solution:**
1. Go to Supabase dashboard → Authentication → Users
2. Check if `ramshyamgopalhari@gmail.com` exists
3. If not, run create-admin script
4. If exists, click "..." → Reset Password

### Error: "Access denied"
**Cause:** User exists but doesn't have admin role
**Solution:**
1. Go to Supabase dashboard → Table Editor → users
2. Find user by email
3. Set `role` = `'admin'`
4. Set `status` = `'active'`

## Testing Steps

1. **Test Frontend:**
   ```bash
   curl https://your-app.vercel.app/api/admin/health
   # Should return: {"ok":true}
   ```

2. **Test Backend:**
   ```bash
   curl https://your-railway-app.up.railway.app/api/admin/health
   # Should return: {"ok":true}
   ```

3. **Test Admin Login:**
   - Go to: `https://your-app.vercel.app/admin/login`
   - Enter credentials
   - Open browser DevTools (F12) → Console
   - Look for errors

## Browser Console Errors to Look For

```javascript
// Good - No errors
✅ Login successful

// Bad - Common errors
❌ CORS policy: No 'Access-Control-Allow-Origin'
   → Fix CORS in backend/server.js

❌ Failed to fetch
   → Backend not accessible, check Railway

❌ 401 Unauthorized  
   → Check credentials or Supabase auth

❌ 403 Forbidden
   → User not admin role

❌ configSync is not defined
   → Already fixed in this commit
```

## Rollback if Needed

If you need to temporarily disable the new feature:

```bash
# Comment out configSync in admin/operate.js
# Lines 4 and 279-283

git add pages/admin/operate.js
git commit -m "temp: disable configSync"
git push origin main
```

## Files Modified in This Fix
- ✅ `pages/admin/operate.js` - Added error handling
- ✅ `scripts/test-live-admin-login.js` - New testing script
- ✅ Created this troubleshooting guide

## Next Steps
1. Push this fix to GitHub
2. Wait for Vercel auto-deployment (2-3 minutes)
3. Try logging in again
4. If still fails, check environment variables
5. Run test script for detailed diagnostics

## Support Commands

```bash
# Check Vercel deployment
vercel --prod

# Check Railway deployment  
railway status

# View Railway logs
railway logs --tail

# Test connectivity
curl https://your-app.vercel.app/api/admin/health
curl https://your-railway-app.up.railway.app/api/admin/health
```
