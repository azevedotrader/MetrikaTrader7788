import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { ForgotPasswordModal } from "./forgot-password-modal";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToRegister: () => void;
}

export function LoginModal({ open, onOpenChange, onSwitchToRegister }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      await login(email, password);
      onOpenChange(false);
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0f0f1a] border-[#1e1e2e]">
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Logo variant="modal" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-bold text-white">
              {t('login.title')}
            </DialogTitle>
            <p className="text-[#6e7191] mt-2">{t('login.subtitle')}</p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {error && (
            <div className="text-[#FF1F3D] text-sm text-center bg-[#FF1F3D]/10 p-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#e0e0e0]">{t('login.email_label')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('login.email_placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#13131a] border-[#28283a] text-white placeholder:text-[#6e7191]"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#e0e0e0]">{t('login.password_label')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('login.password_placeholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#13131a] border-[#28283a] text-white placeholder:text-[#6e7191]"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(!!checked)}
              />
              <Label htmlFor="remember" className="text-sm text-[#e0e0e0]">
                {t('login.remember_me')}
              </Label>
            </div>
            <Button 
              type="button"
              variant="link" 
              className="text-[#6EE000] hover:text-[#6EE000] p-0"
              onClick={() => {
                onOpenChange(false);
                setShowForgotPassword(true);
              }}
            >
              {t('login.forgot_password')}
            </Button>
          </div>

          <Button 
            type="submit" 
            className="w-full gradient-purple-blue hover:opacity-90 transition-opacity"
            disabled={isLoading}
            data-testid="button-login-submit"
          >
            {isLoading ? t('login.loading_button') : t('login.submit_button')}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#28283a]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0f0f1a] px-2 text-[#6e7191]">Ou continue com</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full bg-white hover:bg-gray-100 text-gray-900 border-gray-300"
            onClick={async () => {
              // Open OAuth in popup
              const width = 500;
              const height = 600;
              const left = window.screenX + (window.outerWidth - width) / 2;
              const top = window.screenY + (window.outerHeight - height) / 2;
              
              const popup = window.open(
                '/auth/google',
                'Google Login',
                `width=${width},height=${height},left=${left},top=${top}`
              );
              
              // Listen for postMessage from popup
              const handleMessage = async (event: MessageEvent) => {
                if (event.origin !== window.location.origin) return;
                
                if (event.data.type === 'GOOGLE_AUTH_CODE') {
                  window.removeEventListener('message', handleMessage);
                  
                  try {
                    // Exchange code for user data and token
                    const response = await fetch('/api/auth/google/exchange', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ code: event.data.code })
                    });
                    
                    if (response.ok) {
                      const { user, token, isFirstLogin } = await response.json();
                      
                      // Store in localStorage
                      localStorage.setItem('user', JSON.stringify(user));
                      localStorage.setItem('user-id', user.id);
                      localStorage.setItem('user-token', token);
                      
                      // Store first login flag for tour triggering
                      if (isFirstLogin) {
                        localStorage.setItem('should-start-tour', 'true');
                      }
                      
                      // Reload to trigger auth context update
                      window.location.reload();
                    }
                  } catch (error) {
                    console.error('Error exchanging Google auth code:', error);
                    setError('Erro ao completar login com Google');
                  }
                }
              };
              
              window.addEventListener('message', handleMessage);
            }}
            data-testid="button-google-login"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Entrar com Google
          </Button>
        </form>

        <div className="text-center mt-6">
          <p className="text-[#6e7191]">
            {t('login.no_account')}{" "}
            <Button 
              variant="link" 
              className="text-[#6EE000] hover:text-[#6EE000] p-0"
              onClick={onSwitchToRegister}
            >
              {t('login.create_account')}
            </Button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
    
    <ForgotPasswordModal
      open={showForgotPassword}
      onOpenChange={setShowForgotPassword}
      onBackToLogin={() => {
        setShowForgotPassword(false);
        onOpenChange(true);
      }}
    />
  </>
  );
}
