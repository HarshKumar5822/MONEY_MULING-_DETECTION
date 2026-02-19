// src/components/MuleGraph.tsx
import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw, Activity, Info } from 'lucide-react';
import { SuspiciousAccount, FraudRing } from '@/services/api';

interface GraphNode {
  id: string;
  suspicious: boolean;
  suspicion_score?: number;
  ring_id?: string;
  val?: number;
}

interface GraphLink {
  source: string;
  target: string;
  value?: number;
}

interface Props {
  suspiciousAccounts: SuspiciousAccount[];
  fraudRings: FraudRing[];
  transactions: Array<{ sender_id: string; receiver_id: string; amount?: number }>;
  onNodeClick: (accountId: string) => void;
  selectedNode?: string;
}

const RING_COLORS = [
  '#6366F1', // Indigo
  '#F43F5E', // Rose
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#10B981', // Emerald
  '#06B6D4', // Cyan
];

export function MuleGraph({ suspiciousAccounts, fraudRings, transactions, onNodeClick, selectedNode }: Props) {
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 420 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Highlight state
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState<any>(null);

  const suspiciousSet = useMemo(() =>
    new Set(suspiciousAccounts.map(a => a.account_id)),
    [suspiciousAccounts]
  );

  const suspiciousMap = useMemo(() => {
    const m = new Map<string, SuspiciousAccount>();
    suspiciousAccounts.forEach(a => m.set(a.account_id, a));
    return m;
  }, [suspiciousAccounts]);

  const ringColorMap = useMemo(() => {
    const m = new Map<string, string>();
    fraudRings.forEach((r, i) => {
      m.set(r.ring_id, RING_COLORS[i % RING_COLORS.length]);
    });
    return m;
  }, [fraudRings]);

  const graphData = useMemo(() => {
    const nodeIds = new Set<string>();
    transactions.forEach(t => {
      nodeIds.add(t.sender_id);
      nodeIds.add(t.receiver_id);
    });

    const nodes: GraphNode[] = [...nodeIds].map(id => ({
      id,
      suspicious: suspiciousSet.has(id),
      suspicion_score: suspiciousMap.get(id)?.suspicion_score,
      ring_id: suspiciousMap.get(id)?.ring_id,
      val: suspiciousSet.has(id) ? 3 : 1.5
    }));

    // Group links to handle multi-transactions between same nodes
    const links: GraphLink[] = transactions.slice(0, 500).map(t => ({
      source: t.sender_id,
      target: t.receiver_id,
      value: t.amount || 100
    }));

    return { nodes, links };
  }, [transactions, suspiciousSet, suspiciousMap]);

  // Handle Hover for highlighting
  const updateHighlight = () => {
    setHighlightNodes(new Set(highlightNodes));
    setHighlightLinks(new Set(highlightLinks));
  };

  const handleNodeHover = (node: any) => {
    highlightNodes.clear();
    highlightLinks.clear();
    setHoverNode(node);

    if (node) {
      highlightNodes.add(node);
      graphData.links.forEach((link: any) => {
        if (link.source.id === node.id || link.target.id === node.id) {
          highlightLinks.add(link);
          highlightNodes.add(link.source);
          highlightNodes.add(link.target);
        }
      });
    }

    updateHighlight();
  };

  const handleLinkHover = (link: any) => {
    highlightNodes.clear();
    highlightLinks.clear();

    if (link) {
      highlightLinks.add(link);
      highlightNodes.add(link.source);
      highlightNodes.add(link.target);
    }

    updateHighlight();
  };

  // Responsive sizing
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: 480,
        });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const drawNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      if (!isFinite(node.x) || !isFinite(node.y)) return;

      const isSuspicious = node.suspicious;
      const isSelected = node.id === selectedNode;
      const isHighlighted = highlightNodes.has(node);
      const isDimmed = highlightNodes.size > 0 && !isHighlighted;

      const ringColor = node.ring_id ? (ringColorMap.get(node.ring_id) || '#6366F1') : '#F43F5E';
      const radius = isSuspicious ? (isSelected ? 9 : 6.5) : (isSelected ? 6.5 : 4);
      const alpha = isDimmed ? 0.15 : 1;

      // Draw shadow/outer glow
      if (isSuspicious && !isDimmed) {
        ctx.shadowBlur = 15 / globalScale;
        ctx.shadowColor = ringColor;
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);

      if (isSuspicious) {
        ctx.fillStyle = isSelected ? '#ffffff' : ringColor;
        ctx.fill();
        ctx.strokeStyle = isSelected ? ringColor : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2 / globalScale;
        ctx.stroke();
      } else {
        ctx.fillStyle = isSelected ? '#3B82F6' : (isDimmed ? 'rgba(148, 163, 184, 0.2)' : '#94A3B8');
        ctx.fill();
        if (isSelected) {
          ctx.strokeStyle = '#2563EB';
          ctx.lineWidth = 1.5 / globalScale;
          ctx.stroke();
        }
      }

      ctx.shadowBlur = 0; // reset shadow

      // Label
      if ((isSuspicious || isSelected || isHighlighted) && globalScale > 1.2) {
        const label = node.id.length > 12 ? `...${node.id.slice(-6)}` : node.id;
        const fontSize = 11 / globalScale;
        ctx.font = `${isHighlighted ? 'bold' : 'normal'} ${fontSize}px "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = isDimmed ? 'rgba(0,0,0,0)' : (isSuspicious ? ringColor : '#1E293B');
        ctx.fillText(label, node.x, node.y + radius + 4);
      }
    },
    [selectedNode, ringColorMap, highlightNodes]
  );

  const handleNodeClick = useCallback((node: any) => {
    // Zoom to node
    fgRef.current?.centerAt(node.x, node.y, 800);
    fgRef.current?.zoom(2.5, 800);
    onNodeClick(node.id);
  }, [onNodeClick]);

  return (
    <div className="relative rounded-2xl border border-border bg-graph-bg shadow-inner overflow-hidden group">
      {/* Enhanced Tooltip Overlay */}
      <AnimatePresence>
        {hoverNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-4 left-4 z-20 pointer-events-none bg-card/95 backdrop-blur-md border border-border rounded-xl p-3 shadow-xl min-w-[180px]"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${hoverNode.suspicious ? 'bg-rose-500 animate-pulse' : 'bg-slate-400'}`} />
              <span className="text-xs font-mono font-bold truncate max-w-[120px]">{hoverNode.id}</span>
            </div>
            {hoverNode.suspicious && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                  <span>Risk Score</span>
                  <span className="text-rose-500">{hoverNode.suspicion_score}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${hoverNode.suspicion_score}%` }}
                    className="h-full bg-rose-500"
                  />
                </div>
              </div>
            )}
            {!hoverNode.suspicious && (
              <div className="text-[10px] text-muted-foreground italic">Clean Transaction History</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Header Info */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border shadow-sm flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
          <Activity className="w-3 h-3 text-primary" />
          Live Network
        </div>
        <div className="w-px h-3 bg-border" />
        <div className="text-[11px] font-medium text-foreground">
          {graphData.nodes.length} Accounts • {graphData.links.length} Transmissions
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="flex flex-col gap-1 p-1 bg-card/90 backdrop-blur-sm border border-border rounded-xl shadow-lg">
          {[
            { icon: ZoomIn, action: () => fgRef.current?.zoom(fgRef.current.zoom() * 1.5, 400), tip: 'Zoom in' },
            { icon: ZoomOut, action: () => fgRef.current?.zoom(fgRef.current.zoom() * 0.7, 400), tip: 'Zoom out' },
            { icon: Maximize2, action: () => fgRef.current?.zoomToFit(600, 50), tip: 'Recenter' },
            { icon: RefreshCw, action: () => fgRef.current?.d3ReheatSimulation(), tip: 'Reheat Physics' },
          ].map(({ icon: Icon, action, tip }) => (
            <button
              key={tip}
              onClick={action}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-all active:scale-95"
              title={tip}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Legend Mini */}
      <div className="absolute bottom-4 right-4 z-10 p-3 bg-card/90 backdrop-blur-sm border border-border rounded-xl shadow-lg hidden sm:block">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
            RISK NODE
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            NEUTRAL
          </div>
        </div>
      </div>

      <div ref={containerRef} className="w-full bg-slate-50/30">
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          nodeCanvasObject={drawNode}
          nodeCanvasObjectMode={() => 'replace'}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onLinkHover={handleLinkHover}

          // Link Visuals
          linkColor={(link: any) => highlightLinks.has(link) ? '#4F46E5' : 'rgba(148, 163, 184, 0.15)'}
          linkWidth={(link: any) => highlightLinks.has(link) ? 3 : 1}
          linkCurvature={0.25}

          // Directional Particles
          linkDirectionalParticles={(link: any) => highlightLinks.has(link) || highlightNodes.size === 0 ? 3 : 0}
          linkDirectionalParticleWidth={(link: any) => highlightLinks.has(link) ? 3 : 1.5}
          linkDirectionalParticleSpeed={(link: any) => highlightLinks.has(link) ? 0.015 : 0.006}
          linkDirectionalParticleColor={(link: any) => highlightLinks.has(link) ? '#818CF8' : '#3B82F6'}

          // Physics
          d3AlphaDecay={0.01}
          d3VelocityDecay={0.2}
          cooldownTime={4000}
        />
      </div>

      {graphData.nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/50 backdrop-blur-sm">
          <Info className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-sm font-medium">No active network data loaded</p>
        </div>
      )}
    </div>
  );
}
