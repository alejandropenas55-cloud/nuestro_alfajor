@echo off
title Nuestro Alfajor - Volviendo a lo ultimo en desarrollo
cd /d "%~dp0"

echo ============================================
echo   Volviendo a lo ULTIMO en desarrollo
echo   (lo que Alejandro esta construyendo ahora)
echo ============================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\volver-a-main.ps1"
if errorlevel 1 (
    echo.
    echo Sacale una captura de pantalla a esto y mandasela a Alejandro.
    echo.
    pause
    exit /b 1
)

echo.
echo Ya podes cerrar esta ventana.
echo Cuando Alejandro te avise que hay una etapa nueva para
echo probar, te va a mandar un archivo nuevo como este.
echo.
pause
