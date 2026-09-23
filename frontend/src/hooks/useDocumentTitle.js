import { useEffect } from 'react'

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | PawMate` : 'PawMate | Trusted pet walkers and caregivers'
  }, [title])
}
