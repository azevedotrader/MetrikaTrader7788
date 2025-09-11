import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit2, Calendar, TrendingUp, TrendingDown, Image as ImageIcon } from "lucide-react";
import { DiaryModal } from "@/components/ui/diary-modal";
import { ImageModal } from "@/components/ui/image-modal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DiaryEntry } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

interface DiaryImage {
  id: string;
  fileName: string;
  originalName: string;
  caption?: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export default function Diario() {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | undefined>(undefined);
  const [entryImages, setEntryImages] = useState<Record<string, DiaryImage[]>>({});
  const [selectedImage, setSelectedImage] = useState<DiaryImage | null>(null);
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery<DiaryEntry[]>({
    queryKey: ["/api/diary"],
    enabled: true,
  });

  // Carregar imagens das entradas quando as entradas mudarem
  useEffect(() => {
    if (entries.length > 0) {
      loadAllEntryImages(entries);
    }
  }, [entries]);

  const loadAllEntryImages = async (entries: DiaryEntry[]) => {
    const userId = localStorage.getItem('user-id');
    if (!userId) return;

    const imagePromises = entries.map(async (entry) => {
      try {
        const response = await fetch(`/api/diary/${entry.id}/images`, {
          headers: {
            "user-id": userId,
            "X-User-ID": userId
          },
          credentials: "include"
        });

        if (response.ok) {
          const images = await response.json();
          return { entryId: entry.id, images };
        }
        return { entryId: entry.id, images: [] };
      } catch (error) {
        console.error(`Erro ao carregar imagens da entrada ${entry.id}:`, error);
        return { entryId: entry.id, images: [] };
      }
    });

    const results = await Promise.all(imagePromises);
    const imagesMap: Record<string, DiaryImage[]> = {};
    
    results.forEach(({ entryId, images }) => {
      imagesMap[entryId] = images;
    });

    setEntryImages(imagesMap);
  };

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
            {t('journal.add_entry')}
          </Button>
        </div>

        {entries.length === 0 ? (
          <Card className="bg-[#141414] border-slate-700 text-center py-12">
            <CardContent>
              <Calendar className="h-16 w-16 mx-auto mb-4 text-slate-500" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {t('journal.no_entries')}
              </h3>
              <p className="text-slate-400 mb-6">
                {t('journal.start_recording')}
              </p>
              <Button
                onClick={handleNewEntry}
                className="gradient-purple-blue hover:opacity-90 transition-opacity"
                data-testid="button-first-entry"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('journal.create_first')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div data-testid="journal-entries" className="space-y-6">
            {entries.map((entry) => (
              <Card key={entry.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
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
                    {entry.trades !== undefined && entry.trades !== null && entry.trades > 0 && (
                      <span data-testid={`trades-count-${entry.id}`}>
                        💡 {entry.trades} {t('journal.trades_performed')}
                      </span>
                    )}
                    {entry.winRate && entry.winRate !== "0" && (
                      <span data-testid={`win-rate-${entry.id}`}>
                        🎯 {entry.winRate}% {t('journal.accuracy_rate')}
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
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('journal.lessons_label')}</span>
                          <p className="text-sm text-slate-300 mt-1" data-testid={`lessons-${entry.id}`}>
                            {entry.lessons}
                          </p>
                        </div>
                      )}
                      {entry.improvements && (
                        <div>
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{t('journal.improvements_label')}</span>
                          <p className="text-sm text-slate-300 mt-1" data-testid={`improvements-${entry.id}`}>
                            {entry.improvements}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Seção de imagens */}
                  {entryImages[entry.id] && entryImages[entry.id].length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <div className="flex items-center gap-2 mb-3">
                        <ImageIcon className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                          {entryImages[entry.id].length === 1 ? 'Imagem' : 'Imagens'} ({entryImages[entry.id].length})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {entryImages[entry.id].slice(0, 6).map((image) => (
                          <div key={image.id} className="aspect-square rounded-lg overflow-hidden bg-slate-800 border border-slate-700 hover:border-slate-500 transition-all hover:shadow-lg">
                            <img
                              src={`/api/images/${image.id}`}
                              alt={image.originalName}
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              title={image.originalName}
                              onClick={() => setSelectedImage(image)}
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEyLjc5QTkgOSAwIDEgMSAxMS4yMSAzQTcgNyAwIDAgMCAyMSAxMi43OVoiIHN0cm9rZT0iIzY0NzQ4YiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';
                              }}
                              data-testid={`image-${image.id}`}
                            />
                          </div>
                        ))}
                        {entryImages[entry.id].length > 6 && (
                          <div className="aspect-square rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                            <span className="text-sm text-slate-400">
                              +{entryImages[entry.id].length - 6}
                            </span>
                          </div>
                        )}
                      </div>
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

      {/* Modal de visualização de imagem */}
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageId={selectedImage.id}
          imageName={selectedImage.originalName}
        />
      )}
    </div>
  );
}
