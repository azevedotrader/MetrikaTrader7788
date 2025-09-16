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

  // Criar entrada básica do diário se não existir
  const createBasicDiaryEntry = async (date: Date): Promise<string | null> => {
    try {
      const userId = localStorage.getItem('user-id');
      if (!userId) throw new Error('Usuário não autenticado');

      const formatDateForInput = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const basicEntry = {
        date: formatDateForInput(date),
        title: `Entrada de ${format(date, "d 'de' MMMM", { locale: ptBR })}`,
        content: "Entrada criada para adicionar imagens.",
        emotion: undefined,
        trades: 0,
        pnl: "0",
        winRate: "0",
        lessons: "",
        improvements: "",
      };

      const response = await fetch("/api/diary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user-id": userId,
          "X-User-ID": userId
        },
        body: JSON.stringify(basicEntry),
        credentials: "include"
      });

      if (!response.ok) throw new Error("Erro ao criar entrada");

      const newEntry = await response.json();
      
      // Atualizar cache das entradas do diário
      queryClient.invalidateQueries({ queryKey: ["/api/diary"] });
      
      return newEntry.id;
    } catch (error) {
      console.error('Erro ao criar entrada básica:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar entrada do diário.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Handle upload de imagem
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

    setUploadingImage(true);
    try {
      const userId = localStorage.getItem('user-id');
      if (!userId) throw new Error('Usuário não autenticado');

      // Verificar se já existe entrada para o dia ou criar uma nova
      let targetDiaryEntryId = dayDiaryEntry?.id;
      
      if (!targetDiaryEntryId && selectedDate) {
        targetDiaryEntryId = await createBasicDiaryEntry(selectedDate);
        if (!targetDiaryEntryId) {
          throw new Error('Não foi possível criar entrada do diário');
        }
      }

      if (!targetDiaryEntryId) {
        throw new Error('Não foi possível determinar entrada do diário');
      }

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`/api/diary/${targetDiaryEntryId}/images`, {
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
      setDayImages(prev => [...prev, result.image]);
      
      toast({
        title: "Sucesso!",
        description: "Imagem adicionada com sucesso.",
      });
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }

    // Limpar o input
    event.target.value = '';
  };

  // Handle deletar imagem
  const handleImageDelete = async (imageId: string) => {
    if (!dayDiaryEntry?.id) return;

    if (!confirm("Tem certeza que deseja remover esta imagem?")) return;

    try {
      const userId = localStorage.getItem('user-id');
      if (!userId) throw new Error('Usuário não autenticado');

      const response = await fetch(`/api/diary/${dayDiaryEntry.id}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          "user-id": userId,
          "X-User-ID": userId
        },
        credentials: "include"
      });

      if (!response.ok) throw new Error('Erro ao deletar imagem');

      setDayImages(prev => prev.filter(img => img.id !== imageId));
      
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

          {/* Seção de Imagens - Card independente */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                {dayImages.length > 0 ? `${dayImages.length === 1 ? 'Imagem' : 'Imagens'} (${dayImages.length})` : 'Imagens'}
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                  id="day-image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('day-image-upload')?.click()}
                  disabled={uploadingImage}
                  className="flex items-center gap-2"
                  data-testid="button-upload-day-image"
                >
                  <Upload className="h-3 w-3" />
                  {uploadingImage ? "Enviando..." : "Adicionar"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Grid de imagens */}
              {dayImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {dayImages.slice(0, 8).map((image) => (
                    <div key={image.id} className="relative group aspect-square rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 hover:border-zinc-500 transition-all hover:shadow-lg">
                      <img
                        src={`/api/images/${image.id}`}
                        alt={image.originalName}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                        title={image.originalName}
                        onClick={() => setSelectedImage(image)}
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEyLjc5QTkgOSAwIDEgMSAxMS4yMSAzQTcgNyAwIDAgMCAyMSAxMi43OVoiIHN0cm9rZT0iIzY0NzQ4YiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';
                        }}
                        data-testid={`calendar-image-${image.id}`}
                      />
                      {/* Botão de deletar - visível no hover */}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleImageDelete(image.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                        data-testid={`button-delete-day-image-${image.id}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
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
              )}

              {/* Mensagem quando não há imagens */}
              {dayImages.length === 0 && !loadingImages && (
                <div className="text-center py-6 text-zinc-400 text-sm border border-zinc-700 rounded-lg border-dashed">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                  <span className="block mb-2">Nenhuma imagem adicionada</span>
                  <span className="text-xs text-zinc-500">Clique em "Adicionar" para enviar imagens</span>
                </div>
              )}

              {/* Loading de imagens */}
              {loadingImages && (
                <div className="flex items-center justify-center gap-2 text-zinc-400 py-4">
                  <ImageIcon className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">Carregando imagens...</span>
                </div>
              )}
            </CardContent>
          </Card>

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