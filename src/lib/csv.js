// Tiny CSV parser & writer — handles quoted fields, escaped quotes, CRLF.

export function parseCSV(text) {
  if (!text) return { headers: [], rows: [] }
  // Strip BOM if Excel added one
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)

  const rows = []
  let row = []
  let cur = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++ }
      else if (c === '"') inQuotes = false
      else cur += c
    } else {
      if (c === '"' && cur === '') { inQuotes = true }
      else if (c === ',') { row.push(cur); cur = '' }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = '' }
      else if (c === '\r') { /* skip */ }
      else cur += c
    }
  }
  // Flush last cell/row
  if (cur.length > 0 || row.length > 0) { row.push(cur); rows.push(row) }

  // Drop trailing all-empty rows
  while (rows.length && rows[rows.length - 1].every(v => v === '')) rows.pop()

  if (!rows.length) return { headers: [], rows: [] }

  const headers = rows[0].map(h => h.trim())
  const dataRows = rows.slice(1).map(r => {
    const obj = {}
    headers.forEach((h, idx) => { obj[h] = (r[idx] ?? '').trim() })
    return obj
  })
  return { headers, rows: dataRows }
}

function escapeField(v) {
  const s = v == null ? '' : String(v)
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function toCSV(rows, headers) {
  if (!headers || !headers.length) {
    headers = rows[0] ? Object.keys(rows[0]) : []
  }
  const lines = [headers.map(escapeField).join(',')]
  for (const r of rows) {
    lines.push(headers.map(h => escapeField(r[h])).join(','))
  }
  return lines.join('\r\n')
}

export function downloadCSV(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Common normalizers
export function toNumber(v, fallback = 0) {
  if (v === '' || v == null) return fallback
  const n = Number(String(v).replace(/[$,]/g, ''))
  return Number.isFinite(n) ? n : fallback
}

export function toDateOrNull(v) {
  if (!v) return null
  // Accept yyyy-mm-dd directly
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  // Accept mm/dd/yyyy or m/d/yyyy
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (m) {
    let [_, mo, d, y] = m
    if (y.length === 2) y = (parseInt(y, 10) > 50 ? '19' : '20') + y
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  // Last resort, ISO parse
  const dt = new Date(v)
  if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10)
  return null
}

export function pickOption(value, allowed, fallback) {
  if (!value) return fallback
  const lower = String(value).toLowerCase().trim()
  const match = allowed.find(a => a.toLowerCase() === lower)
  return match || fallback
}
