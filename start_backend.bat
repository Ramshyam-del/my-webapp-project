@echo off
REM Configure environment variables before starting backend
REM set SUPABASE_URL=https://your-project.supabase.co
REM set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
REM set JWT_SECRET=your-super-random-jwt-key-here
set BACKEND_PORT=4001
REM set COINMARKETCAP_API_KEY=your_cmc_key
cd backend
node server.js


