@echo off
echo Starting Quantex Servers...

echo Killing existing Node processes...
taskkill /f /im node.exe 2>nul

echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "npm start"

echo Starting Frontend Server...
cd ..
start "Frontend Server" cmd /k "npm run dev"

echo Servers are starting...
echo Backend: http://localhost:4001
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul 