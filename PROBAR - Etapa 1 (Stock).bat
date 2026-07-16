@echo off
title Nuestro Alfajor - ETAPA 1
cd /d "%~dp0"

echo ============================================
echo   Probando: ETAPA 1
echo   (Incluye la Etapa 2 + Stock actual y
echo    Falta comprar en cada insumo)
echo ============================================
echo.
echo Cuando abajo aparezca la palabra "Ready":
echo   1. Abri Chrome (o el navegador que uses)
echo   2. Anda a esta direccion:   http://localhost:3000
echo.
echo Para CERRAR la prueba: cerra esta ventana negra y listo.
echo ============================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\probar-etapa.ps1" etapa-1
if errorlevel 1 (
    echo.
    echo Sacale una captura de pantalla a esto y mandasela a Alejandro.
    echo.
)

echo.
echo La aplicacion se detuvo.
pause
