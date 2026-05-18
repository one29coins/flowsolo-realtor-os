import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { subscribeToasts } from '../../lib/toast'

export default function Toaster() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    return subscribeToasts((t) => {
      setToasts((prev) => [...prev, t])
      setTimeout(() => {
        setToasts((prev) => prev.filter(x => x.id !== t.id))
      }, t.duration)
    })
  }, [])

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.kind === 'success' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
          {t.kind === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
          {t.kind === 'info' && <Info className="w-4 h-4 text-brand" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
