import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function NovoTrade() {
  const [formData, setFormData] = useState({
    ativo: "",
    tipo: "",
    quantidade: "",
    precoEntrada: "",
    precoSaida: "",
    setup: "",
    observacoes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Trade registrado:", formData);
    // TODO: Implement trade creation logic
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">
              Registrar Novo Trade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ativo" className="text-slate-300">Ativo</Label>
                  <Input
                    id="ativo"
                    placeholder="Ex: PETR4, WINFEB24"
                    value={formData.ativo}
                    onChange={(e) => handleInputChange("ativo", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo" className="text-slate-300">Tipo</Label>
                  <Select onValueChange={(value) => handleInputChange("tipo", value)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compra">Compra</SelectItem>
                      <SelectItem value="venda">Venda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="quantidade" className="text-slate-300">Quantidade</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    placeholder="100"
                    value={formData.quantidade}
                    onChange={(e) => handleInputChange("quantidade", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precoEntrada" className="text-slate-300">Preço de Entrada</Label>
                  <Input
                    id="precoEntrada"
                    type="number"
                    step="0.01"
                    placeholder="25.50"
                    value={formData.precoEntrada}
                    onChange={(e) => handleInputChange("precoEntrada", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precoSaida" className="text-slate-300">Preço de Saída</Label>
                  <Input
                    id="precoSaida"
                    type="number"
                    step="0.01"
                    placeholder="26.80"
                    value={formData.precoSaida}
                    onChange={(e) => handleInputChange("precoSaida", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="setup" className="text-slate-300">Setup/Estratégia</Label>
                <Input
                  id="setup"
                  placeholder="Ex: Rompimento, Pullback, Scalp"
                  value={formData.setup}
                  onChange={(e) => handleInputChange("setup", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes" className="text-slate-300">Observações</Label>
                <Textarea
                  id="observacoes"
                  rows={4}
                  placeholder="Descreva o contexto do trade, emoções, etc."
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange("observacoes", e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 resize-none"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-purple-blue hover:opacity-90 transition-opacity"
              >
                Salvar Trade
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
