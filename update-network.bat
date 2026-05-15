@echo off
cd /d "%~dp0"
title CityTools - Network Update
setlocal enabledelayedexpansion

REM Check for admin rights
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Administrator rights required!
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

cls
echo ========================================================
echo CityTools - Network Configuration Update
echo ========================================================
echo.
echo Use this when you change WiFi networks or router
echo.

REM Auto-detect new IP
echo Detecting new network IP...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address"') do (
    set NEW_IP=%%a
    set NEW_IP=!NEW_IP:~1!
    goto IP_FOUND
)
:IP_FOUND

echo.
echo Old IP (from SERVER_IP.txt): 
type SERVER_IP.txt 2>nul
echo.
echo New detected IP: %NEW_IP%
echo.

set /p CONFIRM="Update to new IP? (Y/N): "
if /i not "%CONFIRM%"=="Y" exit /b

REM Update backend .env
echo Updating Backend...
powershell -Command "(gc backend\.env) -replace 'FRONTEND_URL=http://.*:5173', 'FRONTEND_URL=http://%NEW_IP%:5173' | Out-File -encoding ASCII backend\.env"

REM Update pos-client .env
echo Updating POS Client...
echo VITE_API_URL=http://%NEW_IP%:5000/api > pos-client\.env

REM Update backoffice .env
echo Updating Backoffice...
echo VITE_API_URL=http://%NEW_IP%:5000/api > backoffice\.env

REM Update SERVER_IP.txt
echo %NEW_IP% > SERVER_IP.txt

echo.
echo ========================================================
echo NETWORK UPDATE COMPLETE!
echo ========================================================
echo.
echo New IP: %NEW_IP%
echo.
echo New URLs:
echo   POS:        http://%NEW_IP%:5173
echo   Backoffice: http://%NEW_IP%:5174
echo   Backend:    http://%NEW_IP%:5000/api
echo.
echo IMPORTANT: Restart the system (stop all, then start all)
echo ========================================================
pause
