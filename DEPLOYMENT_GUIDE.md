# 🚀 Quantex Trading Platform - VPS Deployment Guide

## Prerequisites
- VPS server with Ubuntu 20.04+ or similar
- Domain: www.quantex.online (already configured)
- SSH access to your VPS
- GitHub repository: https://github.com/Ramshyam-del/my-webapp-project

## 📋 Step-by-Step Deployment

### 1. Prepare Your Local Environment

```bash
# Commit and push your latest changes
git add .
git commit -m "Production deployment ready"
git push origin main
```

### 2. Configure Environment Variables

**Edit `.env.production` (Frontend):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_API_URL=https://www.quantex.online/api
NEXT_PUBLIC_BACKEND_URL=https://www.quantex.online:4001
NODE_ENV=production
```

**Edit `backend/.env.production` (Backend):**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
PORT=4001
NODE_ENV=production
ADMIN_API_KEY=your-secure-admin-api-key
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=https://www.quantex.online
```

### 3. Connect to Your VPS

```bash
ssh root@your-vps-ip
# or
ssh username@your-vps-ip
```

### 4. Run Deployment Script on VPS

```bash
# Download and run the deployment script
wget https://raw.githubusercontent.com/Ramshyam-del/my-webapp-project/main/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### 5. Manual Setup (if script doesn't work)

#### A. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 and Nginx
sudo npm install -g pm2
sudo apt install -y nginx
```

#### B. Clone Repository
```bash
# Create app directory
sudo mkdir -p /var/www/quantex
sudo chown -R $USER:$USER /var/www/quantex

# Clone your repository
git clone https://github.com/Ramshyam-del/my-webapp-project.git /var/www/quantex
cd /var/www/quantex
```

#### C. Install Dependencies and Build
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Build frontend
npm run build
```

#### D. Setup Environment Files
```bash
# Copy production environment files
cp .env.production .env.local
cp backend/.env.production backend/.env
```

### 6. Configure PM2

```bash
# Create PM2 log directory
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Start applications with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
# Follow the instructions shown by pm2 startup command
```

### 7. Configure Nginx

```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/quantex

# Enable the site
sudo ln -s /etc/nginx/sites-available/quantex /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### 8. Setup SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d quantex.online -d www.quantex.online

# Test auto-renewal
sudo certbot renew --dry-run
```

### 9. Configure Firewall

```bash
# Allow necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## 🔧 Management Commands

### PM2 Commands
```bash
# Check status
pm2 status

# View logs
pm2 logs
pm2 logs quantex-frontend
pm2 logs quantex-backend

# Restart applications
pm2 restart all
pm2 restart quantex-frontend
pm2 restart quantex-backend

# Stop applications
pm2 stop all

# Delete applications
pm2 delete all
```

### Nginx Commands
```bash
# Check status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx

# Reload nginx (without downtime)
sudo systemctl reload nginx

# Test configuration
sudo nginx -t
```

## 🔄 Updating Your Application

```bash
# Connect to VPS
ssh username@your-vps-ip

# Navigate to app directory
cd /var/www/quantex

# Pull latest changes
git pull origin main

# Install new dependencies (if any)
npm install
cd backend && npm install && cd ..

# Rebuild frontend
npm run build

# Restart applications
pm2 restart all
```

## 🐛 Troubleshooting

### Check Application Status
```bash
# PM2 status
pm2 status

# Check logs
pm2 logs

# Check nginx logs
sudo tail -f /var/log/nginx/quantex_error.log
sudo tail -f /var/log/nginx/quantex_access.log
```

### Common Issues

1. **Port 3000/4001 already in use**
   ```bash
   sudo lsof -i :3000
   sudo lsof -i :4001
   # Kill processes if needed
   ```

2. **Permission issues**
   ```bash
   sudo chown -R $USER:$USER /var/www/quantex
   ```

3. **Environment variables not loaded**
   - Check `.env.local` and `backend/.env` files exist
   - Restart PM2 processes

## 🎉 Success!

Your Quantex Trading Platform should now be live at:
- **Frontend**: https://www.quantex.online
- **Admin Panel**: https://www.quantex.online/admin
- **API**: https://www.quantex.online/api

## 📊 Monitoring

- **PM2 Monitoring**: `pm2 monit`
- **Nginx Status**: `sudo systemctl status nginx`
- **SSL Certificate**: `sudo certbot certificates`

---

**Need help?** Check the logs and ensure all environment variables are properly configured.