import { initials } from '../../lib/format'

export default function Avatar({ name, size = 32 }) {
  const fontSize = Math.round(size * 0.4)
  return (
    <div
      className="inline-flex items-center justify-center rounded-full bg-brand text-white font-medium flex-shrink-0"
      style={{ width: size, height: size, fontSize }}
    >
      {initials(name)}
    </div>
  )
}
