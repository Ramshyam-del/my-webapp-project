#!/bin/bash

# ===========================================
# Quantex Production Update Script
# ===========================================
# This script updates the production environment
# and restarts services after Supabase restoration

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Quantex Production Update Script${NC}"
echo -e "${YELLOW}📋 This script will update environment files and restart services${NC}"
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    echo -e "${YELLOW}💡 Expected files: package.json, .env.production${NC}"
    exit 1
fi

echo -e "${YELLOW}🔍 Checking environment files...${NC}"

# Check production environment files
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production not found!${NC}"
    exit 1
fi

if [ ! -f "backend/.env.production" ]; then
    echo -e "${RED}❌ backend/.env.production not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment files found${NC}"

# Update environment files
echo -e "${YELLOW}⚙️ Updating runtime environment files...${NC}"
cp .env.production .env.local
cp backend/.env.production backend/.env

echo -e "${GREEN}✅ Environment files updated${NC}"

# Pull latest changes (optional)
read -p "$(echo -e "${YELLOW}🔄 Pull latest changes from Git? (y/n): ${NC}")" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}📥 Pulling latest changes...${NC}"
    git pull origin main
    
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
    cd backend && npm install && cd ..
    
    echo -e "${YELLOW}🏗️ Building frontend...${NC}"
    npm run build
fi

# Restart PM2 processes
echo -e "${YELLOW}🔄 Restarting PM2 processes...${NC}"
pm2 restart all

# Check PM2 status
echo -e "${YELLOW}📊 PM2 Status:${NC}"
pm2 status

# Test Nginx configuration
echo -e "${YELLOW}🔧 Testing Nginx configuration...${NC}"
sudo nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
    echo -e "${YELLOW}🔄 Reloading Nginx...${NC}"
    sudo systemctl reload nginx
else
    echo -e "${RED}❌ Nginx configuration has errors${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Production update completed!${NC}"
echo -e "${BLUE}🌐 Your site should now be accessible at: https://www.quantex.online${NC}"
echo -e "${YELLOW}💡 If you still see errors, check the logs:${NC}"
echo "   - PM2 logs: pm2 logs"
echo "   - Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""