import { jsPDF } from 'jspdf'
import { CATEGORY_COLORS, SHORT_NAMES } from './constants'

export function exportIncidentPdf(d) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const cat = d.predicted_class || d.category || 'Unknown'
  const color = CATEGORY_COLORS[cat] || '#6b7280'
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  const confidence = d.probability ?? d.category_probability ?? 0

  // Header bar
  doc.setFillColor(r, g, b)
  doc.rect(0, 0, 210, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('TACIS — Thermal Anomaly Detection', 14, 12)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Thermal Anomaly Classification & Investigation System', 14, 19)

  doc.setFontSize(9)
  doc.text(`Incident Report · ${new Date().toLocaleDateString()}`, 14, 25)

  // Category + priority badges
  let y = 36
  doc.setFillColor(r, g, b)
  doc.roundedRect(14, y - 5, 60, 8, 1.5, 1.5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(SHORT_NAMES[cat] || cat, 17, y)

  const priColors = { High: [220, 38, 38], Medium: [245, 158, 11], Low: [100, 116, 139] }
  const pri = priColors[d.priority] || priColors.Low
  doc.setFillColor(...pri)
  doc.roundedRect(78, y - 5, 24, 8, 1.5, 1.5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(d.priority?.toUpperCase() || 'LOW', 81, y)

  y = 52

  // Section helper
  function section(title) {
    if (y > 260) { doc.addPage(); y = 20 }
    doc.setFillColor(241, 245, 249)
    doc.rect(14, y, 182, 7, 'F')
    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(title.toUpperCase(), 17, y + 5)
    y += 10
  }

  function field(label, value) {
    if (y > 270) { doc.addPage(); y = 20 }
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(label, 17, y)
    doc.setTextColor(30, 41, 59)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(String(value ?? '—'), 17, y + 5)
    y += 10
  }

  function fieldRow(pairs) {
    if (y > 270) { doc.addPage(); y = 20 }
    const colW = 182 / pairs.length
    pairs.forEach(([label, value], i) => {
      const x = 17 + i * colW
      doc.setTextColor(100, 116, 139)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text(label, x, y)
      doc.setTextColor(30, 41, 59)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(String(value ?? '—'), x, y + 5)
    })
    y += 12
  }

  function bulletList(items) {
    items.forEach((text) => {
      if (y > 275) { doc.addPage(); y = 20 }
      doc.setTextColor(51, 65, 85)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      const lines = doc.splitTextToSize(`•  ${text}`, 175)
      doc.text(lines, 17, y)
      y += lines.length * 4.2 + 1.5
    })
  }

  // --- Incident Details ---
  section('Incident Details')
  field('Incident ID', d.id)
  fieldRow([
    ['Latitude', d.latitude?.toFixed(5)],
    ['Longitude', d.longitude?.toFixed(5)],
  ])
  fieldRow([
    ['Detected At', d.detected_at ? new Date(d.detected_at).toLocaleString() : '—'],
    ['Source', d.source?.toUpperCase() || '—'],
  ])
  if (d.nearest_industrial) {
    field('Nearest Facility', `${d.nearest_industrial.name} (${(d.nearest_industrial.distance_m / 1000).toFixed(0)} km)`)
  }

  y += 4

  // --- Classification ---
  section('Classification')
  fieldRow([
    ['Predicted Class', SHORT_NAMES[cat] || cat],
    ['Confidence', `${Math.round(confidence * 100)}%`],
  ])
  fieldRow([
    ['FRP', `${d.frp_mw?.toFixed(1) || '—'} MW`],
    ['Brightness I4', `${Math.round(d.brightness_temp_k || 0)} K`],
  ])
  if (d.features?.brightness_temp_i5_k) {
    field('Brightness I5', `${Math.round(d.features.brightness_temp_i5_k)} K`)
  }

  y += 4

  // --- Top 3 classification candidates ---
  if (d.top_3 && d.top_3.length > 0) {
    section('Classification Candidates')
    d.top_3.forEach((t, i) => {
      if (y > 275) { doc.addPage(); y = 20 }
      doc.setTextColor(30, 41, 59)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(`${i + 1}. ${SHORT_NAMES[t.class] || t.class}`, 17, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text(`— ${Math.round(t.probability * 100)}%`, 17 + doc.getTextWidth(`${i + 1}. ${SHORT_NAMES[t.class] || t.class}`) + 2, y)
      y += 5
    })
    y += 3
  }

  // --- Key Evidence ---
  if (d.evidence && d.evidence.length > 0) {
    section('Key Evidence')
    bulletList(d.evidence)
    y += 3
  }

  // --- Why Not (runner-up) ---
  if (d.why_not) {
    section(`Why Not ${SHORT_NAMES[d.why_not.class_name] || d.why_not.class_name}?`)
    const whyBullets = d.why_not.explanation.split('; ').filter((s) => s.trim())
    bulletList(whyBullets.map((b) => b.replace(/\.$/, '')))
    y += 3
  }

  // --- Priority Reason ---
  if (d.priority_reason) {
    section('Priority Assessment')
    doc.setTextColor(51, 65, 85)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const lines = doc.splitTextToSize(d.priority_reason, 175)
    doc.text(lines, 17, y)
    y += lines.length * 4.5 + 4
  }

  // --- Detection Notes ---
  if (d.notes) {
    section('Detection Notes')
    doc.setTextColor(51, 65, 85)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const lines = doc.splitTextToSize(d.notes, 175)
    doc.text(lines, 17, y)
    y += lines.length * 4.5 + 4
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(248, 250, 252)
    doc.rect(0, 280, 210, 17, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.line(0, 280, 210, 280)
    doc.setTextColor(148, 163, 184)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text('Generated by TACIS · SIH26162 · Government Thermal Anomaly Monitoring', 14, 286)
    doc.text(`${d.latitude?.toFixed(4)}°N ${d.longitude?.toFixed(4)}°E · Page ${i}/${pageCount}`, 14, 290)
  }

  // Filename
  const lat = d.latitude?.toFixed(2) || '0'
  const lon = d.longitude?.toFixed(2) || '0'
  const date = d.detected_at ? new Date(d.detected_at).toISOString().slice(0, 10) : 'unknown'
  const filename = `incident-${d.id || `${lat}N${lon}E`}-${date}.pdf`

  doc.save(filename)
}
