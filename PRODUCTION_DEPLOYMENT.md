# 🚀 Production Deployment Guide - Post Security Hardening

## ✅ Security Improvements Applied

### 1. Credential Security
- ✅ All `.env` files removed from git tracking
- ✅ Enhanced `.gitignore` with comprehensive exclusions
- ✅ Created secure environment templates (`.env.example`)
- ✅ Added `SECURITY.md` with best practices
- ✅ Git artifacts cleaned up

### 2. Project Structure
- ✅ Test files moved to `/tests/integration/`
- ✅ Debug files moved to `/tests/debug/`
- ✅ SQL migrations organized in `/backend/database/migrations/`
- ✅ Database fixes separated to `/backend/database/fixes/`
- ✅ Debug pages moved to `/pages-dev/` (excluded from production)
- ✅ Utility scripts organized in `/scripts/`

### 3. Production Build
- ✅ Debug/test pages excluded from Next.js build
- ✅ Security headers added to `next.config.js`
- ✅ Enhanced `.gitignore` to exclude debug files
- ✅ Environment-based page exclusion

### 4. Monitoring System
- ✅ Comprehensive monitoring service implemented
- ✅ Health check endpoints: `/api/monitoring/health`
- ✅ Metrics tracking (requests, errors, performance)
- ✅ Admin monitoring dashboard: `/admin/monitoring`
- ✅ System resource monitoring (CPU, memory)
- ✅ Alert system for critical issues

## 📋 Pre-Deployment Checklist

### Environment Setup
```bash
# 1. Create production environment file
cp .env.example .env.production
cp backend/.env.example backend/.env.production

# 2. Update with REAL production credentials
# Edit .env.production and backend/.env.production
# NEVER commit these files!

# 3. Verify environment variables
cat .env.production  # Should have NO placeholder values
```

### Required Environment Variables

**Frontend (.env.production):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-real-anon-key
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_BACKEND_URL=https://yourdomain.com:4001
NEXT_PUBLIC_COINMARKETCAP_API_KEY=your-api-key
NODE_ENV=production
```

**Backend (backend/.env.production):**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
PORT=4001
HOST=0.0.0.0
NODE_ENV=production
ADMIN_API_KEY=your-secure-admin-api-key
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=https://yourdomain.com
```

### Security Verification
```bash
# 1. Ensure no .env files are tracked
git status | grep .env
# Should return NOTHING

# 2. Check for exposed credentials in code
npm run audit:secrets:win  # On Windows
# Review and fix any matches

# 3. Verify .gitignore is working
git check-ignore .env .env.local backend/.env
# Should show these files are ignored

# 4. Run security audit
npm audit
# Fix any vulnerabilities
```

### Build Verification
```bash
# 1. Clean build
npm run clean:build

# 2. Verify no debug pages in build
# After build, check .next/server/pages/
# Should NOT contain debug-*.js or test-*.js

# 3. Test production build locally
npm run build
npm run start:prod

# 4. Verify endpoints
curl http://localhost:3000
curl http://localhost:4001/api/health
curl http://localhost:4001/api/monitoring/health
```

## 🚀 Deployment Steps

### 1. Prepare Repository
```bash
# Commit all changes (except .env files)
git add .
git commit -m "Production ready - security hardening complete"
git push origin main
```

### 2. Server Setup

**On your VPS:**
```bash
# Connect to server
ssh user@your-server-ip

# Navigate to project
cd /var/www/quantex

# Pull latest code
git pull origin main

# Install dependencies
npm install --production

# Build frontend
npm run build

# Setup environment files
nano .env.production          # Add production credentials
nano backend/.env.production  # Add backend credentials
```

### 3. Start Services

**Using PM2 (Recommended):**
```bash
# Start backend
cd backend
pm2 start ecosystem.config.js --env production

# Start frontend
cd ..
pm2 start npm --name "quantex-frontend" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

**Manual Start (Alternative):**
```bash
# Terminal 1 - Backend
cd backend
NODE_ENV=production node server.js

# Terminal 2 - Frontend
NODE_ENV=production npm start
```

### 4. Verify Deployment

```bash
# Check health endpoints
curl https://yourdomain.com/api/health
curl https://yourdomain.com/api/monitoring/health

# Check logs
pm2 logs quantex-backend
pm2 logs quantex-frontend

# Monitor system
pm2 monit
```

## 📊 Post-Deployment Monitoring

### Access Monitoring Dashboard
1. Login to admin panel: `https://yourdomain.com/admin/login`
2. Navigate to: `https://yourdomain.com/admin/monitoring`
3. Review system health, metrics, and alerts

### Monitor Endpoints
- **Public Health:** `/api/monitoring/health` (no auth required)
- **Public Ping:** `/api/monitoring/ping` (no auth required)
- **Admin Metrics:** `/api/monitoring/metrics` (requires admin API key)
- **Admin Report:** `/api/monitoring/report` (requires admin API key)
- **Admin Alerts:** `/api/monitoring/alerts` (requires admin API key)

### Key Metrics to Watch
- ✅ Request count and error rate
- ✅ Average response time (should be < 500ms)
- ✅ Memory usage (should be < 80%)
- ✅ CPU load average
- ✅ Database connectivity
- ✅ System uptime

### Alert Thresholds
- 🟢 **Healthy:** Error rate < 5%, Memory < 80%
- 🟡 **Warning:** Error rate 5-10%, Memory 80-90%
- 🔴 **Critical:** Error rate > 10%, Memory > 90%

## 🔒 Security Maintenance

### Daily Tasks
- [ ] Review monitoring dashboard for unusual activity
- [ ] Check error logs for security issues
- [ ] Verify all services are running

### Weekly Tasks
- [ ] Review security alerts
- [ ] Check for failed authentication attempts
- [ ] Audit admin actions
- [ ] Review rate limit violations

### Monthly Tasks
- [ ] Rotate admin API keys
- [ ] Update dependencies: `npm audit fix`
- [ ] Review and update security policies
- [ ] Backup database
- [ ] Test disaster recovery

### Quarterly Tasks
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Review and update credentials
- [ ] Compliance check

## 🆘 Troubleshooting

### Service Won't Start
```bash
# Check logs
pm2 logs

# Check environment
node -e "console.log(process.env.NODE_ENV)"

# Verify files
ls -la .env.production
ls -la backend/.env.production
```

### High Memory Usage
```bash
# Check process memory
pm2 monit

# Restart services
pm2 restart all

# View monitoring dashboard
# Go to /admin/monitoring
```

### Database Connection Issues
```bash
# Test connection
curl http://localhost:4001/api/monitoring/health

# Check environment variables
# Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
```

### High Error Rate
1. Check `/admin/monitoring` for error details
2. Review logs: `pm2 logs`
3. Check last error in metrics
4. Verify external API status (CoinMarketCap, etc.)

## 📞 Support

### Emergency Contacts
- **Critical Issues:** Restart all services: `pm2 restart all`
- **Security Breach:** Follow incident response in `SECURITY.md`
- **Data Loss:** Restore from latest backup

### Useful Commands
```bash
# Restart all services
pm2 restart all

# View logs
pm2 logs --lines 100

# Check system resources
htop

# Check disk space
df -h

# Check network
netstat -tulpn
```

## 🎯 Success Criteria

### Deployment is Successful When:
- ✅ All endpoints return 200 OK
- ✅ Frontend loads without errors
- ✅ Users can login and trade
- ✅ Admin panel accessible
- ✅ Monitoring dashboard shows "healthy"
- ✅ No critical alerts
- ✅ Response times < 500ms
- ✅ Memory usage < 80%
- ✅ Zero exposed credentials in git

## 📚 Additional Resources
- **Project Structure:** See `PROJECT_STRUCTURE.md`
- **Security Guidelines:** See `SECURITY.md`
- **Original Deployment Guide:** See `DEPLOYMENT_GUIDE.md`
- **Production Checklist:** See `PRODUCTION_CHECKLIST.md`

---

**Deployment Date:** November 14, 2025  
**Version:** 2.0.0 (Security Hardened)  
**Status:** ✅ Production Ready
