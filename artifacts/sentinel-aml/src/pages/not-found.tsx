import { useLocation } from "wouter"
import { ShieldAlert } from "lucide-react"

export default function NotFound() {
  const [, setLocation] = useLocation()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <ShieldAlert className="w-20 h-20 text-muted-foreground mb-6" />
      <h1 className="text-4xl font-bold mb-4 tracking-tight">404 - Not Found</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        The requested resource could not be found. It may have been moved or you may not have permission to view it.
      </p>
      <button 
        className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
        onClick={() => setLocation("/dashboard")}
      >
        Return to Dashboard
      </button>
    </div>
  )
}
