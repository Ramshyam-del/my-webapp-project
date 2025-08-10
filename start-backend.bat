@echo off
echo Starting Quantex Backend Server...
echo.

set BACKEND_PORT=4001
REM Configure environment before starting backend (fill values in your local env)
REM set SUPABASE_URL=https://your-project.supabase.co
REM set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
set JWT_SECRET=crypto_exchange_jwt_secret_2024

echo Environment variables set:
echo - BACKEND_PORT: %BACKEND_PORT%
echo - NEXT_PUBLIC_SUPABASE_URL: %NEXT_PUBLIC_SUPABASE_URL%
echo - SUPABASE_SERVICE_ROLE_KEY: [SET]
echo - JWT_SECRET: [SET]
echo.

echo Starting server on port %BACKEND_PORT%...
echo Press Ctrl+C to stop the server
echo.

node server.js

echo.
echo Server stopped.
pause 