@echo off
setlocal
echo =================================================================
echo   Starting Airport Java OOP Service (Port 5050)
echo =================================================================

cd /d "%~dp0"
if not exist "target\classes\com\airport\integration\JavaServiceApplication.class" (
    echo Building project before starting...
    call build.bat
    if %errorlevel% neq 0 exit /b %errorlevel%
)

java -cp "target\classes" com.airport.integration.JavaServiceApplication
