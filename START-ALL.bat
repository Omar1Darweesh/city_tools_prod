@echo off

REM ============================================
REM ENCRYPTION/DECRYPTION FUNCTIONS
REM ============================================

goto :SKIP_FUNCTIONS

:ENCRYPT_ID
setlocal EnableDelayedExpansion
set "input=%~1"

REM Simple encoding
set "encoded=!input!"
set "len=0"

for /L %%i in (0,1,200) do (
    set "char=!input:~%%i,1!"
    if defined char if not "!char!"=="" (
        set /a len+=1
    )
)

set "result=CTS_!len!_!encoded!"

for /f "delims=" %%A in ("!result!") do (
    endlocal
    set "ENCRYPTED_DATA=%%A"
)
goto :eof




:SKIP_FUNCTIONS

REM ============================================

cd /d "%~dp0"


title CityTools - System Manager
cls

REM ============================================
REM CLEANUP HANDLER
REM ============================================
if not defined IN_CLEANUP (
    set IN_CLEANUP=1
    
    (
        echo @echo off
        echo echo Shutting down CityTools services...
        echo taskkill /F /FI "WINDOWTITLE eq CityTools*" /T ^>nul 2^>^&1
        echo "%~dp0postgresql-portable\bin\pg_ctl.exe" -D "%~dp0postgresql-data" stop -m fast ^>nul 2^>^&1
        echo timeout /t 2 /nobreak ^>nul
        echo del "%%~f0"
    ) > "%TEMP%\citytools_shutdown.bat"
)

REM ============================================
REM ACTIVATION CHECK
REM ============================================

if exist "ACTIVATION.lock" goto CHECK_HARDWARE

echo ========================================================
echo CityTools POS System - First Time Activation
echo ========================================================
echo.
echo This system requires activation.
echo Please enter the activation code provided by your vendor.
echo.

set /p ACTIVATION_CODE="Enter Activation Code: "

if not "%ACTIVATION_CODE%"=="CITYTOOLS2026" (
    echo.
    echo ================================================
    echo INVALID ACTIVATION CODE!
    echo ================================================
    echo.
    echo Please contact your vendor for the correct code.
    echo.
    pause
    goto :eof
)

echo.
echo Activating system...
echo.
echo Reading hardware information...

REM Get Motherboard Serial
set "MB_SERIAL="
for /f "skip=1 tokens=*" %%I in ('wmic baseboard get serialnumber 2^>nul') do (
    if not "%%I"=="" (
        set "MB_SERIAL=%%I"
        goto mb_found
    )
)
:mb_found
set "MB_SERIAL=%MB_SERIAL: =%"

REM Get CPU ID
set "CPU_ID="
for /f "skip=1 tokens=*" %%I in ('wmic cpu get processorid 2^>nul') do (
    if not "%%I"=="" (
        set "CPU_ID=%%I"
        goto cpu_found
    )
)
:cpu_found
set "CPU_ID=%CPU_ID: =%"

REM Get Disk Serial (First Physical Drive)
set "DISK_SERIAL="
for /f "skip=1 tokens=*" %%I in ('wmic diskdrive where "DeviceID like '%%PHYSICALDRIVE0%%'" get SerialNumber 2^>nul') do (
    if not "%%I"=="" (
        set "DISK_SERIAL=%%I"
        goto disk_found
    )
)
:disk_found
set "DISK_SERIAL=%DISK_SERIAL: =%"

REM Combine all IDs
set "HARDWARE_ID=%MB_SERIAL%-%CPU_ID%-%DISK_SERIAL%"

REM Validate we got at least one ID
if "%MB_SERIAL%"=="" if "%CPU_ID%"=="" if "%DISK_SERIAL%"=="" (
    cls
    echo ================================================
    echo ERROR: Cannot Read Hardware Information
    echo ================================================
    echo.
    echo This system could not detect your hardware.
    echo Please contact your vendor for assistance.
    echo.
    pause
    goto :eof

)

echo Hardware information collected successfully.

REM Encrypt hardware ID with timestamp
call :ENCRYPT_ID "%HARDWARE_ID%"

if "%ENCRYPTED_DATA%"=="" (
    echo ERROR: Activation failed. Please contact support.
    pause
    exit
)


REM Build activation data with escaped pipes
set "ACTIVATION_DATA=%ENCRYPTED_DATA%^|%date%^|%time:~0,8%"

REM Save encrypted activation
(echo %ACTIVATION_DATA%) > ACTIVATION.lock


REM Create hidden vendor record for support
(
    echo ========================================
    echo CityTools Activation Record
    echo ========================================
    echo Activation Date: %date% %time%
    echo Hardware ID: %HARDWARE_ID%
    echo Encrypted: %ENCRYPTED_DATA%
    echo ========================================
) > .activation_record
attrib +h +s .activation_record >nul 2>&1

echo ================================================
echo ACTIVATION SUCCESSFUL!
echo ================================================
echo.
echo System ID: %HARDWARE_ID%
echo.
echo This software is now licensed to this computer only.
echo.
echo Securing source code...

REM Hide source code folders only (NOT node-portable or postgresql-portable)
attrib +h +s backend >nul 2>&1
attrib +h +s pos-client >nul 2>&1
attrib +h +s backoffice >nul 2>&1

echo Source code secured.
echo.
echo Press any key to start the system...
pause >nul
cls

:CHECK_HARDWARE
setlocal EnableDelayedExpansion

REM Read current hardware (same method as activation)
set "MB_SERIAL="
for /f "skip=1 tokens=*" %%I in ('wmic baseboard get serialnumber 2^>nul') do (
    if not "%%I"=="" (
        set "MB_SERIAL=%%I"
        goto mb_found2
    )
)
:mb_found2
set "MB_SERIAL=%MB_SERIAL: =%"

set "CPU_ID="
for /f "skip=1 tokens=*" %%I in ('wmic cpu get processorid 2^>nul') do (
    if not "%%I"=="" (
        set "CPU_ID=%%I"
        goto cpu_found2
    )
)
:cpu_found2
set "CPU_ID=%CPU_ID: =%"

set "DISK_SERIAL="
for /f "skip=1 tokens=*" %%I in ('wmic diskdrive where "DeviceID like '%%PHYSICALDRIVE0%%'" get SerialNumber 2^>nul') do (
    if not "%%I"=="" (
        set "DISK_SERIAL=%%I"
        goto disk_found2
    )
)
:disk_found2
set "DISK_SERIAL=%DISK_SERIAL: =%"

set "CURRENT_ID=%MB_SERIAL%-%CPU_ID%-%DISK_SERIAL%"


REM Read and parse encrypted activation file
set /p ACTIVATION_LINE=<ACTIVATION.lock

REM Extract encrypted part (before first |)
for /f "tokens=1,2,3 delims=|" %%a in ("%ACTIVATION_LINE%") do (
    set "SAVED_ENCRYPTED=%%a"
    set "ACTIVATION_DATE=%%b"
    set "ACTIVATION_TIME=%%c"
)

REM Encrypt current hardware ID for comparison
call :ENCRYPT_ID "%CURRENT_ID%"
set "CURRENT_ENCRYPTED=%ENCRYPTED_DATA%"

REM Compare encrypted values
if not "%CURRENT_ENCRYPTED%"=="%SAVED_ENCRYPTED%" (

       cls
    echo ================================================
    echo UNAUTHORIZED SYSTEM
    echo ================================================
    echo.
    echo This software is not authorized for this computer.
    echo.
    echo Your license was activated on: %ACTIVATION_DATE% at %ACTIVATION_TIME%
    echo.
    echo This could happen if:
    echo  - You replaced your motherboard, CPU, or hard drive
    echo  - You copied this software to another computer
    echo  - The activation file was tampered with
    echo.
    echo Please contact your vendor to transfer your license.
    echo.
    echo Support Info:
    echo  Current Hardware: %CURRENT_ID%
    echo  Activation Code: %SAVED_ENCRYPTED:~0,20%...
    echo.
    pause
    goto :eof

)


REM Ensure source code folders stay locked (NOT node-portable or postgresql-portable)
attrib +h +s backend >nul 2>&1
attrib +h +s pos-client >nul 2>&1
attrib +h +s backoffice >nul 2>&1

REM ============================================
REM SYSTEM STARTUP
REM ============================================

set NODE_PATH=%~dp0node-portable
set PG_PATH=%~dp0postgresql-portable
set PG_DATA=%~dp0postgresql-data
set PG_LOG=%PG_DATA%\postgresql.log
set PGPASSWORD=postgres
set "PATH=%NODE_PATH%;%PG_PATH%\bin;%PATH%"

echo ========================================================
echo CityTools POS System - Portable Edition
echo ========================================================
echo.

REM ============================================
REM STEP 0: CLEANUP OLD PROCESSES
REM ============================================
echo [0/8] Cleaning up any previous instances...

"%PG_PATH%\bin\pg_ctl.exe" -D "%PG_DATA%" stop -m fast >nul 2>&1
timeout /t 2 /nobreak >nul

taskkill /F /IM postgres.exe >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq CityTools Backend" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq CityTools POS" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq CityTools Backoffice" >nul 2>&1

echo Cleanup complete
echo.

REM ============================================
REM STEP 1: POSTGRESQL INITIALIZATION
REM ============================================
echo [1/8] Checking PostgreSQL initialization...
if not exist "%PG_DATA%" (
    echo First time setup - Initializing PostgreSQL...
    "%PG_PATH%\bin\initdb.exe" -U postgres -A trust -E utf8 --locale=C -D "%PG_DATA%" >nul
    echo PostgreSQL initialized
    set FIRST_TIME=1
) else (
    echo PostgreSQL already initialized
    set FIRST_TIME=0
)
echo.

REM ============================================
REM STEP 2: START POSTGRESQL
REM ============================================
echo [2/8] Starting PostgreSQL server...

"%PG_PATH%\bin\pg_isready.exe" -U postgres -h localhost -p 5432 >nul 2>&1
if %errorlevel% equ 0 (
    echo PostgreSQL is already running
    goto PG_READY
)

"%PG_PATH%\bin\pg_ctl.exe" -D "%PG_DATA%" -l "%PG_LOG%" start >nul 2>&1

echo Waiting for PostgreSQL to be ready...
set RETRY_COUNT=0
set MAX_RETRIES=60

:WAIT_PG
"%PG_PATH%\bin\pg_isready.exe" -U postgres -h localhost -p 5432 >nul 2>&1
if %errorlevel% equ 0 goto PG_READY

set /a RETRY_COUNT+=1
if %RETRY_COUNT% geq %MAX_RETRIES% (
    echo.
    echo ================================================
    echo ERROR: PostgreSQL failed to start!
    echo ================================================
    echo.
    echo Last 15 lines of PostgreSQL log:
    echo ------------------------------------------------
    powershell -command "if (Test-Path '%PG_LOG%') { Get-Content '%PG_LOG%' -Tail 15 } else { Write-Host 'Log file not found' }"
    echo ------------------------------------------------
    echo.
    pause
    goto :eof
)

timeout /t 1 /nobreak >nul
goto WAIT_PG

:PG_READY
echo PostgreSQL is ready and accepting connections
echo.

REM ============================================
REM STEP 3: CHECK DATABASE
REM ============================================
echo [3/8] Checking database...
"%PG_PATH%\bin\psql.exe" -U postgres -lqt 2>nul | findstr "rest_pos" >nul 2>&1
if errorlevel 1 (
    echo Database will be created by migrations
    set NEED_SEED=1
) else (
    echo Database exists
    set NEED_SEED=0
)
if %FIRST_TIME%==1 set NEED_SEED=1
echo.

REM ============================================
REM STEP 4: MIGRATIONS
REM ============================================
cd backend
echo [4/8] Running database migrations...
call "%NODE_PATH%\npx.cmd" prisma migrate deploy
if errorlevel 1 (
    echo.
    echo ERROR: Database migrations failed!
    cd ..
    pause
    goto :eof
)
echo Migrations complete
echo.

REM ============================================
REM STEP 5: SEEDING
REM ============================================
echo [5/8] Checking if seeding needed...
if %NEED_SEED%==1 (
    echo First time setup - Seeding database...
    echo This may take 1-2 minutes, please wait...
    echo.
    call "%NODE_PATH%\npm.cmd" run seed:all
    
    if errorlevel 1 (
        echo.
        echo WARNING: Database seeding encountered errors!
        echo The system may not work correctly.
        echo.
        pause
    ) else (
        echo.
        echo Database seeded successfully
    )
) else (
    echo Database already populated, skipping seed...
)
echo.
cd ..

REM ============================================
REM STEP 6: START BACKEND
REM ============================================
echo [6/8] Starting Backend Server...

REM Kill any process on port 5000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 ^| findstr LISTENING') do (
    echo Killing old process on port 5000 (PID: %%a)
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 1 /nobreak >nul

start /min "CityTools Backend" cmd /c "title CityTools Backend && cd /d "%~dp0backend" && "%~dp0node-portable\npm.cmd" run start:dev"

echo Waiting for backend to start (typically 20-40 seconds)...
set BACKEND_RETRY=0
:WAIT_BACKEND
timeout /t 1 /nobreak >nul
netstat -ano | findstr ":5000" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 goto BACKEND_READY

set /a BACKEND_RETRY+=1
if %BACKEND_RETRY% equ 15 echo Still waiting... (TypeScript is compiling)
if %BACKEND_RETRY% equ 30 echo Almost there... (NestJS is initializing)

if %BACKEND_RETRY% geq 60 (
    echo.
    echo ================================================
    echo WARNING: Backend did not respond after 60 seconds!
    echo ================================================
    echo.
    echo Check the "CityTools Backend" window for errors.
    echo Press any key to continue anyway...
    pause >nul
    goto BACKEND_READY
)
goto WAIT_BACKEND

:BACKEND_READY
echo Backend started and responding on port 5000
echo.

REM ============================================
REM STEP 7: START POS CLIENT
REM ============================================
echo [7/8] Starting POS Client...
start /min "CityTools POS" cmd /k "title CityTools POS && cd /d "%~dp0pos-client" && "%~dp0node-portable\npm.cmd" run dev"
timeout /t 3 /nobreak >nul
echo POS starting on port 5173
echo.

REM ============================================
REM STEP 8: START BACKOFFICE
REM ============================================
echo [8/8] Starting Backoffice...
start /min "CityTools Backoffice" cmd /k "title CityTools Backoffice && cd /d "%~dp0backoffice" && "%~dp0node-portable\npm.cmd" run dev"
timeout /t 3 /nobreak >nul
echo Backoffice starting on port 5174
echo.

REM ============================================
REM OPEN BROWSERS
REM ============================================
echo Opening browsers in 5 seconds...
timeout /t 5 /nobreak >nul
start http://localhost:5173
timeout /t 2 /nobreak >nul
start http://localhost:5174
echo.

echo ========================================================
echo ALL SERVICES STARTED SUCCESSFULLY!
echo ========================================================
echo.
echo You should see 4 windows:
echo   1. This main window (System Manager) - KEEP OPEN!
echo   2. CityTools Backend
echo   3. CityTools POS
echo   4. CityTools Backoffice
echo.
echo ========================================================
echo LOGIN CREDENTIALS:
echo ========================================================
echo   Admin User:
echo     Username: admin
echo     Password: admin123
echo.
echo   Cashier User:
echo     Username: cashier
echo     Password: 123456
echo.
echo ========================================================
echo ACCESS URLs (This Computer):
echo ========================================================
echo   POS:        http://localhost:5173
echo   Backoffice: http://localhost:5174
echo   Backend:    http://localhost:5000/api
echo.
echo ========================================================
echo NETWORK ACCESS (Other Devices):
echo ========================================================
echo   To find your IP address, open a new terminal and type:
echo     ipconfig
echo.
echo   Look for "IPv4 Address" (e.g., 192.168.1.68), then use:
echo     POS:        http://YOUR-IP:5173
echo     Backoffice: http://YOUR-IP:5174
echo.
echo ========================================================
echo IMPORTANT: Keep this window open while using the system!
echo ========================================================
echo.
echo To shut down safely: Press Ctrl+C and confirm with 'Y'
echo.

:LOOP
REM Check for shutdown signal every 5 seconds
timeout /t 5 /nobreak >nul

REM Check if stop signal exists
if exist "%TEMP%\citytools_stop_signal.flag" (
    del "%TEMP%\citytools_stop_signal.flag" >nul 2>&1
    goto SHUTDOWN_NOW
)

REM Check PostgreSQL health every 5 seconds
tasklist /FI "IMAGENAME eq postgres.exe" 2>nul | find /I "postgres.exe" >nul
if errorlevel 1 (
    echo.
    echo ================================================
    echo ERROR: PostgreSQL has stopped unexpectedly!
    echo ================================================
    echo.
    goto SHUTDOWN_NOW
)

goto LOOP

:SHUTDOWN_NOW
cls
echo.
echo ========================================================
echo Shutting Down CityTools...
echo ========================================================
echo.
echo Stopping all services...
taskkill /F /IM node.exe /T >nul 2>&1
"%PG_PATH%\bin\pg_ctl.exe" -D "%PG_DATA%" stop -m fast -t 3 >nul 2>&1
taskkill /F /IM postgres.exe /T >nul 2>&1
echo.
echo All services stopped.
echo This window will close in 2 seconds...
timeout /t 2 /nobreak >nul
exit
