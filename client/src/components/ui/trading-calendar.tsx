import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface TradeDay {
  date: number;
  pnl: number;
  trades: number;
  winRate?: number;
}

interface WeekSummary {
  weekNumber: number;
  pnl: number;
  days: number;
  trades: number;
}

interface TradingCalendarProps {
  trades?: any[];
  className?: string;
}

export function TradingCalendar({ trades = [], className }: TradingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Dias da semana
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  // Navegar entre meses
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Obter informações do mês atual
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  
  // Calcular dias do mês
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = domingo
  const daysInMonth = lastDayOfMonth.getDate();

  // Processar trades reais ou gerar dados mock se não houver trades
  const generateTradeData = (): TradeDay[] => {
    if (trades && trades.length > 0) {
      // Processar trades reais
      const tradesByDay = new Map<number, { pnl: number; trades: number }>();
      
      trades.forEach((trade: any) => {
        const tradeDate = new Date(trade.dataHora || trade.data || Date.now());
        if (tradeDate.getMonth() === month && tradeDate.getFullYear() === year) {
          const day = tradeDate.getDate();
          const pnl = parseFloat(trade.resultado) || 0;
          
          if (tradesByDay.has(day)) {
            const existing = tradesByDay.get(day)!;
            tradesByDay.set(day, {
              pnl: existing.pnl + pnl,
              trades: existing.trades + 1
            });
          } else {
            tradesByDay.set(day, { pnl, trades: 1 });
          }
        }
      });
      
      return Array.from(tradesByDay.entries()).map(([date, data]) => ({
        date,
        pnl: Math.round(data.pnl),
        trades: data.trades,
        winRate: undefined // Pode ser calculado se necessário
      }));
    }
    
    // Gerar dados mock apenas se não houver trades reais
    const tradeDays: TradeDay[] = [];
    const tradingDays = [2, 3, 5, 8, 9, 10, 12, 15, 16, 17, 19, 22, 23, 24, 26, 29, 30];
    
    tradingDays.forEach(day => {
      if (day <= daysInMonth) {
        const isProfit = Math.random() > 0.35;
        const pnl = isProfit 
          ? Math.random() * 2000 + 200
          : -(Math.random() * 800 + 100);
        
        tradeDays.push({
          date: day,
          pnl: Math.round(pnl),
          trades: Math.floor(Math.random() * 8) + 1,
          winRate: Math.random() * 40 + 50
        });
      }
    });
    
    return tradeDays;
  };

  const tradeDays = generateTradeData();

  // Calcular resumos semanais
  const calculateWeekSummaries = (): WeekSummary[] => {
    const weeks: WeekSummary[] = [];
    const calendar: (TradeDay | null)[][] = [];
    
    // Criar matriz do calendário
    let week: (TradeDay | null)[] = [];
    
    // Dias vazios no início
    for (let i = 0; i < firstDayOfWeek; i++) {
      week.push(null);
    }
    
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const tradeDay = tradeDays.find(td => td.date === day);
      week.push(tradeDay || null);
      
      if (week.length === 7) {
        calendar.push(week);
        week = [];
      }
    }
    
    // Completar última semana se necessário
    while (week.length < 7 && week.length > 0) {
      week.push(null);
    }
    if (week.length > 0) {
      calendar.push(week);
    }

    // Calcular resumos por semana
    calendar.forEach((weekDays, index) => {
      const validDays = weekDays.filter(day => day !== null) as TradeDay[];
      const totalPnl = validDays.reduce((sum, day) => sum + day.pnl, 0);
      const totalTrades = validDays.reduce((sum, day) => sum + day.trades, 0);
      const tradingDays = validDays.length;

      if (tradingDays > 0) {
        weeks.push({
          weekNumber: index + 1,
          pnl: totalPnl,
          days: tradingDays,
          trades: totalTrades
        });
      }
    });

    return weeks;
  };

  const weekSummaries = calculateWeekSummaries();

  // Renderizar célula do dia
  const renderDayCell = (dayNumber: number | null, isCurrentMonth: boolean = true) => {
    if (!dayNumber || !isCurrentMonth) {
      return <div className="h-16 p-1"></div>;
    }

    const tradeDay = tradeDays.find(td => td.date === dayNumber);
    const hasData = !!tradeDay;
    const isProfit = tradeDay && tradeDay.pnl > 0;
    const isToday = new Date().getDate() === dayNumber && 
                   new Date().getMonth() === month && 
                   new Date().getFullYear() === year;

    return (
      <div className={cn(
        "h-16 p-1 border-r border-b border-slate-700 relative group hover:bg-slate-800/50 transition-colors",
        isToday && "bg-blue-500/10 border-blue-500/30"
      )}>
        <div className="flex flex-col h-full">
          <div className={cn(
            "text-sm font-medium mb-1",
            isToday ? "text-blue-400" : "text-slate-300"
          )}>
            {dayNumber}
          </div>
          
          {hasData && tradeDay && (
            <div className="flex-1 flex flex-col justify-center">
              <div className={cn(
                "text-xs font-semibold mb-1",
                isProfit ? "text-green-400" : "text-red-400"
              )}>
                {isProfit ? '+' : ''}R$ {Math.abs(tradeDay.pnl).toLocaleString('pt-BR')}
              </div>
              <div className="text-xs text-slate-400">
                {tradeDay.trades} trade{tradeDay.trades !== 1 ? 's' : ''}
              </div>
            </div>
          )}
          
          {hasData && (
            <div className={cn(
              "absolute top-1 right-1 w-2 h-2 rounded-full",
              isProfit ? "bg-green-400" : "bg-red-400"
            )}></div>
          )}
        </div>
      </div>
    );
  };

  // Renderizar resumo semanal
  const renderWeekSummary = (week: WeekSummary) => {
    const isProfit = week.pnl > 0;
    
    return (
      <div className="bg-slate-800/50 border-l border-slate-700 p-3 min-h-[64px] flex flex-col justify-center">
        <div className="text-xs text-slate-400 mb-1">Semana {week.weekNumber}</div>
        <div className={cn(
          "font-bold text-sm mb-1",
          isProfit ? "text-green-400" : "text-red-400"
        )}>
          {isProfit ? '+' : ''}R$ {Math.abs(week.pnl).toLocaleString('pt-BR')}
        </div>
        <div className="text-xs text-slate-400">
          {week.days} dia{week.days !== 1 ? 's' : ''}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("bg-slate-900 border-slate-700", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendário de Trading
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-white font-medium capitalize min-w-[160px] text-center">
              {monthName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="text-slate-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-8 bg-slate-800">
          {/* Cabeçalhos dos dias da semana */}
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-slate-300 border-r border-slate-700">
              {day}
            </div>
          ))}
          <div className="p-3 text-center text-sm font-medium text-slate-300">
            Resumo
          </div>
          
          {/* Calendário principal */}
          {(() => {
            const calendar: JSX.Element[] = [];
            let week: JSX.Element[] = [];
            let weekIndex = 0;
            
            // Dias vazios no início
            for (let i = 0; i < firstDayOfWeek; i++) {
              week.push(
                <div key={`empty-${i}`}>
                  {renderDayCell(null, false)}
                </div>
              );
            }
            
            // Dias do mês
            for (let day = 1; day <= daysInMonth; day++) {
              week.push(
                <div key={day}>
                  {renderDayCell(day)}
                </div>
              );
              
              if (week.length === 7) {
                const currentWeekSummary = weekSummaries[weekIndex];
                week.push(
                  <div key={`week-${weekIndex}`}>
                    {currentWeekSummary ? renderWeekSummary(currentWeekSummary) : 
                     <div className="bg-slate-800/50 border-l border-slate-700 p-3 min-h-[64px]"></div>}
                  </div>
                );
                
                calendar.push(...week);
                week = [];
                weekIndex++;
              }
            }
            
            // Completar última semana
            while (week.length < 7 && week.length > 0) {
              week.push(
                <div key={`empty-end-${week.length}`}>
                  {renderDayCell(null, false)}
                </div>
              );
            }
            
            if (week.length > 0) {
              const currentWeekSummary = weekSummaries[weekIndex];
              week.push(
                <div key={`week-${weekIndex}`}>
                  {currentWeekSummary ? renderWeekSummary(currentWeekSummary) : 
                   <div className="bg-slate-800/50 border-l border-slate-700 p-3 min-h-[64px]"></div>}
                </div>
              );
              calendar.push(...week);
            }
            
            return calendar;
          })()}
        </div>

        {/* Resumo mensal */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {tradeDays.length}
              </div>
              <div className="text-sm text-slate-400">Dias de Trading</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {tradeDays.reduce((sum, day) => sum + day.trades, 0)}
              </div>
              <div className="text-sm text-slate-400">Total de Trades</div>
            </div>
            <div className="text-center">
              <div className={cn(
                "text-2xl font-bold",
                tradeDays.reduce((sum, day) => sum + day.pnl, 0) > 0 ? "text-green-400" : "text-red-400"
              )}>
                {tradeDays.reduce((sum, day) => sum + day.pnl, 0) > 0 ? '+' : ''}
                R$ {Math.abs(tradeDays.reduce((sum, day) => sum + day.pnl, 0)).toLocaleString('pt-BR')}
              </div>
              <div className="text-sm text-slate-400">P&L Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {Math.round((tradeDays.filter(day => day.pnl > 0).length / tradeDays.length) * 100) || 0}%
              </div>
              <div className="text-sm text-slate-400">Taxa de Acerto</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}