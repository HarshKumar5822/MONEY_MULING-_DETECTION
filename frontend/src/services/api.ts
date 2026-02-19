// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = "https://money-muling-detection-47ze.onrender.com";

export interface Transaction {
  transaction_id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  timestamp: string;
}

export interface SuspiciousAccount {
  account_id: string;
  suspicion_score: number;
  detected_patterns: string[];
  ring_id: string;
}

export interface FraudRing {
  ring_id: string;
  member_accounts: string[];
  pattern_type: string;
  risk_score: number;
}

export interface AnalysisSummary {
  total_accounts_analyzed: number;
  suspicious_accounts_flagged: number;
  fraud_rings_detected: number;
  processing_time_seconds: number;
}

export interface AnalysisResult {
  suspicious_accounts: SuspiciousAccount[];
  fraud_rings: FraudRing[];
  summary: AnalysisSummary;
}

export const analyzeTransactions = async (file: File): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post<AnalysisResult>(`${API_BASE_URL}/analyze`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
