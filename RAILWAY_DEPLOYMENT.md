# Railway Deployment Guide

This project consists of two services that need to be deployed separately on Railway:

## 🔧 Service 1: Backend API (Express.js)

### Setup:
1. Create a new Railway project for the backend
2. Connect your GitHub repository
3. Set the **Root Directory** to `backend`
4. Add these environment variables in Railway dashboard:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
ADMIN_API_KEY=your-secure-admin-api-key
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.railway.app
```

### Deploy Command:
- Railway will automatically use `npm start` from backend/package.json
- This runs `node server.js`

---

## 🎨 Service 2: Frontend (Next.js)

### Setup:
1. Create a second Railway project for the frontend
2. Connect the same GitHub repository
3. Set the **Root Directory** to `.` (root)
4. Add these environment variables in Railway dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app/api
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.railway.app
NODE_ENV=production
```

### Deploy Command:
- Railway will use the updated railway.json: `npm run build && npm start`

---

## 🔄 Deployment Order:

1. **Deploy Backend First**: Get the backend URL
2. **Update Frontend Environment**: Use backend URL in frontend env vars
3. **Deploy Frontend**: Frontend will connect to backend API

---

## 🐛 Common Issues & Solutions:

### Backend Crashes:
- Check environment variables are set correctly
- Ensure Supabase credentials are valid
- Check Railway logs for specific error messages

### Frontend Crashes:
- Ensure `npm run build` completes successfully
- Check that NEXT_PUBLIC_BACKEND_URL points to deployed backend
- Verify all required environment variables are set

### CORS Issues:
- Update CORS_ORIGIN in backend to match frontend domain
- Ensure both services are deployed and accessible

---

## 📝 Alternative: Single Service Deployment

If you prefer to deploy as a single service, you can:

1. Modify the root Dockerfile to build both frontend and backend
2. Use a process manager like PM2 to run both services
3. Configure nginx or similar to route requests appropriately

This approach is more complex but keeps everything in one Railway service.