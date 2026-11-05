@echo off
setlocal

echo ================================================================
echo   Starting Airport Management System - Multi-Tier Containers
echo ================================================================

cd /d "%~dp0"

if not exist ".env" (
    echo [.env] Creating .env from .env.example...
    copy .env.example .env >nul
)

docker-compose up -d --build

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Docker Compose failed to start containers.
    echo Ensure Docker Desktop is installed and the Docker daemon is running!
    exit /b %errorlevel%
)

echo.
echo ================================================================
echo   Containers Started Successfully!
echo ================================================================
echo   Frontend Web Portal:    http://localhost
echo   Node.js API Gateway:    http://localhost:5000/api
echo   Health Endpoint:        http://localhost:5000/api/health
echo   Java OOP Microservice:  http://localhost:5050/health
echo ================================================================
echo   Run 'docker-down.bat' to stop and clean up containers.
echo ================================================================
