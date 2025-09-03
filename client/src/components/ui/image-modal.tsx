import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, ExternalLink } from "lucide-react";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageId: string;
  imageName: string;
}

export function ImageModal({ isOpen, onClose, imageId, imageName }: ImageModalProps) {
  const imageUrl = `/api/images/${imageId}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = imageName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(imageUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden" data-testid="image-modal">
        {/* Header com controles */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-900">
          <h3 className="text-lg font-medium text-white truncate pr-4" title={imageName}>
            {imageName}
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-zinc-400 hover:text-white"
              data-testid="button-download-image"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenInNewTab}
              className="text-zinc-400 hover:text-white"
              data-testid="button-open-external"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-zinc-400 hover:text-white"
              data-testid="button-close-image-modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Área da imagem */}
        <div className="flex-1 flex items-center justify-center p-4 bg-black/50">
          <img
            src={imageUrl}
            alt={imageName}
            className="max-w-full max-h-[70vh] object-contain rounded-lg"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEyLjc5QTkgOSAwIDEgMSAxMS4yMSAzQTcgNyAwIDAgMCAyMSAxMi43OVoiIHN0cm9rZT0iIzY0NzQ4YiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+';
            }}
            data-testid="modal-image"
          />
        </div>

        {/* Footer com informações */}
        <div className="p-4 border-t border-zinc-700 bg-zinc-900 text-center">
          <p className="text-sm text-zinc-400">
            Clique e arraste para mover • Scroll para zoom • ESC para fechar
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}