# Script para iniciar Backend + Frontend automaticamente

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sistema de Inventario" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
$rootPath = $PSScriptRoot
if (-not $rootPath) {
    $rootPath = Get-Location
}

Set-Location $rootPath

# Localizar ejecutables de Node y NPM para usarlos dentro de los jobs
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
$npmPath  = (Get-Command npm  -ErrorAction SilentlyContinue).Source
if (-not $nodePath -or -not $npmPath) {
    Write-Host "Node.js o npm no encontrados en PATH. Instala Node.js y reinicia la terminal." -ForegroundColor Red
    exit 1
}

function Wait-PortUp {
    param(
        [int]$Port,
        [int]$TimeoutSec = 20
    )
    $sw = [Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $TimeoutSec) {
        try {
            $tcp = New-Object Net.Sockets.TcpClient
            $iar = $tcp.BeginConnect('127.0.0.1', $Port, $null, $null)
            $completed = $iar.AsyncWaitHandle.WaitOne(1000, $false)
            if ($completed -and $tcp.Connected) {
                $tcp.Close()
                return $true
            }
            $tcp.Close()
        } catch { }
    }
    return $false
}

# Iniciar Backend en segundo plano
Write-Host "[1/2] Iniciando Backend..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    param($path, $node)
    Set-Location $path
    & $node index.js
} -ArgumentList $rootPath, $nodePath

# Esperar 2 segundos para que el backend inicie
Start-Sleep -Seconds 2

# Iniciar Frontend en segundo plano
Write-Host "[2/2] Iniciando Frontend (React/Vite)..." -ForegroundColor Blue
$frontendJob = Start-Job -ScriptBlock {
    param($path, $npm)
    Set-Location "$path\frontend-react"
    & $npm run dev
} -ArgumentList $rootPath, $npmPath

# Esperar a que los puertos estén arriba
$okApi = Wait-PortUp -Port 3000 -TimeoutSec 20
$okWeb = Wait-PortUp -Port 5174 -TimeoutSec 20

if (-not $okApi) { Write-Host "Advertencia: API en :3000 no respondió dentro del tiempo." -ForegroundColor Yellow }
if (-not $okWeb) { Write-Host "Advertencia: Frontend en :5174 no respondió dentro del tiempo." -ForegroundColor Yellow }

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Sistema iniciado correctamente!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Links de acceso:" -ForegroundColor Yellow
Write-Host "  Backend API:  " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Frontend:     " -NoNewline; Write-Host "http://localhost:5174" -ForegroundColor Cyan
Write-Host ""
Write-Host "Credenciales de prueba:" -ForegroundColor Yellow
Write-Host "  Email:    admin@rectificadora.com" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Presiona Ctrl+C para detener los servidores" -ForegroundColor Red
Write-Host ""
Write-Host "Abre este link en tu navegador:" -ForegroundColor Magenta
Write-Host "http://localhost:5174" -ForegroundColor White
Write-Host ""

# Mantener el script corriendo y mostrar estado
try {
    Write-Host "Servidores corriendo..." -ForegroundColor Gray
    Write-Host "(Presiona Ctrl+C para detener)" -ForegroundColor Gray
    Write-Host ""
    
    # Esperar hasta que el usuario presione Ctrl+C
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    # Limpiar los jobs cuando se detenga el script
    Write-Host ""
    Write-Host "Deteniendo servidores..." -ForegroundColor Yellow
    Stop-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
    Write-Host "Servidores detenidos." -ForegroundColor Red
}
