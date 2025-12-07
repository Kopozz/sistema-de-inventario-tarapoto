$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:3000/api"

function Test-Step {
    param($Name, $Action)
    Write-Host "Testing $Name..." -NoNewline
    try {
        & $Action
        Write-Host " [OK]" -ForegroundColor Green
    }
    catch {
        Write-Host " [FAILED]" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
}

$token = ""
Test-Step "Login" {
    $body = @{ email = "admin@rectificadora.com"; "contraseña" = "admin123" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/usuarios/login" -Method Post -Body $body -ContentType "application/json"
    $script:token = $res.token
}
$headers = @{ Authorization = "Bearer $token" }

Test-Step "Dashboard Stats" {
    $stats = Invoke-RestMethod -Uri "$baseUrl/estadisticas/dashboard" -Method Get -Headers $headers
    if ($null -eq $stats.totalProductos) { throw "Missing totalProductos" }
    if ($null -eq $stats.ventasHoy) { throw "Missing ventasHoy" }
    if ($null -eq $stats.topProductos) { throw "Missing topProductos" }
    Write-Host " (Stats Received)" -NoNewline
}

Test-Step "Sales Report (Date Range)" {
    $start = (Get-Date).ToString("yyyy-MM-dd")
    $end = (Get-Date).ToString("yyyy-MM-dd")
    $url = "$baseUrl/reportes/ventas-fechas?fechaInicio=$start&fechaFin=$end"
    try {
        $rep = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
        Write-Host " (Range: $start to $end, Count: $($rep.ventas.Count))" -NoNewline
    }
    catch {
        # Consider 404/Empty as valid if no sales?
        # Backend returns { ventas: [] } usually.
        throw $_
    }
}
