# 🚀 Quick Start - Security Hardened Version

## ⚡ Fast Track to Production

### 1️⃣ Setup Environment (5 minutes)
```bash
# Copy environment templates
cp .env.example .env.production
cp backend/.env.example backend/.env.production

# Edit with your real credentials
# Windows: notepad .env.production
# Linux/Mac: nano .env.production
```

### 2️⃣ Verify Security (2 minutes)
```bash
# Check no .env files are tracked
git status | findstr .env
# Should return NOTHING

# Verify .gitignore working
git check-ignore .env
# Should output: .env
```

### 3️⃣ Build & Deploy (5 minutes)
```bash
# Install and build
npm install --production
npm run build

# Start services
npm run start:prod
```

### 4️⃣ Verify Deployment (2 minutes)
```bash
# Test endpoints
curl http://localhost:3000
curl http://localhost:4001/api/health
curl http://localhost:4001/api/monitoring/health
```

## 📊 Monitoring Quick Access

### Endpoints
- **Health Check:** `https://yourdomain.com/api/monitoring/health`
- **Admin Dashboard:** `https://yourdomain.com/admin/monitoring`

### What to Monitor
- ✅ System status (should be "healthy")
- ✅ Error rate (should be < 5%)
- ✅ Response time (should be < 500ms)
- ✅ Memory usage (should be < 80%)

## 🔒 Security Quick Check

### ✅ Verify These Before Going Live
- [ ] No `.env` files in git: `git ls-files | findstr .env`
- [ ] All credentials are production (not test/placeholder)
- [ ] Debug pages not in production: Check `.next/server/pages/`
- [ ] HTTPS enabled in production
- [ ] CORS configured for production domain
- [ ] Admin API key is strong (32+ characters)

## 🆘 Quick Troubleshooting

### Service Won't Start
```bash
pm2 logs        # Check logs
pm2 restart all # Restart services
```

### Can't Access Admin
```bash
# Check admin credentials in database
# Verify session is valid
# Check backend logs: pm2 logs quantex-backend
```

### High Memory Usage
```bash
pm2 monit       # Monitor resources
pm2 restart all # Restart to free memory
```

## 📁 New File Locations

**Moved from root to organized locations:**
- Test files → `/tests/integration/`
- Debug files → `/tests/debug/`
- SQL files → `/backend/database/migrations/`
- Debug pages → `/pages-dev/` (not in production)
- Scripts → `/scripts/`

## 🎯 Post-Deployment Checklist

- [ ] All services running: `pm2 status`
- [ ] Health check passing: `/api/monitoring/health`
- [ ] Can login as admin
- [ ] Can login as user
- [ ] Trading works
- [ ] Withdrawals work
- [ ] Monitoring dashboard accessible
- [ ] No errors in logs: `pm2 logs`

## 📚 Full Documentation

- **Detailed Deployment:** `PRODUCTION_DEPLOYMENT.md`
- **Project Structure:** `PROJECT_STRUCTURE.md`
- **Security Guidelines:** `SECURITY.md`
- **Original README:** `README.md`

---

**Quick Support:** Check monitoring dashboard at `/admin/monitoring` for real-time system status.
