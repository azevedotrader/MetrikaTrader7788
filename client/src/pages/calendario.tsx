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
  const { data: calendarData = [] } = useQuery<any[]>({ queryKey: ['/api/trades/calendar'] });

  return (
    <div className="space-y-6 pb-8">

      {/* Instrucoes */}
      <Card className="rounded-lg border text-card-foreground shadow-sm border-slate-700 bg-[#141313c4]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            {t('calendar.how_to_use')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
              <div>
                <div className="text-white font-medium mb-1">{t('calendar.profitable_days')}</div>
                <div className="text-slate-400">{t('calendar.profitable_days_desc')}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              </div>
              <div>
                <div className="text-white font-medium mb-1">{t('calendar.loss_days')}</div>
                <div className="text-slate-400">{t('calendar.loss_days_desc')}</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-slate-600/50 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-slate-400" />
              </div>
              <div>
                <div className="text-white font-medium mb-1">{t('calendar.weekly_summary')}</div>
                <div className="text-slate-400">{t('calendar.weekly_summary_desc')}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendário Principal */}
      <TradingCalendar 
        trades={trades} 
        calendarData={(calendarData || []) as any[]}
      />

      {/* Dicas de Análise */}
      <Card className="bg-[#070b12] border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            {t('calendar.analysis_tips')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="text-white font-medium mb-3">{t('calendar.temporal_patterns')}</h4>
              <ul className="space-y-2 text-slate-400">
                <li>• {t('calendar.tip1')}</li>
                <li>• {t('calendar.tip2')}</li>
                <li>• {t('calendar.tip3')}</li>
                <li>• {t('calendar.tip4')}</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-3">{t('calendar.improvement_strategies')}</h4>
              <ul className="space-y-2 text-slate-400">
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