# Health Beacon - Start Development Server
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Health Beacon Development Server" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Change to project directory
Set-Location "c:\Users\Alisson\projeto antigravity\health-beacon"
Write-Host "Current Directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Green
$nodeVersion = node --version
Write-Host "Node.js version: $nodeVersion" -ForegroundColor White
Write-Host ""

# Check npm
Write-Host "Checking npm..." -ForegroundColor Green
$npmVersion = npm --version
Write-Host "npm version: $npmVersion" -ForegroundColor White
Write-Host ""

# Check if port 3000 is in use
Write-Host "Checking if port 3000 is available..." -ForegroundColor Green
$portInUse = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "WARNING: Port 3000 is already in use!" -ForegroundColor Red
    Write-Host "Attempting to kill the process..." -ForegroundColor Yellow
    $processId = $portInUse.OwningProcess
    Stop-Process -Id $processId -Force
    Write-Host "Process killed. Waiting 2 seconds..." -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "Port 3000 is available!" -ForegroundColor Green
}
Write-Host ""

# Start the development server
Write-Host "Starting Vite development server..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
npm run dev
