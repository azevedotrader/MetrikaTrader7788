import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash2, Upload, X, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDiaryEntrySchema, type InsertDiaryEntry, type DiaryEntry } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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

interface PendingImage {
  file: File;
  id: string; // ID temporário
  preview: string; // URL de preview
}

interface DiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  entry?: DiaryEntry;
  onSuccess: () => void;
}

export function DiaryModal({ isOpen, onClose, selectedDate, entry, onSuccess }: DiaryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<DiaryImage[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Corrigir formatação da data para evitar problemas de timezone
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const form = useForm<InsertDiaryEntry>({
    resolver: zodResolver(insertDiaryEntrySchema),
    defaultValues: {
      date: "",
      title: "",
      content: "",
      emotion: undefined,
      trades: 0,
      pnl: "0",
      winRate: "0",
      lessons: "",
      improvements: "",
    },
  });

  // Atualizar formulário quando entry mudar
  useEffect(() => {
    if (entry) {
      form.reset({
        date: formatDateForInput(new Date(entry.date)),
        title: entry.title || "",
        content: entry.content || "",
        emotion: (entry.emotion as "confiante" | "ansioso" | "impulsivo" | "calmo" | "eufórico" | "frustrado" | "neutro" | undefined) || undefined,
        trades: entry.trades || 0,
        pnl: entry.pnl || "0",
        winRate: entry.winRate || "0",
        lessons: entry.lessons || "",
        improvements: entry.improvements || "",
      });
    } else if (selectedDate) {
      form.reset({
        date: formatDateForInput(selectedDate),
        title: "",
        content: "",
        emotion: undefined,
        trades: 0,
        pnl: "0",
        winRate: "0",
        lessons: "",
        improvements: "",
      });
    }
  }, [entry, selectedDate, form]);

  // Limpar URLs de preview para evitar memory leaks
  const clearPendingImages = () => {
    pendingImages.forEach(img => URL.revokeObjectURL(img.preview));
    setPendingImages([]);
  };

  // Carregar imagens quando a entrada existir
  useEffect(() => {
    if (entry?.id) {
      loadImages(entry.id);
    } else {
      setImages([]);
    }
    // Limpar imagens pendentes quando trocar de entrada
    clearPendingImages();
  }, [entry]);

  // Cleanup quando o modal fecha
  useEffect(() => {
    if (!isOpen) {
      clearPendingImages();
    }
  }, [isOpen]);

  const loadImages = async (diaryEntryId: string) => {
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
        const imageData = await response.json();
        setImages(imageData);
      }
    } catch (error) {
      console.error('Erro ao carregar imagens:', error);
    }
  };

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

    // Se já existe uma entrada, fazer upload direto
    if (entry?.id) {
      setUploadingImage(true);
      try {
        const userId = localStorage.getItem('user-id');
        if (!userId) throw new Error('Usuário não autenticado');

        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`/api/diary/${entry.id}/images`, {
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
        setImages(prev => [...prev, result.image]);
        
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
    } else {
      // Se não existe entrada ainda, adicionar como imagem pendente
      const preview = URL.createObjectURL(file);
      const pendingImage: PendingImage = {
        file,
        id: `pending-${Date.now()}-${Math.random()}`,
        preview
      };
      
      setPendingImages(prev => [...prev, pendingImage]);
      toast({
        title: t('journal.image_added_pending'),
        description: t('journal.image_added_pending_desc'),
      });
    }

    // Limpar o input
    event.target.value = '';
  };

  const handleImageDelete = async (imageId: string) => {
    // Verificar se é uma imagem pendente
    if (imageId.startsWith('pending-')) {
      if (!confirm("Tem certeza que deseja remover esta imagem?")) return;
      
      setPendingImages(prev => {
        const imageToRemove = prev.find(img => img.id === imageId);
        if (imageToRemove) {
          URL.revokeObjectURL(imageToRemove.preview); // Limpar URL de preview
        }
        return prev.filter(img => img.id !== imageId);
      });
      
      toast({
        title: "Sucesso!",
        description: "Imagem removida.",
      });
      return;
    }

    // Imagem já salva
    if (!entry?.id) return;

    if (!confirm("Tem certeza que deseja remover esta imagem?")) return;

    try {
      const userId = localStorage.getItem('user-id');
      if (!userId) throw new Error('Usuário não autenticado');

      const response = await fetch(`/api/diary/${entry.id}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          "user-id": userId,
          "X-User-ID": userId
        },
        credentials: "include"
      });

      if (!response.ok) throw new Error('Erro ao deletar imagem');

      setImages(prev => prev.filter(img => img.id !== imageId));
      
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

  const onSubmit = async (data: InsertDiaryEntry) => {
    setIsLoading(true);
    try {
      if (entry) {
        // Atualizar entrada existente
        const userId = localStorage.getItem('user-id');
        if (!userId) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch(`/api/diary/${entry.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "user-id": userId,
            "X-User-ID": userId
          },
          body: JSON.stringify(data),
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Erro ao atualizar entrada");
        }
        toast({
          title: t('journal.toast.updated'),
          description: t('journal.toast.updated_desc'),
        });
      } else {
        // Criar nova entrada
        const userId = localStorage.getItem('user-id');
        if (!userId) {
          throw new Error('Usuário não autenticado');
        }
        
        const response = await fetch("/api/diary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "user-id": userId,
            "X-User-ID": userId
          },
          body: JSON.stringify(data),
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Erro ao criar entrada");
        }
        
        const newEntry = await response.json();
        
        // Fazer upload das imagens pendentes
        if (pendingImages.length > 0) {
          let uploadErrors = 0;
          
          for (const pendingImage of pendingImages) {
            try {
              const formData = new FormData();
              formData.append('image', pendingImage.file);

              const uploadResponse = await fetch(`/api/diary/${newEntry.id}/images`, {
                method: 'POST',
                headers: {
                  "user-id": userId,
                  "X-User-ID": userId
                },
                body: formData,
                credentials: "include"
              });
              
              if (!uploadResponse.ok) {
                uploadErrors++;
              }
            } catch (error) {
              console.error('Erro no upload de imagem:', error);
              uploadErrors++;
            }
          }
          
          // Limpar todas as imagens pendentes (URLs e estado)
          clearPendingImages();
          
          // Informar sobre erros de upload se houve
          if (uploadErrors > 0) {
            toast({
              title: "Atenção",
              description: `${uploadErrors} imagem(ns) não puderam ser enviadas. Tente adicionar novamente.`,
              variant: "destructive",
            });
          }
        }
        
        toast({
          title: t('journal.toast.created'),
          description: t('journal.toast.created_desc'),
        });
      }
      onSuccess();
      onClose();
      form.reset();
    } catch (error) {
      console.error("Erro ao salvar entrada:", error);
      toast({
        title: t('journal.toast.error_save'),
        description: t('journal.toast.error_save_desc'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    
    if (!confirm(t('journal.delete_confirm'))) {
      return;
    }

    setIsLoading(true);
    try {
      const userId = localStorage.getItem('user-id');
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }
      
      const response = await fetch(`/api/diary/${entry.id}`, {
        method: "DELETE",
        headers: {
          "user-id": userId,
          "X-User-ID": userId
        },
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Erro ao deletar entrada");
      }
      toast({
        title: t('journal.toast.deleted'),
        description: t('journal.toast.deleted_desc'),
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao deletar entrada:", error);
      toast({
        title: t('journal.toast.error_delete'),
        description: t('journal.toast.error_delete_desc'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const emotionOptions = [
    { value: "confiante", label: t('journal.emotion.confident') },
    { value: "ansioso", label: t('journal.emotion.anxious') },
    { value: "impulsivo", label: t('journal.emotion.impulsive') },
    { value: "calmo", label: t('journal.emotion.calm') },
    { value: "eufórico", label: t('journal.emotion.euphoric') },
    { value: "frustrado", label: t('journal.emotion.frustrated') },
    { value: "neutro", label: t('journal.emotion.neutral') },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="diary-modal">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle data-testid="modal-title">
            {entry ? t('journal.edit_entry') : t('journal.new_entry')}
          </DialogTitle>
          {entry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isLoading}
              className="text-red-600 hover:text-red-800"
              data-testid="button-delete-entry"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="date">{t('journal.date')} *</Label>
            <Input
              id="date"
              type="date"
              {...form.register("date")}
              className="w-full"
              data-testid="input-date"
            />
            {form.formState.errors.date && (
              <p className="text-sm text-red-600">{form.formState.errors.date.message}</p>
            )}
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('journal.title_field')} *</Label>
            <Input
              id="title"
              placeholder={t('journal.title_placeholder')}
              {...form.register("title")}
              data-testid="input-title"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Conteúdo */}
          <div className="space-y-2">
            <Label htmlFor="content">{t('journal.session_description')} *</Label>
            <Textarea
              id="content"
              placeholder={t('journal.session_placeholder')}
              rows={4}
              {...form.register("content")}
              data-testid="textarea-content"
            />
            {form.formState.errors.content && (
              <p className="text-sm text-red-600">{form.formState.errors.content.message}</p>
            )}
          </div>

          {/* Grade de informações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Emoção */}
            <div className="space-y-2">
              <Label>{t('journal.emotional_state')}</Label>
              <Select
                value={form.watch("emotion") || ""}
                onValueChange={(value) => form.setValue("emotion", value as any)}
              >
                <SelectTrigger data-testid="select-emotion">
                  <SelectValue placeholder={t('journal.how_felt')} />
                </SelectTrigger>
                <SelectContent>
                  {emotionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Número de trades */}
            <div className="space-y-2">
              <Label htmlFor="trades">{t('journal.number_trades')}</Label>
              <Input
                id="trades"
                type="number"
                min="0"
                placeholder="0"
                {...form.register("trades", { valueAsNumber: true })}
                data-testid="input-trades"
              />
            </div>

            {/* P&L */}
            <div className="space-y-2">
              <Label htmlFor="pnl">{t('journal.pnl')}</Label>
              <Input
                id="pnl"
                placeholder="0.00"
                {...form.register("pnl")}
                data-testid="input-pnl"
              />
            </div>

            
          </div>

          {/* Lições aprendidas */}
          <div className="space-y-2">
            <Label htmlFor="lessons">{t('journal.lessons_learned')}</Label>
            <Textarea
              id="lessons"
              placeholder={t('journal.lessons_placeholder')}
              rows={3}
              {...form.register("lessons")}
              data-testid="textarea-lessons"
            />
          </div>

          {/* Melhorias */}
          <div className="space-y-2">
            <Label htmlFor="improvements">{t('journal.improvements')}</Label>
            <Textarea
              id="improvements"
              placeholder={t('journal.improvements_placeholder')}
              rows={3}
              {...form.register("improvements")}
              data-testid="textarea-improvements"
            />
          </div>

          {/* Seção de imagens */}
          <div className="space-y-4">
            <Label>{t('journal.images')}</Label>
            
            {/* Upload de imagem - sempre disponível */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={uploadingImage || isLoading}
                className="flex items-center gap-2"
                data-testid="button-upload-image"
              >
                <Upload className="h-4 w-4" />
                {uploadingImage ? "Enviando..." : "Adicionar Imagem"}
              </Button>
              <span className="text-sm text-slate-400">
                PNG, JPG até 5MB
              </span>
            </div>
            
            {/* Mensagem informativa quando não há entrada ainda */}
            {!entry && pendingImages.length === 0 && (
              <div className="text-sm text-slate-400 p-4 border border-slate-700 rounded-lg text-center">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-slate-500" />
                {t('journal.add_images_message')}
              </div>
            )}

            {/* Grid de imagens (existentes + pendentes) */}
            {(images.length > 0 || pendingImages.length > 0) && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Imagens já salvas */}
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
                      <img
                        src={`/api/images/${image.id}`}
                        alt={image.originalName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEyLjc5QTkgOSAwIDEgMSAxMS4yMSAzQTcgNyAwIDAgMCAyMSAxMi43OVoiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K';
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleImageDelete(image.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                      data-testid={`button-delete-image-${image.id}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <p className="mt-2 text-xs text-slate-400 truncate" title={image.originalName}>
                      {image.originalName}
                    </p>
                  </div>
                ))}
                
                {/* Imagens pendentes */}
                {pendingImages.map((pendingImage) => (
                  <div key={pendingImage.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-slate-800 border border-slate-700 border-dashed">
                      <img
                        src={pendingImage.preview}
                        alt={pendingImage.file.name}
                        className="w-full h-full object-cover opacity-80"
                      />
                      {/* Indicador de pendente */}
                      <div className="absolute top-1 left-1 bg-yellow-500 text-black text-xs px-1 rounded">
                        {t('journal.pending_status')}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleImageDelete(pendingImage.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                      data-testid={`button-delete-image-${pendingImage.id}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <p className="mt-2 text-xs text-slate-400 truncate" title={pendingImage.file.name}>
                      {pendingImage.file.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
              data-testid="button-cancel"
            >
              {t('journal.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || uploadingImage}
              className="flex-1"
              data-testid="button-save"
            >
              {isLoading ? t('journal.saving') : entry ? t('journal.update') : t('journal.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}