Write-Host "Starting Quantex Servers..." -ForegroundColor Green
Write-Host ""

# Kill any existing Node.js processes
Write-Host "Stopping any existing Node.js processes..." -ForegroundColor Yellow
taskkill /f /im node.exe 2>$null

# Start Backend Server
Write-Host "Starting Backend Server on port 4001..." -ForegroundColor Cyan
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "Starting Frontend Server on port 3000..." -ForegroundColor Cyan
Set-Location ..
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "Both servers are starting..." -ForegroundColor Green
Write-Host "Backend: http://localhost:4001" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 