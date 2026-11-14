@echo off
setlocal
echo ================================================================
echo   Launching Airport Management System
echo ================================================================

cd /d "%~dp0"

echo [1/3] Starting Java OOP Microservice (Port 5050)...
start "Airport Java Service" /min cmd /c "cd /d java-service && java -cp target/classes com.airport.integration.JavaServiceApplication"

echo [2/3] Starting Node.js REST API Backend (Port 5000)...
start "Airport Backend API" /min cmd /c "cd /d backend && node src/server.js"

echo [3/3] Starting React 18 / Vite Frontend (Port 5173)...
start "Airport Frontend UI" /min cmd /c "cd /d frontend && node node_modules/vite/bin/vite.js --host"

echo Waiting for services to bind...
timeout /t 4 /nobreak >nul

echo Opening browser...
start http://localhost:5173

echo ================================================================
echo   Application Launched!
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:5000/api
echo   Health:    http://localhost:5000/api/health
echo   Java:      http://localhost:5050/health
echo ================================================================
