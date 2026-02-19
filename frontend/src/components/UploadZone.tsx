// src/components/UploadZone.tsx
import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, Zap, Shield } from 'lucide-react';

interface Props {
  onFile: (file: File) => void;
  onMock: () => void;
  disabled?: boolean;
}

export function UploadZone({ onFile, onMock, disabled }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith('.csv')) onFile(file);
    },
    [onFile]
  );

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <label
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          group relative flex flex-col items-center justify-center w-full min-h-[280px] rounded-2xl border-2 border-dashed cursor-pointer
          transition-all duration-300 overflow-hidden select-none
          ${isDragging
            ? 'border-primary bg-primary-dim shadow-blue scale-[1.01]'
            : 'border-border bg-secondary/60 hover:border-primary/60 hover:bg-primary-dim/50 hover:shadow-blue'
          }
        `}
      >
        {/* Scanner animation overlay */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute left-0 right-0 h-0.5 scanner-line" />
              <div className="absolute inset-0 bg-primary/5" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Corner accents */}
        <span className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-primary/30 rounded-tl-sm" />
        <span className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-primary/30 rounded-tr-sm" />
        <span className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-primary/30 rounded-bl-sm" />
        <span className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-primary/30 rounded-br-sm" />

        <input
          type="file"
          accept=".csv"
          className="sr-only"
          onChange={handleInput}
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-4 px-8 py-4 text-center z-10">
          <motion.div
            className={`p-5 rounded-2xl transition-all duration-300 ${isDragging ? 'bg-primary text-primary-foreground shadow-blue' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-blue'}`}
            animate={isDragging ? { scale: [1, 1.08, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            {isDragging ? (
              <Zap className="w-8 h-8" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </motion.div>

          <div>
            <p className="text-lg font-semibold text-foreground">
              {isDragging ? 'Release to Scan' : 'Drop Transaction CSV here'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              or <span className="text-primary font-medium">click to browse</span> your files
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            CSV format: transaction_id, sender_id, receiver_id, amount, timestamp
          </div>
        </div>
      </label>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium">OR</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <motion.button
        onClick={onMock}
        disabled={disabled}
        className="mt-4 w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border border-primary/30 bg-primary-dim text-primary font-semibold text-sm hover:bg-primary hover:text-primary-foreground hover:shadow-blue transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <Shield className="w-4 h-4" />
        Run Demo with Mock Data
        <span className="text-xs font-normal opacity-70">(No backend required)</span>
      </motion.button>
    </motion.div>
  );
}
