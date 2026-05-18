export default function Input({ label, error, hint, className = '', ...rest }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="block text-sm font-medium text-ink mb-1">{label}</span>}
      <input
        className={`w-full px-3 py-2 text-sm bg-white border-hairline ${error ? 'border-red-400' : 'border-line'} rounded-btn focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors`}
        {...rest}
      />
      {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
      {hint && !error && <span className="block text-xs text-ink-muted mt-1">{hint}</span>}
    </label>
  )
}

export function Textarea({ label, error, hint, className = '', rows = 3, ...rest }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="block text-sm font-medium text-ink mb-1">{label}</span>}
      <textarea
        rows={rows}
        className={`w-full px-3 py-2 text-sm bg-white border-hairline ${error ? 'border-red-400' : 'border-line'} rounded-btn focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors resize-y`}
        {...rest}
      />
      {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
      {hint && !error && <span className="block text-xs text-ink-muted mt-1">{hint}</span>}
    </label>
  )
}
