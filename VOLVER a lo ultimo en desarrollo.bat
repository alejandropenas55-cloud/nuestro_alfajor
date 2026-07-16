@echo off
title Nuestro Alfajor - Volviendo a lo ultimo en desarrollo
cd /d "%~dp0"

echo ============================================
echo   Volviendo a lo ULTIMO en desarrollo
echo   (lo que Alejandro esta construyendo ahora)
echo ============================================
echo.

git checkout main --quiet
if errorlevel 1 (
    echo.
    echo Hubo un problema. Sacale una captura de pantalla
    echo a esto y mandasela a Alejandro.
    echo.
    pause
    exit /b 1
)

echo Listo. Ya podes cerrar esta ventana.
echo Cuando Alejandro te avise que hay una etapa nueva para
echo probar, te va a mandar un archivo nuevo como este.
echo.
pause
