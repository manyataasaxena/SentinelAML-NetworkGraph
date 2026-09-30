import { useGetDashboardSummary } from "@workspace/api-client-react"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Users, ArrowRightLeft, ShieldAlert, Activity, TrendingUp, AlertTriangle, Network } from "lucide-react"
import { Link } from "wouter"

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time network intelligence and alert status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active profiles monitored
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitored Flow</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalMoneyFlow)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {summary.totalTransactions.toLocaleString()} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-warning/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Nodes</CardTitle>
            <ShieldAlert className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{summary.highRiskAccounts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Accounts exceeding risk threshold
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.openAlerts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires immediate review
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Latest flagged activities requiring attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.recentAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No recent alerts</div>
              ) : (
                summary.recentAlerts.map(alert => (
                  <div key={alert.id} className="flex items-start justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={alert.severity}>{alert.severity}</Badge>
                        <span className="font-medium">{alert.ruleTriggered}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <Link href={`/customers/${alert.customerId}`} className="hover:text-primary hover:underline">
                          {alert.customerName}
                        </Link>
                        {" · "}{alert.accountNo}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{alert.description}</p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used investigation tools.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/graph" className="flex flex-col items-center justify-center p-6 bg-secondary/50 rounded-lg border border-border hover:bg-secondary transition-colors group">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Network className="w-6 h-6" />
                </div>
                <span className="font-medium">Network Graph</span>
                <span className="text-xs text-muted-foreground mt-1">Explore relationships</span>
              </Link>
              
              <Link href="/transactions" className="flex flex-col items-center justify-center p-6 bg-secondary/50 rounded-lg border border-border hover:bg-secondary transition-colors group">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <span className="font-medium">Transactions</span>
                <span className="text-xs text-muted-foreground mt-1">Monitor flows</span>
              </Link>
              
              <Link href="/customers" className="flex flex-col items-center justify-center p-6 bg-secondary/50 rounded-lg border border-border hover:bg-secondary transition-colors group">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <span className="font-medium">Directory</span>
                <span className="text-xs text-muted-foreground mt-1">Search accounts</span>
              </Link>
              
              <Link href="/reports" className="flex flex-col items-center justify-center p-6 bg-secondary/50 rounded-lg border border-border hover:bg-secondary transition-colors group">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="font-medium">Reports</span>
                <span className="text-xs text-muted-foreground mt-1">Export evidence</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
