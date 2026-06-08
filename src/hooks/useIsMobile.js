import { useEffect, useState } from 'react'

// Match the global breakpoint used by the mobile shell (<= 768px).
const QUERY = '(max-width: 768px)'

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(QUERY).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(QUERY)
    const handler = (e) => setIsMobile(e.matches)
    // Some Safari versions only support addListener
    if (mql.addEventListener) mql.addEventListener('change', handler)
    else mql.addListener(handler)
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', handler)
      else mql.removeListener(handler)
    }
  }, [])

  return isMobile
}

export default useIsMobile
