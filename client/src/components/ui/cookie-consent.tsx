import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { acceptAndInitPixel, declinePixel, hasAnswered } from '@/hooks/useMetaPixel';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mostra banner somente se o usuário ainda não respondeu
    if (!hasAnswered()) {
      // Pequeno delay pra não competir com o carregamento inicial
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  function handleAccept() {
    acceptAndInitPixel();
    setVisible(false);
  }

  function handleDecline() {
    declinePixel();
    setVisible(false);
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 flex justify-center pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-sm shadow-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        role="dialog"
        aria-label="Consentimento de cookies"
      >
        {/* Ícone */}
        <span className="text-2xl shrink-0">🍪</span>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-200 font-medium leading-snug">
            Usamos cookies para melhorar sua experiência e personalizar anúncios.
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Ao aceitar, você concorda com nossa{' '}
            <a
              href="/politica-privacidade"
              className="underline underline-offset-2 hover:text-slate-200 transition-colors"
            >
              Política de Privacidade
            </a>
            {' '}conforme a LGPD.
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDecline}
            className="flex-1 sm:flex-none border-slate-600 text-slate-300 hover:bg-slate-800 text-xs h-8 px-3"
          >
            Recusar
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            className="flex-1 sm:flex-none bg-[#6EE000] hover:bg-[#5bc400] text-black font-semibold text-xs h-8 px-4"
          >
            Aceitar
          </Button>
        </div>
      </div>
    </div>
  );
}
