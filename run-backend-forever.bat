@echo off
title Quantex Backend Server
echo.
echo ========================================
echo    QUANTEX BACKEND SERVER
echo ========================================
echo.
echo This window will keep the backend server running.
echo DO NOT CLOSE THIS WINDOW!
echo.
echo To stop the server, close this window.
echo.
echo Starting server...
echo.

set BACKEND_PORT=4001
REM Set env before running (uncomment and set real values or use a .env loader)
REM Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in system environment before running
set JWT_SECRET=crypto_exchange_jwt_secret_2024

cd backend
node server.js

echo.
echo Server stopped. Press any key to exit...
pause 