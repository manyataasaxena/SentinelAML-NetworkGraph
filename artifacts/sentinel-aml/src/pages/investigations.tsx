import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Loader2, Plus, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { intelligenceFetch, type Investigation } from "@/lib/intelligence-api";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Investigations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["/api/investigations"],
    queryFn: () => intelligenceFetch<{ items: Investigation[] }>("/investigations"),
  });
  const create = useMutation({
    mutationFn: () => intelligenceFetch<Investigation>("/investigations", { method: "POST", body: JSON.stringify({ title, description }) }),
    onSuccess: () => { setTitle(""); setDescription(""); queryClient.invalidateQueries({ queryKey: ["/api/investigations"] }); toast({ title: "Investigation created" }); },
    onError: (error) => toast({ variant: "destructive", title: error.message }),
  });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => intelligenceFetch(`/investigations/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/investigations"] }),
    onError: (error) => toast({ variant: "destructive", title: error.message }),
  });
  if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  const items = data?.items || [];
  return <div className="space-y-6">
    <div><h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight"><ClipboardList className="h-8 w-8 text-primary" />Investigations</h1><p className="mt-1 text-muted-foreground">Turn suspicious alerts and networks into accountable investigation cases.</p></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4" />Create investigation</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-[1fr_2fr_auto]"><Input placeholder="Case title" value={title} onChange={(event) => setTitle(event.target.value)} /><Textarea className="min-h-10" placeholder="Why does this network require investigation?" value={description} onChange={(event) => setDescription(event.target.value)} /><Button onClick={() => create.mutate()} disabled={!title.trim() || !description.trim() || create.isPending}><Save className="mr-2 h-4 w-4" />Create Case</Button></CardContent></Card>
    <Card><CardContent className="overflow-auto p-0"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-4">Case</th><th className="p-4">Description</th><th className="p-4">Scores</th><th className="p-4">Status</th><th className="p-4">Created</th><th className="p-4">Update</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-border/50 align-top"><td className="p-4"><div className="font-mono font-semibold">{item.caseNumber}</div><div>{item.title}</div><div className="text-xs text-muted-foreground">{item.createdByName}</div></td><td className="max-w-[300px] p-4 text-muted-foreground">{item.description}</td><td className="p-4"><div>Network <b>{item.networkRiskScore}/100</b></div><div>Mule <b>{item.muleRiskScore}/100</b></div></td><td className="p-4"><Badge variant={item.status === "closed" ? "success" : "warning"}>{item.status.replaceAll("_", " ")}</Badge></td><td className="whitespace-nowrap p-4 text-muted-foreground">{formatDate(item.createdAt)}</td><td className="p-4"><select className="rounded-md border border-input bg-background px-2 py-2 text-sm" value={item.status} onChange={(event) => update.mutate({ id: item.id, status: event.target.value })}><option value="open">Open</option><option value="under_investigation">Under Investigation</option><option value="escalated">Escalated</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></td></tr>)}</tbody></table>{items.length === 0 && <p className="p-8 text-center text-muted-foreground">No investigations yet. Start one from Cross-Bank Analysis.</p>}</CardContent></Card>
  </div>;
}