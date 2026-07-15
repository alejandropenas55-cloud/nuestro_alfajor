# Cambia el codigo local a una etapa especifica y levanta el servidor de
# desarrollo para probarla. No sube nada a internet ni toca produccion.
#
# Uso:
#   .\scripts\probar-etapa.ps1 produccion-actual   # lo que esta en vivo hoy
#   .\scripts\probar-etapa.ps1 etapa-2             # Produccion en 3 pestanas
#   .\scripts\probar-etapa.ps1 etapa-1             # + Stock simple
#
# Corre "git tag -l -n1" para ver la lista completa y actualizada de etapas.

param(
    [Parameter(Mandatory=$true)]
    [string]$Etapa
)

$ErrorActionPreference = "Stop"
Set-Location -Path (Join-Path $PSScriptRoot "..")

$tagExiste = git tag -l $Etapa
if (-not $tagExiste) {
    Write-Host "No existe la etapa '$Etapa'." -ForegroundColor Red
    Write-Host "Etapas disponibles:" -ForegroundColor Yellow
    git tag -l -n1
    exit 1
}

$cambiosSinGuardar = git status --porcelain
if ($cambiosSinGuardar) {
    Write-Host "Hay cambios sin commitear en el codigo. Guardalos o descartalos antes de cambiar de etapa:" -ForegroundColor Red
    git status --short
    exit 1
}

Write-Host "Cambiando a '$Etapa'..." -ForegroundColor Cyan
git checkout $Etapa --quiet

Write-Host ""
Write-Host "Listo. Estas viendo:" -ForegroundColor Green
git tag -l -n1 $Etapa
Write-Host ""
Write-Host "Levantando el servidor local (Ctrl+C para cortar)..." -ForegroundColor Cyan
Write-Host ""

npm run dev
