@echo off
setlocal enabledelayedexpansion
title Nuestro Alfajor - ETAPA 3
cd /d "%~dp0"

echo ============================================
echo   Probando: ETAPA 3
echo   (Incluye las Etapas 1 y 2 + Orden de
echo    Compra con costos por proveedor.
echo    Solo la ven Alejandro, Javier y Mercedes)
echo ============================================
echo.

set INTENTOS=0
:reintentar_checkout
if exist ".git\index.lock" del /f /q ".git\index.lock" >nul 2>&1
git checkout -- . >nul 2>&1
(for /l %%i in (1,1,50) do echo y) | git checkout etapa-3 --quiet
if errorlevel 1 (
    set /a INTENTOS+=1
    if !INTENTOS! LSS 8 (
        echo OneDrive esta tardando en soltar un archivo, reintentando... ^(!INTENTOS!/8^)
        timeout /t 4 /nobreak >nul
        goto reintentar_checkout
    )
    echo.
    echo Hubo un problema cambiando de version despues de varios intentos.
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
