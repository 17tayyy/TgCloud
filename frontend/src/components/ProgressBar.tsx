import React from 'react';
import { Progress } from '@/components/ui/progress';
import { X, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { ProgressData } from '@/hooks/useProgressTracker';

interface ProgressBarProps {
  operationId: string;
  data: ProgressData;
  onCancel?: (operationId: string) => void;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  operationId, 
  data, 
  onCancel 
}) => {
  const getStatusIcon = () => {
    switch (data.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'uploading_to_telegram':
      case 'starting':
        return data.operation === 'upload' 
          ? <Upload className="w-4 h-4 text-cyber-blue animate-pulse" />
          : <Download className="w-4 h-4 text-cyber-blue animate-pulse" />;
      default:
        return data.operation === 'upload' 
          ? <Upload className="w-4 h-4 text-cyber-blue" />
          : <Download className="w-4 h-4 text-cyber-blue" />;
    }
  };

  const getStatusText = () => {
    switch (data.status) {
      case 'starting':
        return 'Starting...';
      case 'uploading_to_telegram':
        return 'Uploading to Telegram...';
      case 'downloading_from_telegram':
        return 'Downloading from Telegram...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return data.status;
    }
  };

  const getProgressColor = () => {
    switch (data.status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-cyber-blue';
    }
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-4 space-y-3 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-white">
            {data.operation === 'upload' ? 'Uploading' : 'Downloading'}
          </span>
        </div>
        {onCancel && data.status !== 'completed' && data.status !== 'failed' && (
          <button
            onClick={() => onCancel(operationId)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filename */}
      {data.filename && (
        <div className="text-sm text-slate-300 truncate">
          {data.filename}
        </div>
      )}

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress 
          value={data.progress} 
          className="h-2 bg-slate-800"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>{getStatusText()}</span>
          <span>{Math.round(data.progress)}%</span>
        </div>
      </div>

      {/* Speed and ETA */}
      {(data.speed !== '0 B/s' || data.eta !== '0s') && data.status !== 'completed' && (
        <div className="flex justify-between text-xs text-slate-500">
          <span>Speed: {data.speed}</span>
          <span>ETA: {data.eta}</span>
        </div>
      )}
    </div>
  );
};
