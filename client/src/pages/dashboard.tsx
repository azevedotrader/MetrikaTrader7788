import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, Scale, BarChart3 } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="p-6 space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="P&L Total"
          value="+R$ 15.680"
          subtitle="+12.3% este mês"
          icon={TrendingUp}
          trend="up"
          iconColor="text-green-400"
        />
        <MetricCard
          title="Taxa de Acerto"
          value="68.4%"
          subtitle="47 de 69 trades"
          icon={Target}
          iconColor="text-blue-400"
        />
        <MetricCard
          title="RR Médio"
          value="1.84"
          subtitle="Acima da meta"
          icon={Scale}
          iconColor="text-purple-400"
        />
        <MetricCard
          title="Total de Trades"
          value="69"
          subtitle="Este mês"
          icon={BarChart3}
          iconColor="text-yellow-400"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">
              Evolução do Capital
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-slate-700/50 rounded-lg flex items-center justify-center">
              <p className="text-slate-400">Gráfico de linha será implementado aqui</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">
              Desempenho por Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-slate-700/50 rounded-lg flex items-center justify-center">
              <p className="text-slate-400">Gráfico de pizza será implementado aqui</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
