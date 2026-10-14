#!/usr/bin/env bash
# SSO Central - Local Dev Server Launcher for macOS / Linux

echo "========================================================"
echo "   OSTTRA SSO Central - Enterprise Prototype"
echo "========================================================"
echo ""

# 1. Check for Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js (v18+) from https://nodejs.org/"
    exit 1
fi

echo "[OK] Node.js detected: $(node -v)"

# 2. Check dependencies
if [ ! -d "node_modules" ]; then
    echo ""
    echo "[INFO] Installing dependencies (first-time setup)..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] npm install failed."
        exit 1
    fi
fi

# 3. Launch
echo ""
echo "========================================================"
echo " Starting dev server at http://localhost:3000 ..."
echo "========================================================"
echo ""

# Attempt to open browser based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:3000" &
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "http://localhost:3000" &> /dev/null &
fi

npm run dev
