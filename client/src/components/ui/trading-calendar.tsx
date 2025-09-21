import { useState } from "react";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DiaryModal } from "@/components/ui/diary-modal";
import { DayDetailsModal } from "@/components/ui/day-details-modal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isSameDay } from "date-fns";
import type { DiaryEntry } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";
import metrikaLogo from "@assets/bb593927-43a1-4153-a7cb-c63e789ec7c3_1757781377777.png";

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
  const [selectedDiaryEntry, setSelectedDiaryEntry] = useState<
    DiaryEntry | undefined
  >(undefined);
  // Remover detecção JS de mobile - usar breakpoints Tailwind CSS
  const queryClient = useQueryClient();

  // Buscar entradas do diário
  const { data: diaryEntries = [] } = useQuery<DiaryEntry[]>({
    queryKey: ["/api/diary"],
    enabled: true,
  });

  // Dias da semana - versão curta para mobile
  const weekDays = [
    t("calendar.sun_short"),
    t("calendar.mon_short"),
    t("calendar.tue_short"),
    t("calendar.wed_short"),
    t("calendar.thu_short"),
    t("calendar.fri_short"),
    t("calendar.sat_short"),
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
    const targetDateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    return diaryEntries.find((entry) => {
      const entryDate = new Date(entry.date);
      const entryDateString = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, "0")}-${String(entryDate.getDate()).padStart(2, "0")}`;
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
  const locale =
    language === "en" ? "en-US" : language === "es" ? "es-ES" : "pt-BR";
  const monthName = currentDate.toLocaleDateString(locale, { month: "long" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Processar dados reais dos trades
  const processRealTradeData = (): TradeDay[] => {
    const tradeDays: TradeDay[] = [];

    // Agrupar trades por dia do mês atual
    const monthTrades = trades.filter((trade) => {
      // Usar dataHora se disponível, senão date
      const dateStr = trade.dataHora || trade.date;
      const tradeDate = new Date(dateStr);
      return tradeDate.getFullYear() === year && tradeDate.getMonth() === month;
    });

    // Criar mapa de trades por dia
    const tradesByDay = new Map<number, any[]>();
    monthTrades.forEach((trade) => {
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
      const totalPnl = dayTrades.reduce(
        (sum, trade) => sum + (parseFloat(trade.resultado) || trade.pnl || 0),
        0,
      );
      const winningTrades = dayTrades.filter(
        (trade) => (parseFloat(trade.resultado) || trade.pnl || 0) > 0,
      ).length;
      const winRate =
        dayTrades.length > 0 ? (winningTrades / dayTrades.length) * 100 : 0;

      // Calcular R/R médio do dia
      const tradesComRR = dayTrades.filter((trade) => {
        const alvo = parseFloat(trade.alvo) || 0;
        const stop = parseFloat(trade.stop) || 0;
        return alvo > 0 && stop > 0;
      });

      const avgRR =
        tradesComRR.length > 0
          ? tradesComRR.reduce((sum, trade) => {
              const alvo = parseFloat(trade.alvo);
              const stop = parseFloat(trade.stop);
              return sum + alvo / stop;
            }, 0) / tradesComRR.length
          : 0;

      // Maior perda e maior ganho do dia
      const results = dayTrades.map(
        (trade) => parseFloat(trade.resultado) || trade.pnl || 0,
      );
      const maxWin = Math.max(...results.filter((r) => r > 0), 0);
      const maxLoss = Math.min(...results.filter((r) => r < 0), 0);

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

  // Renderizar célula do dia - versão responsiva otimizada
  const renderDayCell = (
    dayNumber: number | null,
    isCurrentMonth: boolean = true,
  ) => {
    if (!dayNumber || !isCurrentMonth) {
      return (
        <div className="p-1 border-r border-b border-zinc-700 h-[85px] sm:h-[95px] md:h-[105px] lg:h-[115px]">
        </div>
      );
    }

    const tradeDay = tradeDays.find((td) => td.date === dayNumber);
    const hasData = !!tradeDay;
    const isProfit = tradeDay && tradeDay.pnl > 0;
    const isBreakEven = tradeDay && tradeDay.pnl === 0;
    const isLoss = tradeDay && tradeDay.pnl < 0;
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
          "border-r border-b border-zinc-700 relative group hover:bg-zinc-800/50 transition-all duration-200 overflow-hidden cursor-pointer h-[85px] sm:h-[95px] md:h-[105px] lg:h-[115px] p-1.5 sm:p-2 md:p-2.5",
          isToday && "bg-zinc-800/60 border-zinc-500 ring-1 ring-zinc-600/50",
          hasData && isProfit && "bg-green-600/90 hover:bg-green-600/95 border-green-500/50 shadow-sm shadow-green-900/10",
          hasData && isLoss && "bg-red-500/90 hover:bg-red-500/95 border-red-400/50 shadow-sm shadow-red-900/10",
          hasData && isBreakEven && "bg-yellow-500/90 hover:bg-yellow-500/95 border-yellow-400/50 shadow-sm shadow-yellow-900/10",
          !hasData && "hover:bg-zinc-800/30",
        )}
        onClick={() => handleDateClick(dayDate)}
        data-testid={`calendar-day-${dayNumber}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-1 sm:mb-1.5">
            <div
              className={cn(
                "font-semibold text-sm sm:text-base md:text-lg",
                hasData && isBreakEven ? "text-zinc-900" : isToday ? "text-white" : hasData ? "text-white/90" : "text-zinc-400",
              )}
            >
              {dayNumber}
            </div>
            {hasDiary && (
              <div title={t("calendar.diary_entry_available")} className="flex-shrink-0">
                <BookOpen
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 opacity-80 hover:opacity-100 transition-opacity"
                  data-testid={`diary-indicator-${dayNumber}`}
                />
              </div>
            )}
          </div>

          {hasData && tradeDay && (
            <div className="flex-1 flex flex-col justify-between space-y-1 sm:space-y-1.5">
              {/* P&L Principal - sempre mostrar */}
              <div
                className="font-bold leading-tight text-white px-2 py-1.5 rounded-lg bg-black/80 text-center shadow-xl text-xs sm:text-sm md:text-base backdrop-blur-md border border-white/30"
                style={{ 
                  textShadow: '0 0 8px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.9)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(0,0,0,0.4)'
                }}
              >
                <span className="sm:hidden">
                  {isProfit ? "+" : ""}{Math.abs(tradeDay.pnl) >= 1000 ? `${(tradeDay.pnl / 1000).toFixed(1)}k` : tradeDay.pnl.toFixed(0)}
                </span>
                <span className="hidden sm:inline md:hidden">
                  {isProfit ? "+" : ""}R$ {Math.abs(tradeDay.pnl) >= 1000 ? `${(tradeDay.pnl / 1000).toFixed(1)}k` : tradeDay.pnl.toFixed(0)}
                </span>
                <span className="hidden md:inline">
                  {isProfit ? "+" : ""}R$ {Math.abs(tradeDay.pnl).toLocaleString(locale, { maximumFractionDigits: 0 })}
                </span>
              </div>

              {/* Informações secundárias */}
              <div className="space-y-0.5 sm:space-y-1">
                {/* Quantidade de trades */}
                <div
                  className={cn(
                    "leading-tight font-semibold px-2 py-1 rounded-lg text-center text-[10px] sm:text-xs border shadow-lg backdrop-blur-sm",
                    isBreakEven 
                      ? "bg-white/85 text-zinc-900 border-zinc-900/30" 
                      : "bg-black/75 text-white border-white/25"
                  )}
                  style={!isBreakEven ? {
                    textShadow: '0 0 6px rgba(255,255,255,0.6), 1px 1px 2px rgba(0,0,0,0.8)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 6px rgba(0,0,0,0.3)'
                  } : {
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px rgba(0,0,0,0.2)'
                  }}
                >
                  {tradeDay.trades} {tradeDay.trades === 1 ? t("calendar.trade") : t("calendar.trades")}
                </div>

                {/* Taxa de acerto - só mostrar se houver múltiplos trades */}
                {tradeDay.trades > 1 && tradeDay.winRate !== undefined && (
                  <div
                    className={cn(
                      "leading-tight font-semibold px-2 py-1 rounded-lg text-center text-[9px] sm:text-[10px] border shadow-lg backdrop-blur-sm",
                      isBreakEven 
                        ? "bg-white/85 text-zinc-900 border-zinc-900/30" 
                        : "bg-black/75 text-white border-white/25"
                    )}
                    style={!isBreakEven ? {
                      textShadow: '0 0 6px rgba(255,255,255,0.6), 1px 1px 2px rgba(0,0,0,0.8)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 6px rgba(0,0,0,0.3)'
                    } : {
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px rgba(0,0,0,0.2)'
                    }}
                  >
                    {tradeDay.winRate.toFixed(0)}% {t("calendar.win")}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Indicador de hover para adicionar entrada */}
          <div className="absolute inset-0 bg-zinc-900/70 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center backdrop-blur-sm">
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-200 drop-shadow-md" />
          </div>
        </div>
      </div>
    );
  };

  // Renderizar resumo semanal - apenas desktop
  const renderWeekSummary = (week: WeekSummary) => {
    const isProfit = week.pnl > 0;

    return (
      <div className={cn(
        "border-l border-zinc-700 p-3 min-h-[105px] lg:min-h-[115px] flex flex-col justify-center transition-colors shadow-lg",
        isProfit ? "bg-green-600/95 hover:bg-green-600/100 border-green-500/50" : week.pnl < 0 ? "bg-red-500/95 hover:bg-red-500/100 border-red-400/50" : "bg-zinc-800/70 hover:bg-zinc-800/80 border-zinc-600/50"
      )}>
        <div className="text-xs text-zinc-200 mb-1.5 font-semibold"
          style={{ textShadow: '0 0 4px rgba(255,255,255,0.5), 1px 1px 2px rgba(0,0,0,0.8)' }}>
          {t("calendar.week")} {week.weekNumber}
        </div>
        <div
          className="font-bold text-sm md:text-base mb-1.5 text-white"
          style={{ textShadow: '0 0 8px rgba(255,255,255,0.8), 2px 2px 4px rgba(0,0,0,0.9)' }}
        >
          {isProfit ? "+" : ""}R$ {Math.abs(week.pnl).toLocaleString(locale, { maximumFractionDigits: 0 })}
        </div>
        <div className="text-xs text-zinc-200 font-semibold"
          style={{ textShadow: '0 0 4px rgba(255,255,255,0.4), 1px 1px 2px rgba(0,0,0,0.7)' }}>
          {week.days} {week.days !== 1 ? t("calendar.days") : t("calendar.day")}
        </div>
        <div className="text-[10px] text-zinc-200 mt-0.5 font-medium"
          style={{ textShadow: '0 0 4px rgba(255,255,255,0.4), 1px 1px 2px rgba(0,0,0,0.7)' }}>
          {week.trades} {week.trades === 1 ? t("calendar.trade") : t("calendar.trades")}
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
          "bg-zinc-900/95 border-zinc-700/70 relative mb-8 md:mb-10 shadow-xl backdrop-blur-sm",
          className,
        )}
        style={{ marginBottom: "50px" }}
      >
        {/* Logo watermark - mais visível, atrás do conteúdo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="opacity-[0.10] sm:opacity-[0.12] md:opacity-[0.15] lg:opacity-[0.18] flex items-center justify-center w-full h-full">
            <img 
              src={metrikaLogo} 
              alt="METRIKA" 
              style={{
                height: '450px',
                width: 'auto',
                objectFit: 'contain',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                filter: 'brightness(1.2) contrast(1.1)',
              }}
              className="block"
            />
          </div>
        </div>

        <CardHeader className="pb-3 sm:pb-4 md:pb-5 relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg md:text-xl text-white flex items-center gap-2 sm:gap-3">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
              <span className="hidden sm:inline">{t("calendar.title")}</span>
              <span className="sm:hidden">{t("calendar.title_short")}</span>
            </CardTitle>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth("prev")}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 p-1.5 sm:p-2 rounded-md transition-all"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <span className="text-sm sm:text-base md:text-lg text-white font-semibold capitalize text-center min-w-[120px] sm:min-w-[140px] md:min-w-[180px] px-2">
                {monthName} {year}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth("next")}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 p-1.5 sm:p-2 rounded-md transition-all"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 relative z-10">
          {/* Calendário */}
          <div className="grid grid-cols-7 md:grid-cols-8">
            {/* Cabeçalho dos dias da semana */}
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-zinc-300 border-r border-b border-zinc-700 py-2.5 sm:py-3 md:py-3.5 text-xs sm:text-sm bg-zinc-800/30"
              >
                {day}
              </div>
            ))}
            <div className="hidden md:block text-center font-semibold text-zinc-300 border-b border-zinc-700 py-3.5 text-sm bg-zinc-800/30">
              {t("calendar.week")}
            </div>

            {/* Dias do calendário */}
            {Array.from({
              length: Math.ceil((firstDayOfWeek + daysInMonth) / 7),
            })
              .map((_, weekIndex) =>
                [
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
                  weekSummaries[weekIndex] ? (
                    <div key={`week-summary-${weekIndex}`} className="hidden md:block">
                      {renderWeekSummary(weekSummaries[weekIndex])}
                    </div>
                  ) : (
                    <div
                      key={`week-empty-${weekIndex}`}
                      className="hidden md:block border-l border-zinc-700 min-h-[96px]"
                    ></div>
                  ),
                ].filter(Boolean),
              )
              .flat()}
          </div>

          {/* Estatísticas mensais - apenas mobile */}
          <div className="md:hidden border-t border-zinc-700 p-4 bg-zinc-900/50">
            <div className="text-center text-white font-semibold mb-4 text-base">
              {t("calendar.summary_of")} {monthName}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <div className="text-xl sm:text-2xl font-bold text-white mb-1">
                  {monthlyStats.tradingDays}
                </div>
                <div className="text-xs sm:text-sm text-zinc-400 font-medium">
                  {t("calendar.trading_days")}
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <div className="text-xl sm:text-2xl font-bold text-white mb-1">
                  {monthlyStats.totalTrades}
                </div>
                <div className="text-xs sm:text-sm text-zinc-400 font-medium">
                  {t("calendar.total_trades")}
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <div
                  className={cn(
                    "text-xl sm:text-2xl font-bold mb-1",
                    monthlyStats.totalPnl > 0
                      ? "text-green-600"
                      : "text-red-500",
                  )}
                >
                  {monthlyStats.totalPnl > 0 ? "+" : ""}
                  R$ {Math.abs(monthlyStats.totalPnl).toLocaleString(locale, { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs sm:text-sm text-zinc-400 font-medium">
                  {t("calendar.pnl_total")}
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <div className="text-xl sm:text-2xl font-bold text-white mb-1">
                  {monthlyStats.winRate}%
                </div>
                <div className="text-xs sm:text-sm text-zinc-400 font-medium">
                  {t("calendar.win_rate")}
                </div>
              </div>
            </div>
          </div>
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
