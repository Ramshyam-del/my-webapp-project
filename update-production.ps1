# ===========================================
# Quantex Production Update Script (Windows)
# ===========================================
# This script updates the production environment
# and restarts services after Supabase restoration

Write-Host "🔄 Quantex Production Update Script" -ForegroundColor Blue
Write-Host "📋 This script will update environment files and restart services" -ForegroundColor Yellow
Write-Host ""

# Check if we're in the correct directory
if (-not (Test-Path "package.json") -or -not (Test-Path ".env.production")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "💡 Expected files: package.json, .env.production" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔍 Checking environment files..." -ForegroundColor Yellow

# Check production environment files
if (-not (Test-Path ".env.production")) {
    Write-Host "❌ .env.production not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "backend\.env.production")) {
    Write-Host "❌ backend\.env.production not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Environment files found" -ForegroundColor Green

# Update environment files
Write-Host "⚙️ Updating runtime environment files..." -ForegroundColor Yellow
Copy-Item ".env.production" ".env.local" -Force
Copy-Item "backend\.env.production" "backend\.env" -Force

Write-Host "✅ Environment files updated" -ForegroundColor Green

# Test production configuration
Write-Host "🧪 Testing Supabase connection..." -ForegroundColor Yellow
node test-supabase-connection.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Supabase connection successful" -ForegroundColor Green
} else {
    Write-Host "❌ Supabase connection failed" -ForegroundColor Red
    Write-Host "💡 Please check your Supabase credentials in .env.production" -ForegroundColor Yellow
}

# Build and test locally
$response = Read-Host "🏗️ Build and test locally? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Set-Location backend
    npm install
    Set-Location ..
    
    Write-Host "🏗️ Building frontend..." -ForegroundColor Yellow
    npm run build
    
    Write-Host "🚀 Starting production server locally..." -ForegroundColor Yellow
    Write-Host "💡 Test at http://localhost:3000 then press Ctrl+C to stop" -ForegroundColor Yellow
    node start-production.js
}

Write-Host ""
Write-Host "🎉 Local update completed!" -ForegroundColor Green
Write-Host "📋 Next steps for live deployment:" -ForegroundColor Blue
Write-Host "1. Upload updated .env.production files to your VPS" -ForegroundColor White
Write-Host "2. Run the update-production.sh script on your VPS" -ForegroundColor White
Write-Host "3. Or manually copy env files and restart PM2 processes" -ForegroundColor White
Write-Host ""
Write-Host "🌐 VPS Commands:" -ForegroundColor Yellow
Write-Host "   cp .env.production .env.local" -ForegroundColor Gray
Write-Host "   cp backend/.env.production backend/.env" -ForegroundColor Gray
Write-Host "   pm2 restart all" -ForegroundColor Gray
Write-Host "   sudo systemctl reload nginx" -ForegroundColor Gray
Write-Host ""