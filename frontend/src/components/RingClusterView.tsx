// src/components/RingClusterView.tsx
import { motion } from 'framer-motion';
import { GitBranch, AlertTriangle, Users } from 'lucide-react';
import { FraudRing, SuspiciousAccount } from '@/services/api';

interface Props {
  fraudRings: FraudRing[];
  suspiciousAccounts: SuspiciousAccount[];
  onAccountClick: (id: string) => void;
}

const RING_COLORS = [
  { bg: 'bg-suspicious-dim', border: 'border-suspicious/30', text: 'text-suspicious', dot: '#EF4444', label: 'bg-suspicious text-primary-foreground' },
  { bg: 'bg-primary-dim', border: 'border-primary/30', text: 'text-primary', dot: '#3B82F6', label: 'bg-primary text-primary-foreground' },
  { bg: 'bg-warning-dim', border: 'border-warning/30', text: 'text-warning', dot: '#F59E0B', label: 'bg-warning text-primary-foreground' },
  { bg: 'bg-safe-dim', border: 'border-safe/30', text: 'text-safe', dot: '#10B981', label: 'bg-safe text-primary-foreground' },
];

function MiniRingGraph({ ring, suspMap, color, onNodeClick }: {
  ring: FraudRing;
  suspMap: Map<string, SuspiciousAccount>;
  color: typeof RING_COLORS[0];
  onNodeClick: (id: string) => void;
}) {
  const members = ring.member_accounts.slice(0, 8);
  const cx = 80, cy = 80, r = 55;

  return (
    <svg viewBox="0 0 160 160" className="w-full h-full">
      {/* Ring connections */}
      {members.map((acc, i) => {
        const next = members[(i + 1) % members.length];
        const a1 = (i / members.length) * 2 * Math.PI - Math.PI / 2;
        const a2 = ((i + 1) / members.length) * 2 * Math.PI - Math.PI / 2;
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
        const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
        return (
          <line key={`${acc}-${next}`} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={color.dot} strokeWidth="1" strokeOpacity="0.4" />
        );
      })}

      {/* Nodes */}
      {members.map((acc, i) => {
        const angle = (i / members.length) * 2 * Math.PI - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        const isSusp = suspMap.has(acc);
        return (
          <g key={acc} className="cursor-pointer" onClick={() => onNodeClick(acc)}>
            {isSusp && (
              <circle cx={x} cy={y} r="10" fill={color.dot} fillOpacity="0.2">
                <animate attributeName="r" values="8;14;8" dur="2s" repeatCount="indefinite" />
                <animate attributeName="fill-opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={x} cy={y} r={isSusp ? 7 : 5}
              fill={isSusp ? color.dot : '#BFDBFE'}
              stroke={isSusp ? color.dot : '#93C5FD'}
              strokeWidth="1.5"
            />
          </g>
        );
      })}

      {/* Center label */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="9" fill={color.dot} fontWeight="700" fontFamily="JetBrains Mono, monospace">
        {ring.ring_id}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="7" fill="#64748b" fontFamily="Inter, sans-serif">
        {ring.member_accounts.length} members
      </text>
    </svg>
  );
}

export function RingClusterView({ fraudRings, suspiciousAccounts, onAccountClick }: Props) {
  const suspMap = new Map(suspiciousAccounts.map(a => [a.account_id, a]));

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-4">
        <GitBranch className="w-4.5 h-4.5 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Fraud Ring Cluster View</h3>
        <span className="text-xs bg-primary-dim text-primary px-2 py-0.5 rounded-full border border-primary/20 font-mono">
          {fraudRings.length} rings
        </span>
        <span className="text-xs text-muted-foreground ml-auto">Click nodes to inspect</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {fraudRings.map((ring, i) => {
          const color = RING_COLORS[i % RING_COLORS.length];
          const riskScore = ring.risk_score;
          return (
            <motion.div
              key={ring.ring_id}
              className={`rounded-xl border ${color.border} ${color.bg} p-4 flex flex-col gap-3`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, duration: 0.35 }}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${color.label}`}>
                  {ring.ring_id}
                </span>
                <div className={`flex items-center gap-1 text-xs font-mono font-semibold ${color.text}`}>
                  <AlertTriangle className="w-3 h-3" />
                  {riskScore.toFixed(0)}
                </div>
              </div>

              <div className="w-full aspect-square max-h-36">
                <MiniRingGraph
                  ring={ring}
                  suspMap={suspMap}
                  color={color}
                  onNodeClick={onAccountClick}
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>{ring.member_accounts.length} accounts</span>
                </div>
                <p className={`text-xs font-medium ${color.text} truncate`}>
                  {ring.pattern_type.replace(/_/g, ' ')}
                </p>
                {/* Risk bar */}
                <div className="h-1 bg-muted rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${riskScore}%`, backgroundColor: color.dot }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
