import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft } from "lucide-react";

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBackToLogin: () => void;
}

export function ForgotPasswordModal({ open, onOpenChange, onBackToLogin }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsSuccess(true);
      } else {
        setError(data.message || "Erro ao processar solicitação");
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after closing
    setTimeout(() => {
      setEmail("");
      setIsSuccess(false);
      setError("");
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#0f0f1a] border-[#1e1e2e]">
        <DialogHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-[#5bc800]/20 rounded-xl flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-[#6EE000]" />
          </div>
          <div>
            <DialogTitle className="text-2xl font-bold text-white">
              {isSuccess ? "Email Enviado!" : "Recuperar Senha"}
            </DialogTitle>
            <p className="text-[#6e7191] mt-2">
              {isSuccess 
                ? "Verifique seu email para redefinir sua senha"
                : "Digite seu email para receber as instruções"}
            </p>
          </div>
        </DialogHeader>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            {error && (
              <div className="text-[#FF1F3D] text-sm text-center bg-[#FF1F3D]/10 p-3 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="text-[#e0e0e0]">Email cadastrado</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#13131a] border-[#28283a] text-white placeholder:text-[#6e7191]"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full gradient-purple-blue hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? "Enviando..." : "Enviar Email de Recuperação"}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full text-[#6e7191] hover:text-white"
                onClick={() => {
                  handleClose();
                  onBackToLogin();
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para o login
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 mt-6">
            <div className="bg-[#6EE000]/10 border border-[#6EE000]/20 p-4 rounded-lg">
              <p className="text-[#6EE000] text-sm">
                Se o email estiver cadastrado, você receberá as instruções de recuperação em alguns minutos.
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full border-[#28283a] text-[#e0e0e0] hover:bg-[#13131a]"
                onClick={() => {
                  handleClose();
                  onBackToLogin();
                }}
              >
                Voltar para o login
              </Button>
              
              <p className="text-xs text-[#6e7191] text-center">
                Não recebeu o email? Verifique sua caixa de spam ou tente novamente em alguns minutos.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}