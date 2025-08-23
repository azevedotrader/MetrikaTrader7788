import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Brain, RefreshCw } from 'lucide-react';

interface SmartReprocessButtonProps {
  userId: string;
  csvImportId?: string;
  onSuccess?: () => void;
}

export function SmartReprocessButton({ 
  userId, 
  csvImportId, 
  onSuccess 
}: SmartReprocessButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const reprocessMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/trades/reprocess-smart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId
        },
        body: JSON.stringify({
          csvImportId: csvImportId || 'latest'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro no reprocessamento');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "🎉 Reprocessamento Concluído!",
        description: data.message,
        duration: 5000,
      });
      
      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/csv-imports'] });
      
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro no Reprocessamento",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    },
  });

  const handleReprocess = async () => {
    setIsProcessing(true);
    try {
      await reprocessMutation.mutateAsync();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handleReprocess}
      disabled={isProcessing || reprocessMutation.isPending}
      variant="outline"
      size="sm"
      className="gap-2 hidden"
      data-testid="button-smart-reprocess"
    >
      {isProcessing || reprocessMutation.isPending ? (
        <RefreshCw className="h-4 w-4 animate-spin" />
      ) : (
        <Brain className="h-4 w-4" />
      )}
      {isProcessing || reprocessMutation.isPending 
        ? 'Reprocessando...' 
        : 'Interpretador Inteligente'
      }
    </Button>
  );
}