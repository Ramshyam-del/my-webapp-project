# 🔧 Supabase Restoration Fix Guide

## Problem Description
After restoring your Supabase project from paused state to free plan, the live domain `www.quantex.online` shows "failed to fetch" errors during login attempts. This happens because:

1. **Environment Mismatch**: The live server is using old/cached environment variables
2. **Service Restart Required**: PM2 processes need to restart to pick up new environment variables
3. **Configuration Sync**: Production environment files need to be synchronized

## ✅ Solution Status

### Local Environment ✅
- [x] Production environment files exist and are configured
- [x] Supabase connection tested successfully
- [x] Local production server runs without errors
- [x] Authentication works locally with production config

### Live Deployment ⚠️
- [ ] VPS environment files need updating
- [ ] PM2 processes need restarting
- [ ] Nginx configuration may need reloading

## 🚀 Quick Fix Instructions

### Option 1: Automated Fix (Recommended)

1. **Upload the update script to your VPS:**
   ```bash
   scp update-production.sh user@your-vps-ip:/var/www/quantex/
   ```

2. **SSH into your VPS and run the script:**
   ```bash
   ssh user@your-vps-ip
   cd /var/www/quantex
   chmod +x update-production.sh
   ./update-production.sh
   ```

### Option 2: Manual Fix

1. **SSH into your VPS:**
   ```bash
   ssh user@your-vps-ip
   cd /var/www/quantex
   ```

2. **Update environment files:**
   ```bash
   # Copy production environment to runtime
   cp .env.production .env.local
   cp backend/.env.production backend/.env
   ```

3. **Restart services:**
   ```bash
   # Restart PM2 processes
   pm2 restart all
   
   # Check PM2 status
   pm2 status
   
   # Reload Nginx
   sudo systemctl reload nginx
   ```

4. **Verify the fix:**
   ```bash
   # Check PM2 logs for errors
   pm2 logs
   
   # Test the website
   curl -I https://www.quantex.online
   ```

## 🔍 Verification Steps

After applying the fix:

1. **Check PM2 Status:**
   ```bash
   pm2 status
   ```
   Both frontend and backend should show "online" status.

2. **Test API Endpoints:**
   ```bash
   curl https://www.quantex.online/api/health
   ```

3. **Test Website:**
   - Visit `https://www.quantex.online`
   - Try user login
   - Try admin login
   - Check browser console for errors

## 🐛 Troubleshooting

### If login still fails:

1. **Check PM2 logs:**
   ```bash
   pm2 logs --lines 50
   ```

2. **Check Nginx logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Verify environment variables:**
   ```bash
   # Check if environment files exist
   ls -la .env.local backend/.env
   
   # Check Supabase URL in environment
   grep SUPABASE_URL .env.local
   ```

4. **Test Supabase connection on VPS:**
   ```bash
   node test-supabase-connection.js
   ```

### If Supabase connection fails:

1. **Verify Supabase project status:**
   - Go to https://app.supabase.com
   - Check if project is active (not paused)
   - Verify project URL matches environment files

2. **Check API keys:**
   - Go to Project Settings > API
   - Copy fresh anon key and service role key
   - Update `.env.production` files

## 📋 Environment File Contents

### Frontend (.env.production):
```env
NEXT_PUBLIC_SUPABASE_URL=https://ishprhrmvubfzohvqqxz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
NEXT_PUBLIC_API_URL=https://www.quantex.online/api
NEXT_PUBLIC_BACKEND_URL=https://my-webapp-project-production.up.railway.app
NEXT_PUBLIC_BASE_URL=https://www.quantex.online
COINMARKETCAP_API_KEY=c86d1a62-cfad-43e5-9724-3c05555fd75b
NODE_ENV=production
```

### Backend (backend/.env.production):
```env
SUPABASE_URL=https://ishprhrmvubfzohvqqxz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
PORT=$PORT
NODE_ENV=production
CORS_ORIGIN=https://www.quantex.online
ADMIN_API_KEY=quantex-admin-api-key-2024-secure-production-ready-32-chars-minimum
```

## 🎯 Expected Results

After successful fix:
- ✅ Website loads at https://www.quantex.online
- ✅ User login works without "failed to fetch" errors
- ✅ Admin login works without "failed to fetch" errors
- ✅ Market data loads (live or mock fallback)
- ✅ All trading features function normally

## 📞 Support

If issues persist:
1. Check PM2 and Nginx logs
2. Verify Supabase project is active and not paused
3. Ensure domain DNS is pointing to correct VPS IP
4. Test locally first to isolate server vs. application issues