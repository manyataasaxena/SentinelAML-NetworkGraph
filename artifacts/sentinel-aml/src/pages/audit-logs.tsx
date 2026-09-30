import { useState } from "react"
import { useListAuditLogs } from "@workspace/api-client-react"
import { Loader2, ShieldCheck, Search, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/utils"

export default function AuditLogs() {
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState("")

  const { data, isLoading } = useListAuditLogs({
    page,
    limit: 50,
    action: actionFilter || undefined,
  })

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            System Audit Trail
          </h1>
          <p className="text-muted-foreground mt-1">Immutable log of all user actions and system changes.</p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-primary/20 bg-card/30">
        <div className="p-4 border-b border-border flex items-center gap-4">
          <div className="relative w-[300px]">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by action (e.g. login, create)..."
              className="pl-9"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value)
                setPage(1)
              }}
            />
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
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target Type</TableHead>
                  <TableHead className="font-mono">Target ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No audit logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {log.userName}
                      </TableCell>
                      <TableCell>
                        <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-mono uppercase">
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.targetType}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.targetId}
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
