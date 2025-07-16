
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Login = () => {
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', password: '', confirmPassword: '' });
  const { login, register, isLoading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.username.trim() || !loginData.password.trim()) {
      return;
    }
    await login(loginData.username, loginData.password);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.username.trim() || !registerData.password.trim()) {
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      return;
    }
    
    const success = await register(registerData.username, registerData.password);
    if (success) {
      // Switch to login tab after successful registration
      setRegisterData({ username: '', password: '', confirmPassword: '' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cyber-gradient">
      <div className="w-full max-w-md">
        <Card className="cyber-card animate-fade-in">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-cyber-blue/20 rounded-full flex items-center justify-center cyber-glow">
              <div className="w-12 h-12 bg-cyber-blue rounded-full animate-glow"></div>
            </div>
            <CardTitle className="text-3xl font-bold text-cyber-blue">TgCloud</CardTitle>
            <CardDescription className="text-muted-foreground">
              Connect to your personal cloud storage via Telegram
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username" className="text-foreground">Username</Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="Enter your username"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      className="cyber-input"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-foreground">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="cyber-input"
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-cyber-blue hover:bg-cyber-blue-dark text-cyber-dark font-semibold py-3 transition-all duration-300 transform hover:scale-105"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username" className="text-foreground">Username</Label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="Choose a username"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      className="cyber-input"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-foreground">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Choose a password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="cyber-input"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-foreground">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className="cyber-input"
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-cyber-blue hover:bg-cyber-blue-dark text-cyber-dark font-semibold py-3 transition-all duration-300 transform hover:scale-105"
                    disabled={isLoading || registerData.password !== registerData.confirmPassword}
                  >
                    {isLoading ? 'Creating account...' : 'Register'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>Your files are synced with Telegram</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
