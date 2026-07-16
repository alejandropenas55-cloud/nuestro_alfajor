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

# OneDrive a veces bloquea un archivo un instante mientras sincroniza, justo
# cuando Git necesita borrarlo para cambiar de version. Cuando eso pasa, Git
# se queda esperando que alguien le conteste "si, reintenta" en la consola
# (algo que nadie ve si esto corre desde un doble clic). Por eso reintentamos
# solos varias veces, contestandole "si" automaticamente cada vez.
$maxIntentos = 8
$exitoso = $false
for ($intento = 1; $intento -le $maxIntentos; $intento++) {
    if (Test-Path ".git\index.lock") {
        Remove-Item ".git\index.lock" -Force -ErrorAction SilentlyContinue
    }
    git checkout -- . 2>$null | Out-Null

    1..50 | ForEach-Object { "y" } | git checkout $Etapa --quiet 2>$null | Out-Null

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
    Write-Host "No se pudo cambiar de version despues de varios intentos." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Listo. Estas viendo:" -ForegroundColor Green
git tag -l -n1 $Etapa
Write-Host ""
Write-Host "Levantando el servidor local (Ctrl+C para cortar)..." -ForegroundColor Cyan
Write-Host ""

npm run dev
