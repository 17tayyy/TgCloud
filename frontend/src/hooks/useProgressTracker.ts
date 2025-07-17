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
      const wsUrl = `ws://localhost:8000/ws/progress?token=${token}`;
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
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000); // Backoff exponencial
          
          console.log(`Attempting to reconnect in ${delay}ms... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            const token = localStorage.getItem('tgcloud_token');
            if (token) {
              connect();
            }
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.log('Max reconnection attempts reached. Stopping automatic reconnection.');
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
