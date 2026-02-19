// src/components/StatCards.tsx
import { motion } from 'framer-motion';
import { Users, AlertTriangle, GitBranch, Clock, TrendingUp } from 'lucide-react';
import { AnalysisSummary } from '@/services/api';

interface Props {
  summary: AnalysisSummary;
  isMockMode: boolean;
}

const cardConfig = [
  {
    key: 'total_accounts_analyzed' as keyof AnalysisSummary,
    label: 'Accounts Analyzed',
    icon: Users,
    color: 'text-primary',
    bg: 'bg-primary-dim',
    border: 'border-primary/20',
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: 'suspicious_accounts_flagged' as keyof AnalysisSummary,
    label: 'Suspicious Accounts',
    icon: AlertTriangle,
    color: 'text-suspicious',
    bg: 'bg-suspicious-dim',
    border: 'border-suspicious/20',
    format: (v: number) => v.toString(),
  },
  {
    key: 'fraud_rings_detected' as keyof AnalysisSummary,
    label: 'Fraud Rings Found',
    icon: GitBranch,
    color: 'text-warning',
    bg: 'bg-warning-dim',
    border: 'border-warning/20',
    format: (v: number) => v.toString(),
  },
  {
    key: 'processing_time_seconds' as keyof AnalysisSummary,
    label: 'Processing Time',
    icon: Clock,
    color: 'text-safe',
    bg: 'bg-safe-dim',
    border: 'border-safe/20',
    format: (v: number) => `${v}s`,
  },
];

export function StatCards({ summary, isMockMode }: Props) {
  const suspicionRate = summary.total_accounts_analyzed > 0
    ? ((summary.suspicious_accounts_flagged / summary.total_accounts_analyzed) * 100).toFixed(1)
    : '0';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cardConfig.map((cfg, i) => {
        const Icon = cfg.icon;
        const value = summary[cfg.key] as number;
        return (
          <motion.div
            key={cfg.key}
            className={`relative rounded-xl border ${cfg.border} ${cfg.bg} p-5 overflow-hidden`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4, ease: 'easeOut' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  {cfg.label}
                </p>
                <p className={`text-3xl font-bold ${cfg.color} font-mono`}>
                  {cfg.format(value)}
                </p>
              </div>
              <div className={`p-2.5 rounded-xl ${cfg.bg} border ${cfg.border}`}>
                <Icon className={`w-5 h-5 ${cfg.color}`} />
              </div>
            </div>
            {cfg.key === 'suspicious_accounts_flagged' && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5 text-suspicious" />
                <span>{suspicionRate}% flag rate</span>
              </div>
            )}
            {isMockMode && (
              <span className="absolute top-2 right-2 text-[9px] font-mono bg-warning/10 text-warning px-1.5 py-0.5 rounded-full border border-warning/20">
                MOCK
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
