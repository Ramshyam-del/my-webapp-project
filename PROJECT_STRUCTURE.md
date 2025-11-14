# Project Structure Documentation

## 📁 Directory Organization

This document describes the reorganized project structure for better maintainability and security.

### Root Level
```
my-webapp-project/
├── pages/              # Production Next.js pages
├── pages-dev/          # Development/debug pages (excluded from production)
├── components/         # React components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── public/             # Static assets
├── styles/             # CSS styles
├── backend/            # Backend server
├── tests/              # All test files
├── scripts/            # Utility scripts
└── docs/               # Documentation
```

### Backend Structure
```
backend/
├── api/                # API route handlers
├── config/             # Configuration files
├── database/           # Database related files
│   ├── migrations/     # Database migration scripts
│   ├── fixes/          # Database fix scripts
│   └── DEPLOY-*.md     # Deployment documentation
├── middleware/         # Express middleware
├── models/             # Data models
├── routes/             # Express routes
├── services/           # Business logic services
├── scripts/            # Backend utility scripts
├── utils/              # Helper utilities
└── worker/             # Background workers
```

### Tests Structure
```
tests/
├── integration/        # Integration tests (test-*.js, check-*.js)
└── debug/              # Debug scripts (debug-*.js, debug-*.html)
```

### Development Pages (pages-dev/)
**⚠️ These pages are excluded from production builds:**
- `debug-*.js` - Debug utilities
- `test-*.js` - Test pages
- `auth-status.js` - Authentication debugging

### Scripts Directory
**Utility scripts for development and maintenance:**
- `create-test-*.js` - Test data creation
- `simulate-*.js` - Simulation utilities
- `get-*.js` - Data retrieval scripts
- `list-*.js` - Listing utilities
- `reset-*.js` - Reset utilities
- `generate-*.js` - Generation utilities
- `update-*.js` - Update utilities

## 🔒 Security Notes

### Environment Files
**NEVER commit these files:**
- `.env`
- `.env.local`
- `.env.production`
- `backend/.env`

**SAFE to commit:**
- `.env.example`
- `.env.*.template`

### Excluded from Production
The following are automatically excluded from production builds:
1. All files in `pages-dev/`
2. All files in `tests/`
3. Debug and test scripts
4. Development environment files

## 🚀 Build Commands

### Development
```bash
npm run dev              # Start development server
```

### Production
```bash
npm run build           # Build for production (excludes debug pages)
npm run start           # Start production server
npm run start:prod      # Start with production script
```

## 📝 File Naming Conventions

### Test Files
- `test-*.js` - Integration/API tests
- `check-*.js` - Database/structure checks
- `debug-*.js` - Debug utilities

### Database Files
- `database-*.sql` - Main database setup
- `create-*.sql` - Table creation scripts
- `fix-*.sql` - Database fixes (in backend/database/fixes/)
- `add-*.sql` - Migration scripts (in backend/database/migrations/)

### Documentation
- `*.md` - Markdown documentation
- `README.md` - Main documentation
- `SECURITY.md` - Security guidelines
- `DEPLOYMENT_*.md` - Deployment guides

## 🔄 Migration Guide

If you're working with the old structure:

### Finding Moved Files

**Test files moved to `tests/integration/`:**
- test-*.js
- check-*.js
- test-*.html

**Debug files moved to `tests/debug/`:**
- debug-*.js
- debug-*.html

**SQL files moved to `backend/database/migrations/`:**
- *.sql (main migrations)

**Fix SQL files moved to `backend/database/fixes/`:**
- fix-*.sql

**Debug pages moved to `pages-dev/`:**
- pages/debug-*.js
- pages/test-*.js
- pages/auth-status.js

**Utility scripts moved to `scripts/`:**
- create-test-*.js
- simulate-*.js
- get-*.js
- list-*.js
- reset-*.js
- generate-*.js
- update-*.js

## 📊 Before vs After

### Before (Cluttered)
```
my-webapp-project/
├── test-admin-login.js
├── test-api-direct.js
├── debug-auth-session.js
├── check-all-trades.js
├── fix-missing-columns.sql
└── ... (50+ files in root)
```

### After (Organized)
```
my-webapp-project/
├── tests/integration/
│   ├── test-admin-login.js
│   ├── test-api-direct.js
│   └── check-all-trades.js
├── tests/debug/
│   └── debug-auth-session.js
├── backend/database/
│   ├── migrations/
│   └── fixes/
│       └── fix-missing-columns.sql
└── pages/ (production only)
```

## 🎯 Benefits

1. **Security**: Debug/test files excluded from production
2. **Organization**: Clear separation of concerns
3. **Maintainability**: Easy to find and update files
4. **Performance**: Smaller production builds
5. **Clarity**: Obvious which files are for development vs production

---

**Last Updated:** November 14, 2025  
**Version:** 2.0.0
