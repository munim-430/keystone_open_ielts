@echo off
TITLE KEYSTONE OPEN IELTS - HOST ADMIN SERVER
COLOR 0A

echo =======================================================================
echo          KEYSTONE OPEN IELTS - COMPUTER-DELIVERED PLATFORM
echo                     HOST / ADMIN SERVER LAUNCHER
echo =======================================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found on this system!
    echo Please download and install Node.js (LTS version) from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Check if dependencies are installed
if not exist "node_modules\" (
    echo [*] First time setup detected. Installing required packages...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install encountered an error.
        pause
        exit /b 1
    )
)

:: 3. Find Host Local IP Address
echo [*] Detecting Local Area Network (LAN) IP Address...
for /f "tokens=4" %%a in ('route print^|findstr 0.0.0.0^|findstr /v "0.0.0.0/0"') do (
    set LOCAL_IP=%%a
)

echo.
echo =======================================================================
echo  [SERVER READY]
echo  - Host Invigilator Dashboard:  http://localhost:3000/admin
echo  - Client Terminal LAN URL:     http://%LOCAL_IP%:3000
echo.
echo  Share the Client Terminal LAN URL with your 22 student Core i3 PCs!
echo =======================================================================
echo.

:: 4. Launch Invigilator Dashboard in Browser after 2 seconds
start "" /b cmd /c "timeout /t 2 >nul & start http://localhost:3000/admin"

:: 5. Start Node Server
node server/index.js

pause
