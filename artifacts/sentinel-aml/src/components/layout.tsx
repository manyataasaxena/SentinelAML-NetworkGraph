import { Link, useLocation } from "wouter"
import { 
  LayoutDashboard, 
  Users, 
  ArrowRightLeft, 
  Network, 
  BellRing, 
  FileText, 
  ShieldCheck, 
  Settings,
  Search,
  LogOut,
  ShieldAlert,
  Building2,
  ShieldQuestion,
  ClipboardList,
  LockKeyhole
} from "lucide-react"
import { useGetCurrentUser, useLogout, getGetCurrentUserQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation()
  const queryClient = useQueryClient()
  const { data: user } = useGetCurrentUser()
  const logout = useLogout()

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Users, label: "Customers", href: "/customers" },
    { icon: ArrowRightLeft, label: "Transactions", href: "/transactions" },
    { icon: Network, label: "Network Graph", href: "/graph" },
    { icon: Building2, label: "Cross-Bank Analysis", href: "/cross-bank" },
    { icon: ShieldQuestion, label: "Potential Mules", href: "/mules" },
    { icon: ClipboardList, label: "Investigations", href: "/investigations" },
    { icon: LockKeyhole, label: "Disclosure Requests", href: "/disclosures" },
    { icon: BellRing, label: "Alerts", href: "/alerts" },
    { icon: FileText, label: "Reports", href: "/reports" },
    ...(user?.role === "admin" ? [{ icon: ShieldCheck, label: "Audit Logs", href: "/audit-logs" }] : []),
  ]

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() })
        setLocation("/login")
      }
    })
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col flex-shrink-0 z-20 relative">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <ShieldAlert className="w-6 h-6 text-primary mr-2" />
          <span className="font-bold text-lg tracking-tight">SentinelAML</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Investigation
          </div>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="block">
              <span className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group",
                location.startsWith(item.href) 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
                <item.icon className={cn("w-4 h-4 mr-3", location.startsWith(item.href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {item.label}
              </span>
            </Link>
          ))}
          
          <div className="mt-8 px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            System
          </div>
          <Link href="/settings" className="block">
            <span className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors group",
              location.startsWith("/settings") 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}>
              <Settings className={cn("w-4 h-4 mr-3", location.startsWith("/settings") ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              Settings
            </span>
          </Link>
        </div>
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium mr-3">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{user?.role.replace("_", " ")}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-muted-foreground" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card z-10 shrink-0">
          <div className="flex-1 max-w-xl">
            {/* Global Search could go here */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search customers, accounts, or transactions..."
                className="w-full bg-secondary border-transparent pl-9 md:w-[300px] lg:w-[400px] focus-visible:bg-background"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">System Live</span>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <div className="max-w-7xl mx-auto h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
