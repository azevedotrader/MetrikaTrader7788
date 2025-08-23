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
  calendarData?: any[];
  className?: string;
}

export function TradingCalendar({ trades = [], calendarData = [], className }: TradingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Dias da semana - versão curta para mobile
  const weekDays = isMobile ? 
    ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] :
    ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
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

  // Processar trades reais para o calendário
  const generateTradeData = (): TradeDay[] => {
    const tradesByDay = new Map<number, { pnl: number; trades: number; winningTrades: number }>();
    
    if (trades && trades.length > 0) {
      trades.forEach((trade: any) => {
        const tradeDate = new Date(trade.dataHora || trade.data || Date.now());
        if (tradeDate.getMonth() === month && tradeDate.getFullYear() === year) {
          const day = tradeDate.getDate();
          const pnl = parseFloat(trade.resultado) || 0;
          const isWinning = pnl > 0;
          
          if (tradesByDay.has(day)) {
            const existing = tradesByDay.get(day)!;
            tradesByDay.set(day, {
              pnl: existing.pnl + pnl,
              trades: existing.trades + 1,
              winningTrades: existing.winningTrades + (isWinning ? 1 : 0)
            });
          } else {
            tradesByDay.set(day, { pnl, trades: 1, winningTrades: isWinning ? 1 : 0 });
          }
        }
      });
      
      return Array.from(tradesByDay.entries()).map(([date, data]) => ({
        date,
        pnl: Math.round(data.pnl),
        trades: data.trades,
        winRate: (data.winningTrades / data.trades) * 100
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

  // Renderizar célula do dia - versão mobile otimizada
  const renderDayCell = (dayNumber: number | null, isCurrentMonth: boolean = true) => {
    if (!dayNumber || !isCurrentMonth) {
      return <div className={cn(
        "p-1 border-r border-b border-zinc-700",
        isMobile ? "h-[110px]" : "h-20"
      )}></div>;
    }

    const tradeDay = tradeDays.find(td => td.date === dayNumber);
    const hasData = !!tradeDay;
    const isProfit = tradeDay && tradeDay.pnl > 0;
    const isToday = new Date().getDate() === dayNumber && 
                   new Date().getMonth() === month && 
                   new Date().getFullYear() === year;

    return (
      <div className={cn(
        "border-r border-b border-zinc-700 relative group hover:bg-zinc-800/50 transition-colors overflow-hidden",
        isMobile ? "h-[110px] p-2" : "h-20 p-1",
        isToday && "bg-zinc-800/50 border-zinc-600",
        hasData && (isProfit ? "bg-green-950/20" : "bg-red-950/20")
      )}>
        <div className="flex flex-col h-full">
          <div className={cn(
            "font-medium",
            isMobile ? "text-sm mb-1" : "text-sm",
            isToday ? "text-white" : "text-zinc-400"
          )}>
            {dayNumber}
          </div>
          
          {hasData && tradeDay && (
            <div className="flex-1 flex flex-col justify-start">
              <div className={cn(
                "font-bold",
                isMobile ? "text-sm" : "text-sm",
                isProfit ? "text-green-400" : "text-red-400"
              )}>
                {isMobile ? 
                  `${isProfit ? '+' : ''}${Math.abs(tradeDay.pnl) >= 1000 ? 
                    `${(tradeDay.pnl/1000).toFixed(1)}k` : 
                    tradeDay.pnl.toFixed(0)}` :
                  `${isProfit ? '+' : ''}R$ ${Math.abs(tradeDay.pnl).toLocaleString('pt-BR')}`
                }
              </div>
              <div className={cn(
                "text-zinc-500",
                isMobile ? "text-[11px] leading-tight" : "text-xs"
              )}>
                {tradeDay.trades} trade{tradeDay.trades !== 1 ? 's' : ''}
              </div>
              {isMobile && tradeDay.winRate && (
                <div className="text-[10px] text-zinc-600 leading-tight">
                  {tradeDay.winRate.toFixed(0)}% win
                </div>
              )}
              {!isMobile && tradeDay.winRate && (
                <div className="text-[10px] text-zinc-600">
                  {tradeDay.winRate.toFixed(0)}% win
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderizar resumo semanal - apenas desktop
  const renderWeekSummary = (week: WeekSummary) => {
    const isProfit = week.pnl > 0;
    
    return (
      <div className="bg-zinc-800/50 border-l border-zinc-700 p-3 min-h-[80px] flex flex-col justify-center">
        <div className="text-xs text-zinc-400 mb-1">Semana {week.weekNumber}</div>
        <div className={cn(
          "font-bold text-sm mb-1",
          isProfit ? "text-green-400" : "text-red-400"
        )}>
          {isProfit ? '+' : ''}R$ {Math.abs(week.pnl).toLocaleString('pt-BR')}
        </div>
        <div className="text-xs text-zinc-400">
          {week.days} dia{week.days !== 1 ? 's' : ''}
        </div>
      </div>
    );
  };

  // Estatísticas mensais
  const monthlyStats = {
    totalPnl: tradeDays.reduce((sum, day) => sum + day.pnl, 0),
    totalTrades: tradeDays.reduce((sum, day) => sum + day.trades, 0),
    winRate: Math.round((tradeDays.filter(day => day.pnl > 0).length / tradeDays.length) * 100) || 0,
    tradingDays: tradeDays.length
  };

  return (
    <Card 
      className={cn("bg-zinc-900 border-zinc-700", isMobile ? "mb-10" : "mb-8", className)}
      style={{ marginBottom: '20px' }}
    >
      <CardHeader className={cn(isMobile ? "pb-2" : "pb-4")}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "text-white flex items-center gap-2",
            isMobile ? "text-base" : "text-lg"
          )}>
            <Calendar className={cn(isMobile ? "w-4 h-4" : "w-5 h-5")} />
            <span className="hidden md:inline">Calendário de Trading</span>
            <span className="md:hidden">Trading</span>
          </CardTitle>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="text-zinc-400 hover:text-white p-1"
            >
              <ChevronLeft className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} />
            </Button>
            <span className={cn(
              "text-white font-medium capitalize text-center",
              isMobile ? "min-w-[120px] text-sm" : "min-w-[160px]"
            )}>
              {monthName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="text-zinc-400 hover:text-white p-1"
            >
              <ChevronRight className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} />
            </Button>
          </div>
        </div>
        
        {/* Estatísticas mensais compactas - mobile */}
        {isMobile && (
          <div className="mt-3 pt-3 border-t border-zinc-700">
            <div className="flex justify-between items-center text-xs">
              <div className="text-zinc-400">
                Estatísticas do mês:
              </div>
              <div className={cn(
                "font-bold",
                monthlyStats.totalPnl >= 0 ? "text-green-400" : "text-red-400"
              )}>
                {monthlyStats.totalPnl >= 0 ? '+' : ''}R$ {Math.abs(monthlyStats.totalPnl).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              {monthlyStats.tradingDays} dias • {monthlyStats.totalTrades} trades • {monthlyStats.winRate}% win
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0 pb-4">
        <div className={cn(
          "grid bg-zinc-800",
          isMobile ? "grid-cols-7" : "grid-cols-8"
        )}>
          {/* Cabeçalhos dos dias da semana */}
          {weekDays.map(day => (
            <div key={day} className={cn(
              "text-center font-medium text-zinc-300 border-r border-b border-zinc-700",
              isMobile ? "p-2 text-xs" : "p-3 text-sm"
            )}>
              {day}
            </div>
          ))}
          {!isMobile && (
            <div className="p-3 text-center text-sm font-medium text-zinc-300 border-b border-zinc-700">
              Resumo
            </div>
          )}
          
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
                if (!isMobile) {
                  const currentWeekSummary = weekSummaries[weekIndex];
                  week.push(
                    <div key={`week-${weekIndex}`}>
                      {currentWeekSummary ? renderWeekSummary(currentWeekSummary) : 
                       <div className="bg-zinc-800/50 border-l border-zinc-700 p-3 min-h-[80px]"></div>}
                    </div>
                  );
                }
                
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
              if (!isMobile) {
                const currentWeekSummary = weekSummaries[weekIndex];
                week.push(
                  <div key={`week-${weekIndex}`}>
                    {currentWeekSummary ? renderWeekSummary(currentWeekSummary) : 
                     <div className="bg-zinc-800/50 border-l border-zinc-700 p-3 min-h-[80px]"></div>}
                  </div>
                );
              }
              calendar.push(...week);
            }
            
            return calendar;
          })()}
        </div>

        {/* Resumo mensal - desktop */}
        {!isMobile && (
          <div className="p-4 border-t border-zinc-700 bg-zinc-800/30">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {monthlyStats.tradingDays}
                </div>
                <div className="text-sm text-zinc-400">Dias de Trading</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {monthlyStats.totalTrades}
                </div>
                <div className="text-sm text-zinc-400">Total de Trades</div>
              </div>
              <div className="text-center">
                <div className={cn(
                  "text-2xl font-bold",
                  monthlyStats.totalPnl > 0 ? "text-green-400" : "text-red-400"
                )}>
                  {monthlyStats.totalPnl > 0 ? '+' : ''}
                  R$ {Math.abs(monthlyStats.totalPnl).toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-zinc-400">P&L Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {monthlyStats.winRate}%
                </div>
                <div className="text-sm text-zinc-400">Taxa de Acerto</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}