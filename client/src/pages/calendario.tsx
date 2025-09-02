import { useQuery } from "@tanstack/react-query";
import { TradingCalendar } from "@/components/ui/trading-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, BarChart3, TrendingUp } from "lucide-react";

export default function CalendarioPage() {
  const { data: trades = [] } = useQuery({ 
    queryKey: ['/api/trades'],
    staleTime: 0, // Sempre buscar dados frescos
    gcTime: 0   // Não manter cache (nova nomenclatura do React Query v5)
  });
  const { data: calendarData = [], isLoading: calendarLoading, error: calendarError } = useQuery<any[]>({ 
    queryKey: ['/api/calendar'],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  // Debug da consulta
  console.log("📊 Calendar Query Debug:", {
    calendarData,
    calendarLoading,
    calendarError,
    hasData: !!calendarData?.length
  });

  return (
    <div className="space-y-6 pb-8">

      {/* Instrucoes */}
      <Card className="rounded-lg border text-card-foreground shadow-sm border-slate-700 bg-[#141313c4]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Como Usar o Calendário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              <div>
                <div className="text-white font-medium mb-1">Dias Lucrativos</div>
                <div className="text-slate-400">Marcados com ponto verde, mostram o P&L positivo do dia</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              </div>
              <div>
                <div className="text-white font-medium mb-1">Dias com Prejuízo</div>
                <div className="text-slate-400">Marcados com ponto vermelho, mostram o P&L negativo do dia</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-slate-600/50 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <div className="text-white font-medium mb-1">Resumo Semanal</div>
                <div className="text-slate-400">Coluna lateral com totais consolidados por semana</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendário Principal */}
      <TradingCalendar 
        trades={trades} 
        calendarData={(calendarData as any[]) || []}
      />

      {/* Dicas de Análise */}
      <Card className="bg-[#070b12] border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Dicas de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="text-white font-medium mb-3">📈 Padrões Temporais</h4>
              <ul className="space-y-2 text-slate-400">
                <li>• Identifique quais dias da semana são mais lucrativos</li>
                <li>• Observe se há padrões em sequências de wins/losses</li>
                <li>• Analise a performance em diferentes semanas do mês</li>
                <li>• Compare meses para identificar sazonalidade</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-3">🎯 Estratégias de Melhoria</h4>
              <ul className="space-y-2 text-slate-400">
                <li>• Evite trading em dias consistentemente negativos</li>
                <li>• Aumente volume em dias/períodos mais lucrativos</li>
                <li>• Use breaks após sequências de perdas</li>
                <li>• Documente o que funcionou nos dias verdes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}