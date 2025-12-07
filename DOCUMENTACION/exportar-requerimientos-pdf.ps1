# Script para exportar Requerimientos a PDF
# Fecha: 29 de octubre de 2025

Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  EXPORTADOR DE REQUERIMIENTOS A PDF              ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$archivo = "09-REQUERIMIENTOS-FUNCIONALES-NO-FUNCIONALES.md"
$rutaCompleta = "c:\Users\User\OneDrive\Desktop\Sistema de Invetario\DOCUMENTACION\$archivo"

# Verificar que el archivo existe
if (Test-Path $rutaCompleta) {
    Write-Host "✓ Archivo encontrado: $archivo" -ForegroundColor Green
    Write-Host ""
    
    # Abrir en VS Code
    Write-Host "📂 Abriendo archivo en VS Code..." -ForegroundColor Cyan
    code $rutaCompleta
    Start-Sleep -Seconds 2
    
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  OPCIONES PARA CONVERTIR A PDF" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "🎯 OPCIÓN 1: Comando de teclado (MÁS RÁPIDA)" -ForegroundColor Green
    Write-Host "  ────────────────────────────────────────────" -ForegroundColor Gray
    Write-Host "  1. Presiona: Ctrl + Shift + P" -ForegroundColor White
    Write-Host "  2. Escribe: markdown pdf" -ForegroundColor White
    Write-Host "  3. Selecciona: 'Markdown PDF: Export (pdf)'" -ForegroundColor White
    Write-Host "  4. Espera 5-10 segundos" -ForegroundColor White
    Write-Host "  5. ¡Listo! El PDF aparecerá en la misma carpeta" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🎯 OPCIÓN 2: Clic derecho" -ForegroundColor Green
    Write-Host "  ────────────────────────────────────────────" -ForegroundColor Gray
    Write-Host "  1. Clic derecho en el archivo .md" -ForegroundColor White
    Write-Host "  2. Selecciona: 'Markdown PDF: Export (pdf)'" -ForegroundColor White
    Write-Host "  3. Espera a que termine" -ForegroundColor White
    Write-Host ""
    
    Write-Host "🎯 OPCIÓN 3: Imprimir como PDF" -ForegroundColor Green
    Write-Host "  ────────────────────────────────────────────" -ForegroundColor Gray
    Write-Host "  1. Presiona: Ctrl + Shift + V (Vista previa)" -ForegroundColor White
    Write-Host "  2. Presiona: Ctrl + P (Imprimir)" -ForegroundColor White
    Write-Host "  3. Impresora: 'Microsoft Print to PDF'" -ForegroundColor White
    Write-Host "  4. Clic en 'Imprimir'" -ForegroundColor White
    Write-Host "  5. Elige nombre y ubicación" -ForegroundColor White
    Write-Host ""
    
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📁 El PDF se guardará como:" -ForegroundColor Yellow
    Write-Host "   09-REQUERIMIENTOS-FUNCIONALES-NO-FUNCIONALES.pdf" -ForegroundColor White
    Write-Host ""
    Write-Host "📍 En la carpeta:" -ForegroundColor Yellow
    Write-Host "   DOCUMENTACION\" -ForegroundColor White
    Write-Host ""
    
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 CONFIGURACIÓN RECOMENDADA DEL PDF:" -ForegroundColor Cyan
    Write-Host "   • Tamaño: A4" -ForegroundColor Gray
    Write-Host "   • Márgenes: Normales" -ForegroundColor Gray
    Write-Host "   • Orientación: Vertical" -ForegroundColor Gray
    Write-Host "   • Escala: 100%" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "⏳ Esperando a que ejecutes la conversión..." -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Presiona cualquier tecla cuando termines..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    # Verificar si se creó el PDF
    $pdfPath = "c:\Users\User\OneDrive\Desktop\Sistema de Invetario\DOCUMENTACION\09-REQUERIMIENTOS-FUNCIONALES-NO-FUNCIONALES.pdf"
    Write-Host ""
    if (Test-Path $pdfPath) {
        Write-Host "✓ ¡PDF creado exitosamente!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Información del archivo:" -ForegroundColor Cyan
        $pdf = Get-Item $pdfPath
        Write-Host "   Nombre: $($pdf.Name)" -ForegroundColor White
        Write-Host "   Tamaño: $([math]::Round($pdf.Length / 1KB, 2)) KB" -ForegroundColor White
        Write-Host "   Ubicación: $($pdf.DirectoryName)" -ForegroundColor White
        Write-Host ""
        Write-Host "¿Deseas abrir el PDF? (S/N)" -ForegroundColor Yellow
        $respuesta = Read-Host
        if ($respuesta -eq "S" -or $respuesta -eq "s") {
            Start-Process $pdfPath
            Write-Host "✓ PDF abierto" -ForegroundColor Green
        }
    } else {
        Write-Host "ℹ️  PDF aún no creado" -ForegroundColor Yellow
        Write-Host "   Verifica que la conversión haya terminado" -ForegroundColor Gray
    }
    
} else {
    Write-Host "✗ ERROR: Archivo no encontrado" -ForegroundColor Red
    Write-Host "   Ruta buscada: $rutaCompleta" -ForegroundColor Gray
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Proceso completado" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
