import { useEffect } from "react"
import { useLocation } from "wouter"
import { useGetCurrentUser, getGetCurrentUserQueryKey } from "@workspace/api-client-react"
import { Loader2 } from "lucide-react"

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation()
  const { data: user, isLoading, error } = useGetCurrentUser({
    query: {
      retry: false,
      queryKey: getGetCurrentUserQueryKey(),
    }
  })

  useEffect(() => {
    if (!isLoading && (error || !user)) {
      setLocation("/login")
    }
  }, [isLoading, error, user, setLocation])

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !user) {
    return null
  }

  return <>{children}</>
}
