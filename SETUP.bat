@echo off
cd /d "%~dp0"
title CityTools - First Time Setup Wizard
setlocal enabledelayedexpansion



REM Check for admin rights
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ================================================
    echo ERROR: Administrator rights required!
    echo ================================================
    echo.
    echo Please right-click this file and select
    echo "Run as administrator"
    echo.
    pause
    exit /b 1
)

cls
echo ========================================================
echo CityTools POS System - First Time Setup
echo ========================================================
echo.

REM Auto-detect network IP
echo Detecting network configuration...
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4 Address"') do (
    set IP_ADDR=%%a
    set IP_ADDR=!IP_ADDR:~1!
    goto IP_FOUND
)
:IP_FOUND

echo Your server IP address: %IP_ADDR%
echo.
echo This IP will be used for:
echo   - Backend API: http://%IP_ADDR%:5000/api
echo   - POS Client: http://%IP_ADDR%:5173
echo   - Backoffice: http://%IP_ADDR%:5174
echo.
echo Other devices on the network will use this IP to connect.
echo.
set /p CONFIRM="Is this IP correct? (Y/N): "

if /i not "%CONFIRM%"=="Y" (
    set /p IP_ADDR="Enter correct IP address: "
)

echo.
echo Configuring system with IP: %IP_ADDR%
echo.

REM ============================================
REM UPDATE BACKEND .env
REM ============================================
echo [1/4] Configuring Backend...
(
    echo PORT=5000
    echo HOST=0.0.0.0
    echo JWT_SECRET="f8a9e9113fd916ab3cba7878e859968663377bdf0e64010badd4cb859fa3051d050de7e0697de4a8458f5098fb8327565545bd408899798fc0f6e2a3c8369847"
    echo FRONTEND_URL=http://%IP_ADDR%:5173
    echo.
    echo # PostgreSQL Connection
    echo DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rest_pos?schema=public"
    echo.
    echo PGHOST=localhost
    echo PGUSER=postgres
    echo PGPASSWORD=postgres
    echo PGDATABASE=rest_pos
    echo PGPORT=5432
    echo.
    echo NODE_ENV=production
) > backend\.env
echo Backend configured



REM ============================================
REM UPDATE POS CLIENT .env
REM ============================================
echo [2/4] Configuring POS Client...
(
    echo VITE_API_URL=http://%IP_ADDR%:5000/api
) > pos-client\.env
echo POS Client configured

REM ============================================
REM UPDATE BACKOFFICE .env
REM ============================================
echo [3/4] Configuring Backoffice...
(
    echo VITE_API_URL=http://%IP_ADDR%:5000/api
) > backoffice\.env
echo Backoffice configured

REM ============================================
REM CONFIGURE WINDOWS FIREWALL
REM ============================================
echo [4/4] Configuring Windows Firewall...

netsh advfirewall firewall delete rule name="CityTools POS" >nul 2>&1
netsh advfirewall firewall delete rule name="CityTools Backoffice" >nul 2>&1
netsh advfirewall firewall delete rule name="CityTools Backend" >nul 2>&1
netsh advfirewall firewall delete rule name="CityTools PostgreSQL" >nul 2>&1

netsh advfirewall firewall add rule name="CityTools POS" dir=in action=allow protocol=TCP localport=5173 >nul
netsh advfirewall firewall add rule name="CityTools Backoffice" dir=in action=allow protocol=TCP localport=5174 >nul
netsh advfirewall firewall add rule name="CityTools Backend" dir=in action=allow protocol=TCP localport=5000 >nul
netsh advfirewall firewall add rule name="CityTools PostgreSQL" dir=in action=allow protocol=TCP localport=5432 >nul

echo Firewall configured

echo.
echo ========================================================
echo SETUP COMPLETE!
echo ========================================================
echo.
echo Configuration saved:
echo   Server IP: %IP_ADDR%
echo.
echo Network Access URLs (for other devices):
echo   POS:        http://%IP_ADDR%:5173
echo   Backoffice: http://%IP_ADDR%:5174
echo.
echo ========================================================
echo NEXT STEPS:
echo ========================================================
echo.
echo 1. Close this window
echo 2. Run START_ALL.bat (as administrator)
echo 3. Enter activation code on first run
echo 4. Share the URLs above with other devices
echo.
echo ========================================================

REM Save IP for reference
echo %IP_ADDR% > SERVER_IP.txt

pause
