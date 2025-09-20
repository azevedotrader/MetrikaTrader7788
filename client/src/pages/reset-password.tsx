import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const [location, navigate] = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState("");
  const [isValidatingToken, setIsValidatingToken] = useState(true);

  useEffect(() => {
    // Extract token from URL query params
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    
    if (!tokenParam) {
      setError("Link inválido. Por favor, solicite um novo link de recuperação.");
      setIsValidatingToken(false);
    } else {
      setToken(tokenParam);
      // Validate token with server
      validateToken(tokenParam);
    }
  }, [location]);

  const validateToken = async (tokenToValidate: string) => {
    try {
      const response = await fetch("/api/auth/validate-reset-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenToValidate }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Token inválido ou expirado. Solicite um novo link de recuperação.");
      }
    } catch (err) {
      setError("Erro ao validar token. Verifique sua conexão com a internet.");
    } finally {
      setIsValidatingToken(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }
    
    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        },
        body: JSON.stringify({ token, newPassword }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        // More detailed error handling
        if (response.status === 400) {
          setError(data.message || "Token inválido, expirado ou já utilizado. Solicite um novo link.");
        } else if (response.status === 500) {
          setError("Erro interno do servidor. Tente novamente em alguns minutos.");
        } else {
          setError(data.message || "Erro ao redefinir senha. Tente novamente.");
        }
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Erro de conectividade. Verifique sua internet e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 gradient-purple-blue rounded-xl flex items-center justify-center mx-auto">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">
              {success ? "Senha Redefinida!" : "Redefinir Senha"}
            </CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              {success 
                ? "Sua senha foi alterada com sucesso"
                : "Digite sua nova senha abaixo"}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          {success ? (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-slate-300">
                  Você será redirecionado para a página inicial em alguns segundos...
                </p>
              </div>
              
              <Button 
                className="w-full gradient-purple-blue hover:opacity-90"
                onClick={() => navigate("/")}
              >
                Ir para Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-start space-x-2 text-red-600 bg-red-600/10 p-3 rounded">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
              
              {isValidatingToken ? (
                <div className="text-center text-slate-400 space-y-2">
                  <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full mx-auto"></div>
                  <p>Validando link de recuperação...</p>
                </div>
              ) : (token && !error) ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-slate-300">
                      Nova Senha
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-slate-300">
                      Confirmar Nova Senha
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full gradient-purple-blue hover:opacity-90 transition-opacity"
                    disabled={isLoading || !token}
                  >
                    {isLoading ? "Redefinindo..." : "Redefinir Senha"}
                  </Button>
                </>
              ) : null}
              
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-purple-400 hover:text-purple-300"
                  onClick={() => navigate("/")}
                >
                  Voltar para o Login
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}