import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Shield, BarChart3, MessageSquare, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface VipUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: "csv" | "trades" | "risk" | "general";
}

export function VipUpgradeModal({ open, onOpenChange, feature = "general" }: VipUpgradeModalProps) {
  const { t, language } = useLanguage();

  const featureMessages = {
    csv: {
      pt: {
        title: "Importação de CSV",
        description: "Importe seus trades automaticamente de arquivos CSV para análise completa."
      },
      en: {
        title: "CSV Import",
        description: "Import your trades automatically from CSV files for complete analysis."
      },
      es: {
        title: "Importación de CSV",
        description: "Importe sus operaciones automáticamente desde archivos CSV para un análisis completo."
      }
    },
    trades: {
      pt: {
        title: "Trades Ilimitados",
        description: "Registre quantos trades quiser e tenha uma análise completa do seu desempenho."
      },
      en: {
        title: "Unlimited Trades",
        description: "Record as many trades as you want and get a complete analysis of your performance."
      },
      es: {
        title: "Operaciones Ilimitadas",
        description: "Registre tantas operaciones como desee y obtenga un análisis completo de su rendimiento."
      }
    },
    risk: {
      pt: {
        title: "Gestão de Risco",
        description: "Crie um plano de gestão de risco personalizado baseado no seu perfil de trader."
      },
      en: {
        title: "Risk Management",
        description: "Create a personalized risk management plan based on your trader profile."
      },
      es: {
        title: "Gestión de Riesgos",
        description: "Cree un plan de gestión de riesgos personalizado basado en su perfil de trader."
      }
    },
    general: {
      pt: {
        title: "Recursos Premium",
        description: "Desbloqueie todos os recursos avançados da plataforma Métrika."
      },
      en: {
        title: "Premium Features",
        description: "Unlock all advanced features of the Métrika platform."
      },
      es: {
        title: "Recursos Premium",
        description: "Desbloquee todas las funciones avanzadas de la plataforma Métrika."
      }
    }
  };

  const lang = language as "pt" | "en" | "es";
  const currentFeature = featureMessages[feature][lang] || featureMessages[feature].pt;

  const benefits = {
    pt: [
      { icon: Zap, text: "Importação ilimitada de CSVs" },
      { icon: BarChart3, text: "Trades ilimitados" },
      { icon: Shield, text: "Gestão de risco personalizada" },
      { icon: MessageSquare, text: "Suporte prioritário" },
      { icon: Sparkles, text: "Análise com IA avançada" },
    ],
    en: [
      { icon: Zap, text: "Unlimited CSV imports" },
      { icon: BarChart3, text: "Unlimited trades" },
      { icon: Shield, text: "Personalized risk management" },
      { icon: MessageSquare, text: "Priority support" },
      { icon: Sparkles, text: "Advanced AI analysis" },
    ],
    es: [
      { icon: Zap, text: "Importación ilimitada de CSVs" },
      { icon: BarChart3, text: "Operaciones ilimitadas" },
      { icon: Shield, text: "Gestión de riesgos personalizada" },
      { icon: MessageSquare, text: "Soporte prioritario" },
      { icon: Sparkles, text: "Análisis con IA avanzada" },
    ]
  };

  const currentBenefits = benefits[lang] || benefits.pt;

  const texts = {
    pt: {
      unlock: "Desbloqueie o Plano VIP",
      subtitle: "Eleve sua experiência de trading para o próximo nível",
      vipBenefits: "Benefícios do Plano VIP",
      price: "R$ 97,00",
      period: "/mês",
      cta: "Quero ser VIP",
      later: "Mais tarde"
    },
    en: {
      unlock: "Unlock the VIP Plan",
      subtitle: "Take your trading experience to the next level",
      vipBenefits: "VIP Plan Benefits",
      price: "$59",
      period: "/month",
      cta: "I want to be VIP",
      later: "Later"
    },
    es: {
      unlock: "Desbloquea el Plan VIP",
      subtitle: "Lleva tu experiencia de trading al siguiente nivel",
      vipBenefits: "Beneficios del Plan VIP",
      price: "$59",
      period: "/mes",
      cta: "Quiero ser VIP",
      later: "Más tarde"
    }
  };

  const currentTexts = texts[lang] || texts.pt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-lg bg-gradient-to-br from-zinc-900 via-zinc-900 to-purple-900/20 border-purple-500/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-yellow-500 rounded-full flex items-center justify-center animate-pulse">
              <Crown className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <span className="bg-gradient-to-r from-purple-400 to-yellow-400 bg-clip-text text-transparent">
              {currentTexts.unlock}
            </span>
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-base">
            {currentTexts.subtitle}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="bg-zinc-800/50 rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                {feature === "csv" && <Zap className="w-5 h-5 text-purple-400" />}
                {feature === "trades" && <BarChart3 className="w-5 h-5 text-purple-400" />}
                {feature === "risk" && <Shield className="w-5 h-5 text-purple-400" />}
                {feature === "general" && <Sparkles className="w-5 h-5 text-purple-400" />}
              </div>
              <div>
                <h3 className="font-semibold text-white">{currentFeature.title}</h3>
                <p className="text-sm text-zinc-400">{currentFeature.description}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-500" />
              {currentTexts.vipBenefits}
            </h4>
            <div className="space-y-2">
              {currentBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-green-600/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-3.5 h-3.5 text-green-500" />
                  </div>
                  <span className="text-zinc-300">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-600/20 to-yellow-600/20 rounded-xl p-4 border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Plano VIP</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{currentTexts.price}</span>
                  <span className="text-zinc-400">{currentTexts.period}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                  POPULAR
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-yellow-500 hover:from-purple-700 hover:to-yellow-600 text-white font-bold py-3 text-lg"
              onClick={() => {
                window.open('/', '_blank');
                onOpenChange(false);
              }}
              data-testid="button-upgrade-vip"
            >
              <Crown className="w-5 h-5 mr-2" />
              {currentTexts.cta}
            </Button>
            <Button 
              variant="ghost" 
              className="w-full text-zinc-400 hover:text-zinc-300"
              onClick={() => onOpenChange(false)}
              data-testid="button-upgrade-later"
            >
              {currentTexts.later}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
