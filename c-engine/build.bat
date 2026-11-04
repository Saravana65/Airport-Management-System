@echo off
setlocal

echo ================================================================
echo   Compiling Airport Management System - C Algorithm Engine
echo ================================================================

where cl >nul 2>nul
if %errorlevel% neq 0 (
    echo Initializing MSVC x64 build environment...
    if exist "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" (
        call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
    ) else if exist "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat" (
        call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"
    ) else (
        echo ERROR: Visual Studio C compiler not found!
        exit /b 1
    )
)

cd /d "%~dp0"

echo.
echo [1/2] Compiling c-engine.exe CLI harness...
cl /nologo /O2 /W3 /D_CRT_SECURE_NO_WARNINGS /Iinclude /Fe:c-engine.exe src\main.c src\gate_allocation.c src\flight_priority_queue.c src\baggage_routing.c
if %errorlevel% neq 0 (
    echo ERROR: Compilation of c-engine.exe failed!
    exit /b %errorlevel%
)
echo Successfully built c-engine.exe

echo.
echo [2/2] Compiling test_algorithms.exe...
cl /nologo /O2 /W3 /D_CRT_SECURE_NO_WARNINGS /Iinclude /Fe:test_algorithms.exe tests\test_algorithms.c src\gate_allocation.c src\flight_priority_queue.c src\baggage_routing.c
if %errorlevel% neq 0 (
    echo ERROR: Compilation of test_algorithms.exe failed!
    exit /b %errorlevel%
)
echo Successfully built test_algorithms.exe

:: Clean up temporary object files
del *.obj 2>nul

echo.
echo ================================================================
echo   C Module Build Complete!
echo ================================================================
