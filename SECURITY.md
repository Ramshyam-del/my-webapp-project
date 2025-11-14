# 🔒 Security Guidelines - Quantex Trading Platform

## ⚠️ CRITICAL SECURITY REMINDERS

### Never Commit Sensitive Data
- ❌ Never commit `.env` files with real credentials
- ❌ Never commit API keys, passwords, or secrets
- ❌ Never commit Supabase service role keys
- ✅ Only commit `.env.example` and `.env.*.template` files

### Environment File Management
```bash
# Development
.env.local          # Your local development credentials (NEVER commit)

# Production
.env.production     # Production credentials (NEVER commit)

# Templates (SAFE to commit)
.env.example        # Frontend template
backend/.env.example # Backend template
```

## 🔐 Credential Management

### Generate Secure Keys
```bash
# Generate random API key (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate random API key (PowerShell)
[Convert]::ToBase64String((1..48|%{Get-Random -Max 256}))
```

### Supabase Credentials
1. **Anon Key** - Safe for client-side use (read-only with RLS)
2. **Service Role Key** - NEVER expose to client, backend only
3. **JWT Secret** - Keep secure, used for token verification

### Key Rotation Schedule
- 🔄 Rotate admin API keys: **Every 90 days**
- 🔄 Rotate JWT secrets: **Every 180 days**
- 🔄 Review access logs: **Weekly**
- 🔄 Audit security events: **Daily**

## 🛡️ Security Best Practices

### Backend Security
- ✅ All admin routes protected with API key middleware
- ✅ Rate limiting on all endpoints
- ✅ Helmet.js for security headers
- ✅ CORS properly configured
- ✅ Timing-safe comparison for API keys
- ✅ Input validation on all user inputs

### Database Security
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Service role used only in backend
- ✅ Prepared statements to prevent SQL injection
- ✅ Audit logs for sensitive operations

### Frontend Security
- ✅ No sensitive data in localStorage
- ✅ HTTPS only in production
- ✅ CSP headers configured
- ✅ XSS protection enabled

## 🚨 Security Incident Response

### If Credentials Are Compromised:
1. **Immediately** rotate all affected credentials
2. Review access logs for unauthorized access
3. Check database for suspicious activity
4. Notify users if data breach occurred
5. Update security monitoring rules

### Rotation Commands:
```bash
# Rotate Supabase credentials
# 1. Go to Supabase Dashboard -> Settings -> API
# 2. Click "Reset database password"
# 3. Update all environment files

# Rotate admin API key
# 1. Generate new key (see above)
# 2. Update backend/.env.production
# 3. Restart backend server
# 4. Update any scripts using the key
```

## 📊 Security Monitoring

### Monitor These Events:
- Failed login attempts (>5 in 15 minutes)
- Multiple API key failures
- Large withdrawals (>$10,000)
- Admin actions outside business hours
- Database access from unknown IPs
- Unusual trading patterns

### Check Security Dashboard:
```
Admin Panel -> Security Monitoring -> View Events
```

## 🔍 Security Audit Checklist

### Before Production Deployment:
- [ ] All `.env` files removed from git
- [ ] All test/debug files excluded from build
- [ ] All credentials rotated from development
- [ ] Security headers verified (helmet.js)
- [ ] Rate limiting tested on all endpoints
- [ ] CORS whitelist verified
- [ ] Database RLS policies tested
- [ ] Admin routes require authentication
- [ ] Error messages don't leak sensitive info
- [ ] Logs don't contain credentials
- [ ] SSL/TLS certificates valid
- [ ] Dependency vulnerabilities checked (`npm audit`)

### Monthly Security Review:
- [ ] Review access logs
- [ ] Check for failed authentication attempts
- [ ] Audit admin actions
- [ ] Review rate limit violations
- [ ] Check for outdated dependencies
- [ ] Verify backup integrity
- [ ] Test disaster recovery procedures

## 📞 Security Contacts

### Report Security Issues:
- **Email:** security@quantex.online
- **Priority:** Critical issues within 24 hours
- **Severity Levels:**
  - 🔴 Critical: Data breach, credential exposure
  - 🟡 High: Authentication bypass, XSS
  - 🟢 Medium: Rate limit bypass, info disclosure
  - ⚪ Low: Minor configuration issues

## 🔗 Additional Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

---

**Last Updated:** November 14, 2025  
**Version:** 1.0.0  
**Review Frequency:** Quarterly
