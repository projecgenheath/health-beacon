@echo off
echo Starting Health Beacon Development Server...
echo.
cd /d "c:\Users\Alisson\projeto antigravity\health-beacon"

echo Checking Node.js version...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found!
    pause
    exit /b 1
)

echo.
echo Checking npm version...
npm --version
if errorlevel 1 (
    echo ERROR: npm not found!
    pause
    exit /b 1
)

echo.
echo Starting Vite development server...
echo Server will be available at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.

npm run dev

pause
