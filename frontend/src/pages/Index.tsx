
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { FileProvider } from '@/contexts/FileContext';
import { TelegramProvider } from '@/contexts/TelegramContext';
import Login from '@/components/Login';
import Dashboard from '@/components/Dashboard';
import { ProgressManager } from '@/components/ProgressManager';

const IndexContent = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <TelegramProvider>
      <FileProvider>
        <ProgressManager />
        <Dashboard />
      </FileProvider>
    </TelegramProvider>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <IndexContent />
    </AuthProvider>
  );
};

export default Index;
