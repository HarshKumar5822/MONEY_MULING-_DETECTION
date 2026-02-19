// src/hooks/useMuleAnalysis.ts
import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { analyzeTransactions, AnalysisResult, Transaction } from '@/services/api';

export type AppState = 'idle' | 'scanning' | 'results' | 'error';

// ── Graph Detection Engine (Client-side fallback) ─────────────────────────────

function detectCycles(adj: Map<string, string[]>, nodes: string[]): string[][] {
  const rings: string[][] = [];
  const visited = new Set<string>();

  function dfs(node: string, start: string, path: string[], depth: number) {
    if (depth > 5) return;
    const neighbors = adj.get(node) || [];
    for (const nb of neighbors) {
      if (nb === start && path.length >= 3) {
        rings.push([...path]);
        return;
      }
      if (!path.includes(nb)) {
        dfs(nb, start, [...path, nb], depth + 1);
      }
    }
  }

  for (const node of nodes) {
    if (!visited.has(node)) {
      dfs(node, node, [node], 1);
      visited.add(node);
    }
  }
  return rings;
}

function detectSmurfing(transactions: Transaction[]): { fanIn: string[]; fanOut: string[] } {
  const inCount = new Map<string, number>();
  const outCount = new Map<string, number>();
  const inSenders = new Map<string, Set<string>>();
  const outReceivers = new Map<string, Set<string>>();

  for (const tx of transactions) {
    inCount.set(tx.receiver_id, (inCount.get(tx.receiver_id) || 0) + 1);
    outCount.set(tx.sender_id, (outCount.get(tx.sender_id) || 0) + 1);
    if (!inSenders.has(tx.receiver_id)) inSenders.set(tx.receiver_id, new Set());
    inSenders.get(tx.receiver_id)!.add(tx.sender_id);
    if (!outReceivers.has(tx.sender_id)) outReceivers.set(tx.sender_id, new Set());
    outReceivers.get(tx.sender_id)!.add(tx.receiver_id);
  }

  const fanIn = [...inSenders.entries()]
    .filter(([, s]) => s.size >= 5)
    .map(([id]) => id);
  const fanOut = [...outReceivers.entries()]
    .filter(([, r]) => r.size >= 5)
    .map(([id]) => id);

  return { fanIn, fanOut };
}

function detectShells(adj: Map<string, string[]>, transactions: Transaction[]): string[] {
  const txCount = new Map<string, number>();
  for (const tx of transactions) {
    txCount.set(tx.sender_id, (txCount.get(tx.sender_id) || 0) + 1);
    txCount.set(tx.receiver_id, (txCount.get(tx.receiver_id) || 0) + 1);
  }

  const shells: string[] = [];
  for (const [node, count] of txCount.entries()) {
    if (count >= 2 && count <= 4) {
      const outDeg = (adj.get(node) || []).length;
      if (outDeg === 1) shells.push(node);
    }
  }
  return shells;
}

export function analyzeLocally(transactions: Transaction[]): AnalysisResult {
  const start = Date.now();

  // Build adjacency list
  const adj = new Map<string, string[]>();
  const allNodes = new Set<string>();
  for (const tx of transactions) {
    allNodes.add(tx.sender_id);
    allNodes.add(tx.receiver_id);
    if (!adj.has(tx.sender_id)) adj.set(tx.sender_id, []);
    adj.get(tx.sender_id)!.push(tx.receiver_id);
  }

  const nodes = [...allNodes];
  const cycles = detectCycles(adj, nodes);
  const { fanIn, fanOut } = detectSmurfing(transactions);
  const shells = detectShells(adj, transactions);

  // Build fraud rings from cycles
  const fraudRings: AnalysisResult['fraud_rings'] = [];
  const suspiciousMap = new Map<string, { score: number; patterns: string[]; ringId: string }>();
  const usedRingIds = new Set<string>();

  // Deduplicate cycles
  const seen = new Set<string>();
  const uniqueCycles = cycles.filter(c => {
    const key = [...c].sort().join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  uniqueCycles.slice(0, 20).forEach((cycle, i) => {
    const ringId = `RING_${String(i + 1).padStart(3, '0')}`;
    usedRingIds.add(ringId);
    const riskScore = Math.min(95, 60 + cycle.length * 5 + Math.random() * 15);
    fraudRings.push({
      ring_id: ringId,
      member_accounts: cycle,
      pattern_type: `cycle_length_${cycle.length}`,
      risk_score: parseFloat(riskScore.toFixed(1)),
    });
    cycle.forEach(acc => {
      const existing = suspiciousMap.get(acc);
      const score = Math.min(100, riskScore + 10 + Math.random() * 15);
      if (!existing || existing.score < score) {
        suspiciousMap.set(acc, {
          score: parseFloat(score.toFixed(1)),
          patterns: [`cycle_length_${cycle.length}`, 'circular_routing'],
          ringId,
        });
      }
    });
  });

  // Smurfing rings
  const smurfRingIdx = fraudRings.length;
  [...fanIn, ...fanOut].forEach((acc, i) => {
    const ringId = `RING_${String(smurfRingIdx + i + 1).padStart(3, '0')}`;
    const isFanIn = fanIn.includes(acc);
    const score = parseFloat((65 + Math.random() * 25).toFixed(1));
    if (!suspiciousMap.has(acc)) {
      suspiciousMap.set(acc, {
        score,
        patterns: [isFanIn ? 'fan_in_aggregation' : 'fan_out_dispersion', 'smurfing'],
        ringId,
      });
      if (!usedRingIds.has(ringId)) {
        usedRingIds.add(ringId);
        const neighbors = isFanIn
          ? transactions.filter(t => t.receiver_id === acc).map(t => t.sender_id).slice(0, 8)
          : transactions.filter(t => t.sender_id === acc).map(t => t.receiver_id).slice(0, 8);
        fraudRings.push({
          ring_id: ringId,
          member_accounts: [acc, ...neighbors],
          pattern_type: isFanIn ? 'fan_in' : 'fan_out',
          risk_score: parseFloat((score - 5).toFixed(1)),
        });
      }
    }
  });

  // Shell accounts
  shells.forEach(acc => {
    if (!suspiciousMap.has(acc)) {
      const ringId = `RING_SHELL_${acc.slice(-3)}`;
      suspiciousMap.set(acc, {
        score: parseFloat((45 + Math.random() * 30).toFixed(1)),
        patterns: ['shell_account', 'low_transaction_count'],
        ringId,
      });
    }
  });

  const suspicious_accounts = [...suspiciousMap.entries()]
    .map(([account_id, v]) => ({
      account_id,
      suspicion_score: v.score,
      detected_patterns: v.patterns,
      ring_id: v.ringId,
    }))
    .sort((a, b) => b.suspicion_score - a.suspicion_score);

  const elapsed = (Date.now() - start) / 1000;

  return {
    suspicious_accounts,
    fraud_rings: fraudRings,
    summary: {
      total_accounts_analyzed: allNodes.size,
      suspicious_accounts_flagged: suspicious_accounts.length,
      fraud_rings_detected: fraudRings.length,
      processing_time_seconds: parseFloat(elapsed.toFixed(2)),
    },
  };
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

export const MOCK_RESULT: AnalysisResult = {
  suspicious_accounts: [
    { account_id: 'ACC_00123', suspicion_score: 97.5, detected_patterns: ['cycle_length_3', 'high_velocity', 'circular_routing'], ring_id: 'RING_001' },
    { account_id: 'ACC_00456', suspicion_score: 94.2, detected_patterns: ['cycle_length_4', 'circular_routing'], ring_id: 'RING_001' },
    { account_id: 'ACC_00789', suspicion_score: 91.0, detected_patterns: ['fan_out_dispersion', 'smurfing'], ring_id: 'RING_002' },
    { account_id: 'ACC_01234', suspicion_score: 87.3, detected_patterns: ['fan_in_aggregation', 'smurfing'], ring_id: 'RING_002' },
    { account_id: 'ACC_01567', suspicion_score: 82.1, detected_patterns: ['cycle_length_3', 'circular_routing'], ring_id: 'RING_003' },
    { account_id: 'ACC_01890', suspicion_score: 79.8, detected_patterns: ['shell_account', 'low_transaction_count'], ring_id: 'RING_004' },
    { account_id: 'ACC_02123', suspicion_score: 74.5, detected_patterns: ['cycle_length_5', 'layered_network'], ring_id: 'RING_003' },
    { account_id: 'ACC_02456', suspicion_score: 68.9, detected_patterns: ['fan_out_dispersion'], ring_id: 'RING_002' },
  ],
  fraud_rings: [
    { ring_id: 'RING_001', member_accounts: ['ACC_00123', 'ACC_00456', 'ACC_00321'], pattern_type: 'cycle_length_3', risk_score: 95.3 },
    { ring_id: 'RING_002', member_accounts: ['ACC_00789', 'ACC_01234', 'ACC_02456', 'ACC_03111', 'ACC_03222', 'ACC_03333'], pattern_type: 'fan_out', risk_score: 88.7 },
    { ring_id: 'RING_003', member_accounts: ['ACC_01567', 'ACC_02123', 'ACC_02789', 'ACC_02890', 'ACC_02991'], pattern_type: 'cycle_length_5', risk_score: 81.2 },
    { ring_id: 'RING_004', member_accounts: ['ACC_01890', 'ACC_04001', 'ACC_04002'], pattern_type: 'shell_network', risk_score: 72.4 },
  ],
  summary: {
    total_accounts_analyzed: 500,
    suspicious_accounts_flagged: 8,
    fraud_rings_detected: 4,
    processing_time_seconds: 1.87,
  },
};

export const MOCK_TRANSACTIONS: Transaction[] = [
  { transaction_id: 'TXN_001', sender_id: 'ACC_00123', receiver_id: 'ACC_00456', amount: 9500, timestamp: '2024-01-15 10:23:00' },
  { transaction_id: 'TXN_002', sender_id: 'ACC_00456', receiver_id: 'ACC_00321', amount: 9200, timestamp: '2024-01-15 11:45:00' },
  { transaction_id: 'TXN_003', sender_id: 'ACC_00321', receiver_id: 'ACC_00123', amount: 8900, timestamp: '2024-01-15 14:10:00' },
  { transaction_id: 'TXN_004', sender_id: 'ACC_00789', receiver_id: 'ACC_03111', amount: 2000, timestamp: '2024-01-16 09:00:00' },
  { transaction_id: 'TXN_005', sender_id: 'ACC_00789', receiver_id: 'ACC_03222', amount: 1800, timestamp: '2024-01-16 09:05:00' },
  { transaction_id: 'TXN_006', sender_id: 'ACC_00789', receiver_id: 'ACC_03333', amount: 1900, timestamp: '2024-01-16 09:07:00' },
  { transaction_id: 'TXN_007', sender_id: 'ACC_01234', receiver_id: 'ACC_00789', amount: 12000, timestamp: '2024-01-16 08:55:00' },
  { transaction_id: 'TXN_008', sender_id: 'ACC_01567', receiver_id: 'ACC_02123', amount: 5500, timestamp: '2024-01-17 11:30:00' },
  { transaction_id: 'TXN_009', sender_id: 'ACC_02123', receiver_id: 'ACC_02789', amount: 5300, timestamp: '2024-01-17 13:20:00' },
  { transaction_id: 'TXN_010', sender_id: 'ACC_02789', receiver_id: 'ACC_01567', amount: 5100, timestamp: '2024-01-17 15:40:00' },
];

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useMuleAnalysis() {
  const [state, setState] = useState<AppState>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);
  const [fileName, setFileName] = useState('');

  const parseCSV = (file: File): Promise<Transaction[]> =>
    new Promise((resolve, reject) =>
      Papa.parse<Transaction>(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: r => {
          if (r.errors.length > 0) reject(new Error('CSV parse error'));
          else resolve(r.data as Transaction[]);
        },
        error: reject,
      })
    );

  const analyze = useCallback(async (file: File) => {
    setFileName(file.name);
    setIsMockMode(false);
    setState('scanning');
    setError(null);

    let txns: Transaction[] = [];
    try {
      txns = await parseCSV(file);
      setTransactions(txns);
    } catch {
      setTransactions([]);
    }

    // Minimum scan animation time
    await new Promise(r => setTimeout(r, 2500));

    try {
      const res = await analyzeTransactions(file);
      setResult(res);
      setState('results');
    } catch {
      // Backend not running → use local analysis
      if (txns.length > 0) {
        const localResult = analyzeLocally(txns);
        setResult(localResult);
        setState('results');
      } else {
        setError('Backend unavailable and no parseable CSV data found.');
        setState('error');
      }
    }
  }, []);

  const loadMockData = useCallback(async () => {
    setIsMockMode(true);
    setFileName('mock_transactions.csv');
    setState('scanning');
    setError(null);
    await new Promise(r => setTimeout(r, 2800));
    setTransactions(MOCK_TRANSACTIONS);
    setResult(MOCK_RESULT);
    setState('results');
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setResult(null);
    setTransactions([]);
    setError(null);
    setIsMockMode(false);
    setFileName('');
  }, []);

  const downloadJSON = useCallback(() => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'muleguard_analysis.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  return { state, result, transactions, error, isMockMode, fileName, analyze, loadMockData, reset, downloadJSON };
}
