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

# 1. Login
$token = ""
Test-Step "Login" {
    $body = @{ email = "admin@rectificadora.com"; "contraseña" = "admin123" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/usuarios/login" -Method Post -Body $body -ContentType "application/json"
    $script:token = $res.token
    if (-not $script:token) { throw "No token received" }
}

$headers = @{ Authorization = "Bearer $token" }

# Cleanup Function
function Cleanup-Item {
    param($Endpoint, $ListProp, $IdProp, $TargetName, $NameProp = "nombre")
    try {
        $res = Invoke-RestMethod -Uri "$baseUrl/$Endpoint" -Method Get -Headers $headers
        $list = $res.$ListProp
        if ($list) {
            $item = $list | Where-Object { $_.$NameProp -eq $TargetName }
            if ($item) {
                $id = $item.$IdProp
                Write-Host " (Cleaning up '$TargetName' ID: $id)..." -NoNewline
                Invoke-RestMethod -Uri "$baseUrl/$Endpoint/$id" -Method Delete -Headers $headers | Out-Null
            }
        }
    }
    catch {
        Write-Host " (Cleanup warning: $_)" -ForegroundColor Yellow
    }
}

Test-Step "Pre-Test Cleanup" {
    # Clean Product first (foreign key)
    Cleanup-Item "productos" "productos" "idProducto" "TestProd_API"
    # Clean Provider
    Cleanup-Item "proveedores" "proveedores" "idProveedor" "TestProv_API" "nombre" # API returns 'nombre' flat
    # Clean Category
    Cleanup-Item "categorias" "categorias" "idCategoria" "TestCat_API"
}

# 2. Create Category
$catId = 0
Test-Step "Create Category" {
    $body = @{ nombre = "TestCat_API"; descripcion = "Created by API test" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/categorias" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    $script:catId = $res.idCategoria
    if (-not $script:catId) { throw "No Category ID received" }
}

# 3. Create Provider
$provId = 0
Test-Step "Create Provider" {
    $body = @{ nombre = "TestProv_API"; email = "test_api@prov.com"; telefono = "123456"; direccion = "Test Dir" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/proveedores" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    $script:provId = $res.idProveedor
    if (-not $script:provId) { throw "No Provider ID received" }
}

# 4. Create Product
$prodId = 0
Test-Step "Create Product" {
    $body = @{ 
        codigo       = "TST-999"; 
        nombre       = "TestProd_API"; 
        precioCompra = 10; 
        precioVenta  = 20; 
        stockActual  = 100;
        idCategoria  = $script:catId; 
        idProveedor  = $script:provId 
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/productos" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    $script:prodId = $res.idProducto
    if (-not $script:prodId) { throw "No Product ID received" }
}

# 5. Verify & Delete Cycle
Test-Step "Verify & Delete Product" {
    # Verify
    $res = Invoke-RestMethod -Uri "$baseUrl/productos/$script:prodId" -Method Get -Headers $headers
    if ($res.producto.nombre -ne "TestProd_API") { throw "Product name mismatch" }
    # Delete
    Invoke-RestMethod -Uri "$baseUrl/productos/$script:prodId" -Method Delete -Headers $headers
}

Test-Step "Verify & Delete Provider" {
    # Verify
    $res = Invoke-RestMethod -Uri "$baseUrl/proveedores/$script:provId" -Method Get -Headers $headers
    if ($res.proveedor.nombre -ne "TestProv_API") { throw "Provider name mismatch" }
    # Delete
    Invoke-RestMethod -Uri "$baseUrl/proveedores/$script:provId" -Method Delete -Headers $headers
}

Test-Step "Verify & Delete Category" {
    # Verify
    $res = Invoke-RestMethod -Uri "$baseUrl/categorias/$script:catId" -Method Get -Headers $headers
    if ($res.categoria.nombre -ne "TestCat_API") { throw "Category name mismatch" }
    # Delete
    Invoke-RestMethod -Uri "$baseUrl/categorias/$script:catId" -Method Delete -Headers $headers
}

Write-Host "System Verified Successfully!" -ForegroundColor Cyan
