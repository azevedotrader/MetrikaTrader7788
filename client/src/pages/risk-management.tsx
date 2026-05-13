import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Loader2, AlertCircle, MessageSquare, Crown, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { QuestionnaireForm } from "@/components/risk-management/QuestionnaireForm";
import { RiskParametersDisplay } from "@/components/risk-management/RiskParametersDisplay";
import { useCurrency } from "@/hooks/useCurrency";
import { useUserPlan } from "@/hooks/useUserPlan";
import { VipUpgradeModal } from "@/components/modals/vip-upgrade-modal";

interface BankrollManagement {
  id: string;
  userId: string;
  bankrollValue: string;
  riskPerOperation: string;
  maxDailyRisk: string;
  maxWeeklyRisk: string;
  minRiskRewardRatio: string;
  drawdownTriggerLosses: number;
  createdAt: Date;
}

interface QuestionnaireAnswers {
  q1: "A" | "B" | "C";
  q2: "A" | "B" | "C";
  q3: string[];
  q4: "A" | "B" | "C";
  q5_winRate: number;
  q5_riskReward: number;
  q6: "A" | "B" | "C";
  q7: "A" | "B" | "C";
}

export default function RiskManagement() {
  const { toast } = useToast();
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const { formatCurrency, getCurrencySymbol } = useCurrency();
  const { planType, isLoading: planLoading } = useUserPlan();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const isFreePlan = planType === 'free';
  
  useEffect(() => {
    if (!planLoading && isFreePlan) {
      setShowUpgradeModal(true);
    }
  }, [planLoading, isFreePlan]);

  // Buscar gestão existente
  const {
    data: bankroll,
    isLoading,
    error,
  } = useQuery<BankrollManagement>({
    queryKey: ["/api/bankroll-management"],
    retry: false,
  });

  // Mutation para criar gestão
  const createMutation = useMutation({
    mutationFn: async ({
      bankrollValue,
      answers,
    }: {
      bankrollValue: number;
      answers: QuestionnaireAnswers;
    }) => {
      const response = await apiRequest("POST", "/api/bankroll-management", {
        bankrollValue,
        answers,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Gestão criada com sucesso!",
        description: "Seu plano de risco personalizado está pronto.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bankroll-management"] });
      setShowQuestionnaire(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar gestão",
        description: error.message || "Tente novamente",
      });
    },
  });

  // Mutation para deletar gestão
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/bankroll-management");
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Gestão deletada",
        description: "Você pode criar uma nova gestão agora.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bankroll-management"] });
      setShowQuestionnaire(true);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao deletar gestão",
        description: error.message || "Tente novamente",
      });
    },
  });

  const handleComplete = (bankrollValue: number, answers: QuestionnaireAnswers) => {
    createMutation.mutate({ bankrollValue, answers });
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja deletar sua gestão atual e refazer o questionário?")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading || planLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#6EE000] mx-auto mb-4" />
          <p className="text-zinc-400">Carregando gestão de risco...</p>
        </div>
      </div>
    );
  }

  if (isFreePlan) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 md:p-6">
        <Card className="max-w-3xl mx-auto bg-graphite/50 border-charcoal-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-center p-6 max-w-md">
              <div className="w-16 h-16 bg-gradient-to-br from-[#6EE000] to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Recurso VIP</h3>
              <p className="text-zinc-400 mb-4">
                A Gestão de Risco Inteligente está disponível apenas para assinantes VIP.
                Crie seu perfil de risco personalizado e receba análises automáticas!
              </p>
              <Button 
                onClick={() => setShowUpgradeModal(true)}
                className="bg-gradient-to-r from-[#6EE000] to-yellow-500 hover:from-[#6EE000] hover:to-yellow-600 text-white font-bold"
                data-testid="button-upgrade-risk"
              >
                <Crown className="w-4 h-4 mr-2" />
                Desbloquear Gestão de Risco
              </Button>
            </div>
          </div>
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Gestão de Risco Inteligente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 opacity-30 pointer-events-none">
            <div className="h-48 flex items-center justify-center text-zinc-500">
              Conteúdo bloqueado para usuários Free
            </div>
          </CardContent>
        </Card>
        
        <VipUpgradeModal 
          open={showUpgradeModal} 
          onOpenChange={setShowUpgradeModal}
          feature="risk"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2 md:gap-3">
            <Calculator className="w-6 h-6 md:w-8 md:h-8" />
            Gestão de Risco Inteligente
          </h1>
          <p className="text-sm md:text-base text-zinc-400">
            Configure seu plano personalizado de gerenciamento de risco baseado em um questionário
            científico de 7 perguntas
          </p>
        </div>

        {/* Conteúdo Principal */}
        {!bankroll && !showQuestionnaire && !error ? (
          // Estado inicial - sem gestão
          <Card className="bg-[#0a0a0f]/50 border-[#1e1e2e]" data-testid="welcome-card">
            <CardHeader>
              <CardTitle className="text-white text-xl">
                Bem-vindo ao Sistema de Gestão de Risco
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Crie seu plano personalizado respondendo 7 perguntas simples
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-[#6EE000]/10 to-[#448aff]/10 border border-[#6EE000]/30 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">O que você vai receber:</h3>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    <li className="flex items-start gap-2">
                      <span className="text-[#6EE000] mt-0.5">✓</span>
                      <span>
                        <strong>Risco por Operação:</strong> O valor exato que você deve arriscar em
                        cada trade
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6EE000] mt-0.5">✓</span>
                      <span>
                        <strong>Risco Máximo Diário:</strong> Limite de perdas que dispara proteção
                        automática
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6EE000] mt-0.5">✓</span>
                      <span>
                        <strong>Risco Máximo Semanal:</strong> Controle de perdas em períodos mais
                        longos
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6EE000] mt-0.5">✓</span>
                      <span>
                        <strong>Relação Risco/Retorno Mínima:</strong> O R:R ideal para seu perfil
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#6EE000] mt-0.5">✓</span>
                      <span>
                        <strong>Regra de Drawdown:</strong> Quantas perdas seguidas antes de reduzir
                        risco
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-green-950/40 to-emerald-950/40 border border-[#6EE000]/40 rounded-lg p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#6EE000]/20 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-[#6EE000]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#6EE000] mb-1 text-base">
                        Prefere criar pelo WhatsApp?
                      </h3>
                      <p className="text-sm text-[#6EE000]/80 leading-relaxed">
                        Você tem <strong>duas formas</strong> de criar sua gestão de risco personalizada:
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-2">
                      <span className="text-[#6EE000] font-bold mt-0.5">1.</span>
                      <div className="flex-1">
                        <p className="text-sm text-[#6EE000] font-medium">Aqui na Plataforma Web</p>
                        <p className="text-xs text-[#6EE000]/70 mt-0.5">
                          Interface visual completa com o questionário das 7 perguntas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-[#6EE000] font-bold mt-0.5">2.</span>
                      <div className="flex-1">
                        <p className="text-sm text-[#6EE000] font-medium">Pelo WhatsApp Bot</p>
                        <p className="text-xs text-[#6EE000]/70 mt-0.5">
                          Conversação interativa com botões - sem precisar digitar nada!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#6EE000]/30 border border-[#6EE000]/30 rounded-md p-3 mb-4">
                    <p className="text-xs text-[#6EE000]/90">
                      <strong>✨ Importante:</strong> Não importa qual método você escolher, os parâmetros
                      de risco calculados serão <strong>exatamente os mesmos</strong>. O algoritmo é
                      idêntico em ambos os canais!
                    </p>
                  </div>

                  <a
                    href="https://wa.me/5522974051621?text=Oi!%20Quero%20criar%20minha%20gest%C3%A3o%20de%20risco%20personalizada"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button
                      className="w-full bg-[#6EE000] hover:bg-[#6EE000] text-white font-medium"
                      size="lg"
                      data-testid="button-whatsapp-cta"
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Criar pelo WhatsApp
                    </Button>
                  </a>

                  <p className="text-xs text-[#6EE000]/60 text-center mt-2">
                    Clique em "🎯 Criar Gestão" no menu e responda 7 perguntas com A/B/C
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setShowQuestionnaire(true)}
                className="w-full bg-gradient-to-r from-[#6EE000] to-[#448aff] hover:from-[#6EE000] hover:to-[#3a7aff]"
                size="lg"
                data-testid="button-start-questionnaire"
              >
                Iniciar Questionário (7 perguntas)
              </Button>
            </CardContent>
          </Card>
        ) : showQuestionnaire || (!bankroll && error) ? (
          // Mostrar questionário
          <QuestionnaireForm
            onComplete={handleComplete}
            isSubmitting={createMutation.isPending}
          />
        ) : bankroll ? (
          // Mostrar parâmetros calculados
          <RiskParametersDisplay
            bankroll={bankroll}
            onDelete={handleDelete}
            isDeleting={deleteMutation.isPending}
            formatCurrency={formatCurrency}
            getCurrencySymbol={getCurrencySymbol}
          />
        ) : (
          // Estado de erro
          <Card className="bg-[#FF1F3D]/20 border-[#FF1F3D]/50">
            <CardHeader>
              <CardTitle className="text-[#FF1F3D] flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Erro ao carregar gestão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-400 mb-4">
                {error && typeof error === "object" && "message" in error
                  ? (error as Error).message
                  : "Erro desconhecido"}
              </p>
              <Button
                onClick={() => setShowQuestionnaire(true)}
                variant="outline"
                className="border-zinc-700"
              >
                Criar Nova Gestão
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Informações Adicionais */}
        {!showQuestionnaire && !bankroll && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-[#0a0a0f]/30 border-[#1e1e2e]/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#6EE000]/20 flex items-center justify-center">
                    <span className="text-xl">🎯</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">Personalizado</h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      Baseado em seu perfil, experiência e objetivos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0a0a0f]/30 border-[#1e1e2e]/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-xl">🛡️</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">Proteção Automática</h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      Regras claras de quando parar e reduzir risco
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0a0a0f]/30 border-[#1e1e2e]/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#6EE000]/20 flex items-center justify-center">
                    <span className="text-xl">📊</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">Baseado em Dados</h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      Algoritmo validado com casos extremos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
