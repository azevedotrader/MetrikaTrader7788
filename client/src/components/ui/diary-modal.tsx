import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDiaryEntrySchema, type InsertDiaryEntry, type DiaryEntry } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface DiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  entry?: DiaryEntry;
  onSuccess: () => void;
}

export function DiaryModal({ isOpen, onClose, selectedDate, entry, onSuccess }: DiaryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
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
              className="text-red-500 hover:text-red-700"
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
              <p className="text-sm text-red-500">{form.formState.errors.date.message}</p>
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
              <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
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
              <p className="text-sm text-red-500">{form.formState.errors.content.message}</p>
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

            {/* Taxa de acerto */}
            <div className="space-y-2">
              <Label htmlFor="winRate">{t('journal.win_rate')}</Label>
              <Input
                id="winRate"
                placeholder="0.0"
                {...form.register("winRate")}
                data-testid="input-win-rate"
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
              disabled={isLoading}
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