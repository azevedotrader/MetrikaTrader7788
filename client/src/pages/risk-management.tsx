import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Loader2, AlertCircle, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { QuestionnaireForm } from "@/components/risk-management/QuestionnaireForm";
import { RiskParametersDisplay } from "@/components/risk-management/RiskParametersDisplay";
import { PerformanceChart } from "@/components/risk-management/PerformanceChart";

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-zinc-400">Carregando gestão de risco...</p>
        </div>
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
          <Card className="bg-zinc-900/50 border-zinc-800" data-testid="welcome-card">
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
                <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-800/50 rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-2">O que você vai receber:</h3>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>
                        <strong>Risco por Operação:</strong> O valor exato que você deve arriscar em
                        cada trade
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>
                        <strong>Risco Máximo Diário:</strong> Limite de perdas que dispara proteção
                        automática
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>
                        <strong>Risco Máximo Semanal:</strong> Controle de perdas em períodos mais
                        longos
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>
                        <strong>Relação Risco/Retorno Mínima:</strong> O R:R ideal para seu perfil
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>
                        <strong>Regra de Drawdown:</strong> Quantas perdas seguidas antes de reduzir
                        risco
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-green-950/40 to-emerald-950/40 border border-green-800/40 rounded-lg p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-green-200 mb-1 text-base">
                        Prefere criar pelo WhatsApp?
                      </h3>
                      <p className="text-sm text-green-200/80 leading-relaxed">
                        Você tem <strong>duas formas</strong> de criar sua gestão de risco personalizada:
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-2">
                      <span className="text-green-400 font-bold mt-0.5">1.</span>
                      <div className="flex-1">
                        <p className="text-sm text-green-100 font-medium">Aqui na Plataforma Web</p>
                        <p className="text-xs text-green-200/70 mt-0.5">
                          Interface visual completa com o questionário das 7 perguntas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-400 font-bold mt-0.5">2.</span>
                      <div className="flex-1">
                        <p className="text-sm text-green-100 font-medium">Pelo WhatsApp Bot</p>
                        <p className="text-xs text-green-200/70 mt-0.5">
                          Conversação interativa com botões - sem precisar digitar nada!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-900/30 border border-green-700/30 rounded-md p-3 mb-4">
                    <p className="text-xs text-green-200/90">
                      <strong>✨ Importante:</strong> Não importa qual método você escolher, os parâmetros
                      de risco calculados serão <strong>exatamente os mesmos</strong>. O algoritmo é
                      idêntico em ambos os canais!
                    </p>
                  </div>

                  <a
                    href="https://wa.me/5511999999999?text=Oi!%20Quero%20criar%20minha%20gest%C3%A3o%20de%20risco%20personalizada"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
                      size="lg"
                      data-testid="button-whatsapp-cta"
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Criar pelo WhatsApp
                    </Button>
                  </a>

                  <p className="text-xs text-green-300/60 text-center mt-2">
                    Clique em "🎯 Criar Gestão" no menu e responda 7 perguntas com A/B/C
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setShowQuestionnaire(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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
          <div className="space-y-6">
            <PerformanceChart bankroll={bankroll} />
            <RiskParametersDisplay
              bankroll={bankroll}
              onDelete={handleDelete}
              isDeleting={deleteMutation.isPending}
            />
          </div>
        ) : (
          // Estado de erro
          <Card className="bg-red-900/20 border-red-800/50">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
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
            <Card className="bg-zinc-900/30 border-zinc-800/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
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

            <Card className="bg-zinc-900/30 border-zinc-800/50">
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

            <Card className="bg-zinc-900/30 border-zinc-800/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
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
