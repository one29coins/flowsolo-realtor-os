// Build a minimal .ics file for a single event and trigger download.
// Compatible with Google Calendar, Apple Calendar, Outlook, etc.

function pad(n) { return String(n).padStart(2, '0') }

function toIcsDate(dateStr) {
  // For all-day events, ICS expects YYYYMMDD (no time).
  if (!dateStr) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr.replace(/-/g, '')
  }
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return null
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
}

function toIcsTimestamp(date) {
  const d = new Date(date)
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

function escape(text = '') {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

export function buildICS({ uid, title, description, dateStr, durationDays = 1 }) {
  const dtStart = toIcsDate(dateStr)
  if (!dtStart) return null
  // For all-day events, DTEND is exclusive (next day)
  const startD = new Date(dateStr + 'T00:00:00')
  const endD = new Date(startD)
  endD.setDate(endD.getDate() + Math.max(1, durationDays))
  const dtEnd = `${endD.getFullYear()}${pad(endD.getMonth() + 1)}${pad(endD.getDate())}`

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FlowSolo Client OS//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid || crypto.randomUUID()}@flowsolo`,
    `DTSTAMP:${toIcsTimestamp(new Date())}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${escape(title)}`,
    description ? `DESCRIPTION:${escape(description)}` : null,
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n')
}

export function downloadICS(filename, content) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
