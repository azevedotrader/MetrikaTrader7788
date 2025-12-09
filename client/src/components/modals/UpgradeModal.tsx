import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Crown, Sparkles, Zap, X, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUsage?: {
    csvImports: number;
    manualTrades: number;
    total: number;
  };
  reason?: 'limit_reached' | 'ai_feature' | 'general';
}

const CHECKOUT_LINKS = {
  monthly: 'https://hub.la/g/CGRfvH9XIZzkXUFTkesn',
  quarterly: 'https://hub.la/g/lUlRpoibiOjhnJF47H43',
  annual: 'https://hub.la/g/kUCz3mE6Gon3TeOz1h40',
};

export function UpgradeModal({ 
  open, 
  onOpenChange, 
  currentUsage,
  reason = 'general' 
}: UpgradeModalProps) {
  const { t } = useLanguage();

  const plans = [
    {
      id: 'monthly',
      name: 'Mensal',
      price: 'R$ 97',
      period: '/mês',
      color: 'bg-blue-600',
      popular: false,
    },
    {
      id: 'quarterly',
      name: 'Trimestral',
      price: 'R$ 197',
      period: '/trimestre',
      color: 'bg-purple-600',
      popular: true,
      savings: 'Economize 32%',
    },
    {
      id: 'annual',
      name: 'Anual',
      price: 'R$ 547',
      period: '/ano',
      color: 'bg-gradient-to-r from-purple-600 to-blue-600',
      popular: false,
      savings: 'Economize 53%',
    },
  ];

  const freeFeatures = [
    { text: 'Máximo 10 trades', included: false },
    { text: 'Sem análise com IA', included: false },
    { text: 'Suporte básico', included: true },
    { text: 'Dashboard básico', included: true },
  ];

  const paidFeatures = [
    { text: 'Trades ilimitados', included: true },
    { text: 'Análise com IA avançada', included: true },
    { text: 'Suporte prioritário', included: true },
    { text: 'Importação CSV ilimitada', included: true },
    { text: 'Relatórios avançados', included: true },
    { text: 'Gestão de risco completa', included: true },
  ];

  const getModalContent = () => {
    switch (reason) {
      case 'limit_reached':
        return {
          title: 'Limite de Trades Atingido',
          description: currentUsage 
            ? `Você já registrou ${currentUsage.total} de 10 trades do plano Free. Faça upgrade para continuar!`
            : 'Você atingiu o limite do plano gratuito. Faça upgrade para trades ilimitados!',
        };
      case 'ai_feature':
        return {
          title: 'Recurso Premium',
          description: 'A análise com IA está disponível apenas para assinantes. Escolha um plano para desbloquear!',
        };
      default:
        return {
          title: 'Faça Upgrade para Acesso Completo',
          description: 'Desbloqueie todos os recursos da plataforma e leve seu trading ao próximo nível.',
        };
    }
  };

  const handleUpgradeClick = (planId: string) => {
    window.open(CHECKOUT_LINKS[planId as keyof typeof CHECKOUT_LINKS], '_blank');
    onOpenChange(false);
  };

  const content = getModalContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-700 text-white" data-testid="modal-upgrade">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-white" data-testid="text-upgrade-title">
            {content.title}
          </DialogTitle>
          <DialogDescription className="text-base text-zinc-400 max-w-2xl mx-auto" data-testid="text-upgrade-description">
            {content.description}
          </DialogDescription>
          
          {currentUsage && reason === 'limit_reached' && (
            <div className="bg-orange-950 border border-orange-800 rounded-lg p-4 mx-auto max-w-sm">
              <div className="flex items-center justify-center space-x-2">
                <Zap className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-200">
                  Uso atual: {currentUsage.total}/10 trades
                </span>
              </div>
            </div>
          )}
        </DialogHeader>

        <Separator className="my-6 bg-zinc-700" />

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-white">Plano Free</h3>
            </div>
            <p className="text-2xl font-bold text-white mb-4">Grátis</p>
            <ul className="space-y-3">
              {freeFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  {feature.included ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm ${feature.included ? 'text-zinc-300' : 'text-zinc-500'}`}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Planos Pagos</h3>
              <Badge className="bg-purple-600 text-white text-xs">Acesso Completo</Badge>
            </div>
            <p className="text-sm text-zinc-400 mb-4">Todos os planos incluem:</p>
            <ul className="space-y-3">
              {paidFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-zinc-300">{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl border-2 p-4 transition-all duration-200 ${
                plan.popular
                  ? 'border-purple-500 bg-purple-950/30'
                  : 'border-zinc-700 hover:border-zinc-600'
              }`}
            >
              {plan.popular && (
                <Badge 
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white"
                >
                  Mais Popular
                </Badge>
              )}
              
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <div className="text-2xl font-bold text-purple-400 mt-2">
                  {plan.price}
                  <span className="text-sm font-normal text-zinc-500">{plan.period}</span>
                </div>
                {plan.savings && (
                  <Badge className="mt-2 bg-green-600 text-white text-xs">
                    {plan.savings}
                  </Badge>
                )}
              </div>

              <Button
                className={`w-full ${plan.color} hover:opacity-90 text-white`}
                onClick={() => handleUpgradeClick(plan.id)}
                data-testid={`button-upgrade-${plan.id}`}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Assinar {plan.name}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-6">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-zinc-400 hover:text-white"
            data-testid="button-cancel"
          >
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
        </div>

        <div className="text-center mt-2">
          <p className="text-xs text-zinc-500">
            Pagamento seguro via PIX ou cartão. Cancele quando quiser.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
