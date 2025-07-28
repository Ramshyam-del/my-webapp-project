#!/bin/bash
set -e

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

echo "=== Done! You can now restart your app manually ==="

