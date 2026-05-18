export default function Card({ children, className = '', dark = false, padding = 'p-5' }) {
  const tone = dark
    ? 'bg-brand text-white'
    : 'bg-white text-ink border-hairline border-line'
  return (
    <div className={`${tone} rounded-card ${padding} ${className}`}>
      {children}
    </div>
  )
}
