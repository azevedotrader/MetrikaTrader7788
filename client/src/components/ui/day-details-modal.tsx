import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, BookOpen, TrendingUp, TrendingDown, Clock, Edit, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import type { DiaryEntry } from "@shared/schema";
import { cn } from "@/lib/utils";

interface DiaryImage {
  id: string;
  fileName: string;
  originalName: string;
  caption?: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  onEditDiary?: () => void;
}

export function DayDetailsModal({ isOpen, onClose, selectedDate, onEditDiary }: DayDetailsModalProps) {
  const [dayImages, setDayImages] = useState<DiaryImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // Buscar entradas do diário
  const { data: diaryEntries = [] } = useQuery<DiaryEntry[]>({
    queryKey: ["/api/diary"],
    enabled: isOpen,
  });

  // Buscar trades
  const { data: trades = [] } = useQuery<any[]>({
    queryKey: ["/api/trades"],
    enabled: isOpen,
  });

  if (!selectedDate) return null;

  // Filtrar dados para a data selecionada
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  
  const dayDiaryEntry = diaryEntries.find(entry => {
    const entryDate = new Date(entry.date);
    const entryDateStr = format(entryDate, 'yyyy-MM-dd');
    return entryDateStr === selectedDateStr;
  });

  const dayTrades = trades.filter(trade => {
    const dateStr = trade.dataHora || trade.date;
    if (!dateStr) return false;
    const tradeDate = new Date(dateStr);
    const tradeDateStr = format(tradeDate, 'yyyy-MM-dd');
    return tradeDateStr === selectedDateStr;
  }).sort((a, b) => {
    // Ordenar por hora (mais recente primeiro)
    const dateA = new Date(a.dataHora || a.date);
    const dateB = new Date(b.dataHora || b.date);
    return dateA.getTime() - dateB.getTime();
  });

  // Calcular estatísticas dos trades do dia
  const dayStats = dayTrades.reduce((acc, trade) => {
    const resultado = parseFloat(trade.resultado) || 0;
    acc.totalPnl += resultado;
    acc.totalTrades += 1;
    if (resultado > 0) acc.winningTrades += 1;
    return acc;
  }, { totalPnl: 0, totalTrades: 0, winningTrades: 0 });

  const winRate = dayStats.totalTrades > 0 ? (dayStats.winningTrades / dayStats.totalTrades) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'HH:mm', { locale: ptBR });
  };

  // Carregar imagens da entrada do diário do dia
  useEffect(() => {
    if (dayDiaryEntry && isOpen) {
      loadDayImages(dayDiaryEntry.id);
    } else {
      setDayImages([]);
    }
  }, [dayDiaryEntry, isOpen]);

  const loadDayImages = async (diaryEntryId: string) => {
    setLoadingImages(true);
    try {
      const userId = localStorage.getItem('user-id');
      if (!userId) return;

      const response = await fetch(`/api/diary/${diaryEntryId}/images`, {
        headers: {
          "user-id": userId,
          "X-User-ID": userId
        },
        credentials: "include"
      });

      if (response.ok) {
        const images = await response.json();
        setDayImages(images);
      }
    } catch (error) {
      console.error('Erro ao carregar imagens do dia:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="day-details-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="modal-title">
            <Calendar className="w-5 h-5" />
            Detalhes de {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo do Dia */}
          {dayStats.totalTrades > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Resumo do Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {dayStats.totalTrades}
                    </div>
                    <div className="text-sm text-zinc-400">Trades</div>
                  </div>
                  <div className="text-center">
                    <div className={cn(
                      "text-2xl font-bold",
                      dayStats.totalPnl > 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {formatCurrency(dayStats.totalPnl)}
                    </div>
                    <div className="text-sm text-zinc-400">P&L Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {winRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-zinc-400">Taxa de Acerto</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {dayStats.winningTrades}
                    </div>
                    <div className="text-sm text-zinc-400">Trades Positivos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Anotações do Diário */}
          {dayDiaryEntry && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Anotações do Diário
                </CardTitle>
                {onEditDiary && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEditDiary}
                    className="text-blue-400 hover:text-blue-300"
                    data-testid="button-edit-diary"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">{dayDiaryEntry.title}</h3>
                  <p className="text-zinc-300 leading-relaxed">{dayDiaryEntry.content}</p>
                </div>

                {dayDiaryEntry.emotion && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-400">Estado emocional:</span>
                    <Badge variant="secondary" className="capitalize">
                      {dayDiaryEntry.emotion}
                    </Badge>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {dayDiaryEntry.trades !== null && dayDiaryEntry.trades !== undefined && dayDiaryEntry.trades > 0 && (
                    <div>
                      <span className="text-zinc-400">Trades registrados:</span>
                      <div className="font-semibold">{dayDiaryEntry.trades}</div>
                    </div>
                  )}
                  {dayDiaryEntry.pnl && parseFloat(dayDiaryEntry.pnl) !== 0 && (
                    <div>
                      <span className="text-zinc-400">P&L registrado:</span>
                      <div className={cn(
                        "font-semibold",
                        parseFloat(dayDiaryEntry.pnl) > 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {formatCurrency(parseFloat(dayDiaryEntry.pnl))}
                      </div>
                    </div>
                  )}
                  {dayDiaryEntry.winRate && parseFloat(dayDiaryEntry.winRate) > 0 && (
                    <div>
                      <span className="text-zinc-400">Taxa de acerto:</span>
                      <div className="font-semibold">{dayDiaryEntry.winRate}%</div>
                    </div>
                  )}
                </div>

                {dayDiaryEntry.lessons && (
                  <div>
                    <h4 className="font-medium text-white mb-1">Lições Aprendidas</h4>
                    <p className="text-zinc-300 text-sm leading-relaxed">{dayDiaryEntry.lessons}</p>
                  </div>
                )}

                {dayDiaryEntry.improvements && (
                  <div>
                    <h4 className="font-medium text-white mb-1">Pontos de Melhoria</h4>
                    <p className="text-zinc-300 text-sm leading-relaxed">{dayDiaryEntry.improvements}</p>
                  </div>
                )}

                {/* Seção de imagens */}
                {dayImages.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ImageIcon className="h-4 w-4 text-zinc-400" />
                      <h4 className="font-medium text-white">
                        {dayImages.length === 1 ? 'Imagem' : 'Imagens'} ({dayImages.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {dayImages.slice(0, 8).map((image) => (
                        <div key={image.id} className="aspect-square rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 hover:border-zinc-600 transition-colors group">
                          <img
                            src={`/api/images/${image.id}`}
                            alt={image.originalName}
                            className="w-full h-full object-cover cursor-pointer"
                            title={image.originalName}
                            onClick={() => window.open(`/api/images/${image.id}`, '_blank')}
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEyLjc5QTkgOSAwIDEgMSAxMS4yMSAzQTcgNyAwIDAgMCAyMSAxMi43OVoiIHN0cm9rZT0iIzY0NzQ4YiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';
                            }}
                            data-testid={`calendar-image-${image.id}`}
                          />
                          {/* Overlay com título ao hover */}
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <span className="text-white text-xs truncate">
                              {image.originalName}
                            </span>
                          </div>
                        </div>
                      ))}
                      {dayImages.length > 8 && (
                        <div className="aspect-square rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                          <span className="text-sm text-zinc-400">
                            +{dayImages.length - 8}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {loadingImages && (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <ImageIcon className="h-4 w-4 animate-pulse" />
                    <span className="text-sm">Carregando imagens...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Lista de Trades */}
          {dayTrades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Trades do Dia ({dayTrades.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dayTrades.map((trade, index) => {
                    const resultado = parseFloat(trade.resultado) || 0;
                    const isProfit = resultado > 0;
                    
                    return (
                      <div
                        key={trade.id || index}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          isProfit 
                            ? "bg-green-950/20 border-green-800/30" 
                            : "bg-red-950/20 border-red-800/30"
                        )}
                        data-testid={`trade-item-${index}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-zinc-400" />
                            <span className="text-sm text-zinc-400">
                              {trade.dataHora ? formatTime(trade.dataHora) : "Horário não disponível"}
                            </span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="font-medium text-white">{trade.ativo}</span>
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                              {trade.tipo && <span>{trade.tipo}</span>}
                              {trade.quantidade && <span>• {trade.quantidade} unidades</span>}
                              {trade.broker && <span>• {trade.broker}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={cn(
                            "font-bold text-lg",
                            isProfit ? "text-green-400" : "text-red-400"
                          )}>
                            {formatCurrency(resultado)}
                          </div>
                          <div className="text-xs text-zinc-400">
                            Res Op
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mensagem quando não há dados */}
          {!dayDiaryEntry && dayTrades.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Nenhum dado encontrado
                </h3>
                <p className="text-zinc-400 mb-4">
                  Não há anotações de diário nem trades registrados para esta data.
                </p>
                {onEditDiary && (
                  <Button
                    onClick={onEditDiary}
                    className="gap-2"
                    data-testid="button-add-diary"
                  >
                    <BookOpen className="w-4 h-4" />
                    Adicionar Entrada no Diário
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-close"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}