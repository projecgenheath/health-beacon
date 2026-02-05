# Health Beacon - Debug Server Startup Script
$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Health Beacon Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set location
$projectPath = "c:\Users\Alisson\projeto antigravity\health-beacon"
Set-Location $projectPath
Write-Host "[INFO] Working directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Check Node.js installation
Write-Host "[CHECK] Verifying Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Node.js version: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Node.js not found or not working properly" -ForegroundColor Red
        Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "[ERROR] Failed to check Node.js: $_" -ForegroundColor Red
    exit 1
}

# Check npm installation
Write-Host "[CHECK] Verifying npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] npm version: $npmVersion" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] npm not found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Failed to check npm: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check if package.json exists
Write-Host "[CHECK] Verifying project files..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "[OK] package.json found" -ForegroundColor Green
} else {
    Write-Host "[ERROR] package.json not found in current directory" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (Test-Path "node_modules") {
    Write-Host "[OK] node_modules directory found" -ForegroundColor Green
} else {
    Write-Host "[WARNING] node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Check if port 3000 is available
Write-Host "[CHECK] Checking if port 3000 is available..." -ForegroundColor Yellow
$portCheck = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($portCheck) {
    Write-Host "[WARNING] Port 3000 is in use by process ID: $($portCheck.OwningProcess)" -ForegroundColor Yellow
    Write-Host "[ACTION] Attempting to kill the process..." -ForegroundColor Yellow
    try {
        Stop-Process -Id $portCheck.OwningProcess -Force -ErrorAction Stop
        Write-Host "[OK] Process killed successfully" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "[ERROR] Failed to kill process: $_" -ForegroundColor Red
        Write-Host "Please manually close the application using port 3000" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "[OK] Port 3000 is available" -ForegroundColor Green
}
Write-Host ""

# Check .env file
Write-Host "[CHECK] Verifying environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "[OK] .env file found" -ForegroundColor Green
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "VITE_SUPABASE_URL") {
        Write-Host "[OK] VITE_SUPABASE_URL is configured" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] VITE_SUPABASE_URL not found in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "[WARNING] .env file not found" -ForegroundColor Yellow
}
Write-Host ""

# Start the development server
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Vite Development Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] Server will be available at: http://localhost:3000" -ForegroundColor Green
Write-Host "[INFO] Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Run npm dev
npm run dev
