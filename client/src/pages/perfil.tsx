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
    capitalInicial: "50000",
    metaMensal: "5",
    perfilRisco: "moderado",
    mercados: {
      acoes: true,
      miniIndice: true,
      forex: false,
      cripto: false
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Perfil atualizado:", formData);
    // TODO: Implement profile update logic
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMarketChange = (market: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      mercados: { ...prev.mercados, [market]: checked }
    }));
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">
              Perfil do Trader
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 gradient-purple-blue rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">{user?.initials}</span>
                </div>
                <div>
                  <Button 
                    type="button"
                    variant="outline" 
                    className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-white"
                  >
                    Alterar Foto
                  </Button>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-slate-300">Nome</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange("nome", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              {/* Trading Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="capitalInicial" className="text-slate-300">Capital Inicial</Label>
                  <Input
                    id="capitalInicial"
                    type="number"
                    value={formData.capitalInicial}
                    onChange={(e) => handleInputChange("capitalInicial", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaMensal" className="text-slate-300">Meta Mensal (%)</Label>
                  <Input
                    id="metaMensal"
                    type="number"
                    value={formData.metaMensal}
                    onChange={(e) => handleInputChange("metaMensal", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              {/* Risk Profile */}
              <div className="space-y-2">
                <Label htmlFor="perfilRisco" className="text-slate-300">Perfil de Risco</Label>
                <Select onValueChange={(value) => handleInputChange("perfilRisco", value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione o perfil de risco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservador">Conservador</SelectItem>
                    <SelectItem value="moderado">Moderado</SelectItem>
                    <SelectItem value="agressivo">Agressivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              

              <Button 
                type="submit" 
                className="w-full gradient-purple-blue hover:opacity-90 transition-opacity"
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
