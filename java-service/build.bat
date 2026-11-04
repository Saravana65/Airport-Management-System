@echo off
setlocal

echo =================================================================
echo   Compiling Airport Management System - Java OOP Service
echo =================================================================

where javac >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: javac is not installed or not in PATH.
    exit /b 1
)

cd /d "%~dp0"

if not exist "target\classes" mkdir "target\classes"
if not exist "target\test-classes" mkdir "target\test-classes"

echo.
echo [1/3] Compiling Main Source Files...
powershell -NoProfile -Command "Get-ChildItem -Recurse -Filter *.java src\main\java | ForEach-Object { '\"' + ($_.FullName -replace '\\', '/') + '\"' } | Out-File -Encoding ascii sources_main.txt"
javac -d target\classes @sources_main.txt
if %errorlevel% neq 0 (
    echo ERROR: Main source compilation failed!
    del sources_main.txt 2>nul
    exit /b %errorlevel%
)
del sources_main.txt 2>nul
echo Main sources compiled successfully.

echo.
echo [2/3] Compiling Test Source Files...
powershell -NoProfile -Command "Get-ChildItem -Recurse -Filter *.java src\test\java | ForEach-Object { '\"' + ($_.FullName -replace '\\', '/') + '\"' } | Out-File -Encoding ascii sources_test.txt"
javac -cp "target\classes" -d target\test-classes @sources_test.txt
if %errorlevel% neq 0 (
    echo ERROR: Test source compilation failed!
    del sources_test.txt 2>nul
    exit /b %errorlevel%
)
del sources_test.txt 2>nul
echo Test sources compiled successfully.

echo.
echo [3/3] Executing Java OOP Test Suite...
java -cp "target\classes;target\test-classes" com.airport.BookingWorkflowTest
if %errorlevel% neq 0 (
    echo ERROR: One or more Java tests failed!
    exit /b %errorlevel%
)

echo.
echo =================================================================
echo   Java OOP Service Build and Test Succeeded!
echo =================================================================
