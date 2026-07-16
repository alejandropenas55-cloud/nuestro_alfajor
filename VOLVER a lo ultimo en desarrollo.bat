@echo off
setlocal enabledelayedexpansion
title Nuestro Alfajor - Volviendo a lo ultimo en desarrollo
cd /d "%~dp0"

echo ============================================
echo   Volviendo a lo ULTIMO en desarrollo
echo   (lo que Alejandro esta construyendo ahora)
echo ============================================
echo.

set INTENTOS=0
:reintentar_checkout
if exist ".git\index.lock" del /f /q ".git\index.lock" >nul 2>&1
git checkout -- . >nul 2>&1
cmd /c "(for /l %%i in (1,1,50) do echo y) | git checkout main --quiet"
if errorlevel 1 (
    set /a INTENTOS+=1
    if !INTENTOS! LSS 8 (
        echo OneDrive esta tardando en soltar un archivo, reintentando... ^(!INTENTOS!/8^)
        timeout /t 4 /nobreak >nul
        goto reintentar_checkout
    )
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
