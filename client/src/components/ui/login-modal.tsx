import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3 } from "lucide-react";
import { useAuth } from "@/lib/auth";
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
      <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
        <DialogHeader className="text-center space-y-4">
          <div className="w-16 h-16 gradient-purple-blue rounded-xl flex items-center justify-center mx-auto">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-bold text-white">
              Entrar no Métrika
            </DialogTitle>
            <p className="text-slate-400 mt-2">Acesse sua conta para continuar</p>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {error && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
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
              <Label htmlFor="remember" className="text-sm text-slate-300">
                Lembrar de mim
              </Label>
            </div>
            <Button 
              type="button"
              variant="link" 
              className="text-purple-400 hover:text-purple-300 p-0"
              onClick={() => {
                onOpenChange(false);
                setShowForgotPassword(true);
              }}
            >
              Esqueceu a senha?
            </Button>
          </div>

          <Button 
            type="submit" 
            className="w-full gradient-purple-blue hover:opacity-90 transition-opacity"
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="text-center mt-6">
          <p className="text-slate-400">
            Não tem conta?{" "}
            <Button 
              variant="link" 
              className="text-purple-400 hover:text-purple-300 p-0"
              onClick={onSwitchToRegister}
            >
              Criar conta gratuita
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
