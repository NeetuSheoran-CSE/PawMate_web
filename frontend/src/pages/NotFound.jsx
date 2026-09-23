import { PawPrint } from 'lucide-react'
import EmptyState from '../components/ui/EmptyState.jsx'
import Button from '../components/ui/Button.jsx'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function NotFound() {
  useDocumentTitle('Page not found')
  return (
    <div className="container section">
      <EmptyState icon={PawPrint} title="This page wandered off" text="The page you are looking for does not exist or has moved." action={<Button to="/">Back to home</Button>} />
    </div>
  )
}
