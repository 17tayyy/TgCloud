
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFiles } from '@/contexts/FileContext';
import { useTelegram } from '@/contexts/TelegramContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Grid, List, MessageCircle, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import TelegramAuth from './TelegramAuth';

interface HeaderProps {
  onShowStats?: () => void;
  onShowStatsPage?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onShowStats, onShowStatsPage }) => {
  const { user, logout } = useAuth();
  const { viewMode, setViewMode } = useFiles();
  const { isConnected, isConnecting, error, isAuthModalOpen, setAuthModalOpen, startAuth } = useTelegram();

  // Remove the useEffect that was causing the infinite loop
  // The TelegramContext already handles initial status check

  const getTelegramButtonProps = () => {
    if (isConnecting) {
      return {
        variant: "outline" as const,
        className: "border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10",
        icon: MessageCircle,
        text: "Connecting...",
        disabled: true
      };
    }

    if (error && error.includes('not configured')) {
      return {
        variant: "outline" as const,
        className: "border-red-400/30 text-red-400 hover:bg-red-400/10",
        icon: AlertCircle,
        text: "Not Configured",
        disabled: true
      };
    }

    if (isConnected) {
      return {
        variant: "default" as const,
        className: "bg-green-500 text-white hover:bg-green-600",
        icon: CheckCircle,
        text: "Connected",
        disabled: false
      };
    }

    return {
      variant: "outline" as const,
      className: "border-cyber-blue/30 text-cyber-blue hover:bg-cyber-blue/10",
      icon: MessageCircle,
      text: "Connect Telegram",
      disabled: false
    };
  };

  const telegramProps = getTelegramButtonProps();
  const TelegramIcon = telegramProps.icon;

  return (
    <>
      <header className="border-b border-cyber-blue/20 bg-cyber-dark-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-cyber-blue/20 rounded-full flex items-center justify-center">
                <div className="w-5 h-5 bg-cyber-blue rounded-full"></div>
              </div>
              <h1 className="text-xl font-bold text-cyber-blue">TgCloud</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Telegram Connection Status */}
            <Button
              variant={telegramProps.variant}
              size="sm"
              onClick={startAuth}
              disabled={telegramProps.disabled}
              className={telegramProps.className}
            >
              <TelegramIcon className="w-4 h-4 mr-2" />
              {telegramProps.text}
            </Button>

            {/* View mode toggle */}
            <div className="flex border border-cyber-blue/30 rounded-md overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-cyber-blue text-cyber-dark' : 'text-cyber-blue hover:bg-cyber-blue/10'}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-cyber-blue text-cyber-dark' : 'text-cyber-blue hover:bg-cyber-blue/10'}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 border border-cyber-blue/30">
                    <AvatarFallback className="bg-cyber-blue/20 text-cyber-blue">
                      {user?.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-cyber-dark-card border border-cyber-blue/30" align="end">
                <DropdownMenuItem className="text-foreground hover:bg-cyber-blue/10">
                  <div className="flex flex-col">
                    <div className="font-medium">{user?.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {isConnected ? 'Telegram Connected ✓' : 'Telegram Disconnected'}
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-cyber-blue/20" />
                {onShowStatsPage && (
                  <DropdownMenuItem 
                    onClick={onShowStatsPage}
                    className="text-foreground hover:bg-cyber-blue/10 cursor-pointer"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Statistics
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={logout}
                  className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <TelegramAuth 
        open={isAuthModalOpen} 
        onOpenChange={setAuthModalOpen} 
      />
    </>
  );
};

export default Header;
