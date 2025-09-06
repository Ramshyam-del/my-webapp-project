# CORS Configuration Fix for Registration Issue

## Problem
The frontend registration form shows "Failed to fetch" because the Railway backend CORS configuration doesn't include the Vercel domain.

## Solution
Update the Railway environment variables to include the Vercel domain in CORS_ORIGIN.

## Steps to Fix

### 1. Access Railway Dashboard
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Navigate to your `my-webapp-project-production` service
3. Click on the **Variables** tab

### 2. Update Environment Variables
Add or update these environment variables:

```
CORS_ORIGIN=https://my-webapp-project-ukuq-5nilch7j8-quantexs-projects.vercel.app,https://www.quantex.online,https://quantex.online
FRONTEND_URL=https://my-webapp-project-ukuq-5nilch7j8-quantexs-projects.vercel.app
```

### 3. Redeploy
1. After updating the variables, Railway will automatically redeploy
2. Wait for the deployment to complete (usually 2-3 minutes)
3. Test the registration form again

## Verification
After the fix:
- Registration should work without "Failed to fetch" errors
- The backend will accept requests from the Vercel frontend
- CORS errors in browser console should be resolved

## Current Configuration
- **Frontend (Vercel)**: https://my-webapp-project-ukuq-5nilch7j8-quantexs-projects.vercel.app
- **Backend (Railway)**: https://my-webapp-project-production.up.railway.app
- **Issue**: Backend CORS only allows https://www.quantex.online
- **Fix**: Add Vercel domain to CORS_ORIGIN

## Alternative Quick Fix
If you have Railway CLI installed:
```bash
railway login
railway link
railway variables set CORS_ORIGIN="https://my-webapp-project-ukuq-5nilch7j8-quantexs-projects.vercel.app,https://www.quantex.online,https://quantex.online"
railway variables set FRONTEND_URL="https://my-webapp-project-ukuq-5nilch7j8-quantexs-projects.vercel.app"
```