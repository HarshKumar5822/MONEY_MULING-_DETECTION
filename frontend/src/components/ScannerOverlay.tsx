// src/components/ScannerOverlay.tsx
import { motion } from 'framer-motion';
import { Shield, Activity } from 'lucide-react';

interface Props {
  fileName?: string;
}

export function ScannerOverlay({ fileName }: Props) {
  const steps = [
    'Parsing transaction graph…',
    'Detecting cyclic patterns…',
    'Analyzing fund flow topology…',
    'Scoring suspicion levels…',
    'Identifying fraud rings…',
  ];

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20 gap-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Scanner card */}
      <div className="relative w-64 h-40 rounded-2xl border border-primary/30 bg-primary-dim overflow-hidden shadow-blue">
        {/* Scan line */}
        <motion.div
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
        {/* Center icon */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <Shield className="w-10 h-10 text-primary" />
          </motion.div>
          <span className="text-xs font-mono text-primary font-medium">ANALYZING</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 text-center">
        <h3 className="text-xl font-semibold text-foreground">Running Forensic Analysis</h3>
        {fileName && (
          <p className="text-sm text-muted-foreground font-mono bg-muted px-3 py-1 rounded-lg">
            📄 {fileName}
          </p>
        )}

        {/* Animated steps */}
        <div className="mt-2 space-y-2 w-72">
          {steps.map((step, i) => (
            <motion.div
              key={step}
              className="flex items-center gap-2.5 text-sm"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.5, duration: 0.4 }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-primary flex-shrink-0"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ delay: i * 0.5, duration: 0.4 }}
              />
              <span className="text-muted-foreground text-left">{step}</span>
              <motion.div
                className="flex-1 h-px bg-primary/30"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: i * 0.5 + 0.2, duration: 0.6 }}
                style={{ transformOrigin: 'left' }}
              />
              <motion.span
                className="text-xs font-mono text-primary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.5 + 0.6 }}
              >
                ✓
              </motion.span>
            </motion.div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-4 w-72 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary-glow rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '95%' }}
            transition={{ duration: 2.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Pulsing activity dots */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
