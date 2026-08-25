import React from 'react';
import { UploadCloud, Download, Trash2, CheckCircle2 } from 'lucide-react';

export interface OperationProgressState {
  isActive: boolean;
  type: 'upload' | 'download' | 'delete';
  progress: number;
  title: string;
  detail: string;
}

interface OperationProgressBarProps {
  operation: OperationProgressState;
  onCancel?: () => void;
}

export const OperationProgressBar: React.FC<OperationProgressBarProps> = ({
  operation,
}) => {
  if (!operation.isActive) return null;

  const isCompleted = operation.progress >= 100;

  const getIcon = () => {
    if (isCompleted) {
      return <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />;
    }
    switch (operation.type) {
      case 'upload':
        return <UploadCloud className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-bounce" />;
      case 'download':
        return <Download className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />;
      case 'delete':
        return <Trash2 className="w-5 h-5 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse" />;
    }
  };

  const getAccentColor = () => {
    switch (operation.type) {
      case 'upload':
        return 'from-cyan-400 via-sky-400 to-blue-500';
      case 'download':
        return 'from-emerald-400 via-teal-400 to-cyan-500';
      case 'delete':
        return 'from-rose-500 via-amber-500 to-rose-600';
    }
  };

  const getBorderColor = () => {
    switch (operation.type) {
      case 'upload':
        return 'border-cyan-400/40 shadow-[0_0_30px_rgba(6,182,212,0.35)]';
      case 'download':
        return 'border-emerald-400/40 shadow-[0_0_30px_rgba(52,211,153,0.35)]';
      case 'delete':
        return 'border-rose-400/40 shadow-[0_0_30px_rgba(244,63,94,0.35)]';
    }
  };

  return (
    <div className="fixed bottom-6 right-4 sm:right-8 z-40 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-300">
      <div
        id="operationProgressContainer"
        className={`liquid-glass rounded-2xl p-4 space-y-3 border ${getBorderColor()} backdrop-blur-xl bg-[#060b19]/90`}
      >
        <div className="flex items-center justify-between space-x-3">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-white/[0.05] border border-white/10 shrink-0">
              {getIcon()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
                {operation.title}
              </h4>
              <p className="text-[11px] text-slate-300 truncate mt-0.5">
                {operation.detail}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <span className="font-mono text-xs font-bold text-cyan-300">
              {Math.round(operation.progress)}%
            </span>
          </div>
        </div>

        {/* Real-time Progress Bar */}
        <div className="w-full bg-[#030712] h-2 rounded-full overflow-hidden border border-white/10 p-[1px]">
          <div
            className={`bg-gradient-to-r ${getAccentColor()} h-full rounded-full transition-all duration-150 ease-out shadow-[0_0_12px_rgba(6,182,212,0.8)]`}
            style={{ width: `${Math.min(100, Math.max(0, operation.progress))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
