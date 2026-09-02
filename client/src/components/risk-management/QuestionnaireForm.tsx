import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronRight, ChevronLeft } from "lucide-react";

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

interface QuestionnaireFormProps {
  onComplete: (bankrollValue: number, answers: QuestionnaireAnswers) => void;
  isSubmitting: boolean;
}

const QUESTIONS = [
  {
    id: "bankroll",
    title: "Qual é o valor do seu capital de trading?",
    type: "number",
    description: "Informe o valor total que você tem disponível para trading",
  },
  {
    id: "q1",
    title: "Q1. Há quanto tempo você opera no mercado?",
    description: "Experiência no trading",
    options: [
      { value: "A", label: "Iniciante (menos de 1 ano)" },
      { value: "B", label: "Intermediário (1 a 3 anos)" },
      { value: "C", label: "Experiente (mais de 3 anos)" },
    ],
  },
  {
    id: "q2",
    title: "Q2. Qual seu perfil de risco preferido?",
    description: "Define os parâmetros base do seu plano",
    options: [
      { value: "A", label: "Conservador (menor risco, crescimento estável)" },
      { value: "B", label: "Moderado (risco equilibrado)" },
      { value: "C", label: "Arrojado (maior risco, maior potencial)" },
    ],
  },
  {
    id: "q3",
    title: "Q3. Em quais mercados você opera?",
    description: "Selecione todos que se aplicam",
    type: "checkbox",
    options: [
      { value: "A", label: "Forex" },
      { value: "B", label: "B3" },
      { value: "C", label: "Cripto" },
      { value: "D", label: "Outro" },
    ],
  },
  {
    id: "q4",
    title: "Q4. Qual seu timeframe principal de operação?",
    description: "Define ajustes adicionais de risco",
    options: [
      { value: "A", label: "Scalper/Intraday (segundos a minutos)" },
      { value: "B", label: "Day Trade (minutos a horas)" },
      { value: "C", label: "Swing Trade (dias a semanas)" },
    ],
  },
  {
    id: "q5",
    title: "Q5. Qual sua taxa de acerto e relação risco/retorno?",
    description: "Ajusta o R:R mínimo recomendado",
    type: "custom",
  },
  {
    id: "q6",
    title: "Q6. Como você reage psicologicamente após uma perda?",
    description: "Impacta o risco diário máximo",
    options: [
      { value: "A", label: "Fico muito abalado e perco a confiança" },
      { value: "B", label: "Fico um pouco incomodado mas sigo o plano" },
      { value: "C", label: "Não me afeta, faz parte do processo" },
    ],
  },
  {
    id: "q7",
    title: "Q7. Como você lida com sequências de perdas (drawdown)?",
    description: "Afeta o gatilho de proteção",
    options: [
      { value: "A", label: "Prefiro parar mais cedo (conservador)" },
      { value: "B", label: "Aguento algumas perdas seguidas (moderado)" },
      { value: "C", label: "Mantenho disciplina por mais tempo (resiliente)" },
    ],
  },
];

export function QuestionnaireForm({ onComplete, isSubmitting }: QuestionnaireFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [bankrollValue, setBankrollValue] = useState("");
  const [answers, setAnswers] = useState<Partial<QuestionnaireAnswers>>({
    q3: [],
  });

  const currentQuestion = QUESTIONS[currentStep];

  const canProceed = () => {
    if (currentStep === 0) {
      return parseFloat(bankrollValue) > 0;
    }
    if (currentQuestion.id === "q3") {
      return (answers.q3 || []).length > 0;
    }
    if (currentQuestion.id === "q5") {
      return answers.q5_winRate !== undefined && answers.q5_riskReward !== undefined;
    }
    return !!answers[currentQuestion.id as keyof QuestionnaireAnswers];
  };

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Enviar formulário
      const completeAnswers: QuestionnaireAnswers = {
        q1: answers.q1 || "B",
        q2: answers.q2 || "B",
        q3: answers.q3 || [],
        q4: answers.q4 || "B",
        q5_winRate: answers.q5_winRate || 50,
        q5_riskReward: answers.q5_riskReward || 2.0,
        q6: answers.q6 || "B",
        q7: answers.q7 || "B",
      };
      onComplete(parseFloat(bankrollValue), completeAnswers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Card className="bg-[#0a0a0f]/50 border-[#1e1e2e]" data-testid="questionnaire-form">
      <CardHeader>
        <CardTitle className="text-white">
          Configure sua Gestão de Risco Personalizada
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Responda 7 perguntas para receber um plano de risco sob medida
        </CardDescription>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-zinc-500 mb-2">
            <span>Pergunta {currentStep + 1} de {QUESTIONS.length}</span>
            <span>{Math.round(((currentStep + 1) / QUESTIONS.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-[#13131a] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6EE000] to-[#448aff] transition-all duration-300"
              style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {currentStep === 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">{currentQuestion.title}</h3>
            <p className="text-sm text-zinc-400">{currentQuestion.description}</p>
            <div>
              <Label htmlFor="bankroll-input" className="text-white">
                Capital Inicial (R$)
              </Label>
              <Input
                id="bankroll-input"
                type="number"
                min="1"
                step="0.01"
                value={bankrollValue}
                onChange={(e) => setBankrollValue(e.target.value)}
                placeholder="Ex: 1000.00"
                className="bg-[#13131a] border-zinc-700 text-white mt-2"
                data-testid="input-bankroll-value"
              />
            </div>
          </div>
        ) : currentQuestion.type === "checkbox" ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">{currentQuestion.title}</h3>
            <p className="text-sm text-zinc-400">{currentQuestion.description}</p>
            <div className="space-y-3">
              {currentQuestion.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`q3-${option.value}`}
                    checked={(answers.q3 || []).includes(option.value)}
                    onCheckedChange={(checked) => {
                      const current = answers.q3 || [];
                      if (checked) {
                        setAnswers({ ...answers, q3: [...current, option.value] });
                      } else {
                        setAnswers({ ...answers, q3: current.filter((v) => v !== option.value) });
                      }
                    }}
                    className="border-zinc-600"
                    data-testid={`checkbox-q3-${option.value}`}
                  />
                  <label
                    htmlFor={`q3-${option.value}`}
                    className="text-sm text-white cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ) : currentQuestion.type === "custom" ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">{currentQuestion.title}</h3>
            <p className="text-sm text-zinc-400">{currentQuestion.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="win-rate" className="text-white">
                  Taxa de Acerto (%)
                </Label>
                <Input
                  id="win-rate"
                  type="number"
                  min="0"
                  max="100"
                  value={answers.q5_winRate || ""}
                  onChange={(e) =>
                    setAnswers({ ...answers, q5_winRate: parseFloat(e.target.value) })
                  }
                  placeholder="Ex: 55"
                  className="bg-[#13131a] border-zinc-700 text-white mt-2"
                  data-testid="input-win-rate"
                />
              </div>
              <div>
                <Label htmlFor="risk-reward" className="text-white">
                  Risco/Retorno (R:R)
                </Label>
                <Input
                  id="risk-reward"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={answers.q5_riskReward || ""}
                  onChange={(e) =>
                    setAnswers({ ...answers, q5_riskReward: parseFloat(e.target.value) })
                  }
                  placeholder="Ex: 2.0"
                  className="bg-[#13131a] border-zinc-700 text-white mt-2"
                  data-testid="input-risk-reward"
                />
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              Exemplo: Win Rate 55% + R:R 1:2 = Para cada R$1 arriscado, ganho R$2
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">{currentQuestion.title}</h3>
            <p className="text-sm text-zinc-400">{currentQuestion.description}</p>
            <RadioGroup
              value={answers[currentQuestion.id as keyof QuestionnaireAnswers] as string}
              onValueChange={(value) =>
                setAnswers({ ...answers, [currentQuestion.id]: value })
              }
            >
              {currentQuestion.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value}
                    id={`${currentQuestion.id}-${option.value}`}
                    className="border-zinc-600"
                    data-testid={`radio-${currentQuestion.id}-${option.value}`}
                  />
                  <label
                    htmlFor={`${currentQuestion.id}-${option.value}`}
                    className="text-sm text-white cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t border-[#1e1e2e]">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="border-zinc-700"
            data-testid="button-back"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
            className="bg-gradient-to-r from-[#6EE000] to-[#448aff]"
            data-testid="button-next"
          >
            {currentStep === QUESTIONS.length - 1 ? (
              isSubmitting ? "Calculando..." : "Finalizar"
            ) : (
              <>
                Próxima
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
