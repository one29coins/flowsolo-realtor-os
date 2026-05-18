const STYLES = {
  Active:        { bg: '#dcfce7', fg: '#166534' },
  Onboarding:    { bg: '#dbeafe', fg: '#1e40af' },
  Paused:        { bg: '#f1f5f9', fg: '#64748b' },
  Completed:     { bg: '#f0fdf4', fg: '#15803d' },
  Lead:          { bg: '#fef9c3', fg: '#854d0e' },
  Churned:       { bg: '#fee2e2', fg: '#991b1b' },
  Paid:          { bg: '#dcfce7', fg: '#166534' },
  Overdue:       { bg: '#fee2e2', fg: '#991b1b' },
  Pending:       { bg: '#fef9c3', fg: '#854d0e' },
  Sent:          { bg: '#dbeafe', fg: '#1e40af' },
  Draft:         { bg: '#f1f5f9', fg: '#64748b' },
  Cancelled:     { bg: '#f1f5f9', fg: '#64748b' },
  High:          { bg: '#fee2e2', fg: '#991b1b' },
  Medium:        { bg: '#fef9c3', fg: '#854d0e' },
  Low:           { bg: '#f1f5f9', fg: '#64748b' },
  'In Progress': { bg: '#dbeafe', fg: '#1e40af' },
  'In Review':   { bg: '#ede9fe', fg: '#5b21b6' },
  'Not Started': { bg: '#f1f5f9', fg: '#64748b' },
  Blocked:       { bg: '#fee2e2', fg: '#991b1b' },
  'To Do':       { bg: '#f1f5f9', fg: '#64748b' },
  Waiting:       { bg: '#fef9c3', fg: '#854d0e' },
  Done:          { bg: '#dcfce7', fg: '#166534' },
  Skipped:       { bg: '#f1f5f9', fg: '#64748b' }
}

export default function Badge({ children, value, className = '' }) {
  const key = value ?? children
  const style = STYLES[key] || { bg: '#f1f5f9', fg: '#64748b' }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ background: style.bg, color: style.fg }}
    >
      {children ?? value}
    </span>
  )
}
