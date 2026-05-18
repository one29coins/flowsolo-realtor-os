export default function Select({ label, error, options = [], className = '', children, ...rest }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="block text-sm font-medium text-ink mb-1">{label}</span>}
      <select
        className={`w-full px-3 py-2 text-sm bg-white border-hairline ${error ? 'border-red-400' : 'border-line'} rounded-btn focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors`}
        {...rest}
      >
        {children ?? options.map(opt => {
          const value = typeof opt === 'string' ? opt : opt.value
          const text = typeof opt === 'string' ? opt : opt.label
          return <option key={value} value={value}>{text}</option>
        })}
      </select>
      {error && <span className="block text-xs text-red-600 mt-1">{error}</span>}
    </label>
  )
}
