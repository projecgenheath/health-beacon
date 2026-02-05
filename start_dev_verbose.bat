@echo off
echo Starting Health Beacon Development Server...
echo.
cd /d "c:\Users\Alisson\projeto antigravity\health-beacon"
echo Current directory: %CD%
echo.
echo Checking Node.js version...
node --version
echo.
echo Checking npm version...
npm --version
echo.
echo Starting Vite dev server...
npm run dev
