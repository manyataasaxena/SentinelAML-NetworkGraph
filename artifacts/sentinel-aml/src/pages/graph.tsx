import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { 
  useGetGraph, 
  RiskLevel,
  useGetCentrality,
  getGetCentralityQueryKey,
  useGetConnectedComponents,
  getGetConnectedComponentsQueryKey,
  useGetCycles,
  getGetCyclesQueryKey,
  useGetMostConnected,
  getGetMostConnectedQueryKey,
  useGetShortestPath,
  getGetShortestPathQueryKey
} from "@workspace/api-client-react"
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d"
import { Loader2, Filter, Activity, Settings, Maximize, X, Network, Link2, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, formatRiskScore } from "@/lib/utils"

// Helper to extract CSS variable HSL to Hex (for canvas rendering)
const hslToHex = (h: number, s: number, l: number) => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const getRiskColor = (level: string): string => {
  switch(level) {
    case 'low': return '#22c55e'; // Green 500
    case 'medium': return '#f59e0b'; // Amber 500
    case 'high': return '#ef4444'; // Red 500
    case 'critical': return '#991b1b'; // Red 800
    default: return '#6b7280';
  }
}

export default function GraphView() {
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Filters
  const [riskLevel, setRiskLevel] = useState<RiskLevel | "ALL">("ALL")
  const [minAmount, setMinAmount] = useState<string>("")
  const [flaggedOnly, setFlaggedOnly] = useState<boolean>(false)

  // Selection
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [selectedEdge, setSelectedEdge] = useState<any>(null)

  // Analytics Panels
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [shortestPathSource, setShortestPathSource] = useState("")
  const [shortestPathTarget, setShortestPathTarget] = useState("")

  // Fetch Data
  const { data: graphData, isLoading: isLoadingGraph } = useGetGraph({
    riskLevel: riskLevel !== "ALL" ? riskLevel : undefined,
    minAmount: minAmount ? parseFloat(minAmount) : undefined,
    flaggedOnly: flaggedOnly ? flaggedOnly : undefined
  })

  // Analytics Hooks
  const { data: centrality, isLoading: isLoadingCentrality, refetch: fetchCentrality } = useGetCentrality({ query: { enabled: false, queryKey: getGetCentralityQueryKey() } })
  const { data: cycles, isLoading: isLoadingCycles, refetch: fetchCycles } = useGetCycles({ query: { enabled: false, queryKey: getGetCyclesQueryKey() } })
  const { data: connectedComponents, isLoading: isLoadingComponents, refetch: fetchComponents } = useGetConnectedComponents({ query: { enabled: false, queryKey: getGetConnectedComponentsQueryKey() } })
  const { data: mostConnected, isLoading: isLoadingMostConnected, refetch: fetchMostConnected } = useGetMostConnected({ limit: 5 }, { query: { enabled: false, queryKey: getGetMostConnectedQueryKey({ limit: 5 }) } })
  const { data: shortestPath, isLoading: isLoadingPath, refetch: fetchShortestPath } = useGetShortestPath(
    { from: shortestPathSource, to: shortestPathTarget }, 
    { query: { enabled: false, queryKey: getGetShortestPathQueryKey({ from: shortestPathSource, to: shortestPathTarget }) } }
  )

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node)
    setSelectedEdge(null)
    
    // Auto-focus on node
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000)
      fgRef.current.zoom(8, 2000)
    }
  }, [])

  const handleLinkClick = useCallback((link: any) => {
    setSelectedEdge(link)
    setSelectedNode(null)
  }, [])

  // Process data for react-force-graph
  const processedData = useMemo(() => {
    if (!graphData) return { nodes: [], links: [] }
    return {
      nodes: graphData.nodes.map(n => ({ ...n })),
      links: graphData.edges.map(e => ({ ...e, source: e.source, target: e.target }))
    }
  }, [graphData])

  return (
    <div className="absolute inset-0 flex overflow-hidden bg-background">
      {/* Main Graph Area */}
      <div className="flex-1 relative" ref={containerRef}>
        {isLoadingGraph && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="font-mono text-sm font-medium tracking-widest text-primary animate-pulse">COMPUTING FORCE TOPOLOGY...</p>
            </div>
          </div>
        )}
        
        {processedData.nodes.length > 0 && (
          <ForceGraph2D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={processedData}
            nodeId="id"
            nodeRelSize={4}
            nodeVal={(node: any) => Math.max(2, Math.min(10, node.degree || 1))}
            nodeColor={(node: any) => getRiskColor(node.riskLevel)}
            nodeLabel="customerName"
            linkColor={(link: any) => link.flagged ? '#ef4444' : '#6b7280'}
            linkWidth={(link: any) => Math.max(1, Math.log10(link.amount || 10))}
            linkLineDash={(link: any) => link.flagged ? [4, 4] : null}
            linkDirectionalParticles={(link: any) => link.flagged ? 4 : 0}
            linkDirectionalParticleSpeed={(link: any) => link.flagged ? 0.01 * (Math.log10(link.amount) / 2) : 0}
            onNodeClick={handleNodeClick}
            onLinkClick={handleLinkClick}
            backgroundColor="transparent"
            d3AlphaDecay={0.01}
            d3VelocityDecay={0.1}
          />
        )}

        {/* Floating Header */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
          <div className="bg-card/90 backdrop-blur border border-border px-4 py-2 rounded-md shadow-lg flex items-center gap-3">
            <Network className="w-5 h-5 text-primary" />
            <h2 className="font-bold tracking-tight">Topology</h2>
            <div className="w-px h-4 bg-border mx-2" />
            <span className="text-xs font-mono text-muted-foreground">{processedData.nodes.length} N / {processedData.links.length} E</span>
          </div>
        </div>

        {/* Floating Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-card/90 backdrop-blur border border-border p-4 rounded-md shadow-lg w-48 text-xs">
          <h3 className="font-bold mb-3 uppercase tracking-wider text-muted-foreground">Risk Legend</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#22c55e]" /> <span>Low Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]" /> <span>Medium Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]" /> <span>High Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#991b1b]" /> <span>Critical Risk</span>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-2 border-t border-border">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#ef4444] to-transparent bg-[length:4px_1px] border-dashed border-b-2 border-[#ef4444]" /> <span>Flagged Flow</span>
            </div>
          </div>
        </div>

        {/* Filters Panel Button */}
        <div className="absolute top-4 right-4 z-10">
          <Button variant="outline" className="bg-card/90 backdrop-blur shadow-lg" onClick={() => setShowAnalytics(!showAnalytics)}>
            {showAnalytics ? <X className="w-4 h-4 mr-2" /> : <Activity className="w-4 h-4 mr-2" />}
            {showAnalytics ? "Close Panel" : "Analytics & Filters"}
          </Button>
        </div>

        {/* Node Detail Overlay */}
        {selectedNode && (
          <div className="absolute top-20 left-4 z-10 bg-card border border-border shadow-2xl rounded-lg w-80 overflow-hidden animate-in slide-in-from-left-4">
            <div className="p-4 border-b border-border flex justify-between items-start">
              <div>
                <Badge variant={selectedNode.riskLevel} className="mb-2 uppercase text-[10px] tracking-wider">{selectedNode.riskLevel} RISK</Badge>
                <h3 className="font-bold text-lg leading-tight">{selectedNode.customerName}</h3>
                <p className="font-mono text-xs text-muted-foreground mt-1">{selectedNode.accountNo}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 text-muted-foreground" onClick={() => setSelectedNode(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 bg-muted/30 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Risk Score</p>
                <p className="font-mono font-bold text-lg">{formatRiskScore(selectedNode.riskScore)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Degree</p>
                <p className="font-mono font-bold text-lg">{selectedNode.degree}</p>
              </div>
            </div>
            <div className="p-4">
              <Button className="w-full" size="sm" onClick={() => window.open(`/customers/${selectedNode.id}`, '_blank')}>
                Open Full Profile
              </Button>
            </div>
          </div>
        )}

        {/* Edge Detail Overlay */}
        {selectedEdge && (
          <div className="absolute top-20 left-4 z-10 bg-card border border-border shadow-2xl rounded-lg w-80 overflow-hidden animate-in slide-in-from-left-4">
            <div className="p-4 border-b border-border flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Transaction Link</span>
                  {selectedEdge.flagged && <Badge variant="destructive" className="text-[10px]">FLAGGED</Badge>}
                </div>
                <h3 className="font-mono font-bold text-xl">{formatCurrency(selectedEdge.amount, selectedEdge.currency)}</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 text-muted-foreground" onClick={() => setSelectedEdge(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 bg-muted/30 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Source Node</p>
                <p className="font-medium text-sm">{selectedEdge.source.customerName || selectedEdge.source}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Target Node</p>
                <p className="font-medium text-sm">{selectedEdge.target.customerName || selectedEdge.target}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Timestamp</p>
                <p className="font-mono text-xs">{new Date(selectedEdge.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Side Panel: Analytics & Filters */}
      {showAnalytics && (
        <div className="w-96 bg-card border-l border-border flex flex-col z-20 shadow-2xl animate-in slide-in-from-right shrink-0">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="font-bold">Graph Tools</h2>
          </div>
          
          <Tabs defaultValue="filters" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0">
              <TabsTrigger value="filters" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Filters</TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Analytics</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-y-auto">
              <TabsContent value="filters" className="p-4 m-0 space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Risk Threshold</label>
                  <Select value={riskLevel} onValueChange={(val: any) => setRiskLevel(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Risk Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Show All Levels</SelectItem>
                      <SelectItem value="critical">Critical Risk Only</SelectItem>
                      <SelectItem value="high">High & Critical</SelectItem>
                      <SelectItem value="medium">Medium & Above</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Min Transaction Amount</label>
                  <Input 
                    type="number" 
                    placeholder="e.g. 10000" 
                    value={minAmount} 
                    onChange={e => setMinAmount(e.target.value)} 
                  />
                </div>

                <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Flagged Edges Only</label>
                    <p className="text-xs text-muted-foreground">Hide clean transactions</p>
                  </div>
                  <div 
                    className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${flaggedOnly ? 'bg-destructive' : 'bg-input'}`}
                    onClick={() => setFlaggedOnly(!flaggedOnly)}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${flaggedOnly ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button variant="outline" className="w-full" onClick={() => {
                    setRiskLevel("ALL")
                    setMinAmount("")
                    setFlaggedOnly(false)
                  }}>Reset Filters</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="analytics" className="p-4 m-0 space-y-6">
                <div className="space-y-4">
                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted p-3 border-b border-border flex justify-between items-center">
                      <h3 className="text-sm font-bold">Centrality Analysis</h3>
                      <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => fetchCentrality()} disabled={isLoadingCentrality}>
                        {isLoadingCentrality ? <Loader2 className="w-3 h-3 animate-spin" /> : "Run"}
                      </Button>
                    </div>
                    {centrality && (
                      <div className="p-3 bg-card max-h-48 overflow-y-auto space-y-2">
                        {centrality.slice(0, 5).map((c, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span className="truncate pr-2 font-medium">{c.customerName}</span>
                            <Badge variant={c.riskLevel} className="text-[10px] px-1 h-5">{c.degree}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted p-3 border-b border-border flex justify-between items-center">
                      <h3 className="text-sm font-bold">Cycle Detection</h3>
                      <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => fetchCycles()} disabled={isLoadingCycles}>
                        {isLoadingCycles ? <Loader2 className="w-3 h-3 animate-spin" /> : "Run"}
                      </Button>
                    </div>
                    {cycles && (
                      <div className="p-3 bg-card text-sm">
                        {cycles.length === 0 ? (
                          <p className="text-muted-foreground text-xs">No money laundering cycles detected.</p>
                        ) : (
                          <div className="text-destructive font-medium flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" />
                            {cycles.length} Cycles Detected
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-muted p-3 border-b border-border">
                      <h3 className="text-sm font-bold">Shortest Path</h3>
                    </div>
                    <div className="p-3 space-y-3">
                      <Input placeholder="Source Acc No" className="h-8 text-xs font-mono" value={shortestPathSource} onChange={e => setShortestPathSource(e.target.value)} />
                      <Input placeholder="Target Acc No" className="h-8 text-xs font-mono" value={shortestPathTarget} onChange={e => setShortestPathTarget(e.target.value)} />
                      <Button size="sm" className="w-full h-8" onClick={() => fetchShortestPath()} disabled={!shortestPathSource || !shortestPathTarget || isLoadingPath}>
                        {isLoadingPath ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : "Compute Path"}
                      </Button>
                      
                      {shortestPath && shortestPath.found && (
                        <div className="mt-3 p-2 bg-success/10 border border-success/20 rounded text-xs font-mono text-success-foreground break-all">
                          {shortestPath.path.join(" → ")}
                        </div>
                      )}
                      {shortestPath && !shortestPath.found && (
                        <div className="mt-3 p-2 bg-muted rounded text-xs text-center text-muted-foreground">
                          No path found between accounts.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
    </div>
  )
}
