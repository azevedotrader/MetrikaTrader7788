import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { ShieldOff, ExternalLink, LogOut } from "lucide-react";

const CHECKOUT_URL_MONTHLY = "https://hub.la/g/kUCz3mE6Gon3TeOz1h40";
const CHECKOUT_URL_ANNUAL  = "https://hub.la/g/CGRfvH9XIZzkXUFTkesn";

export function NoPlanScreen() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8">
        <Logo variant="modal" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-[#0f0f1a] border border-[#1e1e2e] rounded-2xl p-8 text-center shadow-2xl">
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
            <ShieldOff className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-white mb-2">
          Sem plano ativo
        </h1>

        <p className="text-[#6e7191] text-sm mb-1">
          O e-mail <span className="text-white font-medium">{user?.email}</span>
        </p>
        <p className="text-[#6e7191] text-sm mb-8">
          não possui um plano ativo no Metrika.
        </p>

        <div className="space-y-3">
          <a href={CHECKOUT_URL_MONTHLY} target="_blank" rel="noopener noreferrer" className="block">
            <Button className="w-full gradient-purple-blue hover:opacity-90 transition-opacity font-semibold">
              <ExternalLink className="w-4 h-4 mr-2" />
              Assinar Plano Mensal — R$ 97/mês
            </Button>
          </a>

          <a href={CHECKOUT_URL_ANNUAL} target="_blank" rel="noopener noreferrer" className="block">
            <Button
              variant="outline"
              className="w-full border-[#6EE000]/40 text-[#6EE000] hover:bg-[#6EE000]/10 hover:border-[#6EE000] font-semibold"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Assinar Plano Anual — R$ 57,38/mês 🔥
            </Button>
          </a>
        </div>

        <p className="text-[#6e7191] text-xs mt-6">
          Já comprou? Aguarde alguns segundos — o acesso é ativado automaticamente.
          <br />
          Se o problema persistir, entre em contato pelo suporte.
        </p>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="mt-6 flex items-center gap-2 text-[#6e7191] hover:text-white text-sm transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sair da conta
      </button>
    </div>
  );
}
