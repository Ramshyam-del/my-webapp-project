#!/bin/bash

# Quantex Trading Platform - VPS Deployment Script
# Usage: ./deploy.sh

set -e

echo "🚀 Starting Quantex deployment to VPS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="quantex"
APP_DIR="/var/www/quantex"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR"
NGINX_CONFIG="/etc/nginx/sites-available/quantex"
PM2_APP_NAME="quantex"

echo -e "${YELLOW}📦 Installing dependencies...${NC}"

# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js 18.x
echo -e "${YELLOW}📦 Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo -e "${YELLOW}📦 Installing PM2...${NC}"
sudo npm install -g pm2

# Install Nginx
echo -e "${YELLOW}📦 Installing Nginx...${NC}"
sudo apt install -y nginx

# Create application directory
echo -e "${YELLOW}📁 Setting up application directory...${NC}"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# Clone or update repository
if [ -d "$APP_DIR/.git" ]; then
    echo -e "${YELLOW}🔄 Updating existing repository...${NC}"
    cd $APP_DIR
    git pull origin main
else
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    git clone https://github.com/Ramshyam-del/my-webapp-project.git $APP_DIR
    cd $APP_DIR
fi

# Install frontend dependencies
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
npm install

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd $BACKEND_DIR
npm install
cd $FRONTEND_DIR

# Build frontend
echo -e "${YELLOW}🏗️ Building frontend...${NC}"
npm run build

# Setup environment files
echo -e "${YELLOW}⚙️ Setting up environment files...${NC}"
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production not found! Please create it with your Supabase credentials.${NC}"
    exit 1
fi

if [ ! -f "backend/.env.production" ]; then
    echo -e "${RED}❌ backend/.env.production not found! Please create it with your credentials.${NC}"
    exit 1
fi

# Copy production env files
cp .env.production .env.local
cp backend/.env.production backend/.env

echo -e "${GREEN}✅ Application setup complete!${NC}"
echo -e "${YELLOW}🔧 Next steps:${NC}"
echo "1. Configure your environment variables in .env.production files"
echo "2. Run: pm2 start ecosystem.config.js"
echo "3. Configure Nginx with the provided config"
echo "4. Setup SSL certificate"
echo -e "${GREEN}🎉 Deployment script completed!${NC}"