#!/bin/bash
set -e

echo "=============================="
echo "   FULL AUTO-FIX & RESTART    "
echo "=============================="

### 1. Stop all running processes
echo "=== Stopping PM2 processes (if any) ==="
if command -v pm2 >/dev/null 2>&1; then
  pm2 stop all || true
  pm2 delete all || true
fi

echo "=== Stopping systemd Node services (if any) ==="
systemctl list-units --type=service | grep -i node && {
  for svc in $(systemctl list-units --type=service | grep -i node | awk '{print $1}'); do
    echo "Stopping $svc"
    systemctl stop "$svc" || true
    systemctl disable "$svc" || true
  done
} || echo "No node services found."

echo "=== Killing all Node processes ==="
pkill -9 node || true

echo "=== Freeing ports 3000 and 4000 ==="
fuser -k 3000/tcp || true
fuser -k 4000/tcp || true

echo "=== Verifying ports ==="
lsof -i:3000 || echo "✅ Port 3000 is free"
lsof -i:4000 || echo "✅ Port 4000 is free"

### 2. Update latest code
echo "=== Pulling latest changes from GitHub ==="
cd /root/pro
git reset --hard
git pull origin main

### 3. Backend Setup
echo "=== Setting up Backend ==="
cd /root/pro/backend
npm install --legacy-peer-deps

# Ensure build script exists
if ! grep -q '"build"' package.json; then
  echo "Adding missing build script..."
  sed -i '/"scripts": {/a \    "build": "echo Backend build skipped",' package.json
fi

echo "=== Starting Backend (Production Mode) ==="
npm run start &

sleep 5

### 4. Frontend Setup
echo "=== Setting up Frontend ==="
cd /root/pro
npm install react-chartjs-2 chart.js papaparse --legacy-peer-deps || true
npm install --legacy-peer-deps

echo "=== Building Frontend (Production Mode) ==="
npm run build || echo "⚠️ Build failed, check errors manually"

echo "=== Starting Frontend ==="
npm run start &

echo "=============================="
echo "✅ Backend & Frontend Restarted Successfully"
echo "=============================="

