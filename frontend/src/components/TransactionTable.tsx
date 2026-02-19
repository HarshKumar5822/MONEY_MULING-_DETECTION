// src/components/TransactionTable.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react';
import { Transaction } from '@/services/api';

interface Props {
  transactions: Transaction[];
  suspiciousIds: Set<string>;
  onAccountClick: (id: string) => void;
}

const PAGE_SIZE = 8;

export function TransactionTable({ transactions, suspiciousIds, onAccountClick }: Props) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const slice = transactions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <motion.div
      className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
    >
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm">Transaction Ledger</h3>
        <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded-md">
          {transactions.length.toLocaleString()} records
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {['Transaction ID', 'Sender', 'Receiver', 'Amount', 'Timestamp', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((tx, i) => {
              const isSenderSusp = suspiciousIds.has(tx.sender_id);
              const isReceiverSusp = suspiciousIds.has(tx.receiver_id);
              const isFlagged = isSenderSusp || isReceiverSusp;
              return (
                <motion.tr
                  key={tx.transaction_id}
                  className={`border-b border-border/50 transition-colors ${isFlagged ? 'bg-suspicious-dim/30 hover:bg-suspicious-dim/50' : 'hover:bg-muted/30'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted-foreground">{tx.transaction_id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onAccountClick(tx.sender_id)}
                      className={`flex items-center gap-1 font-mono text-xs font-medium rounded px-1.5 py-0.5 transition-colors ${
                        isSenderSusp
                          ? 'text-suspicious bg-suspicious-dim hover:bg-suspicious hover:text-primary-foreground'
                          : 'text-foreground hover:text-primary'
                      }`}
                    >
                      {tx.sender_id}
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onAccountClick(tx.receiver_id)}
                      className={`flex items-center gap-1 font-mono text-xs font-medium rounded px-1.5 py-0.5 transition-colors ${
                        isReceiverSusp
                          ? 'text-suspicious bg-suspicious-dim hover:bg-suspicious hover:text-primary-foreground'
                          : 'text-foreground hover:text-primary'
                      }`}
                    >
                      {tx.receiver_id}
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-foreground">
                      {Number(tx.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground font-mono">{tx.timestamp}</span>
                  </td>
                  <td className="px-4 py-3">
                    {isFlagged ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-suspicious bg-suspicious-dim px-2 py-0.5 rounded-full border border-suspicious/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-suspicious animate-pulse" />
                        Flagged
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-safe bg-safe-dim px-2 py-0.5 rounded-full border border-safe/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-safe" />
                        Clear
                      </span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
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
