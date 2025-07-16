
import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Shield, ShieldOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { encryptionAPI, statsAPI } from '@/services/api';

const EncryptionToggle = () => {
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load encryption status on mount
  useEffect(() => {
    const loadEncryptionStatus = async () => {
      try {
        const stats = await statsAPI.get();
        setIsEncrypted(stats.encryption_enabled);
      } catch (error) {
        console.error('Error loading encryption status:', error);
      }
    };
    
    loadEncryptionStatus();
  }, []);

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      if (checked) {
        await encryptionAPI.enable();
        console.log('Encryption enabled');
      } else {
        await encryptionAPI.disable();
        console.log('Encryption disabled');
      }
      
      setIsEncrypted(checked);
      console.log('Encryption toggled:', checked);
    } catch (error: any) {
      console.error('Encryption toggle error:', error);
      toast({
        title: "Encryption toggle failed",
        description: error.response?.data?.detail || "Failed to toggle encryption",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        {isEncrypted ? (
          <Shield className="w-4 h-4 text-green-400" />
        ) : (
          <ShieldOff className="w-4 h-4 text-gray-400" />
        )}
        <span className="text-sm font-medium text-foreground">
          Encryption
        </span>
      </div>
      <Switch
        checked={isEncrypted}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-green-500"
        disabled={isLoading}
      />
    </div>
  );
};

export default EncryptionToggle;
