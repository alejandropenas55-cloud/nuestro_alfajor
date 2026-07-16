@echo off
title Nuestro Alfajor - ETAPA 3
cd /d "%~dp0"

echo ============================================
echo   Probando: ETAPA 3
echo   (Incluye las Etapas 1 y 2 + Orden de
echo    Compra con costos por proveedor.
echo    Solo la ven Alejandro, Javier y Mercedes)
echo ============================================
echo.
echo Cuando abajo aparezca la palabra "Ready":
echo   1. Abri Chrome (o el navegador que uses)
echo   2. Anda a esta direccion:   http://localhost:3000
echo.
echo Para CERRAR la prueba: cerra esta ventana negra y listo.
echo ============================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\probar-etapa.ps1" etapa-3
if errorlevel 1 (
    echo.
    echo Sacale una captura de pantalla a esto y mandasela a Alejandro.
    echo.
)

echo.
echo La aplicacion se detuvo.
pause
