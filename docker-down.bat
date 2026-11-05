@echo off
setlocal

echo ================================================================
echo   Stopping Airport Management System Containers
echo ================================================================

cd /d "%~dp0"

docker-compose down

echo.
echo ================================================================
echo   Containers Stopped and Network Removed Cleanly.
echo ================================================================
