import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function Analises() {
  const setupsData = [
    { name: "Rompimento", value: "+R$ 8.420", trend: "positive" },
    { name: "Pullback", value: "+R$ 5.280", trend: "positive" },
    { name: "Scalp", value: "-R$ 1.120", trend: "negative" }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <div>
        <div className="flex flex-wrap gap-4">
          <Select>
            <SelectTrigger className="w-48 bg-[#13131a] border-[#28283a] text-white">
              <SelectValue placeholder="Todos os ativos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os ativos</SelectItem>
              <SelectItem value="petr4">PETR4</SelectItem>
              <SelectItem value="winfeb24">WINFEB24</SelectItem>
            </SelectContent>
          </Select>
          
          <Select>
            <SelectTrigger className="w-48 bg-[#13131a] border-[#28283a] text-white">
              <SelectValue placeholder="Todos os setups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os setups</SelectItem>
              <SelectItem value="rompimento">Rompimento</SelectItem>
              <SelectItem value="pullback">Pullback</SelectItem>
            </SelectContent>
          </Select>
          
          <Input 
            type="date" 
            className="w-48 bg-[#13131a] border-[#28283a] text-white"
          />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[#0f0f1a] border-[#1e1e2e]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">
              Desempenho por Horário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-[#1e1e2e]/50 rounded-lg flex items-center justify-center">
              <p className="text-[#6e7191]">Heatmap será implementado aqui</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f1a] border-[#1e1e2e]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">
              Lucro por Dia da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-[#1e1e2e]/50 rounded-lg flex items-center justify-center">
              <p className="text-[#6e7191]">Gráfico de barras será implementado aqui</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f1a] border-[#1e1e2e]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">
              Drawdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-[#1e1e2e]/50 rounded-lg flex items-center justify-center">
              <p className="text-[#6e7191]">Gráfico de drawdown será implementado aqui</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f1a] border-[#1e1e2e]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">
              Setups Mais Lucrativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {setupsData.map((setup, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-[#1e1e2e]/50 rounded"
                >
                  <span className="text-white">{setup.name}</span>
                  <span className={setup.trend === "positive" ? "text-green-600" : "text-red-500"}>
                    {setup.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
