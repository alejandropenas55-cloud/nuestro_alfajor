@echo off
title Nuestro Alfajor - ETAPA 1
cd /d "%~dp0"

echo ============================================
echo   Probando: ETAPA 1
echo   (Incluye la Etapa 2 + Stock actual y
echo    Falta comprar en cada insumo)
echo ============================================
echo.

git checkout etapa-1 --quiet
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
