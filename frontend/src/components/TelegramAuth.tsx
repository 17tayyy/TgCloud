
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, Key, Lock, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';
import { useTelegram } from '@/contexts/TelegramContext';

interface TelegramAuthProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TelegramAuth: React.FC<TelegramAuthProps> = ({ open, onOpenChange }) => {
  const { 
    isConnecting, 
    connectionStep, 
    phone,
    error,
    setPhone,
    sendPhoneCode, 
    verifyCode, 
    sendPassword,
    reset,
    startAuth
  } = useTelegram();

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [phoneInput, setPhoneInput] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      startAuth();
      setCode('');
      setPassword('');
      setPhoneInput('');
    }
  }, [open]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    
    const success = await sendPhoneCode(phoneInput.trim());
    if (success) {
      setPhone(phoneInput.trim());
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    const result = await verifyCode(code.trim());
    if (result === 'success') {
      setTimeout(() => onOpenChange(false), 1500);
    }
    setCode('');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    
    const success = await sendPassword(password.trim());
    if (success) {
      setTimeout(() => onOpenChange(false), 1500);
    }
    setPassword('');
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
    setCode('');
    setPassword('');
    setPhoneInput('');
  };

  const renderStepContent = () => {
    switch (connectionStep) {
      case 'checking':
        return (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-cyber-blue/10 rounded-full mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-cyber-blue animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Checking Telegram status...</h3>
              <p className="text-muted-foreground text-sm">
                Verifying configuration and connection
              </p>
            </div>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-cyber-blue" />
            </div>
          </div>
        );

      case 'phone':
        return (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 bg-cyber-blue/10 rounded-full mx-auto mb-4">
              <Phone className="w-8 h-8 text-cyber-blue" />
            </div>
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Connect your Telegram</h3>
              <p className="text-muted-foreground text-sm">
                Enter your phone number to receive a verification code
              </p>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1234567890"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="bg-cyber-dark border-cyber-blue/30"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Include country code (e.g., +1 for US, +34 for Spain)
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!phoneInput.trim() || isConnecting}
                className="bg-cyber-blue text-cyber-dark hover:bg-cyber-blue/90"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Code'
                )}
              </Button>
            </div>
          </form>
        );

      case 'code':
        return (
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 bg-cyber-blue/10 rounded-full mx-auto mb-4">
              <Key className="w-8 h-8 text-cyber-blue" />
            </div>
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Enter verification code</h3>
              <p className="text-muted-foreground text-sm">
                Check your Telegram app for the verification code
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Sent to: {phone}
              </p>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="12345"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="bg-cyber-dark border-cyber-blue/30 text-center text-lg tracking-widest"
                maxLength={5}
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!code.trim() || isConnecting}
                className="bg-cyber-blue text-cyber-dark hover:bg-cyber-blue/90"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
          </form>
        );

      case 'password':
        return (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="flex items-center justify-center w-16 h-16 bg-cyber-blue/10 rounded-full mx-auto mb-4">
              <Lock className="w-8 h-8 text-cyber-blue" />
            </div>
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Two-factor authentication</h3>
              <p className="text-muted-foreground text-sm">
                Enter your Telegram password to complete authentication
              </p>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your Telegram password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-cyber-dark border-cyber-blue/30"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!password.trim() || isConnecting}
                className="bg-cyber-blue text-cyber-dark hover:bg-cyber-blue/90"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Authenticate'
                )}
              </Button>
            </div>
          </form>
        );

      case 'connected':
        return (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Successfully connected!</h3>
              <p className="text-muted-foreground text-sm">
                Your Telegram account is now connected to TgCloud
              </p>
            </div>
            <Button 
              onClick={() => onOpenChange(false)}
              className="bg-cyber-blue text-cyber-dark hover:bg-cyber-blue/90"
            >
              Continue
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Connection Failed</h3>
              <p className="text-muted-foreground text-sm">
                {error || 'Unable to connect to Telegram'}
              </p>
            </div>
            <div className="flex justify-center space-x-2">
              <Button 
                variant="outline"
                onClick={handleClose}
              >
                Close
              </Button>
              <Button 
                onClick={startAuth}
                className="bg-cyber-blue text-cyber-dark hover:bg-cyber-blue/90"
              >
                Try Again
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-cyber-dark-card border border-cyber-blue/30 text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-cyber-blue">Telegram Authentication</DialogTitle>
        </DialogHeader>
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
};

export default TelegramAuth;
