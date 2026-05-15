@echo off
title CityTools - Developer Unlock
cls

echo ========================================================
echo CityTools - Developer Access
echo ========================================================
echo.
echo This will unlock source code folders for development.
echo.

set /p DEV_PASSWORD="Enter Developer Password: "

REM Change this password!
if not "%DEV_PASSWORD%"=="DEV2026" (
    echo.
    echo ❌ INCORRECT PASSWORD!
    echo.
    pause
    exit
)

echo.
echo Unlocking folders...

attrib -h -s backend
attrib -h -s pos-client
attrib -h -s backoffice
attrib -h -s node-portable

echo.
echo ================================================
echo ✅ FOLDERS UNLOCKED!
echo ================================================
echo.
echo You can now access:
echo   - backend/
echo   - pos-client/
echo   - backoffice/
echo   - node-portable/
echo.
echo ⚠️  Remember to LOCK them again before deployment!
echo    (Run: LOCK-FOLDERS.bat)
echo.
pause
