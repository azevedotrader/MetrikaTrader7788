import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, BarChart2, Activity } from "lucide-react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function ResultBadge({ resultado }: { resultado: string }) {
  if (resultado === 'take') return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Take</Badge>;
  if (resultado === 'loss') return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Loss</Badge>;
  return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">BE</Badge>;
}

export default function ClubeDoGrafico() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/clube-do-grafico"],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics;
  const trades: any[] = data?.trades || [];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-primary" />
            Relatório do Clube do Gráfico
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Dados em tempo real · Somente leitura · Atualiza a cada 30s
          </p>
        </div>
        <Badge variant="outline" className="text-green-400 border-green-500/30 bg-green-500/10">
          <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse inline-block"></span>
          Ao vivo
        </Badge>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metrics.totalTrades}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Assertividade</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{metrics.winRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">PNL Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${metrics.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(metrics.totalPnl)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">R/R Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{metrics.rrRatio}x</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-400" /> Ganhos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-400">{metrics.winners}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-red-400" /> Perdas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-400">{metrics.losers}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trade Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Log de Trades ({trades.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 text-muted-foreground font-medium">Data/Hora</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Ativo</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Mercado</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Direção</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Resultado</th>
                  <th className="text-right p-3 text-muted-foreground font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-muted-foreground">
                      Nenhum trade registrado ainda
                    </td>
                  </tr>
                ) : (
                  trades.map((trade: any) => (
                    <tr key={trade.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono text-xs">{formatDate(trade.dataHora || trade.createdAt)}</td>
                      <td className="p-3 font-semibold">{trade.ativo || '-'}</td>
                      <td className="p-3 capitalize text-muted-foreground">{trade.mercado || '-'}</td>
                      <td className="p-3">
                        <span className={trade.tipo === 'compra' ? 'text-green-400' : 'text-red-400'}>
                          {trade.tipo === 'compra' ? '▲ Compra' : '▼ Venda'}
                        </span>
                      </td>
                      <td className="p-3">
                        <ResultBadge resultado={trade.resultado || ''} />
                      </td>
                      <td className={`p-3 text-right font-mono font-semibold ${
                        parseFloat(trade.valorFinanceiro || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {trade.valorFinanceiro ? formatCurrency(parseFloat(String(trade.valorFinanceiro))) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
