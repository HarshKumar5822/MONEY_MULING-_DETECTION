// src/components/MuleGraph.tsx
import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, RefreshCw } from 'lucide-react';
import { SuspiciousAccount, FraudRing } from '@/services/api';

interface GraphNode {
  id: string;
  suspicious: boolean;
  suspicion_score?: number;
  ring_id?: string;
}

interface GraphLink {
  source: string;
  target: string;
}

interface Props {
  suspiciousAccounts: SuspiciousAccount[];
  fraudRings: FraudRing[];
  transactions: Array<{ sender_id: string; receiver_id: string }>;
  onNodeClick: (accountId: string) => void;
  selectedNode?: string;
}

const RING_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#10B981', // emerald
  '#EC4899', // pink
];

export function MuleGraph({ suspiciousAccounts, fraudRings, transactions, onNodeClick, selectedNode }: Props) {
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 420 });
  const containerRef = useRef<HTMLDivElement>(null);

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
    }));

    const links: GraphLink[] = transactions.slice(0, 200).map(t => ({
      source: t.sender_id,
      target: t.receiver_id,
    }));

    return { nodes, links };
  }, [transactions, suspiciousSet, suspiciousMap]);

  // Responsive sizing
  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: Math.max(380, Math.min(520, entry.contentRect.width * 0.6)),
        });
      }
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const drawNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      // Guard: skip nodes without finite coordinates (early simulation ticks)
      if (!isFinite(node.x) || !isFinite(node.y)) return;
      const isSuspicious = node.suspicious;
      const isSelected = node.id === selectedNode;
      const ringColor = node.ring_id ? (ringColorMap.get(node.ring_id) || '#EF4444') : '#EF4444';
      const radius = isSuspicious ? (isSelected ? 10 : 7) : (isSelected ? 7 : 4.5);

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);

      if (isSuspicious) {
        // Glow effect
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius * 2.5);
        gradient.addColorStop(0, `${ringColor}99`);
        gradient.addColorStop(1, `${ringColor}00`);
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 2.5, 0, 2 * Math.PI);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Main node
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = ringColor;
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#ffffff' : `${ringColor}cc`;
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.stroke();
      } else {
        ctx.fillStyle = isSelected ? '#3B82F6' : '#BFDBFE';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#1D4ED8' : '#93C5FD';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Label for suspicious / selected
      if ((isSuspicious || isSelected) && globalScale > 0.8) {
        const label = node.id.length > 10 ? node.id.slice(-6) : node.id;
        const fontSize = Math.max(8, 10 / globalScale);
        ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = isSuspicious ? ringColor : '#1D4ED8';
        ctx.fillText(label, node.x, node.y + radius + 2);
      }
    },
    [selectedNode, ringColorMap]
  );

  const handleNodeClick = useCallback((node: any) => {
    onNodeClick(node.id);
  }, [onNodeClick]);

  return (
    <div className="relative rounded-xl border border-border bg-graph-bg overflow-hidden">
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        {[
          { icon: ZoomIn, action: () => fgRef.current?.zoom(1.4, 300), tip: 'Zoom in' },
          { icon: ZoomOut, action: () => fgRef.current?.zoom(0.7, 300), tip: 'Zoom out' },
          { icon: Maximize2, action: () => fgRef.current?.zoomToFit(400, 40), tip: 'Fit view' },
          { icon: RefreshCw, action: () => fgRef.current?.d3ReheatSimulation(), tip: 'Reheat' },
        ].map(({ icon: Icon, action, tip }) => (
          <button
            key={tip}
            onClick={action}
            title={tip}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-card border border-border shadow-sm text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-xl p-3 shadow-sm">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Legend</p>
        <div className="flex items-center gap-2 text-xs text-foreground">
          <span className="w-3 h-3 rounded-full bg-[#BFDBFE] border border-[#93C5FD] flex-shrink-0" />
          Normal Account
        </div>
        <div className="flex items-center gap-2 text-xs text-foreground">
          <span className="w-3 h-3 rounded-full bg-suspicious flex-shrink-0 animate-pulse" />
          Suspicious
        </div>
        {fraudRings.slice(0, 3).map((ring, i) => (
          <div key={ring.ring_id} className="flex items-center gap-2 text-xs text-foreground">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: RING_COLORS[i % RING_COLORS.length] }} />
            {ring.ring_id}
          </div>
        ))}
      </div>

      <div ref={containerRef} className="w-full">
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="hsl(220, 30%, 98%)"
          nodeCanvasObject={drawNode}
          nodeCanvasObjectMode={() => 'replace'}
          onNodeClick={handleNodeClick}
          linkColor={() => 'rgba(148, 163, 184, 0.4)'}
          linkWidth={1}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={0.85}
          linkDirectionalArrowColor={() => 'rgba(148, 163, 184, 0.6)'}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleColor={() => '#3B82F6'}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          cooldownTime={3000}
          nodeRelSize={1}
        />
      </div>

      {graphData.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No graph data available</p>
        </div>
      )}
    </div>
  );
}
