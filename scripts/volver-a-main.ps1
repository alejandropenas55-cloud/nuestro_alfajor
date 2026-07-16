# Vuelve a la rama principal (main) sin levantar el servidor.
# Usado por "VOLVER a lo ultimo en desarrollo.bat".

$ErrorActionPreference = "Stop"
Set-Location -Path (Join-Path $PSScriptRoot "..")

$maxIntentos = 8
$exitoso = $false
for ($intento = 1; $intento -le $maxIntentos; $intento++) {
    if (Test-Path ".git\index.lock") {
        Remove-Item ".git\index.lock" -Force -ErrorAction SilentlyContinue
    }
    git checkout -- . 2>$null | Out-Null

    1..50 | ForEach-Object { "y" } | git checkout main --quiet 2>$null | Out-Null

    if ($LASTEXITCODE -eq 0) {
        $exitoso = $true
        break
    }

    if ($intento -lt $maxIntentos) {
        Write-Host "OneDrive esta tardando en soltar un archivo, reintentando... ($intento/$maxIntentos)" -ForegroundColor Yellow
        Start-Sleep -Seconds 4
    }
}

if (-not $exitoso) {
    Write-Host ""
    Write-Host "No se pudo volver a la version actual despues de varios intentos." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Listo, volviste a lo ultimo en desarrollo." -ForegroundColor Green
exit 0
