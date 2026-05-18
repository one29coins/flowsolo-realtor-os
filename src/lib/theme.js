// Theme helpers — apply user-chosen brand/accent colors via CSS variables.

export const DEFAULT_BRAND = '#0f2d1a'
export const DEFAULT_ACCENT = '#22c55e'

export function hexToRgbString(hex) {
  if (!hex) return null
  const h = hex.replace('#', '')
  if (h.length !== 6) return null
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if ([r, g, b].some(n => Number.isNaN(n))) return null
  return `${r} ${g} ${b}`
}

function shift(hex, percent) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const f = (c) => {
    const v = c + Math.round((percent < 0 ? c : 255 - c) * (percent / 100))
    return Math.max(0, Math.min(255, v))
  }
  return `${f(r)} ${f(g)} ${f(b)}`
}

export function applyTheme({ brand, accent } = {}) {
  const root = document.documentElement
  const b = brand || DEFAULT_BRAND
  const a = accent || DEFAULT_ACCENT
  const brandRgb = hexToRgbString(b) || hexToRgbString(DEFAULT_BRAND)
  const accentRgb = hexToRgbString(a) || hexToRgbString(DEFAULT_ACCENT)
  root.style.setProperty('--brand-rgb', brandRgb)
  root.style.setProperty('--brand-light-rgb', shift(b, 12))
  root.style.setProperty('--brand-dark-rgb', shift(b, -12))
  root.style.setProperty('--accent-rgb', accentRgb)
  root.style.setProperty('--accent-dark-rgb', shift(a, -10))
}

export const COLOR_PRESETS = [
  { name: 'Forest',    brand: '#0f2d1a', accent: '#22c55e' },
  { name: 'Midnight',  brand: '#0f172a', accent: '#3b82f6' },
  { name: 'Cocoa',     brand: '#3b2a20', accent: '#f59e0b' },
  { name: 'Sunset',    brand: '#7c2d12', accent: '#fb923c' },
  { name: 'Rose',      brand: '#4c1d4e', accent: '#ec4899' },
  { name: 'Ink',       brand: '#111111', accent: '#22c55e' },
  { name: 'Royal',     brand: '#312e81', accent: '#a78bfa' },
  { name: 'Slate',     brand: '#1f2937', accent: '#10b981' }
]
