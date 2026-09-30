import { useState, useMemo } from "react"
import { useRoute, Link, useLocation } from "wouter"
import { 
  useGetCustomer, 
  useGetCustomerTransactions, 
  useGetRiskBreakdown,
  useDeleteCustomer,
  getGetCustomerQueryKey,
  getGetCustomerTransactionsQueryKey,
  getGetRiskBreakdownQueryKey,
  getListCustomersQueryKey
} from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { formatCurrency, formatDate, formatRiskScore } from "@/lib/utils"
import { Loader2, ArrowLeft, AlertTriangle, ShieldCheck, TrendingUp, Activity, User as UserIcon, Calendar, MapPin, Mail, Hash, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

export default function CustomerDetail() {
  const [, params] = useRoute("/customers/:id")
  const id = params?.id || ""
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const { data: customer, isLoading: isLoadingCustomer } = useGetCustomer(id, { query: { enabled: !!id, queryKey: getGetCustomerQueryKey(id) } })
  const { data: transactions, isLoading: isLoadingTx } = useGetCustomerTransactions(id, { query: { enabled: !!id, queryKey: getGetCustomerTransactionsQueryKey(id) } })
  const { data: risk, isLoading: isLoadingRisk } = useGetRiskBreakdown(id, { query: { enabled: !!id, queryKey: getGetRiskBreakdownQueryKey(id) } })
  const deleteCustomer = useDeleteCustomer()

  const handleDelete = () => {
    deleteCustomer.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Customer deleted successfully" })
        queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() })
        setLocation("/customers")
      },
      onError: (err) => {
        toast({ variant: "destructive", title: "Deletion failed", description: err.data?.error })
      }
    })
  }

  const txStats = useMemo(() => {
    if (!transactions) return { sent: 0, received: 0, totalAmount: 0 }
    return transactions.reduce((acc, tx) => {
      if (tx.senderId === id) acc.sent++
      if (tx.receiverId === id) acc.received++
      acc.totalAmount += tx.amount
      return acc
    }, { sent: 0, received: 0, totalAmount: 0 })
  }, [transactions, id])

  if (isLoadingCustomer || !customer) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/customers">
            <Button variant="ghost" size="icon" className="shrink-0 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{customer.fullName}</h1>
              <Badge variant={customer.riskLevel} className="text-sm px-3 py-1">
                {customer.riskLevel.toUpperCase()} RISK
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 font-mono text-sm">ACC: {customer.accountNo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Entity
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete the customer profile
                  and sever all associated transaction links in the network graph.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="destructive" onClick={handleDelete} disabled={deleteCustomer.isPending}>
                  {deleteCustomer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirm Deletion
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Entity Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <UserIcon className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Full Name</p>
                <p className="font-medium">{customer.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Email</p>
                <p className="font-medium">{customer.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Account No</p>
                <p className="font-medium font-mono">{customer.accountNo}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Jurisdiction</p>
                <p className="font-medium">{customer.country}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Date of Birth/Inc.</p>
                <p className="font-medium">{customer.dob || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">System Entry</p>
                <p className="font-medium">{new Date(customer.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card className="md:col-span-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Risk Intelligence Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-8">
              <div className="text-center">
                <div className="text-5xl font-bold font-mono tracking-tighter text-primary">
                  {formatRiskScore(customer.riskScore)}
                </div>
                <div className="text-sm font-medium mt-2 text-muted-foreground uppercase tracking-widest">Score</div>
              </div>
              <div className="flex-1 space-y-3 border-l border-border pl-8">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Triggered Rules</h4>
                {isLoadingRisk ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : risk?.triggeredRules.length === 0 ? (
                  <p className="text-sm text-success flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    No risk flags triggered. Entity behavior is normal.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {risk?.triggeredRules.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-3 bg-background/50 p-2 rounded-md border border-border">
                        <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium flex items-center justify-between gap-4">
                            {rule.rule}
                            <span className="text-xs font-mono text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                              +{rule.points} pts
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <div>
            <CardTitle className="text-lg">Transaction History</CardTitle>
            <CardDescription>
              {txStats.sent} Sent • {txStats.received} Received • Total Vol: {formatCurrency(txStats.totalAmount)}
            </CardDescription>
          </div>
          <Link href="/transactions">
            <Button variant="outline" size="sm">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analyze Flow
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingTx ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Time</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!transactions || transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                      No transaction history found.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map(tx => {
                    const isSender = tx.senderId === customer.id
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(tx.timestamp)}
                        </TableCell>
                        <TableCell>
                          <span className={isSender ? "text-destructive font-medium" : "text-success font-medium"}>
                            {isSender ? "OUT" : "IN"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">
                            {isSender ? tx.receiverName || "Unknown" : tx.senderName || "Unknown"}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {isSender ? tx.receiverAccountNo : tx.senderAccountNo}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(tx.amount, tx.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={tx.status}>{tx.status}</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
