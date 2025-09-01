import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit2, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { DiaryModal } from "@/components/ui/diary-modal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DiaryEntry } from "@shared/schema";

export default function Diario() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | undefined>(undefined);
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery<DiaryEntry[]>({
    queryKey: ["/api/diary"],
    enabled: true,
  });

  const handleNewEntry = () => {
    setSelectedEntry(undefined);
    setIsModalOpen(true);
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/diary"] });
  };

  const getEmotionEmoji = (emotion?: string) => {
    const emotions: Record<string, string> = {
      confiante: "😎",
      ansioso: "😰",
      impulsivo: "🏃‍♂️",
      calmo: "😌",
      eufórico: "🤩",
      frustrado: "😤",
      neutro: "😐",
    };
    return emotion ? emotions[emotion] || "😐" : "😐";
  };

  const formatPnL = (pnl?: string) => {
    if (!pnl || pnl === "0") return "R$ 0,00";
    const value = parseFloat(pnl);
    const prefix = value >= 0 ? "+" : "";
    return `${prefix}R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  };

  const isProfitable = (pnl?: string) => {
    if (!pnl) return false;
    return parseFloat(pnl) > 0;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-end mb-6">
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full mb-4" />
                  <div className="flex space-x-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-end mb-6">
          <Button
            onClick={handleNewEntry}
            className="gradient-purple-blue hover:opacity-90 transition-opacity"
            data-testid="button-new-entry"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Entrada
          </Button>
        </div>

        {entries.length === 0 ? (
          <Card className="bg-[#141414] border-slate-700 text-center py-12">
            <CardContent>
              <Calendar className="h-16 w-16 mx-auto mb-4 text-slate-500" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhuma entrada ainda
              </h3>
              <p className="text-slate-400 mb-6">
                Comece registrando suas reflexões e análises de trading
              </p>
              <Button
                onClick={handleNewEntry}
                className="gradient-purple-blue hover:opacity-90 transition-opacity"
                data-testid="button-first-entry"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira entrada
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {entries.map((entry) => (
              <Card key={entry.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white" data-testid={`entry-title-${entry.id}`}>
                        {entry.title}
                      </h3>
                      <p className="text-sm text-slate-400" data-testid={`entry-date-${entry.id}`}>
                        {format(new Date(entry.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditEntry(entry)}
                        className="text-slate-400 hover:text-white"
                        data-testid={`button-edit-${entry.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {entry.pnl && entry.pnl !== "0" && (
                    <div className="mb-4">
                      <Badge 
                        variant={isProfitable(entry.pnl) ? "default" : "destructive"}
                        className={
                          isProfitable(entry.pnl)
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" 
                            : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        }
                        data-testid={`badge-pnl-${entry.id}`}
                      >
                        {isProfitable(entry.pnl) ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {formatPnL(entry.pnl)}
                      </Badge>
                    </div>
                  )}
                </CardHeader>
                
                <CardContent>
                  <p className="text-slate-300 leading-relaxed mb-4" data-testid={`entry-content-${entry.id}`}>
                    {entry.content}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-slate-400">
                    {entry.trades !== undefined && entry.trades > 0 && (
                      <span data-testid={`trades-count-${entry.id}`}>
                        💡 {entry.trades} trades realizados
                      </span>
                    )}
                    {entry.winRate && entry.winRate !== "0" && (
                      <span data-testid={`win-rate-${entry.id}`}>
                        🎯 {entry.winRate}% de acerto
                      </span>
                    )}
                    {entry.emotion && (
                      <span data-testid={`emotion-${entry.id}`}>
                        {getEmotionEmoji(entry.emotion)} {entry.emotion}
                      </span>
                    )}
                  </div>
                  
                  {(entry.lessons || entry.improvements) && (
                    <div className="mt-4 pt-4 border-t border-slate-700 space-y-2">
                      {entry.lessons && (
                        <div>
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Lições:</span>
                          <p className="text-sm text-slate-300 mt-1" data-testid={`lessons-${entry.id}`}>
                            {entry.lessons}
                          </p>
                        </div>
                      )}
                      {entry.improvements && (
                        <div>
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Melhorias:</span>
                          <p className="text-sm text-slate-300 mt-1" data-testid={`improvements-${entry.id}`}>
                            {entry.improvements}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <DiaryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          entry={selectedEntry}
          onSuccess={handleModalSuccess}
        />
      </div>
    </div>
  );
}
