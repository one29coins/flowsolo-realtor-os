// Tiny event-based toast bus. The <Toaster /> component subscribes and renders.
const listeners = new Set()
let nextId = 1

export function toast(message, kind = 'info', duration = 3500) {
  const t = { id: nextId++, message, kind, duration }
  listeners.forEach(l => l(t))
  return t.id
}

toast.success = (msg, d) => toast(msg, 'success', d)
toast.error = (msg, d) => toast(msg, 'error', d)
toast.info = (msg, d) => toast(msg, 'info', d)

export function subscribeToasts(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
