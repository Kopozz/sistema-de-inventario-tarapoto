// Utilidades de exportación a PDF y Excel
// Nota: Requiere dependencias jsPDF, jspdf-autotable y xlsx.

import { COMPANY_INFO, nowPE } from './company'

// Carga dinámica para reducir bundle si no se usa
export async function exportToPDF({ title, columns, rows, filename = 'reporte' }) {
  try {
    const { jsPDF } = await import('jspdf')
    await import('jspdf-autotable')

    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const marginX = 40
    let cursorY = 40

    // Encabezado empresa
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(COMPANY_INFO.name, marginX, cursorY)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const { fecha, hora } = nowPE()
    const infoLines = [
      COMPANY_INFO.ruc,
      COMPANY_INFO.address,
      `Tel: ${COMPANY_INFO.phone}  |  Email: ${COMPANY_INFO.email}`,
      COMPANY_INFO.website,
      `Fecha: ${fecha}   Hora: ${hora}`
    ].filter(Boolean)

    cursorY += 16
    infoLines.forEach((line) => {
      doc.text(line, marginX, cursorY)
      cursorY += 14
    })

    // Título del documento
    cursorY += 10
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text(title, marginX, cursorY)

    // Tabla
    cursorY += 10
    doc.autoTable({
      startY: cursorY,
      head: [columns],
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [249, 115, 22] }, // naranja
      theme: 'striped'
    })

    // Pie
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(9)
    doc.text(`${COMPANY_INFO.name} - Generado automáticamente`, marginX, pageHeight - 20)

    doc.save(`${filename}.pdf`)
  } catch (error) {
    console.error('Error al exportar PDF:', error)
    throw new Error(`Error al generar PDF: ${error.message}`)
  }
}

export async function exportToExcel({ title, columns, rows, filename = 'reporte' }) {
  try {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    const header = [columns]
    const data = header.concat(rows)
    const ws = XLSX.utils.aoa_to_sheet(data)

    // Auto width
    const colWidths = columns.map((col, idx) => ({ wch: Math.max(col.length, 12) }))
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31))
    XLSX.writeFile(wb, `${filename}.xlsx`)
  } catch (error) {
    console.error('Error al exportar Excel:', error)
    throw new Error(`Error al generar Excel: ${error.message}`)
  }
}
