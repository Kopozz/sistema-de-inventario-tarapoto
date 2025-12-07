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
}
$headers = @{ Authorization = "Bearer $token" }

# Cleanup Function
function Cleanup-Item {
    param($Endpoint, $TargetName, $NameProp = "nombre")
    try {
        $res = Invoke-RestMethod -Uri "$baseUrl/$Endpoint" -Method Get -Headers $headers
        $list = $res."$Endpoint" # e.g. res.productos
        if ($list) {
            $items = $list | Where-Object { $_.$NameProp -eq $TargetName }
            # Force array
            $items = @($items)
            foreach ($item in $items) {
                if ($item) {
                    # Determine ID prop name dynamically or hardcode for test
                    $id = if ($Endpoint -eq "productos") { $item.idProducto } 
                    elseif ($Endpoint -eq "proveedores") { $item.idProveedor } 
                    else { $item.idCategoria }
                    
                    Write-Host " (Cleaning '$TargetName' ID: $id)..." -NoNewline
                    try {
                        Invoke-RestMethod -Uri "$baseUrl/$Endpoint/$id" -Method Delete -Headers $headers | Out-Null
                    }
                    catch { Write-Host " [Skip]" -ForegroundColor Gray }
                }
            }
        }
    }
    catch { Write-Host " (Cleanup skip)" -ForegroundColor Gray }
}

Test-Step "Pre-Cleanup" {
    # 1. Find Product
    try {
        $res = Invoke-RestMethod -Uri "$baseUrl/productos" -Method Get -Headers $headers
        $prod = $res.productos | Where-Object { $_.nombre -eq "TestProd_Move" }
        
        if ($prod) {
            $prodIdCleanup = $prod.idProducto
            Write-Host " (Found Old Product ID: $prodIdCleanup)..." -NoNewline
            
            # 2. Find Movements for this product
            $movRes = Invoke-RestMethod -Uri "$baseUrl/movimientos?idProducto=$prodIdCleanup" -Method Get -Headers $headers
            $movs = $movRes.movimientos
            
            if ($movs) {
                Write-Host " (Deleting $($movs.Count) movements)..." -NoNewline
                foreach ($m in $movs) {
                    Invoke-RestMethod -Uri "$baseUrl/movimientos/$($m.idMovimientoInventario)" -Method Delete -Headers $headers | Out-Null
                }
            }
            
            # 3. Delete Product
            Invoke-RestMethod -Uri "$baseUrl/productos/$prodIdCleanup" -Method Delete -Headers $headers | Out-Null
        }
    }
    catch { Write-Host " (prod cleanup skipped $_)" -ForegroundColor Gray }

    Cleanup-Item "proveedores" "TestProv_Move"
    Cleanup-Item "categorias" "TestCat_Move"
}

# 2. Setup (Category, Provider, Product)
$catId = 0
$provId = 0
$prodId = 0
$initialStock = 100

Test-Step "Setup Test Data" {
    # Cat
    $bodyCat = @{ nombre = "TestCat_Move"; descripcion = "Moves Test" } | ConvertTo-Json
    $resCat = Invoke-RestMethod -Uri "$baseUrl/categorias" -Method Post -Headers $headers -Body $bodyCat -ContentType "application/json"
    $script:catId = $resCat.idCategoria

    # Prov
    $bodyProv = @{ nombre = "TestProv_Move"; email = "move@test.com"; telefono = "000"; direccion = "Test" } | ConvertTo-Json
    $resProv = Invoke-RestMethod -Uri "$baseUrl/proveedores" -Method Post -Headers $headers -Body $bodyProv -ContentType "application/json"
    $script:provId = $resProv.idProveedor

    # Prod
    $bodyProd = @{ 
        codigo = "MOV-100"; nombre = "TestProd_Move"; 
        precioCompra = 10; precioVenta = 20; stockActual = $initialStock;
        idCategoria = $script:catId; idProveedor = $script:provId 
    } | ConvertTo-Json
    $resProd = Invoke-RestMethod -Uri "$baseUrl/productos" -Method Post -Headers $headers -Body $bodyProd -ContentType "application/json"
    $script:prodId = $resProd.idProducto
}

# 3. Test ENTRY (Compra)
$entryId = 0
Test-Step "Register Entry (Add Stock)" {
    # Add 50 units
    $date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $body = @{ 
        idProducto     = $script:prodId; 
        tipoMovimiento = "entrada"; # Lowercase required by backend check
        cantidad       = 50; 
        fechaHora      = $date;
        idUsuario      = 2 # Assuming ID 2 exists (Admin per previous convo)
    } | ConvertTo-Json
    
    $res = Invoke-RestMethod -Uri "$baseUrl/movimientos" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    $script:entryId = $res.idMovimientoInventario # Capture ID
    
    # Verify Stock = 150
    $prod = Invoke-RestMethod -Uri "$baseUrl/productos/$script:prodId" -Method Get -Headers $headers
    if ($prod.producto.stockActual -ne 150) { 
        throw "Stock expected 150, got $($prod.producto.stockActual)" 
    }
}

# 4. Test EXIT (Venta/Ajuste)
$exitId = 0
Test-Step "Register Exit (Remove Stock)" {
    # Remove 30 units
    $date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $body = @{ 
        idProducto     = $script:prodId; 
        tipoMovimiento = "salida"; # Lowercase
        cantidad       = 30; 
        fechaHora      = $date;
        idUsuario      = 2 
    } | ConvertTo-Json
    
    $res = Invoke-RestMethod -Uri "$baseUrl/movimientos" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    $script:exitId = $res.idMovimientoInventario

    # Verify Stock = 120 (150 - 30)
    $prod = Invoke-RestMethod -Uri "$baseUrl/productos/$script:prodId" -Method Get -Headers $headers
    if ($prod.producto.stockActual -ne 120) { 
        throw "Stock expected 120, got $($prod.producto.stockActual)" 
    }
}

# 5. Cleanup
Test-Step "Cleanup" {
    # Delete movements first (Foreign Key constraint)
    if ($script:entryId) { 
        Write-Host " (Cleaning Entry $script:entryId)..." -NoNewline
        Invoke-RestMethod -Uri "$baseUrl/movimientos/$script:entryId" -Method Delete -Headers $headers | Out-Null
    }
    if ($script:exitId) { 
        Write-Host " (Cleaning Exit $script:exitId)..." -NoNewline
        Invoke-RestMethod -Uri "$baseUrl/movimientos/$script:exitId" -Method Delete -Headers $headers | Out-Null
    }
    Invoke-RestMethod -Uri "$baseUrl/productos/$script:prodId" -Method Delete -Headers $headers | Out-Null
    Invoke-RestMethod -Uri "$baseUrl/proveedores/$script:provId" -Method Delete -Headers $headers | Out-Null
    Invoke-RestMethod -Uri "$baseUrl/categorias/$script:catId" -Method Delete -Headers $headers | Out-Null
}

Write-Host "Inventory Movements Verified Successfully!" -ForegroundColor Cyan
