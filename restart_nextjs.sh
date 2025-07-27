#!/bin/bash

echo "=== Pulling latest changes from GitHub ==="
git reset --hard
git pull origin main

echo "=== Stopping any running processes on ports 4000 and 3000 ==="
pkill -f "node server.js" || true
pkill -f "next" || true

echo "=== Starting Backend ==="
cd /root/pro/backend
npm install --force
nohup node server.js > backend.log 2>&1 &

echo "=== Building and Starting Frontend (Production Mode) ==="
cd /root/pro
npm install --force
npm run build
nohup npm run start > frontend.log 2>&1 &

echo "=== Checking Running Processes ==="
ps aux | grep -E "node|next"

echo "=== Last 30 lines of Backend Log ==="
tail -n 30 /root/pro/backend/backend.log

echo "=== Last 30 lines of Frontend Log ==="
tail -n 30 /root/pro/frontend.log

echo "✅ Restart Complete! Check logs if any issue."
