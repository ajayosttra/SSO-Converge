@echo off
setlocal
title SSO Central - Local Dev Server

echo ========================================================
echo    OSTTRA SSO Central - Enterprise Prototype
echo ========================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on your system!
    echo Please download and install Node.js (v18 or higher) from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js is detected.
node -v

:: 2. Check if node_modules exists, install if missing
if not exist "node_modules" (
    echo.
    echo [INFO] First time setup: Installing dependencies...
    echo (This may take 1-2 minutes)
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed. Please check your network/proxy.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed successfully.
)

:: 3. Launch the development server
echo.
echo ========================================================
echo  Starting local server...
echo  The prototype will be accessible at:
echo  http://localhost:3000  (or next available port)
echo ========================================================
echo.

start "" "http://localhost:3000"
call npm run dev

pause
