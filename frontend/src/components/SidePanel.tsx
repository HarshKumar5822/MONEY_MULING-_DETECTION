// src/components/SidePanel.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Clock, TrendingUp, Shield, ExternalLink } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { SuspiciousAccount, FraudRing, Transaction } from '@/services/api';

interface Props {
  accountId: string | null;
  suspiciousAccounts: SuspiciousAccount[];
  fraudRings: FraudRing[];
  transactions: Transaction[];
  onClose: () => void;
}

const patternLabels: Record<string, { label: string; desc: string }> = {
  cycle_length_3: { label: 'Circular Route ×3', desc: 'Money cycles through 3 accounts to obscure origin' },
  cycle_length_4: { label: 'Circular Route ×4', desc: 'Money cycles through 4 accounts' },
  cycle_length_5: { label: 'Circular Route ×5', desc: 'Complex 5-hop money laundering loop' },
  circular_routing: { label: 'Circular Routing', desc: 'Funds returned to originating account' },
  high_velocity: { label: 'High Velocity', desc: 'Abnormally high transaction frequency' },
  fan_out_dispersion: { label: 'Fan-Out', desc: 'Rapid dispersion to many accounts (smurfing)' },
  fan_in_aggregation: { label: 'Fan-In', desc: 'Aggregation from many sources (structuring)' },
  smurfing: { label: 'Smurfing', desc: 'Breaking large amounts into smaller transactions' },
  shell_account: { label: 'Shell Account', desc: 'Minimal activity, used as pass-through' },
  low_transaction_count: { label: 'Low Activity', desc: 'Suspiciously few transactions' },
  layered_network: { label: 'Layered Network', desc: 'Multi-hop shell account chain' },
};

export function SidePanel({ accountId, suspiciousAccounts, fraudRings, transactions, onClose }: Props) {
  const account = suspiciousAccounts.find(a => a.account_id === accountId);
  const ring = account ? fraudRings.find(r => r.ring_id === account.ring_id) : null;

  const accountTxns = transactions.filter(
    t => t.sender_id === accountId || t.receiver_id === accountId
  ).slice(0, 10);

  const scoreColor = account
    ? account.suspicion_score >= 85
      ? '#EF4444'
      : account.suspicion_score >= 65
      ? '#F59E0B'
      : '#10B981'
    : '#10B981';

  return (
    <AnimatePresence>
      {accountId && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-foreground/10 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.aside
            className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-card border-l border-border shadow-lg z-50 flex flex-col overflow-hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
              <div className="flex items-center gap-2.5">
                {account ? (
                  <AlertTriangle className="w-4.5 h-4.5 text-suspicious" />
                ) : (
                  <CheckCircle className="w-4.5 h-4.5 text-safe" />
                )}
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Account Details</p>
                  <p className="font-mono font-bold text-sm text-foreground">{accountId}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {account ? (
                <>
                  {/* Suspicion Score */}
                  <div className="flex items-center gap-6 p-4 rounded-xl border border-suspicious/20 bg-suspicious-dim/40">
                    <div className="w-20 h-20 flex-shrink-0">
                      <CircularProgressbar
                        value={account.suspicion_score}
                        text={`${account.suspicion_score.toFixed(0)}%`}
                        styles={buildStyles({
                          textSize: '22px',
                          textColor: scoreColor,
                          pathColor: scoreColor,
                          trailColor: 'hsl(var(--muted))',
                          pathTransitionDuration: 1,
                        })}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Suspicion Score</p>
                      <p className="text-2xl font-bold text-suspicious">{account.suspicion_score.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {account.suspicion_score >= 85 ? '🔴 Critical Risk' : account.suspicion_score >= 65 ? '🟡 High Risk' : '🟢 Medium Risk'}
                      </p>
                    </div>
                  </div>

                  {/* Ring Info */}
                  {ring && (
                    <div className="p-4 rounded-xl border border-primary/20 bg-primary-dim/40">
                      <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">Fraud Ring</p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono font-bold text-primary">{ring.ring_id}</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20 font-medium">
                          {ring.pattern_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" />
                          {ring.member_accounts.length} members
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Risk: {ring.risk_score.toFixed(1)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {ring.member_accounts.map(acc => (
                          <span
                            key={acc}
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              acc === accountId
                                ? 'bg-primary text-primary-foreground font-semibold'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {acc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Detected Patterns */}
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider">Detected Patterns</p>
                    <div className="space-y-2">
                      {account.detected_patterns.map(pattern => {
                        const info = patternLabels[pattern] || { label: pattern, desc: '' };
                        return (
                          <div key={pattern} className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/50 border border-border">
                            <span className="w-1.5 h-1.5 rounded-full bg-suspicious mt-1.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-foreground">{info.label}</p>
                              {info.desc && <p className="text-[11px] text-muted-foreground mt-0.5">{info.desc}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <CheckCircle className="w-10 h-10 text-safe" />
                  <div>
                    <p className="font-semibold text-foreground">Account Not Flagged</p>
                    <p className="text-sm text-muted-foreground mt-1">This account shows no suspicious patterns.</p>
                  </div>
                </div>
              )}

              {/* Transaction Timeline */}
              {accountTxns.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Recent Transactions ({accountTxns.length})
                  </p>
                  <div className="space-y-2">
                    {accountTxns.map(tx => {
                      const isSender = tx.sender_id === accountId;
                      return (
                        <div key={tx.transaction_id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border text-xs">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isSender ? 'bg-suspicious-dim text-suspicious' : 'bg-safe-dim text-safe'}`}>
                            {isSender ? '↑' : '↓'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono font-medium truncate text-foreground">
                              {isSender ? `→ ${tx.receiver_id}` : `← ${tx.sender_id}`}
                            </p>
                            <p className="text-muted-foreground truncate">{tx.timestamp}</p>
                          </div>
                          <span className={`font-mono font-bold flex-shrink-0 ${isSender ? 'text-suspicious' : 'text-safe'}`}>
                            {isSender ? '-' : '+'}
                            {Number(tx.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
