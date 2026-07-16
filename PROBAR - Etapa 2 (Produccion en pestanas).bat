@echo off
title Nuestro Alfajor - ETAPA 2
cd /d "%~dp0"

echo ============================================
echo   Probando: ETAPA 2
echo   (Produccion dividida en 3 pestanas, con
echo    los insumos crudos desglosados)
echo ============================================
echo.
echo Cuando abajo aparezca la palabra "Ready":
echo   1. Abri Chrome (o el navegador que uses)
echo   2. Anda a esta direccion:   http://localhost:3000
echo.
echo Para CERRAR la prueba: cerra esta ventana negra y listo.
echo ============================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\probar-etapa.ps1" etapa-2
if errorlevel 1 (
    echo.
    echo Sacale una captura de pantalla a esto y mandasela a Alejandro.
    echo.
)

echo.
echo La aplicacion se detuvo.
pause
