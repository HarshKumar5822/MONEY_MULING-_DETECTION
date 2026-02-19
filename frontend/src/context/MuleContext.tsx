
import React, { createContext, useContext, ReactNode, useState, useMemo } from 'react';
import { useMuleAnalysis, AppState } from '@/hooks/useMuleAnalysis';
import { AnalysisResult, Transaction } from '@/services/api';

export interface AppSettings {
  highRiskThreshold: number;
  mediumRiskThreshold: number;
  enableDarkTheme: boolean; // Just a placeholder for now
  detectCycles: boolean;
  detectSmurfing: boolean;
}

interface MuleContextType {
  state: AppState;
  result: AnalysisResult | null;
  transactions: Transaction[];
  error: string | null;
  isMockMode: boolean;
  fileName: string;
  analyze: (file: File) => Promise<void>;
  loadMockData: () => Promise<void>;
  reset: () => void;
  downloadJSON: () => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const MuleContext = createContext<MuleContextType | undefined>(undefined);

export function MuleProvider({ children }: { children: ReactNode }) {
  const muleData = useMuleAnalysis();
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('mule_settings');
    if (saved) return JSON.parse(saved);
    return {
      highRiskThreshold: 85,
      mediumRiskThreshold: 65,
      enableDarkTheme: true,
      detectCycles: true,
      detectSmurfing: true,
    };
  });

  React.useEffect(() => {
    localStorage.setItem('mule_settings', JSON.stringify(settings));

    if (settings.enableDarkTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const value = useMemo(() => ({
    ...muleData,
    settings,
    updateSettings
  }), [muleData, settings]);

  return (
    <MuleContext.Provider value={value}>
      {children}
    </MuleContext.Provider>
  );
}

export function useMuleContext() {
  const context = useContext(MuleContext);
  if (context === undefined) {
    throw new Error('useMuleContext must be used within a MuleProvider');
  }
  return context;
}

