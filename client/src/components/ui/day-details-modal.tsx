import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, BookOpen, TrendingUp, TrendingDown, Clock, Edit, Image as ImageIcon, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { DiaryEntry } from "@shared/schema";
import { cn } from "@/lib/utils";
import { ImageModal } from "./image-modal";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedImage, setSelectedImage] = useState<DiaryImage | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [tradeImages, setTradeImages] = useState<{ [tradeId: string]: DiaryImage[] }>({});
  const [uploadingTradeId, setUploadingTradeId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Filtrar dados para a data selecionada (só se selectedDate existir)
  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  
  const dayDiaryEntry = selectedDateStr ? diaryEntries.find(entry => {
    try {
      const entryDate = new Date(entry.date);
      if (isNaN(entryDate.getTime())) return false;
      const entryDateStr = format(entryDate, 'yyyy-MM-dd');
      return entryDateStr === selectedDateStr;
    } catch {
      return false;
    }
  }) : undefined;

  const dayTrades = selectedDateStr ? trades.filter(trade => {
    try {
      const dateStr = trade.dataHora || trade.date;
      if (!dateStr) return false;
      const tradeDate = new Date(dateStr);
      if (isNaN(tradeDate.getTime())) return false;
      const tradeDateStr = format(tradeDate, 'yyyy-MM-dd');
      return tradeDateStr === selectedDateStr;
    } catch {
      return false;
    }
  }).sort((a, b) => {
    try {
      // Ordenar por hora (mais recente primeiro)
      const dateA = new Date(a.dataHora || a.date);
      const dateB = new Date(b.dataHora || b.date);
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
      return dateA.getTime() - dateB.getTime();
    } catch {
      return 0;
    }
  }) : [];

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
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Hora inválida";
      return format(date, 'HH:mm', { locale: ptBR });
    } catch {
      return "Hora inválida";
    }
  };

  // Carregar imagens dos trades
  useEffect(() => {
    if (!isOpen || dayTrades.length === 0 || !selectedDate) {
      setTradeImages({});
      return;
    }

    const fetchTradeImages = async () => {
      setLoadingImages(true);
      try {
        const userId = localStorage.getItem('user-id');
        if (!userId) return;

        const imagesMap: { [tradeId: string]: DiaryImage[] } = {};
        
        await Promise.all(
          dayTrades.map(async (trade) => {
            try {
              const response = await fetch(`/api/trades/${trade.id}/images`, {
                headers: {
                  "user-id": userId,
                  "X-User-ID": userId
                },
                credentials: "include"
              });

              if (response.ok) {
                const data = await response.json();
                if (data.images && data.images.length > 0) {
                  imagesMap[trade.id] = data.images;
                }
              }
            } catch (error) {
              console.error(`Erro ao carregar imagens do trade ${trade.id}:`, error);
            }
          })
        );

        setTradeImages(imagesMap);
      } catch (error) {
        console.error('Erro ao carregar imagens dos trades:', error);
      } finally {
        setLoadingImages(false);
      }
    };

    fetchTradeImages();
  }, [isOpen, selectedDate, dayTrades.length]);

  // Handle upload de imagem para um trade específico
  const handleTradeImageUpload = async (tradeId: string, file: File) => {
    // Validação do arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingTradeId(tradeId);
    try {
      const userId = localStorage.getItem('user-id');
      if (!userId) throw new Error('Usuário não autenticado');

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`/api/trades/${tradeId}/images`, {
        method: 'POST',
        headers: {
          "user-id": userId,
          "X-User-ID": userId
        },
        body: formData,
        credentials: "include"
      });

      if (!response.ok) throw new Error('Erro ao fazer upload');

      const result = await response.json();
      
      // Atualizar o estado local com a nova imagem
      setTradeImages(prev => ({
        ...prev,
        [tradeId]: [result.image]
      }));
      
      toast({
        title: "Sucesso!",
        description: "Imagem adicionada ao trade com sucesso.",
      });
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
    } finally {
      setUploadingTradeId(null);
    }
  };

  // Handle deletar imagem de um trade
  const handleTradeImageDelete = async (tradeId: string, imageId: string) => {
    if (!confirm("Tem certeza que deseja remover esta imagem?")) return;

    try {
      const userId = localStorage.getItem('user-id');
      if (!userId) throw new Error('Usuário não autenticado');

      const response = await fetch(`/api/trades/${tradeId}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          "user-id": userId,
          "X-User-ID": userId
        },
        credentials: "include"
      });

      if (!response.ok) throw new Error('Erro ao deletar imagem');

      // Remover a imagem do estado local
      setTradeImages(prev => ({
        ...prev,
        [tradeId]: []
      }));
      
      toast({
        title: "Sucesso!",
        description: "Imagem removida com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a imagem.",
        variant: "destructive",
      });
    }
  };

  // Verificação de segurança - retornar null se selectedDate não existir
  if (!selectedDate) return null;

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
                      dayStats.totalPnl > 0 ? "text-green-600" : "text-red-500"
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
                    <div className="text-2xl font-bold text-green-600">
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
                    className="text-blue-600 hover:text-blue-600"
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
                        parseFloat(dayDiaryEntry.pnl) > 0 ? "text-green-600" : "text-red-500"
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
                    const tradeImage = tradeImages[trade.id]?.[0];
                    const isUploadingThisTrade = uploadingTradeId === trade.id;
                    
                    return (
                      <div
                        key={trade.id || index}
                        className={cn(
                          "rounded-lg border",
                          isProfit 
                            ? "bg-green-950/20 border-green-800/30" 
                            : "bg-red-950/20 border-red-800/30"
                        )}
                        data-testid={`trade-item-${index}`}
                      >
                        {/* Info do trade */}
                        <div className="flex items-center justify-between p-3">
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

                          <div className="flex items-center gap-3">
                            {/* Botão de upload de imagem */}
                            <div className="flex items-center gap-1">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleTradeImageUpload(trade.id, file);
                                  }
                                  e.target.value = '';
                                }}
                                disabled={isUploadingThisTrade || !!tradeImage}
                                className="hidden"
                                id={`trade-image-upload-${trade.id}`}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => document.getElementById(`trade-image-upload-${trade.id}`)?.click()}
                                disabled={isUploadingThisTrade || !!tradeImage}
                                className="flex items-center gap-1 h-7 px-2"
                                data-testid={`button-upload-trade-image-${index}`}
                              >
                                <ImageIcon className="h-3 w-3" />
                                {isUploadingThisTrade ? "..." : tradeImage ? "✓" : "+"}
                              </Button>
                            </div>

                            {/* Resultado */}
                            <div className="text-right">
                              <div className={cn(
                                "font-bold text-lg",
                                isProfit ? "text-green-600" : "text-red-500"
                              )}>
                                {formatCurrency(resultado)}
                              </div>
                              <div className="text-xs text-zinc-400">
                                Res Op
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Imagem do trade */}
                        {tradeImage && (
                          <div className="px-3 pb-3">
                            <div className="relative group w-32 h-32 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700">
                              <img
                                src={`/api/images/${tradeImage.id}`}
                                alt={tradeImage.originalName}
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => setSelectedImage(tradeImage)}
                                onError={(e) => {
                                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEyLjc5QTkgOSAwIDEgMSAxMS4yMSAzQTcgNyAwIDAgMCAyMSAxMi43OVoiIHN0cm9rZT0iIzY0NzQ4YiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';
                                }}
                                data-testid={`trade-image-${index}`}
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => handleTradeImageDelete(trade.id, tradeImage.id)}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                                data-testid={`button-delete-trade-image-${index}`}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
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

      {/* Modal de visualização de imagem */}
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageId={selectedImage.id}
          imageName={selectedImage.originalName}
        />
      )}
    </Dialog>
  );
}