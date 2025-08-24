import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";

export default function Perfil() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nome: user?.name || "",
    email: user?.email || "",
    telefone: "",
    senha: "",
    confirmarSenha: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Perfil atualizado:", formData);
    // TODO: Implement profile update logic
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-100 border-gray-300">
          <CardHeader>
            <CardTitle className="text-gray-800 text-xl font-semibold">Editar Dados do Usuário</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-gray-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">{user?.initials}</span>
                </div>
                <div>
                  <Button 
                    type="button"
                    variant="outline" 
                    className="bg-black hover:bg-gray-800 border-black text-white"
                  >
                    Alterar Foto
                  </Button>
                </div>
              </div>

              {/* Dados do Usuário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-gray-700">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="telefone" className="text-gray-700">Telefone</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange("telefone", e.target.value)}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="senha" className="text-gray-700">Nova Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="Digite uma nova senha"
                    value={formData.senha}
                    onChange={(e) => handleInputChange("senha", e.target.value)}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha" className="text-gray-700">Confirmar Senha</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    placeholder="Confirme a nova senha"
                    value={formData.confirmarSenha}
                    onChange={(e) => handleInputChange("confirmarSenha", e.target.value)}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
              </div>


              <Button 
                type="submit" 
                className="w-full bg-black hover:bg-gray-800 text-white transition-colors"
              >
                Salvar Alterações
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
