import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Perfil() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: user?.name || "",
    email: user?.email || "",
    telefone: (user as any)?.phone || "",
    senha: "",
    confirmarSenha: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.nome.trim()) {
      toast({
        title: "Erro de validação",
        description: "O nome é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.email.trim()) {
      toast({
        title: "Erro de validação",
        description: "O email é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    
    // Validação de senha
    if (formData.senha && formData.senha !== formData.confirmarSenha) {
      toast({
        title: "Erro de validação",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.senha && formData.senha.length < 6) {
      toast({
        title: "Erro de validação",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Preparar dados para envio (remover senha vazia)
      const updateData: any = {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
      };
      
      if (formData.telefone.trim()) {
        updateData.telefone = formData.telefone.trim();
      }
      
      if (formData.senha.trim()) {
        updateData.senha = formData.senha;
      }
      
      // Chamar API real
      const response = await apiRequest('PUT', '/api/profile', updateData);
      const result = await response.json();
      
      // Atualizar o contexto de usuário com os novos dados
      updateUser({
        name: updateData.nome,
        email: updateData.email,
        ...(updateData.telefone && { phone: updateData.telefone })
      });
      
      // Atualizar o formulário com os novos dados (exceto senhas)
      setFormData(prev => ({
        ...prev,
        nome: updateData.nome,
        email: updateData.email,
        telefone: updateData.telefone || "",
        senha: "",
        confirmarSenha: ""
      }));
      
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram atualizadas com sucesso.",
      });
      
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o perfil. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-[#0a0a0f]/90 border-[#1e1e2e]">
          <CardHeader>
            <CardTitle className="text-white text-xl font-semibold">Editar Dados do Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex items-center space-x-6">
                {user?.profilePhoto ? (
                  <img 
                    src={user.profilePhoto} 
                    alt={user.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 gradient-purple-blue rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">{user?.initials}</span>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <p className="text-white font-semibold">{user?.name}</p>
                  <p className="text-zinc-400 text-sm">{user?.email}</p>
                  {user?.googleId && (
                    <p className="text-[#6EE000] text-xs flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      Conectado com Google
                    </p>
                  )}
                </div>
              </div>

              {/* Dados do Usuário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-zinc-300">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    className="bg-[#13131a] border-zinc-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="bg-[#13131a] border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="telefone" className="text-zinc-300">Telefone</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange("telefone", e.target.value)}
                    className="bg-[#13131a] border-zinc-700 text-white placeholder:text-zinc-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="senha" className="text-zinc-300">Nova Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="Digite uma nova senha"
                    value={formData.senha}
                    onChange={(e) => handleInputChange("senha", e.target.value)}
                    className="bg-[#13131a] border-zinc-700 text-white placeholder:text-zinc-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha" className="text-zinc-300">Confirmar Senha</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    placeholder="Confirme a nova senha"
                    value={formData.confirmarSenha}
                    onChange={(e) => handleInputChange("confirmarSenha", e.target.value)}
                    className="bg-[#13131a] border-zinc-700 text-white placeholder:text-zinc-400"
                  />
                </div>
              </div>


              {/* Links úteis */}
              <div className="flex justify-center gap-4 pt-4 border-t border-zinc-700">
                <a 
                  href="/politica-privacidade" 
                  className="text-sm text-zinc-400 hover:text-white transition-colors underline"
                  data-testid="link-privacy-policy-profile"
                >
                  Política de Privacidade
                </a>
                <span className="text-zinc-600">•</span>
                <a 
                  href="/termos-servico" 
                  className="text-sm text-zinc-400 hover:text-white transition-colors underline"
                  data-testid="link-terms-service-profile"
                >
                  Termos de Serviço
                </a>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-black hover:bg-gray-800 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
