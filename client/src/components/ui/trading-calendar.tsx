import { useState } from "react";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Plus, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { DiaryModal } from "@/components/ui/diary-modal";
import { DayDetailsModal } from "@/components/ui/day-details-modal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isSameDay } from "date-fns";
import type { DiaryEntry } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

interface TradeDay {
  date: number;
  pnl: number;
  trades: number;
  winRate?: number;
  avgRR?: number;
  maxLoss?: number;
  maxWin?: number;
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
  onDateClick?: (date: Date, entry?: DiaryEntry) => void;
}

export function TradingCalendar({
  trades = [],
  calendarData = [],
  className,
  onDateClick,
}: TradingCalendarProps) {
  const { t, language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDayDetailsModalOpen, setIsDayDetailsModalOpen] = useState(false);
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);
  const [selectedDiaryEntry, setSelectedDiaryEntry] = useState<DiaryEntry | undefined>(undefined);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const queryClient = useQueryClient();

  // Buscar entradas do diário
  const { data: diaryEntries = [] } = useQuery<DiaryEntry[]>({
    queryKey: ["/api/diary"],
    enabled: true,
  });

  // Dias da semana - versão curta para mobile
  const weekDays = [
    t('calendar.sun_short'),
    t('calendar.mon_short'),
    t('calendar.tue_short'),
    t('calendar.wed_short'),
    t('calendar.thu_short'),
    t('calendar.fri_short'),
    t('calendar.sat_short')
  ];

  // Funções para o diário
  const handleDateClick = (date: Date) => {
    // Abrir modal de detalhes do dia
    setSelectedDate(date);
    setIsDayDetailsModalOpen(true);
  };

  const handleEditDiary = () => {
    if (!selectedDate) return;
    const existingEntry = getDiaryEntryForDate(selectedDate);
    
    // Fechar modal de detalhes e abrir modal de edição
    setIsDayDetailsModalOpen(false);
    setSelectedDiaryEntry(existingEntry);
    setIsDiaryModalOpen(true);
  };

  const handleDiaryModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/diary"] });
  };

  const getDiaryEntryForDate = (date: Date) => {
    const targetDateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    return diaryEntries.find(entry => {
      const entryDate = new Date(entry.date);
      const entryDateString = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
      return entryDateString === targetDateString;
    });
  };

  // Navegar entre meses
  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Dados do mês atual
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const locale = language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'pt-BR';
  const monthName = currentDate.toLocaleDateString(locale, { month: "long" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Processar dados reais dos trades
  const processRealTradeData = (): TradeDay[] => {
    const tradeDays: TradeDay[] = [];
    
    // Agrupar trades por dia do mês atual
    const monthTrades = trades.filter(trade => {
      // Usar dataHora se disponível, senão date
      const dateStr = trade.dataHora || trade.date;
      const tradeDate = new Date(dateStr);
      return tradeDate.getFullYear() === year && tradeDate.getMonth() === month;
    });

    // Criar mapa de trades por dia
    const tradesByDay = new Map<number, any[]>();
    monthTrades.forEach(trade => {
      const dateStr = trade.dataHora || trade.date;
      const tradeDate = new Date(dateStr);
      const day = tradeDate.getDate();
      
      if (!tradesByDay.has(day)) {
        tradesByDay.set(day, []);
      }
      tradesByDay.get(day)!.push(trade);
    });

    // Calcular estatísticas por dia
    tradesByDay.forEach((dayTrades, day) => {
      const totalPnl = dayTrades.reduce((sum, trade) => sum + (parseFloat(trade.resultado) || trade.pnl || 0), 0);
      const winningTrades = dayTrades.filter(trade => (parseFloat(trade.resultado) || trade.pnl || 0) > 0).length;
      const winRate = dayTrades.length > 0 ? (winningTrades / dayTrades.length) * 100 : 0;
      
      // Calcular R/R médio do dia
      const tradesComRR = dayTrades.filter(trade => {
        const alvo = parseFloat(trade.alvo) || 0;
        const stop = parseFloat(trade.stop) || 0;
        return alvo > 0 && stop > 0;
      });
      
      const avgRR = tradesComRR.length > 0 
        ? tradesComRR.reduce((sum, trade) => {
            const alvo = parseFloat(trade.alvo);
            const stop = parseFloat(trade.stop);
            return sum + (alvo / stop);
          }, 0) / tradesComRR.length
        : 0;
      
      // Maior perda e maior ganho do dia
      const results = dayTrades.map(trade => parseFloat(trade.resultado) || trade.pnl || 0);
      const maxWin = Math.max(...results.filter(r => r > 0), 0);
      const maxLoss = Math.min(...results.filter(r => r < 0), 0);

      tradeDays.push({
        date: day,
        pnl: totalPnl,
        trades: dayTrades.length,
        winRate: winRate,
        avgRR: avgRR,
        maxWin: maxWin,
        maxLoss: maxLoss,
      });
    });

    return tradeDays;
  };

  const tradeDays = processRealTradeData();

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
      const tradeDay = tradeDays.find((td) => td.date === day);
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
      const validDays = weekDays.filter((day) => day !== null) as TradeDay[];
      const totalPnl = validDays.reduce((sum, day) => sum + day.pnl, 0);
      const totalTrades = validDays.reduce((sum, day) => sum + day.trades, 0);
      const tradingDays = validDays.length;

      if (tradingDays > 0) {
        weeks.push({
          weekNumber: index + 1,
          pnl: totalPnl,
          days: tradingDays,
          trades: totalTrades,
        });
      }
    });

    return weeks;
  };

  const weekSummaries = calculateWeekSummaries();

  // Renderizar célula do dia - versão mobile otimizada
  const renderDayCell = (
    dayNumber: number | null,
    isCurrentMonth: boolean = true,
  ) => {
    if (!dayNumber || !isCurrentMonth) {
      return (
        <div
          className={cn(
            "p-1 border-r border-b border-zinc-700",
            isMobile ? "h-[130px]" : "h-24",
          )}
        ></div>
      );
    }

    const tradeDay = tradeDays.find((td) => td.date === dayNumber);
    const hasData = !!tradeDay;
    const isProfit = tradeDay && tradeDay.pnl > 0;
    const isToday =
      new Date().getDate() === dayNumber &&
      new Date().getMonth() === month &&
      new Date().getFullYear() === year;

    // Verificar se há entrada do diário para este dia
    const dayDate = new Date(year, month, dayNumber);
    const diaryEntry = getDiaryEntryForDate(dayDate);
    const hasDiary = !!diaryEntry;

    return (
      <div
        className={cn(
          "border-r border-b border-zinc-700 relative group hover:bg-zinc-800/50 transition-colors overflow-hidden cursor-pointer",
          isMobile ? "h-[130px] p-2" : "h-24 p-1",
          isToday && "bg-zinc-800/50 border-zinc-600",
          hasData && (isProfit ? "bg-green-950/20" : "bg-red-950/20"),
        )}
        onClick={() => handleDateClick(dayDate)}
        data-testid={`calendar-day-${dayNumber}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-1">
            <div
              className={cn(
                "font-medium",
                isMobile ? "text-sm" : "text-sm",
                isToday ? "text-white" : "text-zinc-400",
              )}
            >
              {dayNumber}
            </div>
            {hasDiary && (
              <div title="Entrada de diário disponível">
                <BookOpen 
                  className="w-3 h-3 text-blue-400 opacity-70" 
                  data-testid={`diary-indicator-${dayNumber}`}
                />
              </div>
            )}
          </div>

          {hasData && tradeDay && (
            <div className="flex-1 flex flex-col justify-start space-y-0.5">
              {/* P&L Principal */}
              <div
                className={cn(
                  "font-bold leading-tight",
                  isMobile ? "text-sm" : "text-sm",
                  isProfit ? "text-green-400" : "text-red-400",
                )}
              >
                {isMobile
                  ? `${isProfit ? "+" : ""}${
                      Math.abs(tradeDay.pnl) >= 1000
                        ? `${(tradeDay.pnl / 1000).toFixed(1)}k`
                        : tradeDay.pnl.toFixed(0)
                    }`
                  : `${isProfit ? "+" : ""}R$ ${Math.abs(tradeDay.pnl).toLocaleString(locale)}`}
              </div>
              
              {/* Número de trades */}
              <div
                className={cn(
                  "text-zinc-500 leading-tight",
                  isMobile ? "text-[10px]" : "text-[10px]",
                )}
              >
                {tradeDay.trades} trade{tradeDay.trades !== 1 ? "s" : ""}
              </div>
              
              {/* Taxa de acerto */}
              {tradeDay.winRate !== undefined && (
                <div className={cn(
                  "text-zinc-600 leading-tight",
                  isMobile ? "text-[9px]" : "text-[9px]"
                )}>
                  {tradeDay.winRate.toFixed(0)}% win
                </div>
              )}
              
              {/* R/R médio - só mostrar se houver dados válidos */}
              {tradeDay.avgRR && tradeDay.avgRR > 0.1 && (
                <div className={cn(
                  "text-blue-400 leading-tight font-medium",
                  isMobile ? "text-[9px]" : "text-[9px]"
                )}>
                  1:{tradeDay.avgRR.toFixed(2)}
                </div>
              )}
            </div>
          )}

          {/* Indicador de hover para adicionar entrada */}
          <div className="absolute inset-0 bg-zinc-800/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Plus className="w-4 h-4 text-zinc-300" />
          </div>
        </div>
      </div>
    );
  };

  // Renderizar resumo semanal - apenas desktop
  const renderWeekSummary = (week: WeekSummary) => {
    const isProfit = week.pnl > 0;

    return (
      <div className="bg-zinc-800/50 border-l border-zinc-700 p-3 min-h-[96px] flex flex-col justify-center">
        <div className="text-xs text-zinc-400 mb-1">
          Semana {week.weekNumber}
        </div>
        <div
          className={cn(
            "font-bold text-sm mb-1",
            isProfit ? "text-green-400" : "text-red-400",
          )}
        >
          {isProfit ? "+" : ""}R$ {Math.abs(week.pnl).toLocaleString(locale)}
        </div>
        <div className="text-xs text-zinc-400">
          {week.days} {week.days !== 1 ? t('calendar.days') : t('calendar.day')}
        </div>
      </div>
    );
  };

  // Estatísticas mensais
  const monthlyStats = {
    totalPnl: tradeDays.reduce((sum, day) => sum + day.pnl, 0),
    totalTrades: tradeDays.reduce((sum, day) => sum + day.trades, 0),
    winRate:
      Math.round(
        (tradeDays.filter((day) => day.pnl > 0).length / tradeDays.length) *
          100,
      ) || 0,
    tradingDays: tradeDays.length,
  };

  return (
    <>
      <Card
        className={cn(
          "bg-zinc-900 border-zinc-700",
          isMobile ? "mb-10" : "mb-8",
          className,
        )}
        style={{ marginBottom: "50px" }}
      >
        <CardHeader className={cn(isMobile ? "pb-2" : "pb-4")}>
          <div className="flex items-center justify-between">
            <CardTitle
              className={cn(
                "text-white flex items-center gap-2",
                isMobile ? "text-base" : "text-lg",
              )}
            >
              <Calendar className={cn(isMobile ? "w-4 h-4" : "w-5 h-5")} />
              <span className="hidden md:inline">{t('calendar.title')}</span>
              <span className="md:hidden">Trading</span>
            </CardTitle>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth("prev")}
                className="text-zinc-400 hover:text-white p-1"
              >
                <ChevronLeft className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} />
              </Button>
              <span
                className={cn(
                  "text-white font-medium capitalize text-center",
                  isMobile ? "min-w-[120px] text-sm" : "min-w-[160px]",
                )}
              >
                {monthName} {year}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth("next")}
                className="text-zinc-400 hover:text-white p-1"
              >
                <ChevronRight className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Calendário */}
          <div
            className={cn(
              "grid",
              isMobile ? "grid-cols-7" : "grid-cols-8", // 8 colunas no desktop (incluindo resumos semanais)
            )}
          >
            {/* Cabeçalho dos dias da semana */}
            {weekDays.map((day) => (
              <div
                key={day}
                className={cn(
                  "text-center font-medium text-zinc-400 border-r border-b border-zinc-700",
                  isMobile ? "py-2 text-xs" : "py-3 text-sm",
                )}
              >
                {day}
              </div>
            ))}
            {!isMobile && (
              <div className="text-center font-medium text-zinc-400 border-b border-zinc-700 py-3 text-sm">
                {t('calendar.week')}
              </div>
            )}

            {/* Dias do calendário */}
{Array.from({ length: Math.ceil((firstDayOfWeek + daysInMonth) / 7) }).map(
              (_, weekIndex) => [
                ...Array.from({ length: 7 }).map((_, dayIndex) => {
                  const dayNumber =
                    weekIndex * 7 + dayIndex - firstDayOfWeek + 1;
                  return (
                    <div key={`day-${weekIndex}-${dayIndex}`}>
                      {renderDayCell(
                        dayNumber > 0 && dayNumber <= daysInMonth
                          ? dayNumber
                          : null,
                      )}
                    </div>
                  );
                }),
                // Resumo semanal - apenas desktop
                !isMobile && weekSummaries[weekIndex] ? (
                  <div key={`week-summary-${weekIndex}`}>
                    {renderWeekSummary(weekSummaries[weekIndex])}
                  </div>
                ) : !isMobile ? (
                  <div
                    key={`week-empty-${weekIndex}`}
                    className="border-l border-zinc-700 min-h-[96px]"
                  ></div>
                ) : null,
              ].filter(Boolean),
            ).flat()}
          </div>

          {/* Estatísticas mensais - apenas mobile */}
          {isMobile && (
            <div className="border-t border-zinc-700 p-4">
              <div className="text-center text-white font-medium mb-3">
                {t('calendar.summary_of')} {monthName}
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {monthlyStats.tradingDays}
                  </div>
                  <div className="text-sm text-zinc-400">{t('calendar.trading_days')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {monthlyStats.totalTrades}
                  </div>
                  <div className="text-sm text-zinc-400">{t('calendar.total_trades')}</div>
                </div>
                <div className="text-center">
                  <div
                    className={cn(
                      "text-2xl font-bold",
                      monthlyStats.totalPnl > 0
                        ? "text-green-400"
                        : "text-red-400",
                    )}
                  >
                    {monthlyStats.totalPnl > 0 ? "+" : ""}
                    R$ {Math.abs(monthlyStats.totalPnl).toLocaleString(locale)}
                  </div>
                  <div className="text-sm text-zinc-400">{t('calendar.pnl_total')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {monthlyStats.winRate}%
                  </div>
                  <div className="text-sm text-zinc-400">{t('calendar.win_rate')}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Dia */}
      <DayDetailsModal
        isOpen={isDayDetailsModalOpen}
        onClose={() => setIsDayDetailsModalOpen(false)}
        selectedDate={selectedDate}
        onEditDiary={handleEditDiary}
      />

      {/* Modal do Diário */}
      <DiaryModal
        isOpen={isDiaryModalOpen}
        onClose={() => setIsDiaryModalOpen(false)}
        selectedDate={selectedDate}
        entry={selectedDiaryEntry}
        onSuccess={handleDiaryModalSuccess}
      />
    </>
  );
}