@echo off
title CityTools - Install Shortcuts on This PC
setlocal enabledelayedexpansion

cls
echo ========================================================
echo CityTools - Client Shortcut Installer
echo ========================================================
echo.

REM Check if SERVER_IP.txt exists on USB
if exist "%~dp0SERVER_IP.txt" (
    for /f "tokens=* delims= " %%a in (%~dp0SERVER_IP.txt) do set SERVER_IP=%%a
    set SERVER_IP=!SERVER_IP: =!
    echo Detected Server IP: !SERVER_IP!
    echo.
) else (
    echo SERVER_IP.txt not found on USB.
    echo.
    set /p SERVER_IP="Enter Server IP Address (e.g., 192.168.1.100): "
)

echo.
echo This will create shortcuts on THIS computer's Desktop
echo pointing to: http://!SERVER_IP!:5173 (POS)
echo          and: http://!SERVER_IP!:5174 (Backoffice)
echo.
set /p CONFIRM="Continue? (Y/N): "

if /i not "!CONFIRM!"=="Y" exit /b

echo.
echo Installing shortcuts...
echo.

REM Create CityTools folder for icons
set "ICON_DIR=%APPDATA%\CityTools"
if not exist "%ICON_DIR%" (
    mkdir "%ICON_DIR%"
    echo Created icon directory: %ICON_DIR%
)

REM Copy icons from USB to AppData
set "USB_POS=%~dp0pos-icon.ico"
set "USB_BO=%~dp0backoffice-icon.ico"

if exist "%USB_POS%" (
    echo Copying POS icon...
    copy /Y "%USB_POS%" "%ICON_DIR%\pos-icon.ico" >nul 2>&1
    if exist "%ICON_DIR%\pos-icon.ico" (
        set "POS_ICON=%ICON_DIR%\pos-icon.ico"
        echo POS icon copied successfully
    ) else (
        echo POS icon copy failed, using default
        set "POS_ICON=%SystemRoot%\System32\SHELL32.dll,13"
    )
) else (
    echo POS icon not found on USB, using default
    set "POS_ICON=%SystemRoot%\System32\SHELL32.dll,13"
)

if exist "%USB_BO%" (
    echo Copying Backoffice icon...
    copy /Y "%USB_BO%" "%ICON_DIR%\backoffice-icon.ico" >nul 2>&1
    if exist "%ICON_DIR%\backoffice-icon.ico" (
        set "BO_ICON=%ICON_DIR%\backoffice-icon.ico"
        echo Backoffice icon copied successfully
    ) else (
        echo Backoffice icon copy failed, using default
        set "BO_ICON=%SystemRoot%\System32\SHELL32.dll,44"
    )
) else (
    echo Backoffice icon not found on USB, using default
    set "BO_ICON=%SystemRoot%\System32\SHELL32.dll,44"
)

echo.

REM Set PowerShell path
set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PS%" set "PS=%SystemRoot%\SysWOW64\WindowsPowerShell\v1.0\powershell.exe"

if not exist "%PS%" (
    echo ERROR: PowerShell not found!
    pause
    exit /b
)

REM Detect Desktop location
for /f "usebackq delims=" %%i in (`"%PS%" -Command "[Environment]::GetFolderPath('Desktop')"`) do set DESKTOP=%%i

if "%DESKTOP%"=="" (
    set "DESKTOP=%USERPROFILE%\Desktop"
    if not exist "%DESKTOP%" set "DESKTOP=%USERPROFILE%\OneDrive\Desktop"
)

echo Creating shortcuts on: %DESKTOP%
echo.

REM Create POS shortcut with custom icon
echo [1/2] Creating POS shortcut...
"%PS%" -Command "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('D:\fix-shortcut\CityTools POS.lnk'); $SC.TargetPath = 'http://%SERVER_IP%:5173'; $SC.IconLocation = '%POS_ICON%'; $SC.Description = 'CityTools Point of Sale'; $SC.Save()"

REM Create Backoffice shortcut with custom icon
echo [2/2] Creating Backoffice shortcut...
"%PS%" -Command "$WS = New-Object -ComObject WScript.Shell; $SC = $WS.CreateShortcut('D:\fix-shortcut\CityTools Backoffice.lnk'); $SC.TargetPath = 'http://%SERVER_IP%:5174'; $SC.IconLocation = '%BO_ICON%'; $SC.Description = 'CityTools Backoffice'; $SC.Save()"

echo.
echo ========================================================
echo INSTALLATION COMPLETE!
echo ========================================================
echo.
echo Shortcuts created on Desktop!
echo   - CityTools POS (http://%SERVER_IP%:5173)
echo   - CityTools Backoffice (http://%SERVER_IP%:5174)
echo.
if exist "%ICON_DIR%\pos-icon.ico" (
    echo Custom icons installed successfully!
) else (
    echo Note: Using default system icons
)
echo.
echo You can now:
echo   1. Remove the USB drive safely
echo   2. Double-click shortcuts to access CityTools
echo.
echo Make sure this device is connected to the same WiFi!
echo ========================================================
echo.
pause
