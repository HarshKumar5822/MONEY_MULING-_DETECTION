// src/components/FraudTable.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, AlertCircle, Users, TrendingUp } from 'lucide-react';
import { FraudRing } from '@/services/api';

interface Props {
  fraudRings: FraudRing[];
  onRingClick: (ring: FraudRing) => void;
}

const PAGE_SIZE = 5;

const patternBadge: Record<string, { label: string; cls: string }> = {
  cycle_length_3: { label: 'Cycle ×3', cls: 'bg-suspicious-dim text-suspicious border-suspicious/30' },
  cycle_length_4: { label: 'Cycle ×4', cls: 'bg-suspicious-dim text-suspicious border-suspicious/30' },
  cycle_length_5: { label: 'Cycle ×5', cls: 'bg-suspicious-dim text-suspicious border-suspicious/30' },
  fan_in: { label: 'Fan-In', cls: 'bg-warning-dim text-warning border-warning/30' },
  fan_out: { label: 'Fan-Out', cls: 'bg-warning-dim text-warning border-warning/30' },
  shell_network: { label: 'Shell Net', cls: 'bg-primary-dim text-primary border-primary/30' },
  shell_network_chain: { label: 'Shell Net', cls: 'bg-primary-dim text-primary border-primary/30' },
  layered_network: { label: 'Layered', cls: 'bg-primary-dim text-primary border-primary/30' },
};

const riskColor = (score: number) => {
  if (score >= 85) return 'text-suspicious';
  if (score >= 70) return 'text-warning';
  return 'text-safe';
};

export function FraudTable({ fraudRings, onRingClick }: Props) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(fraudRings.length / PAGE_SIZE);
  const slice = fraudRings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const badge = (type: string) => {
    const cfg = patternBadge[type] || { label: type, cls: 'bg-muted text-muted-foreground border-border' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.cls}`}>
        {cfg.label}
      </span>
    );
  };

  return (
    <motion.div
      className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-4.5 h-4.5 text-suspicious" />
          <h3 className="font-semibold text-foreground text-sm">Fraud Ring Summary</h3>
          <span className="bg-suspicious-dim text-suspicious text-xs font-mono px-2 py-0.5 rounded-full border border-suspicious/20">
            {fraudRings.length} rings
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {['Ring ID', 'Pattern', 'Members', 'Member Accounts', 'Risk Score'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((ring, i) => (
              <motion.tr
                key={ring.ring_id}
                className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors group"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => onRingClick(ring)}
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-semibold text-primary bg-primary-dim px-2 py-1 rounded-md">
                    {ring.ring_id}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {badge(ring.pattern_type)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-mono font-medium">{ring.member_accounts.length}</span>
                  </div>
                </td>
                <td className="px-4 py-3 max-w-[220px]">
                  <p className="text-xs text-muted-foreground font-mono truncate group-hover:text-foreground transition-colors">
                    {ring.member_accounts.join(', ')}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-[80px] h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${ring.risk_score}%`,
                          backgroundColor: ring.risk_score >= 85 ? 'hsl(var(--suspicious))' : ring.risk_score >= 70 ? 'hsl(var(--warning))' : 'hsl(var(--safe))',
                        }}
                      />
                    </div>
                    <span className={`font-mono font-bold text-sm ${riskColor(ring.risk_score)}`}>
                      {ring.risk_score.toFixed(1)}
                    </span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, fraudRings.length)} of {fraudRings.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-colors border ${i === page
                    ? 'bg-primary text-primary-foreground border-primary shadow-blue'
                    : 'border-border text-muted-foreground hover:text-primary hover:border-primary/40'
                  }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
