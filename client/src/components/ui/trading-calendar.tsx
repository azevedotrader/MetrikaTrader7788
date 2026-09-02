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
  rawTrades?: any[];
}

interface WeekSummary {
  weekNumber: number;
  pnl: number;
  rTotal: number;
  days: number;
  trades: number;
}

interface TradingCalendarProps {
  trades?: any[];
  calendarData?: any[];
  className?: string;
  onDateClick?: (date: Date, entry?: DiaryEntry) => void;
  hideData?: boolean;
}

export function TradingCalendar({
  trades = [],
  calendarData = [],
  className,
  onDateClick,
  hideData = false,
}: TradingCalendarProps) {
  const { t, language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showMode, setShowMode] = useState<"money" | "r">("money");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDayDetailsModalOpen, setIsDayDetailsModalOpen] = useState(false);
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);
  const [selectedDiaryEntry, setSelectedDiaryEntry] = useState<
    DiaryEntry | undefined
  >(undefined);
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
    setSelectedDate(date);
    setIsDayDetailsModalOpen(true);
  };

  const handleEditDiary = () => {
    if (!selectedDate) return;
    const existingEntry = getDiaryEntryForDate(selectedDate);
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

    const monthTrades = trades.filter((trade) => {
      const dateStr = trade.dataHora || trade.date;
      const tradeDate = new Date(dateStr);
      return tradeDate.getFullYear() === year && tradeDate.getMonth() === month;
    });

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
        rawTrades: dayTrades,
      });
    });

    return tradeDays;
  };

  const tradeDays = processRealTradeData();

  // Calcular resumos semanais
  const calculateWeekSummaries = (): WeekSummary[] => {
    const weeks: WeekSummary[] = [];

    const weekRanges = [
      { start: 1, end: 7 },
      { start: 8, end: 14 },
      { start: 15, end: 21 },
      { start: 22, end: daysInMonth },
    ];

    weekRanges.forEach((range, index) => {
      const weekTrades = tradeDays.filter(
        (td) => td.date >= range.start && td.date <= range.end
      );

      if (weekTrades.length > 0) {
        const totalPnl = weekTrades.reduce((sum, day) => sum + day.pnl, 0);
        const totalTrades = weekTrades.reduce((sum, day) => sum + day.trades, 0);
        const tradingDays = weekTrades.length;
        const rTotal = weekTrades.reduce((sum, day) => {
          const dayR = (day.rawTrades || []).reduce((s: number, t: any) => {
            const risco = parseFloat(t.risco || "0");
            const res = parseFloat(t.resultado || "0");
            return risco > 0 ? s + res / risco : s;
          }, 0);
          return sum + dayR;
        }, 0);

        weeks.push({
          weekNumber: index + 1,
          pnl: totalPnl,
          rTotal,
          days: tradingDays,
          trades: totalTrades,
        });
      }
    });

    return weeks;
  };

  const weekSummaries = calculateWeekSummaries();

  // Renderizar célula do dia
  const renderDayCell = (
    dayNumber: number | null,
    isCurrentMonth: boolean = true,
  ) => {
    if (!dayNumber || !isCurrentMonth) {
      return (
        <div className="p-1 border-r border-b border-[var(--brd)] h-[80px] sm:h-[120px] md:h-[155px] lg:h-[170px]">
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

    const dayDate = new Date(year, month, dayNumber);
    const diaryEntry = getDiaryEntryForDate(dayDate);
    const hasDiary = !!diaryEntry;

    return (
      <div
        className={cn(
          "border-r border-b border-[var(--brd)] relative transition-all duration-200 overflow-hidden cursor-pointer",
          "h-[80px] sm:h-[120px] md:h-[155px] lg:h-[170px] p-1 sm:p-2 md:p-2.5",
          "bg-[var(--card)]/60 shadow-sm",
          isToday && "ring-1 ring-inset ring-[var(--brd2)]",
          !hasData && "hover:bg-[var(--surf)]/80",
        )}
        onClick={() => handleDateClick(dayDate)}
        data-testid={`calendar-day-${dayNumber}`}
      >
        {/* Overlay de cor para dias com resultado */}
        {hasData && (
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-0 pointer-events-none",
              isLoss     && "bg-gradient-to-b from-[#FF1F3D]/20 to-[#FF1F3D]/8",
              isProfit   && "bg-gradient-to-b from-[#6EE000]/20 to-[#6EE000]/8",
              isBreakEven && "bg-gradient-to-b from-amber-500/25 to-amber-600/10"
            )}
          />
        )}

        {/* Número do dia */}
        <div
          className={cn(
            "absolute top-1 left-1 sm:top-1.5 sm:left-1.5 text-[10px] sm:text-[11px] md:text-xs font-semibold",
            isBreakEven ? "text-amber-900" : "text-[var(--text)]/80",
          )}
        >
          {dayNumber}
        </div>

        {/* Ícone do diário */}
        {hasDiary && (
          <div title={t("calendar.diary_entry_available")} className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5">
            <BookOpen
              className={cn(
                "w-3 h-3 sm:w-4 sm:h-4",
                isBreakEven ? "text-amber-900/70" : "text-[var(--text)]/70"
              )}
              data-testid={`diary-indicator-${dayNumber}`}
            />
          </div>
        )}

        {/* P&L centralizado */}
        {hasData && tradeDay && (
          <div className="flex h-full items-center justify-center">
            <div
              className={cn(
                "font-extrabold tracking-tight tabular-nums leading-none text-center",
                "text-sm sm:text-lg md:text-2xl",
                hideData
                  ? "text-[var(--dim)]"
                  : isBreakEven
                  ? "text-amber-900"
                  : isProfit
                  ? "text-[var(--gold)]"
                  : "text-[var(--r)]"
              )}
              style={{
                textShadow: hideData ? "none" : "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              {hideData ? (
                <span>•••••</span>
              ) : showMode === "r" ? (
                (() => {
                  const rTotal = (tradeDay.rawTrades || []).reduce((sum: number, t: any) => {
                    const risco = parseFloat(t.risco || "0");
                    const res = parseFloat(t.resultado || "0");
                    return risco > 0 ? sum + res / risco : sum;
                  }, 0);
                  return (
                    <span>
                      {rTotal >= 0 ? "+" : ""}{rTotal.toFixed(1)}R
                    </span>
                  );
                })()
              ) : (
                <>
                  <span className="sm:hidden">
                    {tradeDay.pnl >= 0 ? "+" : ""}{Math.abs(tradeDay.pnl) >= 1000 ? `${(tradeDay.pnl / 1000).toFixed(0)}k` : tradeDay.pnl.toFixed(0)}
                  </span>
                  <span className="hidden sm:inline md:hidden">
                    {tradeDay.pnl >= 0 ? "+" : ""}R$ {Math.abs(tradeDay.pnl) >= 1000 ? `${(tradeDay.pnl / 1000).toFixed(1)}k` : tradeDay.pnl.toFixed(0)}
                  </span>
                  <span className="hidden md:inline">
                    {tradeDay.pnl >= 0 ? "+" : ""}R$ {Math.abs(tradeDay.pnl).toLocaleString(locale, { maximumFractionDigits: 0 })}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Métricas secundárias */}
        {hasData && tradeDay && (
          <div className={cn(
            "absolute bottom-0.5 sm:bottom-1.5 left-0.5 right-0.5 sm:left-2 sm:right-2 flex items-center justify-center gap-1 sm:gap-2 text-[8px] sm:text-[10px] md:text-xs",
            isBreakEven ? "text-amber-900/80" : "text-[var(--text)]/75"
          )}>
            <span>{tradeDay.trades} <span className="hidden sm:inline">{tradeDay.trades === 1 ? t("calendar.trade") : t("calendar.trades")}</span><span className="sm:hidden">t</span></span>
            {tradeDay.trades > 1 && tradeDay.winRate !== undefined && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">{tradeDay.winRate.toFixed(0)}% {t("calendar.win")}</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // Renderizar resumo semanal
  const renderWeekSummary = (week: WeekSummary) => {
    const isProfit = week.pnl > 0;
    const isLoss   = week.pnl < 0;

    return (
      <div
        className={cn(
          "min-h-[155px] lg:min-h-[170px] grid place-items-center transition-colors relative",
          "bg-[var(--card)]/60 shadow-sm",
          "hover:brightness-105"
        )}
      >
        {/* Overlay de cor */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 pointer-events-none",
            isLoss   && "bg-gradient-to-b from-[#FF1F3D]/20 to-[#FF1F3D]/8",
            isProfit && "bg-gradient-to-b from-[#6EE000]/20 to-[#6EE000]/8",
            week.pnl === 0 && "bg-[var(--brd)]/20"
          )}
        />

        <div className="text-center relative z-10 px-1">
          <div className="text-xs text-[var(--dim)] mb-1">
            {t("calendar.week")} {week.weekNumber}
          </div>
          <div
            className={cn(
              "font-extrabold text-base md:text-lg tabular-nums mb-1",
              hideData
                ? "text-[var(--dim)]"
                : isProfit
                ? "text-[var(--gold)]"
                : isLoss
                ? "text-[var(--r)]"
                : "text-[var(--text)]"
            )}
            style={{ textShadow: hideData ? "none" : "0 1px 3px rgba(0,0,0,0.3)" }}
          >
            {hideData
              ? "•••••"
              : showMode === "r"
              ? `${week.rTotal >= 0 ? "+" : ""}${week.rTotal.toFixed(1)}R`
              : `${isProfit ? "+" : ""}R$ ${Math.abs(week.pnl).toLocaleString(locale, { maximumFractionDigits: 0 })}`}
          </div>
          <div className="text-[10px] text-[var(--dim)]">
            {week.days} {week.days !== 1 ? t("calendar.days") : t("calendar.day")} • {week.trades} {week.trades === 1 ? t("calendar.trade") : t("calendar.trades")}
          </div>
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
          "bg-[var(--card)] border-[var(--brd)] relative mb-8 md:mb-10 shadow-xl",
          className,
        )}
        style={{ marginBottom: "50px" }}
      >
        {/* Logo watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="opacity-[0.07] sm:opacity-[0.09] md:opacity-[0.12] flex items-center justify-center w-full h-full">
            <img
              src={metrikaLogo}
              alt="METRIKA"
              style={{
                height: "450px",
                width: "auto",
                objectFit: "contain",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                filter: "brightness(1.1) contrast(1.0)",
              }}
              className="block"
            />
          </div>
        </div>

        <CardHeader className="pb-3 sm:pb-4 md:pb-5 relative z-10 border-b border-[var(--brd)]">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg md:text-xl text-[var(--text)] flex items-center gap-2 sm:gap-3">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[var(--b)]" />
              <span className="hidden sm:inline">{t("calendar.title")}</span>
              <span className="sm:hidden">{t("calendar.title_short")}</span>
            </CardTitle>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="flex items-center gap-1 mr-2">
                {(["money", "r"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setShowMode(m)}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold border transition-all ${
                      showMode === m
                        ? "bg-[#6EE000]/20 border-[#6EE000]/50 text-[#6EE000]"
                        : "border-[var(--brd)] text-[var(--dim)] hover:border-[var(--brd2)]"
                    }`}
                  >
                    {m === "money" ? "R$" : "R"}
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth("prev")}
                className="text-[var(--dim)] hover:text-[var(--text)] hover:bg-[var(--surf)] p-1.5 sm:p-2 rounded-md transition-all"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <span className="text-sm sm:text-base md:text-lg text-[var(--text)] font-semibold capitalize text-center min-w-[120px] sm:min-w-[140px] md:min-w-[180px] px-2">
                {monthName} {year}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth("next")}
                className="text-[var(--dim)] hover:text-[var(--text)] hover:bg-[var(--surf)] p-1.5 sm:p-2 rounded-md transition-all"
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
                className="text-center font-semibold text-[var(--dim)] border-r border-b border-[var(--brd)] py-1.5 sm:py-2.5 md:py-3.5 text-[10px] sm:text-xs md:text-sm bg-[var(--surf)]/60"
              >
                {day}
              </div>
            ))}
            <div className="hidden md:block text-center font-semibold text-[var(--dim)] border-b border-[var(--brd)] py-3.5 text-sm bg-[var(--surf)]/60">
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
                    <div key={`week-summary-${weekIndex}`} className="hidden md:block border-l border-[var(--brd)]">
                      {renderWeekSummary(weekSummaries[weekIndex])}
                    </div>
                  ) : (
                    <div
                      key={`week-empty-${weekIndex}`}
                      className="hidden md:block border-l border-[var(--brd)] min-h-[155px] lg:min-h-[170px]"
                    ></div>
                  ),
                ].filter(Boolean),
              )
              .flat()}
          </div>

          {/* Estatísticas mensais - apenas mobile */}
          <div className="md:hidden border-t border-[var(--brd)] p-4 bg-[var(--surf)]/40">
            <div className="text-center text-[var(--text)] font-semibold mb-4 text-base">
              {t("calendar.summary_of")} {monthName}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 rounded-lg bg-[var(--card)] border border-[var(--brd)]">
                <div className="text-xl sm:text-2xl font-bold text-[var(--text)] mb-1">
                  {monthlyStats.tradingDays}
                </div>
                <div className="text-xs sm:text-sm text-[var(--dim)] font-medium">
                  {t("calendar.trading_days")}
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-[var(--card)] border border-[var(--brd)]">
                <div className="text-xl sm:text-2xl font-bold text-[var(--text)] mb-1">
                  {monthlyStats.totalTrades}
                </div>
                <div className="text-xs sm:text-sm text-[var(--dim)] font-medium">
                  {t("calendar.total_trades")}
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-[var(--card)] border border-[var(--brd)]">
                <div
                  className={cn(
                    "text-xl sm:text-2xl font-bold mb-1",
                    hideData
                      ? "text-[var(--dim)]"
                      : monthlyStats.totalPnl > 0
                      ? "text-[var(--gold)]"
                      : monthlyStats.totalPnl < 0
                      ? "text-[var(--r)]"
                      : "text-[var(--text)]",
                  )}
                >
                  {hideData
                    ? "•••••"
                    : showMode === "r"
                    ? (() => {
                        const rTotal = tradeDays.reduce((sum, day) => {
                          return sum + (day.rawTrades || []).reduce((s: number, t: any) => {
                            const risco = parseFloat(t.risco || "0");
                            const res = parseFloat(t.resultado || "0");
                            return risco > 0 ? s + res / risco : s;
                          }, 0);
                        }, 0);
                        return `${rTotal >= 0 ? "+" : ""}${rTotal.toFixed(1)}R`;
                      })()
                    : `${monthlyStats.totalPnl > 0 ? "+" : ""}R$ ${Math.abs(monthlyStats.totalPnl).toLocaleString(locale, { maximumFractionDigits: 0 })}`}
                </div>
                <div className="text-xs sm:text-sm text-[var(--dim)] font-medium">
                  {t("calendar.pnl_total")}
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-[var(--card)] border border-[var(--brd)]">
                <div className="text-xl sm:text-2xl font-bold text-[var(--text)] mb-1">
                  {monthlyStats.winRate}%
                </div>
                <div className="text-xs sm:text-sm text-[var(--dim)] font-medium">
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
