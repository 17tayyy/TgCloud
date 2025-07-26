import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export interface ProgressData {
  progress: number;
  status: string;
  filename?: string;
  operation: 'upload' | 'download';
  speed: string;
  eta: string;
  timestamp: string;
}

export interface ProgressUpdate {
  type: 'progress_update';
  operation_id: string;
  data: ProgressData;
}

export const useProgressTracker = () => {
  const [progressData, setProgressData] = useState<Record<string, ProgressData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // 1 second base delay
  const maxReconnectDelay = 30000; // 30 seconds max delay
  const jitterFactor = 0.1; // 10% jitter to avoid thundering herd

  const connect = useCallback(() => {
    const token = localStorage.getItem('tgcloud_token');
    if (!token) {
      return;
    }

    // Evitar múltiples conexiones simultáneas
    if (wsRef.current?.readyState === WebSocket.CONNECTING || 
        wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = `${import.meta.env.VITE_WS_BASE_URL}/ws/progress?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Progress WebSocket connected successfully');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0; // Reset contador
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        // Configurar ping cada 30 segundos
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Manejar pong del servidor
          if (message.type === 'pong') {
            // El servidor está vivo
            return;
          }
          
          if (message.type === 'progress_update') {
            setProgressData(prev => ({
              ...prev,
              [message.operation_id]: message.data
            }));

            if (message.data.status === 'completed' || message.data.status === 'failed') {
              setTimeout(() => {
                setProgressData(prev => {
                  const newData = { ...prev };
                  delete newData[message.operation_id];
                  return newData;
                });
              }, 5000); // Aumentado de 3 a 5 segundos
            }
          }
        } catch (error) {
          console.error('Error parsing progress update:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('Progress WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
        setIsConnected(false);
        wsRef.current = null;
        
        // Limpiar ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        
        // Solo reconectar si no fue un cierre intencional y no hemos excedido los intentos
        if (event.code !== 1000 && event.code !== 1001 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          
          // Improved backoff with jitter
          const exponentialDelay = Math.min(
            baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1),
            maxReconnectDelay
          );
          const jitter = exponentialDelay * jitterFactor * Math.random();
          const finalDelay = exponentialDelay + jitter;
          
          console.log(`Attempting to reconnect in ${Math.round(finalDelay)}ms... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            const token = localStorage.getItem('tgcloud_token');
            if (token && wsRef.current?.readyState !== WebSocket.OPEN) {
              connect();
            }
          }, finalDelay);
          
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.log('Max reconnection attempts reached. Stopping automatic reconnection.');
          toast({
            title: "Connection Lost",
            description: "Unable to reconnect to server. Please refresh the page.",
            variant: "destructive"
          });
        }
      };

      ws.onerror = (error) => {
        console.error('Progress WebSocket error:', error);
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000); // Cierre normal
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    setIsConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0; // Reset contador
    setTimeout(connect, 1000); // Esperar un poco antes de reconectar
  }, [disconnect, connect]);

  const getProgress = useCallback((operationId: string): ProgressData | null => {
    return progressData[operationId] || null;
  }, [progressData]);

  const getAllProgress = useCallback((): Record<string, ProgressData> => {
    return progressData;
  }, [progressData]);

  // Auto-conectar al montar solo si hay token
  useEffect(() => {
    const token = localStorage.getItem('tgcloud_token');
    if (token) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    progressData,
    getProgress,
    getAllProgress,
    connect,
    disconnect,
    reconnect
  };
};
