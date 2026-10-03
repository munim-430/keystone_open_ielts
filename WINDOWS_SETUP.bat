@echo off
TITLE KEYSTONE OPEN IELTS - WINDOWS ONE-CLICK INSTALLER
COLOR 0F

echo =======================================================================
echo          KEYSTONE OPEN IELTS - WINDOWS INSTALLATION & SETUP
echo =======================================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js was not detected on this machine.
    echo Opening nodejs.org download page...
    start https://nodejs.org/en/download
    echo Please install Node.js (v18 or higher recommended) and re-run this script.
    pause
    exit /b 1
)

echo [✓] Node.js detected:
node -v
npm -v
echo.

:: 2. Copy .env.example to .env if not exists
if not exist ".env" (
    echo [*] Generating default .env configuration...
    copy .env.example .env >nul
    echo [✓] Created .env configuration file.
)

:: 3. Install NPM packages
echo [*] Installing required Node.js libraries...
call npm install
if %errorlevel% neq 0 (
    echo [X] Error during npm install. Check your internet connection.
    pause
    exit /b 1
)
echo [✓] Packages installed successfully.
echo.

:: 4. Windows Firewall Configuration Advice
echo =======================================================================
echo  LAN FIREWALL CONFIGURATION NOTE:
echo  If the 22 client PCs cannot connect to this Host PC over LAN, open
echo  an Administrator Command Prompt and run this command:
echo.
echo  netsh advfirewall firewall add rule name="Keystone IELTS Port 3000" dir=in action=allow protocol=TCP localport=3000
echo =======================================================================
echo.
echo Setup is complete! You can now double-click START_HOST_SERVER.bat.
pause
