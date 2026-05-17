import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, Upload, X, Clipboard } from "lucide-react";

interface TradeImage {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

interface TradeImageUploadProps {
  tradeId: string | undefined; // undefined enquanto o trade ainda não foi salvo
}

async function getAuthHeaders() {
  const userId = localStorage.getItem('user-id');
  const token = localStorage.getItem('user-token');
  return {
    "user-id": userId || "",
    "X-User-ID": userId || "",
    "Authorization": `Bearer ${token}`,
  };
}

export function TradeImageUpload({ tradeId }: TradeImageUploadProps) {
  const [images, setImages] = useState<TradeImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Busca imagens existentes quando o tradeId estiver disponível
  useEffect(() => {
    if (!tradeId) { setImages([]); return; }
    (async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/trades/${tradeId}/images`, { headers, credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setImages(data.images || []);
        }
      } catch {}
    })();
  }, [tradeId]);

  const uploadFile = useCallback(async (file: File) => {
    if (!tradeId) {
      toast({ title: "Salve o trade primeiro", description: "O trade precisa estar salvo para anexar uma imagem.", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: "Arquivo inválido", description: "Selecione apenas arquivos de imagem.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "O arquivo deve ter no máximo 10 MB.", variant: "destructive" });
      return;
    }

    // Preview local imediato
    const url = URL.createObjectURL(file);
    setPreview(url);
    setUploading(true);

    try {
      const userId = localStorage.getItem('user-id');
      const token = localStorage.getItem('user-token');
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`/api/trades/${tradeId}/images`, {
        method: "POST",
        headers: {
          "user-id": userId || "",
          "X-User-ID": userId || "",
          "Authorization": `Bearer ${token}`,
        },
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error("Erro no upload");

      const data = await res.json();
      setImages(prev => [...prev, data.image]);
      setPreview(null);
      URL.revokeObjectURL(url);
      toast({ title: "Imagem adicionada", description: "Print do trade salvo com sucesso." });
    } catch {
      setPreview(null);
      URL.revokeObjectURL(url);
      toast({ title: "Erro no upload", description: "Não foi possível enviar a imagem.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [tradeId, toast]);

  // Paste via Ctrl+V / Cmd+V
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Só processa se o foco estiver dentro do componente ou globalmente no dialog
      const items = Array.from(e.clipboardData?.items || []);
      const imageItem = items.find(item => item.type.startsWith('image/'));
      if (!imageItem) return;
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) uploadFile(file);
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [uploadFile]);

  const handleDelete = async (imageId: string) => {
    if (!tradeId) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/trades/${tradeId}/images/${imageId}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });
      if (res.ok) {
        setImages(prev => prev.filter(img => img.id !== imageId));
        toast({ title: "Imagem removida" });
      }
    } catch {
      toast({ title: "Erro ao remover imagem", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[var(--dim,#888)] text-xs font-medium flex items-center gap-1.5">
        <ImageIcon className="w-3.5 h-3.5" /> Print do Trade
      </label>

      {/* Drop zone / paste area */}
      {images.length === 0 && !preview && (
        <div
          ref={dropZoneRef}
          className="border border-dashed border-[var(--brd,#333)] rounded-lg p-4 flex flex-col items-center justify-center gap-2 text-center cursor-pointer hover:border-[#6EE000]/50 transition-colors min-h-[88px]"
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex items-center gap-3 text-[var(--dim,#888)]">
            <div className="flex flex-col items-center gap-1">
              <Clipboard className="w-5 h-5" />
              <span className="text-xs">Ctrl+V / ⌘V</span>
            </div>
            <span className="text-xs text-[var(--dim,#555)]">ou</span>
            <div className="flex flex-col items-center gap-1">
              <Upload className="w-5 h-5" />
              <span className="text-xs">Escolher arquivo</span>
            </div>
          </div>
        </div>
      )}

      {/* Preview de upload em andamento */}
      {preview && (
        <div className="relative w-full rounded-lg overflow-hidden border border-[var(--brd,#333)]">
          <img src={preview} alt="preview" className="w-full max-h-48 object-contain bg-black/30 opacity-60" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[#6EE000] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}

      {/* Imagens salvas */}
      {images.length > 0 && (
        <div className="space-y-2">
          {images.map(img => (
            <div key={img.id} className="relative group rounded-lg overflow-hidden border border-[var(--brd,#333)]">
              <img
                src={`/api/images/${img.id}`}
                alt={img.originalName}
                className="w-full max-h-48 object-contain bg-black/20"
              />
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(img.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
          {/* Botão para adicionar mais */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full border-dashed border-[var(--brd,#333)] text-[var(--dim,#888)] text-xs h-8"
          >
            <Upload className="w-3 h-3 mr-1" /> Adicionar outro print
          </Button>
        </div>
      )}

      {/* Input oculto */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
