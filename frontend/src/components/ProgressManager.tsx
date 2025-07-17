import React, { useState, useEffect } from 'react';
import { useProgressTracker } from '@/hooks/useProgressTracker';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, Upload, Download, CheckCircle2, AlertCircle } from 'lucide-react';

export const ProgressManager: React.FC = () => {
  const { progressData, getAllProgress } = useProgressTracker();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  const allProgress = getAllProgress();
  const hasActiveProgress = Object.keys(allProgress).length > 0;

  useEffect(() => {
    if (hasActiveProgress && !isVisible) {
      setIsVisible(true);
      setIsExiting(false);
    } else if (!hasActiveProgress && isVisible) {
      // Iniciar animación de salida
      setIsExiting(true);
      // Ocultar completamente después de la animación
      const timeout = setTimeout(() => {
        setIsVisible(false);
        setIsExiting(false);
      }, 500); // Duración de la animación de salida
      
      return () => clearTimeout(timeout);
    }
  }, [hasActiveProgress, isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed bottom-6 left-6 z-50 max-w-sm transition-all duration-500 ease-in-out ${
      isExiting 
        ? 'animate-out slide-out-to-bottom-5 fade-out-0' 
        : 'animate-in slide-in-from-bottom-5 fade-in-0'
    }`}>
      <Card className="bg-background/95 backdrop-blur-md border-border/50 shadow-2xl transform transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              File Operations
            </h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {Object.keys(allProgress).length} active
            </span>
          </div>
          
          <div className="space-y-4">
            {Object.entries(allProgress).map(([operationId, data]) => {
              const isUpload = data.operation === 'upload';
              const isCompleted = data.status === 'completed';
              const isFailed = data.status === 'failed';
              
              return (
                <div 
                  key={operationId} 
                  className="space-y-3 animate-in fade-in-0 duration-300"
                >
                  {/* Header with file info */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`p-1.5 rounded-full transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 animate-bounce' 
                          : isFailed 
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse'
                          : isUpload 
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                          : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : isFailed ? (
                          <AlertCircle className="w-3 h-3" />
                        ) : isUpload ? (
                          <Upload className="w-3 h-3 animate-pulse" />
                        ) : (
                          <Download className="w-3 h-3 animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate" title={data.filename}>
                          {data.filename}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize transition-colors duration-200">
                          {data.status.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-foreground tabular-nums">
                        {data.progress}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <Progress 
                      value={data.progress} 
                      className={`h-2 transition-all duration-300 ${
                        isCompleted 
                          ? '[&>div]:bg-green-500 [&>div]:animate-pulse' 
                          : isFailed 
                          ? '[&>div]:bg-red-500'
                          : isUpload 
                          ? '[&>div]:bg-blue-500' 
                          : '[&>div]:bg-green-500'
                      }`}
                    />
                    
                    {/* Speed and ETA */}
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span className="tabular-nums">{data.speed}</span>
                      <span className="tabular-nums">{data.eta}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};
