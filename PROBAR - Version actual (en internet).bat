@echo off
title Nuestro Alfajor - Version actual (la que esta en internet)
cd /d "%~dp0"

echo ============================================
echo   Probando: VERSION ACTUAL (la de internet)
echo ============================================
echo.

git checkout produccion-actual --quiet
if errorlevel 1 (
    echo.
    echo Hubo un problema cambiando de version.
    echo Sacale una captura de pantalla a esto y mandasela a Alejandro.
    echo.
    pause
    exit /b 1
)

echo Preparando la aplicacion, puede tardar unos segundos...
echo.
echo Cuando abajo aparezca la palabra "Ready":
echo   1. Abri Chrome (o el navegador que uses)
echo   2. Anda a esta direccion:   http://localhost:3000
echo.
echo Para CERRAR la prueba: cerra esta ventana negra y listo.
echo ============================================
echo.

call npm run dev

echo.
echo La aplicacion se detuvo.
pause
