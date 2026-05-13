import { useQuery } from "@tanstack/react-query";
import { TradingCalendar } from "@/components/ui/trading-calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, BarChart3, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CalendarioPage() {
  const { t } = useLanguage();
  const { data: trades = [] } = useQuery({ 
    queryKey: ['/api/trades'],
    staleTime: 0, // Sempre buscar dados frescos
    gcTime: 0   // Não manter cache (nova nomenclatura do React Query v5)
  });
  const { data: calendarData = [] } = useQuery({ queryKey: ['/api/trades/calendar'] });

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 md:p-6 pb-6 md:pb-8">

      {/* Instrucoes */}
      <Card className="rounded-lg border text-card-foreground shadow-sm border-[#1e1e2e] bg-[#141313c4]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            {t('calendar.how_to_use')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#6EE000]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 bg-[#6EE000] rounded-full"></div>
              </div>
              <div>
                <div className="text-white font-medium mb-1">{t('calendar.profitable_days')}</div>
                <div className="text-[#6e7191]">{t('calendar.profitable_days_desc')}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#FF1F3D]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 bg-[#FF1F3D] rounded-full"></div>
              </div>
              <div>
                <div className="text-white font-medium mb-1">{t('calendar.loss_days')}</div>
                <div className="text-[#6e7191]">{t('calendar.loss_days_desc')}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#28283a]/50 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-[#6e7191]" />
              </div>
              <div>
                <div className="text-white font-medium mb-1">{t('calendar.weekly_summary')}</div>
                <div className="text-[#6e7191]">{t('calendar.weekly_summary_desc')}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendário Principal */}
      <div data-testid="trading-calendar">
        <TradingCalendar 
          trades={trades} 
          calendarData={calendarData as any[]}
        />
      </div>

      {/* Dicas de Análise */}
      <Card className="bg-[#070b12] border-[#1e1e2e]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#6EE000]" />
            {t('calendar.analysis_tips')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="text-white font-medium mb-3">{t('calendar.temporal_patterns')}</h4>
              <ul className="space-y-2 text-[#6e7191]">
                <li>• {t('calendar.tip1')}</li>
                <li>• {t('calendar.tip2')}</li>
                <li>• {t('calendar.tip3')}</li>
                <li>• {t('calendar.tip4')}</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-3">{t('calendar.improvement_strategies')}</h4>
              <ul className="space-y-2 text-[#6e7191]">
                <li>• {t('calendar.strategy1')}</li>
                <li>• {t('calendar.strategy2')}</li>
                <li>• {t('calendar.strategy3')}</li>
                <li>• {t('calendar.strategy4')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}