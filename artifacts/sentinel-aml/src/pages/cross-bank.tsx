import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Building2, Network, ShieldAlert, ArrowRightLeft, Loader2, Plus, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { intelligenceFetch, type CrossBankNetwork } from "@/lib/intelligence-api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function CrossBank() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ["/api/cross-bank/networks"],
    queryFn: () => intelligenceFetch<CrossBankNetwork>("/cross-bank/networks"),
  });
  const createCase = useMutation({
    mutationFn: () => intelligenceFetch("/investigations", {
      method: "POST",
      body: JSON.stringify({
        title: "Cross-bank network review",
        description: "Review a simulated cross-bank transaction network with restricted external identities.",
        networkRiskScore: data?.stats.networkRiskScore || 0,
        muleRiskScore: data?.stats.potentialMules ? 70 : 0,
        severity: (data?.stats.networkRiskScore || 0) >= 75 ? "critical" : "high",
      }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investigations"] });
      toast({ title: "Investigation case created" });
    },
    onError: (error) => toast({ variant: "destructive", title: error.message }),
  });

  if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!data) return null;
  const metricCards: { label: string; value: string | number; Icon: LucideIcon }[] = [
    { label: "Banks Involved", value: data.stats.banksInvolved, Icon: Building2 },
    { label: "Accounts Involved", value: data.stats.accountsInvolved, Icon: Network },
    { label: "Cross-Bank Flows", value: data.stats.crossBankTransactions, Icon: ArrowRightLeft },
    { label: "Network Risk", value: `${data.stats.networkRiskScore}/100`, Icon: ShieldAlert },
  ];
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight"><Network className="h-8 w-8 text-primary" />Cross-Bank Analysis</h1>
          <p className="mt-1 text-muted-foreground">Privacy-aware analysis across three simulated Indian banks.</p>
        </div>
        <Button onClick={() => createCase.mutate()} disabled={createCase.isPending}><Plus className="mr-2 h-4 w-4" />Start Investigation</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {metricCards.map(({ label, value, Icon }) => (
          <Card key={label}><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{label}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{value}</div></CardContent></Card>
        ))}
      </div>
      <Card><CardHeader><CardTitle>Network risk factors</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{data.reasons.map((reason) => <Badge key={reason} variant="warning">{reason}</Badge>)}</CardContent></Card>
      <Card>
        <CardHeader><CardTitle>Privacy-safe external entities</CardTitle></CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">Entity</th><th className="p-3">Owning bank</th><th className="p-3">Identity</th><th className="p-3">Risk</th></tr></thead>
            <tbody>{data.nodes.map((node) => <tr key={node.id} className="border-b border-border/50"><td className="p-3 font-mono">{node.id}</td><td className="p-3">{node.bank}</td><td className="p-3"><Badge variant="outline">Identity Restricted</Badge></td><td className="p-3"><Badge variant={node.riskLevel as any}>{node.riskScore}/100</Badge></td></tr>)}</tbody>
          </table>
          <p className="mt-4 text-xs text-muted-foreground">External customer names, full account numbers, and internal IDs are intentionally withheld from this network response. Use an investigation and disclosure request when identity is genuinely required.</p>
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Cross-bank transaction flows</CardTitle></CardHeader><CardContent className="overflow-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-3">From</th><th className="p-3">To</th><th className="p-3">Amount</th><th className="p-3">Time</th></tr></thead><tbody>{data.edges.slice(0, 20).map((edge) => <tr key={edge.id} className="border-b border-border/50"><td className="p-3 font-mono">{edge.source}</td><td className="p-3 font-mono">{edge.target}</td><td className="p-3">{formatCurrency(edge.amount, edge.currency)}</td><td className="p-3 text-muted-foreground">{formatDate(edge.timestamp)}</td></tr>)}</tbody></table><Link href="/graph" className="mt-4 inline-block text-sm text-primary hover:underline">Open the existing network graph →</Link></CardContent></Card>
    </div>
  );
}