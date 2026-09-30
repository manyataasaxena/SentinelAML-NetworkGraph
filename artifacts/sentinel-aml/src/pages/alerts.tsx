import { useState } from "react"
import { useListAlerts, useUpdateAlert, RiskLevel, getListAlertsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2, Filter, AlertTriangle, ShieldCheck, Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Link } from "wouter"

export default function Alerts() {
  const [page, setPage] = useState(1)
  const [severity, setSeverity] = useState<RiskLevel | "ALL">("ALL")
  const [resolved, setResolved] = useState<"ALL" | "true" | "false">("false")
  
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useListAlerts({
    page,
    limit: 20,
    severity: severity !== "ALL" ? severity : undefined,
    resolved: resolved === "ALL" ? undefined : resolved === "true"
  })

  const updateAlert = useUpdateAlert()

  const handleResolve = (id: string, currentStatus: boolean) => {
    updateAlert.mutate(
      { id, data: { resolved: !currentStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() })
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() })
          toast({ title: `Alert marked as ${!currentStatus ? 'resolved' : 'open'}` })
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to update alert" })
        }
      }
    )
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-destructive flex items-center gap-3">
            <AlertTriangle className="h-8 w-8" />
            Alert Management
          </h1>
          <p className="text-muted-foreground mt-1">Review and resolve system-generated compliance alerts.</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-destructive/20">
        <div className="p-4 border-b border-border flex items-center gap-4 bg-card/50 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select 
              value={severity} 
              onValueChange={(val) => {
                setSeverity(val as RiskLevel | "ALL")
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={resolved} 
              onValueChange={(val) => {
                setResolved(val as any)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Open Only</SelectItem>
                <SelectItem value="true">Resolved</SelectItem>
                <SelectItem value="ALL">All Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No alerts found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((alert) => (
                    <TableRow key={alert.id} className={alert.resolved ? "opacity-60" : ""}>
                      <TableCell>
                        {alert.resolved ? (
                          <ShieldCheck className="w-5 h-5 text-success" />
                        ) : (
                          <Clock className="w-5 h-5 text-warning animate-pulse" />
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="font-medium text-sm">{alert.ruleTriggered}</div>
                        <div className="text-xs text-muted-foreground truncate">{alert.description}</div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/customers/${alert.customerId}`} className="font-medium text-sm hover:text-primary hover:underline">
                          {alert.customerName}
                        </Link>
                        <div className="font-mono text-xs text-muted-foreground">{alert.accountNo}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={alert.severity}>{alert.severity.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(alert.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant={alert.resolved ? "outline" : "secondary"} 
                          size="sm"
                          onClick={() => handleResolve(alert.id, alert.resolved)}
                          disabled={updateAlert.isPending}
                        >
                          {alert.resolved ? "Reopen" : "Resolve"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
        
        {data && data.total > 0 && (
          <div className="p-4 border-t border-border bg-card/50 flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing {((page - 1) * data.limit) + 1} to {Math.min(page * data.limit, data.total)} of {data.total} entries
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => p + 1)}
                disabled={page * data.limit >= data.total}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
