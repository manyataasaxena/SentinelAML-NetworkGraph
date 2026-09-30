import { useState, useCallback } from "react"
import { useGetReportSummary, useExportReport, ExportReportType } from "@workspace/api-client-react"
import { formatCurrency, formatRiskScore } from "@/lib/utils"
import { Loader2, Download, FileText, PieChart, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Link } from "wouter"

export default function Reports() {
  const { data: summary, isLoading } = useGetReportSummary()
  const [exportingType, setExportingType] = useState<ExportReportType | null>(null)
  const { toast } = useToast()

  const handleExport = useCallback(async (type: ExportReportType) => {
    setExportingType(type)
    try {
      // Direct fetch for the CSV because the Orval hook tries to parse it as JSON by default
      const res = await fetch(`/api/reports/export?type=${type}`)
      if (!res.ok) throw new Error("Failed to export")
      const blob = await res.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `sentinel-export-${type}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
      
      toast({ title: `Exported ${type} successfully` })
    } catch (e) {
      toast({ variant: "destructive", title: "Export failed", description: "Failed to generate CSV export" })
    } finally {
      setExportingType(null)
    }
  }, [toast])

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Reports</h1>
          <p className="text-muted-foreground mt-1">System risk summaries and data exports for regulators.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Highest Risk Entities
            </CardTitle>
            <CardDescription>Accounts requiring immediate regulatory review.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary.suspiciousAccounts.map((account, idx) => (
                <div key={account.accountNo} className="flex items-start justify-between p-4 border border-border bg-card/50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{account.customerName}</span>
                      <Badge variant={account.riskLevel}>{account.riskLevel.toUpperCase()}</Badge>
                    </div>
                    <div className="font-mono text-xs text-muted-foreground mt-1 mb-2">{account.accountNo}</div>
                    <div className="flex gap-2 text-xs">
                      {account.topRules.slice(0, 2).map((rule, i) => (
                        <span key={i} className="bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                          {rule}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-mono font-bold text-destructive">
                      {formatRiskScore(account.riskScore)}
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Risk Score</div>
                  </div>
                </div>
              ))}
              {summary.suspiciousAccounts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No critical risk accounts identified.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Risk Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-success font-medium">Low Risk</span>
                  <span className="font-mono">{summary.riskCounts.low}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-warning font-medium">Medium Risk</span>
                  <span className="font-mono">{summary.riskCounts.medium}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-destructive opacity-80 font-medium">High Risk</span>
                  <span className="font-mono">{summary.riskCounts.high}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-destructive font-bold">Critical Risk</span>
                  <span className="font-mono">{summary.riskCounts.critical}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Data Exports
              </CardTitle>
              <CardDescription>Generate CSV extracts for audit and regulators.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-between" 
                onClick={() => handleExport("customers")}
                disabled={exportingType !== null}
              >
                <span>Customer Registry</span>
                {exportingType === "customers" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-between" 
                onClick={() => handleExport("transactions")}
                disabled={exportingType !== null}
              >
                <span>Transaction Log</span>
                {exportingType === "transactions" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-between" 
                onClick={() => handleExport("alerts")}
                disabled={exportingType !== null}
              >
                <span>Alert History</span>
                {exportingType === "alerts" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
