import { useState } from "react"
import { useListTransactions, TxStatus, getListTransactionsQueryKey } from "@workspace/api-client-react"
import { Loader2, Search, Filter, Plus, ArrowRightLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { formatCurrency, formatDate } from "@/lib/utils"

export default function Transactions() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<TxStatus | "ALL">("ALL")
  const [currency, setCurrency] = useState<string>("ALL")

  const { data, isLoading } = useListTransactions({
    page,
    limit: 20,
    search: search || undefined,
    status: status !== "ALL" ? status : undefined,
    currency: currency !== "ALL" ? currency : undefined,
  })

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Flow</h1>
          <p className="text-muted-foreground mt-1">Monitor, filter and review wire transfers.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Log Transaction
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-4 bg-card/50 flex-wrap">
          <div className="relative flex-1 min-w-[250px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts or names..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select 
              value={status} 
              onValueChange={(val) => {
                setStatus(val as TxStatus | "ALL")
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="clean">Clean</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={currency} 
              onValueChange={(val) => {
                setCurrency(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Curr.</SelectItem>
                <SelectItem value="INR">INR</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="JPY">JPY</SelectItem>
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
                  <TableHead>Time</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Receiver</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No transactions found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.items.map((tx) => (
                    <TableRow key={tx.id} className="group">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(tx.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm text-foreground">{tx.senderName || "Unknown"}</div>
                        <div className="font-mono text-xs text-muted-foreground">{tx.senderAccountNo}</div>
                      </TableCell>
                      <TableCell>
                        <ArrowRightLeft className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm text-foreground">{tx.receiverName || "Unknown"}</div>
                        <div className="font-mono text-xs text-muted-foreground">{tx.receiverAccountNo}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(tx.amount, tx.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={tx.status}>{tx.status.replace("_", " ").toUpperCase()}</Badge>
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
