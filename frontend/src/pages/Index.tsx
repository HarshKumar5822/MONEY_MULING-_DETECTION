import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Shield, Download, WifiOff, RotateCcw, Network, TableIcon, GitBranch, Eye } from 'lucide-react';
import { useMuleContext } from '@/context/MuleContext';
import { UploadZone } from '@/components/UploadZone';
import { ScannerOverlay } from '@/components/ScannerOverlay';
import { StatCards } from '@/components/StatCards';
import { MuleGraph } from '@/components/MuleGraph';
import { FraudTable } from '@/components/FraudTable';
import { TransactionTable } from '@/components/TransactionTable';
import { SidePanel } from '@/components/SidePanel';
import { RingClusterView } from '@/components/RingClusterView';
import { FraudRing } from '@/services/api';

type Tab = 'graph' | 'clusters' | 'rings' | 'transactions';

const TABS: { id: Tab; label: string; icon: typeof Network }[] = [
  { id: 'graph', label: 'Network Graph', icon: Network },
  { id: 'clusters', label: 'Ring Clusters', icon: GitBranch },
  { id: 'rings', label: 'Fraud Rings', icon: Eye },
  { id: 'transactions', label: 'Transactions', icon: TableIcon },
];

import { DecorativeBackground } from '@/components/DecorativeBackground';

export default function Index() {
  const { state, result, transactions, error, isMockMode, fileName, analyze, loadMockData, reset, downloadJSON } = useMuleContext();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('graph');

  const suspiciousIds = new Set(result?.suspicious_accounts.map(a => a.account_id) || []);

  const handleNodeClick = (id: string) => setSelectedAccount(id);
  const handleRingClick = (ring: FraudRing) => {
    if (ring.member_accounts.length > 0) setSelectedAccount(ring.member_accounts[0]);
  };

  return (
    <div className="w-full relative min-h-screen">
      <DecorativeBackground />

      {/* ── ACTION BAR (Contextual) ─────────────────────────────────────── */}
      {state === 'results' && (
        <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border px-4 sm:px-6 py-2 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
            <span className="text-sm font-semibold text-foreground">Analysis Complete</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadJSON}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 shadow-blue transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">JSON</span>
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Scan</span>
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative">
        <AnimatePresence mode="wait">

          {/* ── IDLE: Upload ── */}
          {state === 'idle' && (
            <motion.div
              key="idle"
              className="relative"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <div className="max-w-xl mx-auto pt-8">
                {/* Hero */}
                <div className="relative z-10 text-center mb-10">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-2 bg-primary-dim text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/20 mb-5"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    RIFT 2026 · Graph Theory / Financial Crime Track
                  </motion.div>
                  <h1 className="text-4xl sm:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1] mb-6">
                    Detect Money<br />
                    <span className="text-primary relative inline-block">
                      Muling Networks
                      <motion.div
                        animate={{ width: ['0%', '100%', '0%'] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute -bottom-1 left-0 h-1 bg-primary/30 rounded-full"
                      />
                    </span>
                  </h1>
                  <p className="mt-4 text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
                    Upload a transaction CSV and our graph engine will detect fraud rings, circular routing, smurfing, and shell accounts in seconds.
                  </p>
                </div>

                <div className="relative z-10 bg-background/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-2xl">
                  <UploadZone onFile={analyze} onMock={loadMockData} />
                </div>

                {/* Feature grid */}
                <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                  {[
                    { icon: '🔄', label: 'Cycle Detection', desc: 'Find 3–5 hop money loops', color: 'bg-blue-500/10' },
                    { icon: '🐟', label: 'Smurfing', desc: 'Fan-in / fan-out patterns', color: 'bg-indigo-500/10' },
                    { icon: '🐚', label: 'Shell Accounts', desc: 'Layered pass-through nets', color: 'bg-emerald-500/10' },
                  ].map((f, i) => (
                    <motion.div
                      key={f.label}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.4 + i * 0.1,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{
                        scale: 1.05,
                        rotateY: 5,
                        rotateX: -5,
                        boxShadow: "0 20px 40px rgba(0,0,0,0.12)"
                      }}
                      className={`p-4 rounded-2xl border border-border bg-card/50 backdrop-blur-sm transition-all hover:bg-card hover:shadow-lg ${f.color} perspective-1000`}
                    >
                      <div className="text-2xl mb-2">{f.icon}</div>
                      <p className="text-sm font-bold text-foreground">{f.label}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-snug">{f.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}

          {/* ── SCANNING ── */}
          {state === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative z-10"
            >
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
              <ScannerOverlay fileName={fileName} />
            </motion.div>
          )}

          {/* ── ERROR ── */}
          {state === 'error' && (
            <motion.div
              key="error"
              className="max-w-md mx-auto pt-16 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-suspicious-dim border border-suspicious/30 flex items-center justify-center mx-auto mb-4">
                <WifiOff className="w-7 h-7 text-suspicious" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Analysis Failed</h3>
              <p className="text-sm text-muted-foreground mt-2 mb-6">{error}</p>
              <button
                onClick={reset}
                className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-blue hover:opacity-90 transition-opacity"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
            </motion.div>
          )}

          {/* ── RESULTS ── */}
          {state === 'results' && result && (
            <motion.div
              key="results"
              className="space-y-6 relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {/* Sidebar decorative accents */}
              <div className="hidden 2xl:block absolute -left-48 top-0 bottom-0 w-32 pointer-events-none">
                <div className="h-full border-l border-primary/10 flex flex-col justify-around py-20">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="w-4 h-[1px] bg-primary/20" />
                  ))}
                </div>
              </div>
              <div className="hidden 2xl:block absolute -right-48 top-0 bottom-0 w-32 pointer-events-none">
                <div className="h-full border-r border-suspicious/10 flex flex-col justify-around py-20 items-end">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="w-4 h-[1px] bg-suspicious/20" />
                  ))}
                </div>
              </div>

              {/* Summary cards */}
              <StatCards summary={result.summary} isMockMode={isMockMode} />

              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.id
                        ? 'bg-card text-foreground shadow-sm border border-border'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                {activeTab === 'graph' && (
                  <motion.div key="graph" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <MuleGraph
                      suspiciousAccounts={result.suspicious_accounts}
                      fraudRings={result.fraud_rings}
                      transactions={transactions}
                      onNodeClick={handleNodeClick}
                      selectedNode={selectedAccount || undefined}
                    />
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      Click any node to inspect • Scroll to zoom • Drag to pan • Red nodes = suspicious accounts
                    </p>
                  </motion.div>
                )}

                {activeTab === 'clusters' && (
                  <motion.div key="clusters" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <RingClusterView
                      fraudRings={result.fraud_rings}
                      suspiciousAccounts={result.suspicious_accounts}
                      onAccountClick={handleNodeClick}
                    />
                  </motion.div>
                )}

                {activeTab === 'rings' && (
                  <motion.div key="rings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <FraudTable fraudRings={result.fraud_rings} onRingClick={handleRingClick} />
                  </motion.div>
                )}

                {activeTab === 'transactions' && (
                  <motion.div key="transactions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {transactions.length > 0 ? (
                      <TransactionTable
                        transactions={transactions}
                        suspiciousIds={suspiciousIds}
                        onAccountClick={handleNodeClick}
                      />
                    ) : (
                      <div className="rounded-xl border border-border bg-muted/30 py-16 text-center">
                        <p className="text-muted-foreground text-sm">No transaction records loaded</p>
                        <p className="text-xs text-muted-foreground mt-1">Upload a real CSV to see transaction data here</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Suspicious accounts quick list */}
              {result.suspicious_accounts.length > 0 && (
                <motion.div
                  className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="px-5 py-4 border-b border-border flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-suspicious animate-pulse" />
                    <h3 className="font-semibold text-foreground text-sm">Suspicious Accounts — Sorted by Risk</h3>
                  </div>
                  <div className="p-4 flex flex-wrap gap-2">
                    {result.suspicious_accounts.map(acc => (
                      <motion.button
                        key={acc.account_id}
                        onClick={() => handleNodeClick(acc.account_id)}
                        className={`group flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-mono font-medium ${selectedAccount === acc.account_id
                          ? 'bg-suspicious text-primary-foreground border-suspicious shadow-red'
                          : 'bg-suspicious-dim text-suspicious border-suspicious/30 hover:bg-suspicious hover:text-primary-foreground hover:shadow-red'
                          }`}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                        {acc.account_id}
                        <span className="font-bold opacity-80">{acc.suspicion_score.toFixed(0)}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── SIDE PANEL ─────────────────────────────────────────────────── */}
      <SidePanel
        accountId={selectedAccount}
        suspiciousAccounts={result?.suspicious_accounts || []}
        fraudRings={result?.fraud_rings || []}
        transactions={transactions}
        onClose={() => setSelectedAccount(null)}
      />
    </div>
  );
}
