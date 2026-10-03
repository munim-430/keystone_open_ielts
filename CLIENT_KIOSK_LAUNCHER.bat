@echo off
TITLE KEYSTONE OPEN IELTS - CLIENT TERMINAL KIOSK
COLOR 0B

echo =======================================================================
echo          KEYSTONE OPEN IELTS - CLIENT TERMINAL LAUNCHER
echo              Optimized for Windows Core i3 LAN Terminals
echo =======================================================================
echo.

:: 1. Read or Prompt for Host Server IP
set HOST_FILE=host_ip.txt
if exist "%HOST_FILE%" (
    set /p HOST_IP=<"%HOST_FILE%"
) else (
    echo Enter the Host PC Local IP Address (e.g. 192.168.1.100):
    set /p HOST_IP="Host IP: "
    echo %HOST_IP%> "%HOST_FILE%"
)

if "%HOST_IP%"=="" (
    echo [ERROR] No Host IP provided.
    del "%HOST_FILE%" 2>nul
    pause
    exit /b 1
)

:: 2. Target URL with Terminal ID as computer name
set TARGET_URL=http://%HOST_IP%:3000?pc=%COMPUTERNAME%

echo [*] Connecting to Host Server at: %TARGET_URL%
echo.

:: 3. Find Chrome or Microsoft Edge
set BROWSER_CMD=""

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set BROWSER_CMD="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set BROWSER_CMD="%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    set BROWSER_CMD="%LocalAppData%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    set BROWSER_CMD="%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
) else if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    set BROWSER_CMD="%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
)

if %BROWSER_CMD%=="" (
    echo [WARNING] Neither Chrome nor Edge executable was detected in standard paths.
    echo Launching default system browser...
    start %TARGET_URL%
) else (
    echo [*] Launching secure Kiosk Exam Mode with audio/mic permissions...
    %BROWSER_CMD% --kiosk --app=%TARGET_URL% --disable-pinch --overscroll-history-navigation=0 --autoplay-policy=no-user-gesture-required --use-fake-ui-for-media-stream
)

echo.
echo Exam window launched. Press any key if you need to reconfigure the Host IP.
pause >nul
del "%HOST_FILE%" 2>nul
