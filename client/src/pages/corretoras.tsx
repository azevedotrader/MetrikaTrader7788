import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { apiRequest } from "@/lib/queryClient";
import { 
  Building, 
  Upload, 
  Download, 
  RefreshCw as Sync, 
  Settings, 
  FileText, 
  TrendingUp,
  BarChart3,
  Activity
} from "lucide-react";

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

export default function Corretoras() {
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

  const calculateStats = (trades: any[]): BrokerStats => {
    if (!trades || trades.length === 0) {
      return { totalTrades: 0, totalProfit: 0, winRate: 0 };
    }

    const totalTrades = trades.length;
    const totalProfit = trades.reduce((sum, trade) => sum + (parseFloat(trade.resultado) || 0), 0);
    const winningTrades = trades.filter(trade => (parseFloat(trade.resultado) || 0) > 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    return { totalTrades, totalProfit, winRate };
  };

  const getBrokerConfig = (broker: string) => {
    return (brokerConfigs as any[]).find((config: any) => config.broker === broker);
  };

  if (configsLoading || tradesLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Corretoras</h1>
          <p className="text-slate-400">Gerencie suas corretoras e fontes de dados</p>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="imports">Histórico de Importações</TabsTrigger>
          <TabsTrigger value="consolidated">Dados Consolidados</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(brokerInfo).map(([broker, info]) => {
              const config = getBrokerConfig(broker);
              const trades = (tradesByBroker as any)[broker] || [];
              const stats = calculateStats(trades);
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