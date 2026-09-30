import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, LockKeyhole, ShieldCheck, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { intelligenceFetch, type DisclosureRequest } from "@/lib/intelligence-api";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Disclosures() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [investigationId, setInvestigationId] = useState("");
  const [anonymousEntityId, setAnonymousEntityId] = useState("");
  const [reason, setReason] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["/api/disclosure-requests"], queryFn: () => intelligenceFetch<{ items: DisclosureRequest[] }>("/disclosure-requests") });
  const request = useMutation({
    mutationFn: () => intelligenceFetch("/disclosure-requests", { method: "POST", body: JSON.stringify({ investigationId, anonymousEntityId, reason }) }),
    onSuccess: () => { setInvestigationId(""); setAnonymousEntityId(""); setReason(""); queryClient.invalidateQueries({ queryKey: ["/api/disclosure-requests"] }); toast({ title: "Disclosure request submitted" }); },
    onError: (error) => toast({ variant: "destructive", title: error.message }),
  });
  const decide = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) => intelligenceFetch(`/disclosure-requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/disclosure-requests"] }); toast({ title: "Disclosure decision recorded" }); },
    onError: (error) => toast({ variant: "destructive", title: error.message }),
  });
  if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  const items = data?.items || [];
  return <div className="space-y-6">
    <div><h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight"><LockKeyhole className="h-8 w-8 text-primary" />Disclosure Requests</h1><p className="mt-1 text-muted-foreground">External identities stay restricted until the owning bank’s authorized reviewer approves access.</p></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-4 w-4" />Request minimum necessary identity</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-3"><Input placeholder="Investigation ID" value={investigationId} onChange={(event) => setInvestigationId(event.target.value)} /><Input placeholder="Anonymous ID, e.g. EXT-BETA-..." value={anonymousEntityId} onChange={(event) => setAnonymousEntityId(event.target.value)} /><Textarea className="min-h-10 md:col-span-2" placeholder="Reason for identity verification" value={reason} onChange={(event) => setReason(event.target.value)} /><Button onClick={() => request.mutate()} disabled={!investigationId || !anonymousEntityId || !reason.trim() || request.isPending}>Request Identity</Button></CardContent></Card>
    <Card><CardHeader><CardTitle>Review queue</CardTitle></CardHeader><CardContent className="overflow-auto p-0"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-4">Entity</th><th className="p-4">Owning bank</th><th className="p-4">Reason</th><th className="p-4">Status</th><th className="p-4">Requested</th><th className="p-4 text-right">Decision</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b border-border/50 align-top"><td className="p-4 font-mono">{item.anonymousEntityId}<div className="text-xs font-sans text-muted-foreground">Case {item.investigationId}</div></td><td className="p-4">{item.owningBank}</td><td className="max-w-[320px] p-4 text-muted-foreground">{item.reason}</td><td className="p-4"><Badge variant={item.status === "approved" ? "success" : item.status === "rejected" ? "destructive" : "warning"}>{item.status}</Badge></td><td className="whitespace-nowrap p-4 text-muted-foreground">{formatDate(item.createdAt)}</td><td className="p-4 text-right">{item.status === "pending" ? <span className="flex justify-end gap-2"><Button size="sm" onClick={() => decide.mutate({ id: item.id, status: "approved" })}><ShieldCheck className="mr-1 h-4 w-4" />Approve</Button><Button size="sm" variant="outline" onClick={() => decide.mutate({ id: item.id, status: "rejected" })}><XCircle className="mr-1 h-4 w-4" />Reject</Button></span> : <span className="text-xs text-muted-foreground">Decision recorded</span>}</td></tr>)}</tbody></table>{items.length === 0 && <p className="p-8 text-center text-muted-foreground">No disclosure requests yet.</p>}</CardContent></Card>
  </div>;
}