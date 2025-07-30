import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  Calendar,
  DollarSign,
  BarChart3,
  Timer,
  Brain,
  Trophy,
  AlertTriangle,
  Building, 
  Upload, 
  Download, 
  RefreshCw as Sync, 
  Settings, 
  FileText,
  Activity
} from "lucide-react";
import { type Trade } from "@shared/schema";

const brokerConfigSchema = z.object({
  broker: z.enum(["gate.io", "tickmill", "clear"]),
  apiKey: z.string().min(1, "API Key é obrigatória"),
  apiSecret: z.string().min(1, "API Secret é obrigatório"),
  isActive: z.boolean().default(true)
});

type BrokerConfigForm = z.infer<typeof brokerConfigSchema>;

interface BrokerStats {
  totalTrades: number;
  totalProfit: number;
  winRate: number;
}

const brokerInfo = {
  "gate.io": {
    name: "Gate.io",
    type: "Crypto",
    color: "bg-purple-500",
    icon: Activity,
    description: "Exchange de criptomoedas com integração API"
  },
  "tickmill": {
    name: "Tickmill",
    type: "Forex",
    color: "bg-blue-500", 
    icon: TrendingUp,
    description: "Corretora Forex com importação CSV"
  },
  "clear": {
    name: "Clear",
    type: "B3",
    color: "bg-green-500",
    icon: BarChart3,
    description: "Corretora brasileira B3 com importação CSV"
  }
};

interface TradeMetrics {
  totalTrades: number;
  rentabilidadeTotal: number;
  rentabilidadeMes: number;
  rentabilidadeSemana: number;
  rentabilidadeAno: number;
  melhorTrade: number;
  piorTrade: number;
  taxaAcerto: number;
  riscoRetornoMedio: number;
  tempoMedioTrade: number;
  setupMaisLucrativo: { setup: string; total: number; percent: number };
  emocaoMaisRecorrente: { emocao: string; count: number };
  lucroPorDiaSemana: Array<{ dia: string; valor: number }>;
}

const emojiEmocoes = {
  'confiante': '😎',
  'ansioso': '😰',
  'impulsivo': '🔥',
  'calmo': '😌',
  'eufórico': '🤩',
  'frustrado': '😤',
  'neutro': '😐'
};

function calculateMetrics(trades: Trade[]): TradeMetrics {
  if (!trades.length) {
    return {
      totalTrades: 0,
      rentabilidadeTotal: 0,
      rentabilidadeMes: 0,
      rentabilidadeSemana: 0,
      rentabilidadeAno: 0,
      melhorTrade: 0,
      piorTrade: 0,
      taxaAcerto: 0,
      riscoRetornoMedio: 0,
      tempoMedioTrade: 0,
      setupMaisLucrativo: { setup: "", total: 0, percent: 0 },
      emocaoMaisRecorrente: { emocao: "", count: 0 },
      lucroPorDiaSemana: []
    };
  }

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  // Rentabilidade total
  const rentabilidadeTotal = trades.reduce((acc, trade) => {
    const resultado = parseFloat(trade.resultado || "0");
    return acc + resultado;
  }, 0);

  // Rentabilidade por período
  const tradesRecentes = trades.filter(trade => new Date(trade.dataHora) >= oneWeekAgo);
  const tradesMes = trades.filter(trade => new Date(trade.dataHora) >= oneMonthAgo);
  const tradesAno = trades.filter(trade => new Date(trade.dataHora) >= oneYearAgo);

  const rentabilidadeSemana = tradesRecentes.reduce((acc, trade) => 
    acc + parseFloat(trade.resultado || "0"), 0);
  const rentabilidadeMes = tradesMes.reduce((acc, trade) => 
    acc + parseFloat(trade.resultado || "0"), 0);
  const rentabilidadeAno = tradesAno.reduce((acc, trade) => 
    acc + parseFloat(trade.resultado || "0"), 0);

  // Melhor e pior trade
  const resultados = trades.map(trade => parseFloat(trade.resultado || "0"));
  const melhorTrade = Math.max(...resultados);
  const piorTrade = Math.min(...resultados);

  // Taxa de acerto
  const tradesPositivos = trades.filter(trade => parseFloat(trade.resultado || "0") > 0);
  const taxaAcerto = (tradesPositivos.length / trades.length) * 100;

  // Risco/Retorno médio
  const riscoRetornoMedio = trades.reduce((acc, trade) => {
    const risco = parseFloat(trade.risco || "2");
    const retorno = Math.abs(parseFloat(trade.resultado || "0"));
    return acc + (retorno / risco);
  }, 0) / trades.length;

  // Setup mais lucrativo
  const setupLucros: { [key: string]: number } = {};
  trades.forEach(trade => {
    const setup = trade.setup || "Outros";
    const resultado = parseFloat(trade.resultado || "0");
    setupLucros[setup] = (setupLucros[setup] || 0) + resultado;
  });

  const setupMaisLucrativo = Object.entries(setupLucros).reduce((max, [setup, total]) => {
    return total > max.total ? { setup, total, percent: (total / rentabilidadeTotal) * 100 } : max;
  }, { setup: "", total: 0, percent: 0 });

  // Emoção mais recorrente
  const emocoesCount: { [key: string]: number } = {};
  trades.forEach(trade => {
    const emocao = trade.emocao || "neutro";
    emocoesCount[emocao] = (emocoesCount[emocao] || 0) + 1;
  });

  const emocaoMaisRecorrente = Object.entries(emocoesCount).reduce((max, [emocao, count]) => {
    return count > max.count ? { emocao, count } : max;
  }, { emocao: "", count: 0 });

  // Lucro por dia da semana
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const lucroPorDia: { [key: number]: number } = {};
  
  trades.forEach(trade => {
    const dia = new Date(trade.dataHora).getDay();
    const resultado = parseFloat(trade.resultado || "0");
    lucroPorDia[dia] = (lucroPorDia[dia] || 0) + resultado;
  });

  const lucroPorDiaSemana = diasSemana.map((dia, index) => ({
    dia,
    valor: lucroPorDia[index] || 0
  }));

  return {
    totalTrades: trades.length,
    rentabilidadeTotal,
    rentabilidadeMes,
    rentabilidadeSemana,
    rentabilidadeAno,
    melhorTrade,
    piorTrade,
    taxaAcerto,
    riscoRetornoMedio,
    tempoMedioTrade: 0, // Calcular baseado em dados futuros
    setupMaisLucrativo,
    emocaoMaisRecorrente,
    lucroPorDiaSemana
  };
}

function MetricCard({ title, value, icon: Icon, color = "text-white", badge, subtitle }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
  badge?: string;
  subtitle?: string;
}) {
  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-300">{title}</CardTitle>
        <Icon className="h-4 w-4 text-purple-400" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>
          {typeof value === 'number' ? 
            (title.includes('R$') || title.includes('Resultado') ? 
              `R$ ${value.toFixed(2)}` : 
              value.toFixed(1)
            ) : value
          }
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        {badge && (
          <Badge variant="secondary" className="mt-2">
            {badge}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBroker, setSelectedBroker] = useState<string>("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const form = useForm<BrokerConfigForm>({
    resolver: zodResolver(brokerConfigSchema),
    defaultValues: {
      isActive: true
    }
  });

  // Fetch all trades
  const { data: trades = [], isLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  // Fetch broker configurations
  const { data: brokerConfigs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['/api/broker-configs'],
  });

  // Fetch trades by broker
  const { data: tradesByBroker = {}, isLoading: tradesLoading } = useQuery({
    queryKey: ['/api/trades/by-broker'],
  });

  // Fetch CSV import history
  const { data: csvImports = [], isLoading: importsLoading } = useQuery({
    queryKey: ['/api/csv-imports'],
  });

  // Create/update broker config mutation
  const configMutation = useMutation({
    mutationFn: (data: BrokerConfigForm) => 
      fetch('/api/broker-configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': localStorage.getItem('user-id') || ''
        },
        body: JSON.stringify(data)
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/broker-configs'] });
      setIsConfigDialogOpen(false);
      form.reset();
      toast({
        title: "Configuração salva",
        description: "Configuração da corretora foi salva com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar configuração",
        variant: "destructive"
      });
    }
  });

  // CSV upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({ file, broker }: { file: File; broker: string }) => {
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('broker', broker);
      
      return fetch('/api/trades/upload-csv', {
        method: 'POST',
        body: formData,
        headers: {
          'user-id': localStorage.getItem('user-id') || ''
        }
      }).then(res => res.json());
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trades/by-broker'] });
      queryClient.invalidateQueries({ queryKey: ['/api/csv-imports'] });
      setIsUploadDialogOpen(false);
      setCsvFile(null);
      setSelectedBroker("");
      
      toast({
        title: "Importação concluída",
        description: `${data.tradesImported} trades importados com sucesso.`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na importação",
        description: error.message || "Erro ao importar arquivo CSV",
        variant: "destructive"
      });
    }
  });

  // Gate.io sync mutation
  const syncMutation = useMutation({
    mutationFn: () => 
      fetch('/api/sync/gate-io', {
        method: 'POST',
        headers: {
          'user-id': localStorage.getItem('user-id') || ''
        }
      }).then(res => res.json()),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trades/by-broker'] });
      
      toast({
        title: "Sincronização Gate.io",
        description: data.message
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na sincronização",
        description: error.message || "Erro ao sincronizar com Gate.io",
        variant: "destructive"
      });
    }
  });

  const onConfigSubmit = (data: BrokerConfigForm) => {
    configMutation.mutate(data);
  };

  const handleUpload = () => {
    if (!csvFile || !selectedBroker) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um arquivo e uma corretora",
        variant: "destructive"
      });
      return;
    }
    
    uploadMutation.mutate({ file: csvFile, broker: selectedBroker });
  };

  const calculateBrokerStats = (trades: any[]): BrokerStats => {
    if (!trades || trades.length === 0) {
      return { totalTrades: 0, totalProfit: 0, winRate: 0 };
    }

    const totalTrades = trades.length;
    const totalProfit = trades.reduce((sum: number, trade: any) => sum + (parseFloat(trade.resultado) || 0), 0);
    const winningTrades = trades.filter((trade: any) => (parseFloat(trade.resultado) || 0) > 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    return { totalTrades, totalProfit, winRate };
  };

  const getBrokerConfig = (broker: string) => {
    return (brokerConfigs as any[]).find((config: any) => config.broker === broker);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-2">Carregando suas métricas...</p>
        </div>
      </div>
    );
  }

  const metrics = calculateMetrics(trades);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-2">Resumo completo da sua performance de trading</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Settings className="w-4 h-4 mr-2" />
                Configurar API
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configurar API da Corretora</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onConfigSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="broker"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Corretora</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a corretora" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="gate.io">Gate.io (Crypto)</SelectItem>
                            <SelectItem value="tickmill">Tickmill (Forex)</SelectItem>
                            <SelectItem value="clear">Clear (B3)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="Sua API Key" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="apiSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Secret</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="Seu API Secret" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={configMutation.isPending}>
                    {configMutation.isPending ? "Salvando..." : "Salvar Configuração"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Importar CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Trades via CSV</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Corretora</label>
                  <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a corretora" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tickmill">Tickmill (Forex)</SelectItem>
                      <SelectItem value="clear">Clear (B3)</SelectItem>
                      <SelectItem value="gate.io">Gate.io (Crypto)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Arquivo CSV</label>
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  />
                </div>

                <Button 
                  onClick={handleUpload} 
                  className="w-full"
                  disabled={uploadMutation.isPending || !csvFile || !selectedBroker}
                >
                  {uploadMutation.isPending ? "Importando..." : "Importar Trades"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="brokers">Corretoras</TabsTrigger>
          <TabsTrigger value="imports">Importações</TabsTrigger>
          <TabsTrigger value="consolidated">Consolidado</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="✅ Rentabilidade Total"
          value={`R$ ${metrics.rentabilidadeTotal.toFixed(2)}`}
          icon={DollarSign}
          color={metrics.rentabilidadeTotal >= 0 ? "text-green-400" : "text-red-400"}
        />
        
        <MetricCard
          title="🧮 Total de Trades"
          value={metrics.totalTrades}
          icon={BarChart3}
        />
        
        <MetricCard
          title="🎯 Taxa de Acerto"
          value={`${metrics.taxaAcerto.toFixed(1)}%`}
          icon={Target}
          color={metrics.taxaAcerto >= 50 ? "text-green-400" : "text-red-400"}
        />
        
        <MetricCard
          title="🔁 R/R Médio"
          value={`${metrics.riscoRetornoMedio.toFixed(2)}:1`}
          icon={TrendingUp}
          color={metrics.riscoRetornoMedio >= 2 ? "text-green-400" : "text-yellow-400"}
        />
      </div>

      {/* Rentabilidade por período */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="📈 Rentabilidade (Semana)"
          value={`R$ ${metrics.rentabilidadeSemana.toFixed(2)}`}
          icon={Calendar}
          color={metrics.rentabilidadeSemana >= 0 ? "text-green-400" : "text-red-400"}
        />
        
        <MetricCard
          title="📈 Rentabilidade (Mês)"
          value={`R$ ${metrics.rentabilidadeMes.toFixed(2)}`}
          icon={Calendar}
          color={metrics.rentabilidadeMes >= 0 ? "text-green-400" : "text-red-400"}
        />
        
        <MetricCard
          title="📈 Rentabilidade (Ano)"
          value={`R$ ${metrics.rentabilidadeAno.toFixed(2)}`}
          icon={Calendar}
          color={metrics.rentabilidadeAno >= 0 ? "text-green-400" : "text-red-400"}
        />
      </div>

      {/* Melhores e piores trades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="💥 Melhor Trade"
          value={`R$ ${metrics.melhorTrade.toFixed(2)}`}
          icon={Trophy}
          color="text-green-400"
          subtitle="Maior lucro em uma operação"
        />
        
        <MetricCard
          title="💥 Pior Trade"
          value={`R$ ${metrics.piorTrade.toFixed(2)}`}
          icon={AlertTriangle}
          color="text-red-400"
          subtitle="Maior prejuízo em uma operação"
        />
      </div>

      {/* Setup e Emoção */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="🔍 Setup Mais Lucrativo"
          value={metrics.setupMaisLucrativo.setup || "Nenhum"}
          icon={Target}
          color="text-purple-400"
          subtitle={metrics.setupMaisLucrativo.total > 0 ? 
            `R$ ${metrics.setupMaisLucrativo.total.toFixed(2)} (${metrics.setupMaisLucrativo.percent.toFixed(1)}%)` : 
            "Nenhum trade registrado"
          }
        />
        
        <MetricCard
          title="🧠 Emoção Mais Recorrente"
          value={`${emojiEmocoes[metrics.emocaoMaisRecorrente.emocao as keyof typeof emojiEmocoes] || '😐'} ${
            metrics.emocaoMaisRecorrente.emocao || 'Neutro'
          }`}
          icon={Brain}
          color="text-blue-400"
          subtitle={`${metrics.emocaoMaisRecorrente.count} trades`}
        />
      </div>

      {/* Lucro por dia da semana */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-400" />
            📊 Lucro/Prejuízo por Dia da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.lucroPorDiaSemana.map(({ dia, valor }) => (
              <div key={dia} className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">{dia}</span>
                <div className="flex items-center gap-2">
                  <div className={`w-32 h-6 bg-slate-800 rounded-full overflow-hidden`}>
                    <div 
                      className={`h-full transition-all duration-300 ${
                        valor >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.min(Math.abs(valor) / Math.max(...metrics.lucroPorDiaSemana.map(d => Math.abs(d.valor))) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <span className={`text-sm font-medium min-w-[80px] text-right ${
                    valor >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    R$ {valor.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trades recentes */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Timer className="h-5 w-5 text-purple-400" />
            Últimos Trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <p className="text-slate-400 text-center py-8">
              Nenhum trade registrado ainda. 
              <br />
              <span className="text-purple-400">Comece registrando seu primeiro trade!</span>
            </p>
          ) : (
            <div className="space-y-3">
              {trades.slice(-5).reverse().map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      parseFloat(trade.resultado || "0") >= 0 ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                    <div>
                      <p className="text-white font-medium">{trade.ativo}</p>
                      <p className="text-slate-400 text-sm">
                        {trade.setup} • {new Date(trade.dataHora).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      parseFloat(trade.resultado || "0") >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      R$ {parseFloat(trade.resultado || "0").toFixed(2)}
                    </p>
                    <p className="text-slate-400 text-sm">{trade.mercado}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="brokers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(brokerInfo).map(([broker, info]) => {
              const config = getBrokerConfig(broker);
              const trades = (tradesByBroker as any)[broker] || [];
              const stats = calculateBrokerStats(trades);
              const IconComponent = info.icon;

              return (
                <Card key={broker} className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${info.color}`}>
                          <IconComponent className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-white">{info.name}</CardTitle>
                          <CardDescription>{info.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {config?.isActive && (
                          <Badge variant="default" className="bg-green-500">
                            Ativo
                          </Badge>
                        )}
                        <Badge variant="secondary">{info.type}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-white">{stats.totalTrades}</div>
                        <div className="text-xs text-slate-400">Trades</div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {stats.totalProfit >= 0 ? '+' : ''}R$ {stats.totalProfit.toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-400">Resultado</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-400">{stats.winRate.toFixed(1)}%</div>
                        <div className="text-xs text-slate-400">Win Rate</div>
                      </div>
                    </div>

                    <Separator className="bg-slate-700" />

                    <div className="flex justify-between items-center">
                      {broker === 'gate.io' && config?.isActive && (
                        <Button 
                          size="sm" 
                          onClick={() => syncMutation.mutate()}
                          disabled={syncMutation.isPending}
                        >
                          <Sync className="w-4 h-4 mr-1" />
                          {syncMutation.isPending ? "Sync..." : "Sincronizar"}
                        </Button>
                      )}
                      
                      <div className="flex space-x-1">
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="imports" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Histórico de Importações CSV</CardTitle>
              <CardDescription>Acompanhe suas importações de dados</CardDescription>
            </CardHeader>
            <CardContent>
              {(csvImports as any[]).length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  Nenhuma importação realizada ainda
                </div>
              ) : (
                <div className="space-y-4">
                  {(csvImports as any[]).map((importItem: any) => (
                    <div key={importItem.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${importItem.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                        <div>
                          <div className="font-medium text-white">{importItem.fileName}</div>
                          <div className="text-sm text-slate-400">
                            {brokerInfo[importItem.broker as keyof typeof brokerInfo]?.name || importItem.broker}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white">{importItem.tradesImported} trades</div>
                        <div className="text-xs text-slate-400">
                          {new Date(importItem.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consolidated" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Dados Consolidados</CardTitle>
              <CardDescription>Visão unificada de todas as corretoras</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/trades/consolidated'] });
                  toast({
                    title: "Dados consolidados",
                    description: "Dados de todas as corretoras foram consolidados com sucesso."
                  });
                }}
              >
                <Building className="w-4 h-4 mr-2" />
                Consolidar Dados de Todas as Corretoras
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}