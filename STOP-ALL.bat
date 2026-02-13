@echo off
cd /d "%~dp0"

set PG_PATH=%~dp0postgresql-portable
set PG_DATA=%~dp0postgresql-data
set PROJECT_PATH=%~dp0

REM Create shutdown signal for main window
echo stop > "%TEMP%\citytools_stop_signal.flag"

REM Give main window 3 seconds to detect signal
timeout /t 3 /nobreak >nul

REM ============================================
REM SAFE: Only kill PostgreSQL from OUR folder
REM ============================================
"%PG_PATH%\bin\pg_ctl.exe" -D "%PG_DATA%" stop -m immediate >nul 2>&1

for /f "tokens=2" %%a in ('wmic process where "name='postgres.exe' and CommandLine like '%%postgresql-portable%%'" get ProcessId /format:list 2^>nul ^| find "="') do (
    for /f "tokens=2 delims==" %%b in ("%%a") do taskkill /F /PID %%b >nul 2>&1
)

REM ============================================
REM SAFE: Only kill node.exe from OUR folder
REM ============================================
for /f "tokens=2" %%a in ('wmic process where "name='node.exe' and (CommandLine like '%%backend%%' or CommandLine like '%%pos-client%%' or CommandLine like '%%backoffice%%')" get ProcessId /format:list 2^>nul ^| find "="') do (
    for /f "tokens=2 delims==" %%b in ("%%a") do taskkill /F /PID %%b /T >nul 2>&1
)

REM ============================================
REM SAFE: Only kill processes on OUR specific ports
REM ============================================
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5000" ^| findstr LISTENING') do taskkill /F /PID %%a /T >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5173" ^| findstr LISTENING') do taskkill /F /PID %%a /T >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5174" ^| findstr LISTENING') do taskkill /F /PID %%a /T >nul 2>&1

REM ============================================
REM SAFE: Only close CityTools windows
REM ============================================
powershell -Command "Get-Process cmd -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle -like '*CityTools*'} | Stop-Process -Force" 2>nul

REM Show success
cls
echo ========================================================
echo CityTools Stopped Successfully!
echo ========================================================
echo.
echo All CityTools services closed safely.
echo Other applications were not affected.
echo.
timeout /t 2 /nobreak >nul
exit
