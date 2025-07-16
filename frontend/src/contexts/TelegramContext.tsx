import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { telegramAPI } from '@/services/api';
import { toast } from '@/hooks/use-toast';

type ConnectionStep = 'checking' | 'phone' | 'code' | 'password' | 'connected' | 'error';

interface TelegramContextType {
  isConnected: boolean;
  isConnecting: boolean;
  connectionStep: ConnectionStep;
  phone: string;
  error: string | null;
  isAuthModalOpen: boolean;
  setPhone: (phone: string) => void;
  sendPhoneCode: (phone: string) => Promise<boolean>;
  verifyCode: (code: string) => Promise<'success' | 'password_required' | 'invalid'>;
  sendPassword: (password: string) => Promise<boolean>;
  checkStatus: () => Promise<void>;
  disconnect: () => void;
  reset: () => void;
  setAuthModalOpen: (open: boolean) => void;
  startAuth: () => void;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within TelegramProvider');
  }
  return context;
};

// Error message mapping
const ERROR_HANDLERS = {
  'not configured': 'Contact administrator - Telegram API not configured',
  'Error checking status': 'Cannot connect to Telegram servers. Try again later.',
  'Error sending code': 'Failed to send verification code. Check phone number.',
  'Invalid code': 'Verification code is incorrect. Please try again.',
  'Error verifying': 'Authentication failed. Please restart the process.'
};

const getErrorMessage = (apiMessage: string): string => {
  for (const [key, message] of Object.entries(ERROR_HANDLERS)) {
    if (apiMessage.includes(key)) return message;
  }
  return apiMessage; // Fallback to original message
};

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState<ConnectionStep>('checking');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Prevent multiple simultaneous calls
  const isCheckingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const checkStatus = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isCheckingRef.current) {
      console.log('checkStatus already in progress, skipping');
      return;
    }

    isCheckingRef.current = true;
    
    try {
      setIsConnecting(true);
      setError(null);
      
      // First check if Telegram is configured
      const config = await telegramAPI.checkConfig();
      if (config.message.includes('not configured')) {
        setConnectionStep('error');
        setError(getErrorMessage(config.message));
        setIsConnected(false);
        return;
      }

      // Then check authorization status
      const response = await telegramAPI.getStatus();
      const connected = response.message === 'Authorized';
      setIsConnected(connected);
      setConnectionStep(connected ? 'connected' : 'phone');
      
      if (response.message.includes('Error')) {
        setError(getErrorMessage(response.message));
      }
    } catch (error: any) {
      console.error('Error checking Telegram status:', error);
      setIsConnected(false);
      setConnectionStep('error');
      setError('Failed to check Telegram status');
    } finally {
      setIsConnecting(false);
      isCheckingRef.current = false;
    }
  }, []); // Empty dependencies to prevent re-creation

  const startAuth = async () => {
    setConnectionStep('checking');
    setError(null);
    setIsAuthModalOpen(true);
    
    try {
      // Check configuration first
      const config = await telegramAPI.checkConfig();
      if (config.message.includes('not configured')) {
        setConnectionStep('error');
        setError(getErrorMessage(config.message));
        return;
      }

      // Check current status
      const status = await telegramAPI.getStatus();
      if (status.message === 'Authorized') {
        setConnectionStep('connected');
        setIsConnected(true);
        toast({
          title: "Already connected",
          description: "Telegram is already connected to your account",
        });
        return;
      }

      if (status.message.includes('Error')) {
        setConnectionStep('error');
        setError(getErrorMessage(status.message));
        return;
      }

      // Start with phone input
      setConnectionStep('phone');
    } catch (error: any) {
      setConnectionStep('error');
      setError('Failed to initialize Telegram authentication');
    }
  };

  const sendPhoneCode = async (phoneNumber: string) => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const response = await telegramAPI.sendPhone(phoneNumber);
      
      if (response.message === 'Code sent') {
        setPhone(phoneNumber);
        setConnectionStep('code');
        toast({
          title: "Code sent",
          description: "Verification code sent to your Telegram",
        });
        return true;
      } else {
        setError(getErrorMessage(response.message));
        return false;
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to send code';
      setError(getErrorMessage(errorMsg));
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const verifyCode = async (code: string) => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const response = await telegramAPI.verifyCode(phone, code);
      const message = response.message;
      
      if (message === 'Authenticated') {
        setIsConnected(true);
        setConnectionStep('connected');
        toast({
          title: "Connected!",
          description: "Telegram account connected successfully",
        });
        return 'success';
      } else if (message === 'Password required') {
        setConnectionStep('password');
        return 'password_required';
      } else {
        setError(getErrorMessage(message));
        return 'invalid';
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to verify code';
      setError(getErrorMessage(errorMsg));
      return 'invalid';
    } finally {
      setIsConnecting(false);
    }
  };

  const sendPassword = async (password: string) => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const response = await telegramAPI.sendPassword(password);
      
      if (response.message === 'Authenticated') {
        setIsConnected(true);
        setConnectionStep('connected');
        toast({
          title: "Connected!",
          description: "Telegram account connected successfully",
        });
        return true;
      } else {
        setError(getErrorMessage(response.message));
        return false;
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to authenticate';
      setError(getErrorMessage(errorMsg));
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setConnectionStep('phone');
    setPhone('');
    setError(null);
    toast({
      title: "Disconnected",
      description: "Telegram account disconnected",
    });
  };

  const reset = () => {
    setIsConnecting(false);
    setConnectionStep('phone');
    setPhone('');
    setError(null);
  };

  const setAuthModalOpen = (open: boolean) => {
    setIsAuthModalOpen(open);
    if (!open) {
      reset();
    }
  };

  // Only check status once when component mounts
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      checkStatus();
    }
  }, [checkStatus]);

  return (
    <TelegramContext.Provider value={{
      isConnected,
      isConnecting,
      connectionStep,
      phone,
      error,
      isAuthModalOpen,
      setPhone,
      sendPhoneCode,
      verifyCode,
      sendPassword,
      checkStatus,
      disconnect,
      reset,
      setAuthModalOpen,
      startAuth
    }}>
      {children}
    </TelegramContext.Provider>
  );
};
