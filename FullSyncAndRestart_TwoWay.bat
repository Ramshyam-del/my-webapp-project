@echo off
:: ===============================
:: Full Two-Way Sync and Restart Script
:: ===============================

echo ===============================
echo [1/4] Committing and pushing local changes to GitHub...
echo ===============================
cd /d "%~dp0my-webapp-project"
git add .
git commit -m "Auto-sync: Updated from Cursor" || echo "No new changes to commit"
git pull origin main --rebase
git push origin main

echo.
echo ===============================
echo [2/4] Connecting to server and restarting app...
echo ===============================

:: Replace with your actual server IP and user
set SERVER_USER=root
set SERVER_IP=162.0.216.199

ssh %SERVER_USER%@%SERVER_IP% "cd /root/pro && git reset --hard && git pull origin main && chmod +x restart_nextjs.sh && ./restart_nextjs.sh"

echo.
echo ===============================
echo [3/4] Pulling any new changes back into Cursor (two-way sync)...
echo ===============================
cd /d "%~dp0my-webapp-project"
git pull origin main

echo.
echo ===============================
echo [4/4] Done! Project fully synced and server restarted.
echo ===============================
pause
