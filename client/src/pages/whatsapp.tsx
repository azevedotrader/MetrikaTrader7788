import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { FaWhatsapp, FaCheckCircle, FaCopy } from "react-icons/fa";
import { PhoneIcon, InfoIcon, MessageSquare, TrendingUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function WhatsAppPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsappNumber || "");

  const saveNumberMutation = useMutation({
    mutationFn: async (number: string) => {
      const response = await apiRequest("PATCH", "/api/user/whatsapp", { whatsappNumber: number });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Número salvo com sucesso!",
        description: "Seu número do WhatsApp foi vinculado à sua conta.",
      });
      // Atualizar o número localmente e no contexto do usuário
      if (data.whatsappNumber) {
        setWhatsappNumber(data.whatsappNumber);
        updateUser({ whatsappNumber: data.whatsappNumber });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar número",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  const handleSaveNumber = () => {
    if (!whatsappNumber) {
      toast({
        title: "Número inválido",
        description: "Por favor, insira um número válido.",
        variant: "destructive",
      });
      return;
    }
    saveNumberMutation.mutate(whatsappNumber);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência.",
    });
  };

  const exampleMessages = [
    {
      title: "Trade de Compra",
      message: `Trade BTC
Compra
Entrada: 45000
Saída: 46500
Quantidade: 0.5
Resultado: +750`,
    },
    {
      title: "Trade de Venda",
      message: `Trade EUR/USD
Venda
Entrada: 1.0850
Stop: 1.0900
Alvo: 1.0750
Capital: 1000`,
    },
    {
      title: "Trade Simples",
      message: `PETR4
Compra 100 ações
R$ 28.50
Lucro: R$ 320`,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
            <FaWhatsapp className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">WhatsApp</h1>
            <p className="text-zinc-400">Configure e registre seus trades via WhatsApp</p>
          </div>
        </div>

        {/* Configuração do Webhook */}
        <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-600/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <InfoIcon className="w-5 h-5 text-purple-600" />
              Configuração do Webhook (Para Desenvolvedores)
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Configure estes valores no Meta Developer Console (Facebook)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-purple-900/20 border-purple-600/30">
              <InfoIcon className="h-4 w-4 text-purple-600" />
              <AlertTitle className="text-purple-600">Webhook do WhatsApp</AlertTitle>
              <AlertDescription className="text-zinc-300">
                Para receber mensagens automaticamente via WhatsApp Business API
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  URL do Webhook
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`${window.location.origin}/webhook`)}
                    className="text-zinc-400 hover:text-white h-6 px-2"
                  >
                    <FaCopy className="w-3 h-3" />
                  </Button>
                </h4>
                <code className="text-green-400 text-sm break-all">
                  {window.location.origin}/webhook
                </code>
              </div>

              <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                <h4 className="text-white font-semibold mb-2">Token de Verificação</h4>
                <p className="text-zinc-400 text-sm">
                  Configurado nos secrets do servidor (WHATSAPP_VERIFY_TOKEN)
                </p>
              </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
              <h4 className="text-blue-400 font-semibold mb-2">Como Configurar:</h4>
              <ol className="text-zinc-300 text-sm space-y-2 list-decimal list-inside">
                <li>Acesse o <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Meta Developer Console</a></li>
                <li>Vá em Produtos → WhatsApp → Configuração → Webhook</li>
                <li>Cole a URL do webhook acima</li>
                <li>Use o mesmo token de verificação configurado no servidor</li>
                <li>Inscreva-se no campo "messages"</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Configuração do Número */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PhoneIcon className="w-5 h-5 text-green-600" />
              Configurar Número do WhatsApp
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Vincule seu número do WhatsApp para salvar trades automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="tel"
                  placeholder="+55 11 99999-9999"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  data-testid="input-whatsapp-number"
                />
                <p className="text-xs text-zinc-500 mt-2">
                  Digite no formato: +55 (DDD) número
                </p>
              </div>
              <Button
                onClick={handleSaveNumber}
                disabled={saveNumberMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
                data-testid="button-save-whatsapp"
              >
                {saveNumberMutation.isPending ? "Salvando..." : "Salvar Número"}
              </Button>
            </div>

            {user?.whatsappNumber && (
              <Alert className="bg-green-900/20 border-green-600/30">
                <FaCheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">Número Configurado!</AlertTitle>
                <AlertDescription className="text-zinc-300">
                  Seu número atual: {user.whatsappNumber}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Como Funciona */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <InfoIcon className="w-5 h-5 text-blue-600" />
              Como Funciona?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mb-3">
                  <span className="text-white font-bold">1</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Configure seu Número</h3>
                <p className="text-zinc-400 text-sm">
                  Salve o número do WhatsApp que você vai usar para enviar trades
                </p>
              </div>

              <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mb-3">
                  <span className="text-white font-bold">2</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Envie Mensagens</h3>
                <p className="text-zinc-400 text-sm">
                  Envie os detalhes do seu trade por WhatsApp seguindo os exemplos
                </p>
              </div>

              <div className="bg-zinc-800 p-4 rounded-lg border border-zinc-700">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center mb-3">
                  <span className="text-white font-bold">3</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Trade Salvo!</h3>
                <p className="text-zinc-400 text-sm">
                  O sistema processa automaticamente e salva o trade na plataforma
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formato das Mensagens */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              Formato das Mensagens
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Veja exemplos de como enviar seus trades via WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-900/20 border-blue-600/30">
              <InfoIcon className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-600">Dica Importante</AlertTitle>
              <AlertDescription className="text-zinc-300">
                Não precisa seguir um formato rígido! Nosso sistema com IA entende mensagens naturais.
                Quanto mais informações você incluir, melhor será o registro do trade.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h4 className="text-white font-semibold">Informações que você pode incluir:</h4>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-zinc-300">
                  <FaCheckCircle className="text-green-600" />
                  <span>Ativo negociado (BTC, PETR4, EUR/USD)</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <FaCheckCircle className="text-green-600" />
                  <span>Tipo (Compra ou Venda)</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <FaCheckCircle className="text-green-600" />
                  <span>Preço de entrada</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <FaCheckCircle className="text-green-600" />
                  <span>Preço de saída</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <FaCheckCircle className="text-green-600" />
                  <span>Stop Loss</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <FaCheckCircle className="text-green-600" />
                  <span>Alvo de lucro</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <FaCheckCircle className="text-green-600" />
                  <span>Quantidade negociada</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <FaCheckCircle className="text-green-600" />
                  <span>Resultado (lucro/prejuízo)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exemplos de Mensagens */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Exemplos de Mensagens
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Copie e adapte estes exemplos para seus trades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {exampleMessages.map((example, index) => (
              <div
                key={index}
                className="bg-zinc-800 p-4 rounded-lg border border-zinc-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-semibold">{example.title}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(example.message)}
                    className="text-zinc-400 hover:text-white"
                    data-testid={`button-copy-example-${index}`}
                  >
                    <FaCopy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                </div>
                <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3">
                  <pre className="text-green-400 text-sm whitespace-pre-wrap font-mono">
                    {example.message}
                  </pre>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Benefícios */}
        <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-600/30">
          <CardHeader>
            <CardTitle className="text-white">Por que usar o WhatsApp?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaCheckCircle className="text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Rapidez</h4>
                  <p className="text-zinc-300 text-sm">
                    Registre trades em segundos, direto do celular
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaCheckCircle className="text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Praticidade</h4>
                  <p className="text-zinc-300 text-sm">
                    Não precisa abrir a plataforma toda vez
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaCheckCircle className="text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Flexibilidade</h4>
                  <p className="text-zinc-300 text-sm">
                    Envie de qualquer lugar, a qualquer hora
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaCheckCircle className="text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Inteligência Artificial</h4>
                  <p className="text-zinc-300 text-sm">
                    Sistema entende mensagens naturais automaticamente
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
