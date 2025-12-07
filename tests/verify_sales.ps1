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
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader $_.Exception.Response.GetResponseStream()
            Write-Host $reader.ReadToEnd() -ForegroundColor Red
        }
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

# Helper to find existing ID or create temp
$catId = 0
$provId = 0
$prodId = 0

Test-Step "Setup Test Product" {
    # Reuse cleanup logic if exists, or just create new names
    # Cat
    $bodyCat = @{ nombre = "TestCat_Sale"; descripcion = "Sale Test" } | ConvertTo-Json
    $resCat = Invoke-RestMethod -Uri "$baseUrl/categorias" -Method Post -Headers $headers -Body $bodyCat -ContentType "application/json"
    $script:catId = $resCat.idCategoria

    # Prov
    $bodyProv = @{ nombre = "TestProv_Sale"; email = "sale@test.com"; telefono = "000"; direccion = "Test" } | ConvertTo-Json
    $resProv = Invoke-RestMethod -Uri "$baseUrl/proveedores" -Method Post -Headers $headers -Body $bodyProv -ContentType "application/json"
    $script:provId = $resProv.idProveedor

    # Prod (Stock 10)
    $bodyProd = @{ 
        codigo = "SALE-001"; nombre = "TestProd_Sale"; 
        precioCompra = 10; precioVenta = 100; stockActual = 10;
        idCategoria = $script:catId; idProveedor = $script:provId 
    } | ConvertTo-Json
    $resProd = Invoke-RestMethod -Uri "$baseUrl/productos" -Method Post -Headers $headers -Body $bodyProd -ContentType "application/json"
    $script:prodId = $resProd.idProducto
}

# 1. Successful Sale
$saleId = 0
Test-Step "Process Sale (5 units)" {
    $body = @{
        nombreCliente = "Test Client";
        total         = 500;
        detalles      = @(
            @{
                idProducto     = $script:prodId;
                cantidad       = 5;
                precioUnitario = 100;
                subtotal       = 500
            }
        )
    } | ConvertTo-Json -Depth 5

    $res = Invoke-RestMethod -Uri "$baseUrl/ventas" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    $script:saleId = $res.idVenta
    Write-Host " (Sale ID: $script:saleId)..." -NoNewline
    
    # Verify Stock = 5
    $prod = Invoke-RestMethod -Uri "$baseUrl/productos/$script:prodId" -Method Get -Headers $headers
    if ($prod.producto.stockActual -ne 5) { throw "Stock expected 5, got $($prod.producto.stockActual)" }

    # Verify Movement Created
    $movs = Invoke-RestMethod -Uri "$baseUrl/movimientos?idProducto=$script:prodId" -Method Get -Headers $headers
    $saleMov = $movs.movimientos | Where-Object { $_.tipoMovimiento -eq "salida" -and $_.cantidad -eq 5 }
    if (-not $saleMov) { throw "No 'salida' movement found for sale" }
}

# 2. Oversell Test
Test-Step "Oversell (10 units - Only 5 left)" {
    $body = @{
        nombreCliente = "Test Fail";
        total         = 1000;
        detalles      = @(
            @{
                idProducto     = $script:prodId;
                cantidad       = 10;
                precioUnitario = 100;
                subtotal       = 1000
            }
        )
    } | ConvertTo-Json -Depth 5

    try {
        Invoke-RestMethod -Uri "$baseUrl/ventas" -Method Post -Headers $headers -Body $body -ContentType "application/json"
        throw "Should have failed due to insufficient stock"
    }
    catch {
        if ($_.Exception.Response.StatusCode -eq 400) {
            Write-Host " (Blocked as expected)" -NoNewline
        }
        else {
            throw $_
        }
    }
}

# Cleanup
Test-Step "Cleanup" {
    # 1. Delete Sale (Should auto-revert stock and delete movements and details)
    if ($script:saleId -gt 0) {
        Write-Host " (Deleting Sale ID: $script:saleId)..." -NoNewline
        Invoke-RestMethod -Uri "$baseUrl/ventas/$script:saleId" -Method Delete -Headers $headers | Out-Null
        
        # Verify Stock Reverted (Should be 10 again)
        $prod = Invoke-RestMethod -Uri "$baseUrl/productos/$script:prodId" -Method Get -Headers $headers
        if ($prod.producto.stockActual -ne 10) { 
            Write-Host " [Warning: Stock not reverted. Got $($prod.producto.stockActual)]" -ForegroundColor Yellow 
        }
        else {
            Write-Host " (Stock reverted to 10)..." -NoNewline
        }
    }

    # 2. Delete Product
    Invoke-RestMethod -Uri "$baseUrl/productos/$script:prodId" -Method Delete -Headers $headers | Out-Null

    # 3. Delete Provider/Category
    Invoke-RestMethod -Uri "$baseUrl/proveedores/$script:provId" -Method Delete -Headers $headers | Out-Null
    Invoke-RestMethod -Uri "$baseUrl/categorias/$script:catId" -Method Delete -Headers $headers | Out-Null
}
# Write-Host "Verified!"
