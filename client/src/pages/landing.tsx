import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  ChartBar, 
  Link2, 
  TrendingUp, 
  Target,
  Brain,
  DollarSign,
  Clock,
  Shield,
  Zap,
  CheckCircle,
  Users,
  Calendar,
  FileText,
  PieChart,
  ArrowRight,
  Star,
  Activity,
  Database,
  Download,
  LineChart
} from "lucide-react";
import { LoginModal } from "@/components/ui/login-modal";
import { RegisterModal } from "@/components/ui/register-modal";

export default function Landing() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleSwitchToRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="relative z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-purple-blue rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">Métrika</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#recursos" className="text-slate-300 hover:text-white transition-colors">
                Recursos
              </a>
              <a href="#precos" className="text-slate-300 hover:text-white transition-colors">
                Preços
              </a>
              <a href="#contato" className="text-slate-300 hover:text-white transition-colors">
                Contato
              </a>
            </nav>
            <div className="flex space-x-2 sm:space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setShowLogin(true)}
                className="text-slate-300 hover:text-white text-sm sm:text-base px-2 sm:px-4"
              >
                Entrar
              </Button>
              <Button 
                onClick={() => setShowRegister(true)}
                className="gradient-purple-blue hover:opacity-90 transition-opacity text-sm sm:text-base px-2 sm:px-4"
              >
                <span className="hidden sm:inline">Começar Agora</span>
                <span className="sm:hidden">Começar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-slate-900 to-indigo-900/40"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-transparent"></div>
        
        {/* Floating geometric elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-r from-gold-400/20 to-yellow-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Announcement Banner */}
          <div className="text-center mb-8 sm:mb-12">
            <Badge className="gradient-emerald-blue text-white px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-semibold animate-glow">
              <span className="hidden sm:inline">✨ Novo: Integração com Gate.io + 3 Corretoras</span>
              <span className="sm:hidden">✨ Novo: Integração Gate.io</span>
            </Badge>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="text-center lg:text-left">
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-6 sm:mb-8 lg:mb-10 leading-tight">
                <span className="text-white">O Fim das</span>
                <span className="gradient-text block animate-pulse-slow">Planilhas</span>
                <span className="text-white">de Trading</span>
              </h1>
              
              <p className="font-body text-lg sm:text-xl md:text-2xl lg:text-3xl text-slate-200 mb-6 sm:mb-8 leading-relaxed">
                A única plataforma que analisa seus trades automaticamente e revela 
                <span className="text-emerald-400 font-bold"> os padrões que geram lucro</span>
              </p>
              
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8 justify-center lg:justify-start">
                <div className="flex items-center space-x-2 text-slate-300">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Import automático de trades</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Analytics avançado</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-12 sm:mb-16 justify-center lg:justify-start">
                <Button 
                  size="lg"
                  onClick={() => setShowRegister(true)}
                  className="gradient-emerald-blue hover:scale-105 hover:shadow-2xl transition-all duration-300 px-6 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-bold animate-glow"
                >
                  Começar Grátis
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/30 hover:border-emerald-400 transition-all duration-300 px-6 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-semibold backdrop-blur-sm"
                >
                  Ver Demo
                </Button>
              </div>
              
              {/* Social Proof */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-8">
                <div className="flex items-center space-x-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-slate-300 font-medium">4.9/5</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span>1.200+ traders ativos</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <Activity className="w-5 h-5 text-green-400" />
                  <span>2M+ trades analisados</span>
                </div>
              </div>
            </div>
            
            {/* Enhanced Dashboard Preview */}
            <div className="relative">
              {/* Main Dashboard Card */}
              <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border-emerald-600/30 shadow-2xl transform hover:scale-105 transition-all duration-500 animate-glow">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 gradient-emerald-blue rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xl font-bold text-white">Dashboard Principal</span>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1">
                      Live
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-gradient-to-br from-emerald-500/25 to-teal-500/25 border-emerald-500/40 hover:border-emerald-400/60 transition-all duration-300">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-slate-200">P&L Total</span>
                          <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="text-3xl font-bold text-emerald-400">+R$ 28.540</div>
                        <div className="text-sm text-emerald-300">+12.4% este mês</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-indigo-500/25 to-blue-500/25 border-indigo-500/40 hover:border-indigo-400/60 transition-all duration-300">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-slate-200">Win Rate</span>
                          <Target className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="text-3xl font-bold text-indigo-400">78.5%</div>
                        <div className="text-sm text-indigo-300">156/199 trades</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Chart Visualization */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-300">Evolução do Capital</span>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        </div>
                      </div>
                      <div className="h-32 bg-gradient-to-r from-slate-900/50 to-slate-800/50 rounded-lg p-2 flex items-end justify-between">
                        {[
                          { height: 20, color: "from-red-500 to-red-400" },
                          { height: 25, color: "from-yellow-500 to-yellow-400" },
                          { height: 35, color: "from-green-500 to-green-400" },
                          { height: 45, color: "from-green-500 to-green-400" },
                          { height: 55, color: "from-blue-500 to-blue-400" },
                          { height: 48, color: "from-blue-500 to-blue-400" },
                          { height: 65, color: "from-purple-500 to-purple-400" },
                          { height: 72, color: "from-purple-500 to-purple-400" }
                        ].map((bar, i) => (
                          <div 
                            key={i}
                            className={`w-3 bg-gradient-to-t ${bar.color} rounded-t opacity-80 hover:opacity-100 transition-opacity`}
                            style={{ height: `${bar.height}px` }}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Broker Integration Status */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <span className="text-sm font-medium text-slate-300 mb-3 block">Corretoras Conectadas</span>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-sm text-slate-300">Gate.io</span>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400 text-xs">Sincronizado</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span className="text-sm text-slate-300">Clear</span>
                          </div>
                          <Badge className="bg-blue-500/20 text-blue-400 text-xs">Ativo</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                            <span className="text-sm text-slate-300">Tickmill</span>
                          </div>
                          <Badge className="bg-orange-500/20 text-orange-400 text-xs">Conectado</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 w-20 h-20 gradient-emerald-blue rounded-full opacity-25 animate-float"></div>
              <div className="absolute -bottom-6 -left-6 w-16 h-16 gradient-teal rounded-full opacity-25 animate-float" style={{ animationDelay: '3s' }}></div>
              <div className="absolute top-1/2 -right-8 w-12 h-12 gradient-gold rounded-full opacity-20 animate-pulse-slow"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement Section */}
      <section className="py-24 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-red-400">95% dos Traders</span>
              <span className="text-white block">Falham Por Não Saberem</span>
              <span className="gradient-text">O Que Estão Fazendo Errado</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-4xl mx-auto">
              Sem dados precisos e análises consistentes, você está operando no escuro. 
              Métrika revela exatamente onde você perde dinheiro e como corrigir.
            </p>
          </div>

          <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                problem: "Planilhas Desatualizadas",
                description: "Você perde tempo preenchendo planilhas manualmente em vez de focar nas operações",
                icon: FileText,
                color: "from-red-500 to-red-400"
              },
              {
                problem: "Dados Imprecisos",
                description: "Erros de cálculo e dados inconsistentes levam a decisões erradas",
                icon: Database,
                color: "from-orange-500 to-orange-400"
              },
              {
                problem: "Análise Limitada",
                description: "Sem insights profundos sobre seus padrões de trading, você repete os mesmos erros",
                icon: Brain,
                color: "from-yellow-500 to-yellow-400"
              }
            ].map((item, index) => (
              <Card key={index} className="bg-slate-800/80 border-slate-700 hover:border-slate-600 transition-all">
                <CardContent className="p-8 text-center">
                  <div className={`w-16 h-16 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center mx-auto mb-6 opacity-20`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{item.problem}</h3>
                  <p className="text-slate-400">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Preview Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 text-sm font-medium mb-6">
              A Solução Definitiva
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="gradient-text">Screenshots Reais</span>
              <span className="text-white block">da Plataforma</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Veja exatamente como o Métrika transforma seus dados de trading em insights acionáveis
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Dashboard Screenshot */}
            <div className="order-2 lg:order-1">
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <PieChart className="w-5 h-5" />
                      Dashboard Analytics
                    </CardTitle>
                    <Badge className="bg-green-500/20 text-green-400">Real-time</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Performance Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-300">Lucro Total</span>
                        <DollarSign className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="text-2xl font-bold text-green-400">R$ 45.230</div>
                      <div className="text-xs text-green-300">+18.5% no mês</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-300">Trades Vencedores</span>
                        <Target className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="text-2xl font-bold text-blue-400">82.3%</div>
                      <div className="text-xs text-blue-300">234/284 trades</div>
                    </div>
                  </div>

                  {/* Analytics Chart */}
                  <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-300">Evolução Mensal</span>
                      <LineChart className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="h-24 flex items-end justify-between space-x-1">
                      {[
                        { height: 15, profit: true },
                        { height: 25, profit: true },
                        { height: 20, profit: false },
                        { height: 35, profit: true },
                        { height: 45, profit: true },
                        { height: 40, profit: true },
                        { height: 55, profit: true },
                        { height: 60, profit: true }
                      ].map((bar, i) => (
                        <div 
                          key={i}
                          className={`flex-1 rounded-t transition-all hover:opacity-80 ${
                            bar.profit 
                              ? 'bg-gradient-to-t from-green-500 to-green-400' 
                              : 'bg-gradient-to-t from-red-500 to-red-400'
                          }`}
                          style={{ height: `${bar.height}px` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Recent Trades */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-slate-300">Últimos Trades</span>
                    {[
                      { pair: "BTC/USDT", result: "+R$ 1.250", positive: true, time: "14:32" },
                      { pair: "ETH/USDT", result: "+R$ 890", positive: true, time: "13:45" },
                      { pair: "EUR/USD", result: "-R$ 320", positive: false, time: "12:18" }
                    ].map((trade, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 bg-slate-800/30 rounded">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${trade.positive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                          <span className="text-sm text-slate-300">{trade.pair}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${trade.positive ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.result}
                          </span>
                          <span className="text-xs text-slate-400">{trade.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Features List */}
            <div className="order-1 lg:order-2">
              <h3 className="text-3xl font-bold text-white mb-8">
                Tudo Que Você Precisa Para
                <span className="gradient-text block">Dominar Seus Trades</span>
              </h3>
              
              <div className="space-y-6">
                {[
                  {
                    icon: Zap,
                    title: "Import Automático",
                    description: "Conecte suas corretoras e tenha todos os trades importados automaticamente. Zero trabalho manual.",
                    color: "text-yellow-400"
                  },
                  {
                    icon: Brain,
                    title: "IA Analytics",
                    description: "Algoritmos avançados identificam seus padrões de lucro e perda, revelando insights invisíveis.",
                    color: "text-purple-400"
                  },
                  {
                    icon: Shield,
                    title: "Risk Management",
                    description: "Monitore seu risco em tempo real e receba alertas antes de comprometer seu capital.",
                    color: "text-blue-400"
                  },
                  {
                    icon: Calendar,
                    title: "Journal Inteligente",
                    description: "Sistema de journaling que aprende com seus trades e sugere melhorias automáticas.",
                    color: "text-green-400"
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className={`w-12 h-12 ${feature.color} bg-current/10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold text-white mb-2">{feature.title}</h4>
                      <p className="text-slate-300">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-24 bg-gradient-to-r from-emerald-900/25 to-indigo-900/25 border-y border-emerald-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">
              Resultados Comprovados
            </h2>
            <p className="font-body text-xl text-slate-200">Números reais de traders que transformaram seus resultados</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "2.1M+", label: "Trades Analisados", icon: Activity, color: "gradient-emerald-blue" },
              { value: "1.200+", label: "Traders Ativos", icon: Users, color: "gradient-teal" },
              { value: "847%", label: "Média de Melhoria", icon: TrendingUp, color: "gradient-gold" },
              { value: "4.9/5", label: "Satisfação", icon: Star, color: "gradient-emerald-blue" }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className={`w-20 h-20 ${stat.color} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:animate-glow transition-all duration-300`}>
                  <stat.icon className="w-10 h-10 text-white" />
                </div>
                <div className="text-4xl md:text-5xl font-display font-bold text-white mb-3">{stat.value}</div>
                <div className="text-slate-300 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-16 sm:py-20 lg:py-28 bg-gradient-to-br from-slate-900 via-emerald-900/15 to-slate-900 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-20 left-10 w-40 h-40 gradient-emerald-blue rounded-full opacity-10 blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 gradient-teal rounded-full opacity-10 blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <Badge className="gradient-emerald-blue text-white px-6 py-3 text-base font-semibold mb-8 animate-glow">
              Planos e Preços
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-6 sm:mb-8">
              <span className="text-white">Escolha o Plano</span>
              <span className="gradient-text block animate-pulse-slow">Perfeito para Você</span>
            </h2>
            <p className="font-body text-lg sm:text-xl lg:text-2xl text-slate-200 max-w-4xl mx-auto">
              Transforme sua análise de trading hoje mesmo. Cancele quando quiser.
            </p>
          </div>

          <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Plano Starter */}
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 hover:border-slate-600 transition-all">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Trader Starter</h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-3xl sm:text-4xl font-bold text-white">R$ 29,90</span>
                    <span className="text-slate-400 ml-2">/mês</span>
                  </div>
                  <p className="text-slate-400">7 dias grátis</p>
                </div>
                
                <div className="space-y-4 mb-8">
                  {[
                    "Acesso completo às métricas dos seus trades",
                    "Backup seguro de todo histórico",
                    "Anotações detalhadas para cada trade",
                    "Filtros avançados por mercado e período"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  variant="outline" 
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                  onClick={() => setShowRegister(true)}
                >
                  Teste 7 Dias Grátis
                </Button>
              </CardContent>
            </Card>

            {/* Plano Pro - Destaque */}
            <Card className="bg-gradient-to-br from-emerald-600/25 to-indigo-600/25 border-emerald-500 relative sm:transform sm:scale-110 shadow-2xl animate-glow">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Trader Pro</h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-3xl sm:text-4xl font-bold text-white">R$ 49,90</span>
                    <span className="text-slate-400 ml-2">/mês</span>
                  </div>
                  <p className="text-slate-300">Anual: R$ 42/mês</p>
                </div>
                
                <div className="space-y-4 mb-8">
                  {[
                    "Tudo do Starter +",
                    "Suporte integrado direto no app",
                    "Análise mensal das suas métricas",
                    "Sugestões para melhoria",
                    "Integração TradingView",
                    "Acompanhamento profissional"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-white font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full gradient-emerald-blue hover:scale-105 hover:shadow-2xl transition-all duration-300 text-xl font-bold py-4 animate-glow"
                  onClick={() => setShowRegister(true)}
                >
                  Começar Agora
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
              </CardContent>
            </Card>

            {/* Plano Black */}
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 hover:border-slate-600 transition-all">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Trader Black</h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-3xl sm:text-4xl font-bold text-white">R$ 97</span>
                    <span className="text-slate-400 ml-2">/mês</span>
                  </div>
                  <p className="text-slate-400">Anual: R$ 80/mês</p>
                </div>
                
                <div className="space-y-4 mb-8">
                  {[
                    "IA treinada no seu histórico",
                    "Relatórios inteligentes completos",
                    "Suporte 24h via IA",
                    "Análise 2x/mês com estratégias",
                    "Gestão de risco personalizada",
                    "Call mensal com equipe profissional"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  variant="outline" 
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                  onClick={() => setShowRegister(true)}
                >
                  Nível Máximo
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Garantia */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center space-x-2 text-slate-300 bg-slate-800/50 rounded-full px-6 py-3">
              <Shield className="w-5 h-5 text-green-400" />
              <span>Garantia de 30 dias ou seu dinheiro de volta</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-20 lg:py-28 bg-gradient-to-br from-slate-900/80 to-emerald-900/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              O Que Nossos Traders Dizem
            </h2>
            <p className="font-body text-lg sm:text-xl lg:text-2xl text-slate-200">Resultados reais de quem usa o Métrika todos os dias</p>
          </div>

          <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                name: "Carlos Rodrigues",
                role: "Day Trader • São Paulo",
                content: "Métrika me fez economizar 4 horas por semana que eu gastava com planilhas. Agora posso focar 100% no trading. Meu win rate subiu de 62% para 78%.",
                rating: 5,
                improvement: "+R$ 23.400 em 3 meses"
              },
              {
                name: "Ana Silva",
                role: "Swing Trader • Rio de Janeiro",
                content: "A integração com Gate.io foi um divisor de águas. Todos os meus trades crypto são importados automaticamente. O analytics revelou padrões que eu nunca tinha notado.",
                rating: 5,
                improvement: "Win rate: 65% → 81%"
              },
              {
                name: "Pedro Santos",
                role: "Forex Trader • Belo Horizonte",
                content: "Testei várias plataformas de journaling, mas nenhuma chega perto do Métrika. O sistema de IA realmente aprende com meus trades e me dá insights valiosos.",
                rating: 5,
                improvement: "Capital cresceu 340%"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-emerald-600/30 hover:border-emerald-500/50 transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex text-gold-400 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                  
                  <p className="font-body text-slate-200 mb-6 leading-relaxed text-lg">"{testimonial.content}"</p>
                  
                  <div className="border-t border-slate-700 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-white">{testimonial.name}</div>
                        <div className="text-sm text-slate-400">{testimonial.role}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-emerald-400">{testimonial.improvement}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="recursos" className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-slate-800/30 to-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              <span className="gradient-text">Recursos Exclusivos</span>
              <span className="text-white block">que Farão a Diferença</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Cada função foi pensada para acelerar seu progresso e maximizar seus lucros
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                icon: Zap,
                title: "Sync Automático",
                description: "Importe seus trades e tenha controle sobre cada mercado com todas métricas de visualização organizada.",
                color: "from-yellow-500 to-orange-500"
              },
              {
                icon: Brain,
                title: "IA Analytics",
                description: "Integração com inteligência artificial para estudar as métricas da sua conta detalhada mostrando as melhores correções e ajustes para potencializar resultados.",
                color: "from-purple-500 to-pink-500"  
              },
              {
                icon: Target,
                title: "Risk Manager",
                description: "Monitore risco em tempo real e receba alertas antes de comprometer capital.",
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: FileText,
                title: "Journal Inteligente",
                description: "Sistema aprende com seus trades e sugere melhorias automaticamente.",
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: PieChart,
                title: "Charts Avançados",
                description: "Visualizações interativas que revelam padrões ocultos nos seus dados.",
                color: "from-indigo-500 to-purple-500"
              },
              {
                icon: Clock,
                title: "Time Analytics",
                description: "Descubra seus ativos, horários e dias mais lucrativos com uma análise de dados eficiente e organizada.",
                color: "from-teal-500 to-green-500"
              },
              {
                icon: Database,
                title: "Multi-Asset",
                description: "Forex, Crypto, Ações, Futuros - todos os mercados em uma plataforma.",
                color: "from-rose-500 to-pink-500"
              },
              {
                icon: Download,
                title: "Export Completo",
                description: "Exporte relatórios profissionais em PDF para clientes e investidores.",
                color: "from-slate-500 to-gray-500"
              }
            ].map((feature, index) => (
              <Card key={index} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 hover:border-slate-600 transition-all group">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-br from-emerald-900/40 via-slate-900 to-indigo-900/40 border-t border-emerald-800/30 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-10 left-10 w-64 h-64 gradient-emerald-blue rounded-full opacity-10 blur-3xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 gradient-teal rounded-full opacity-10 blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
        
        <div className="relative max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-emerald-600/30 rounded-3xl p-16 shadow-2xl animate-glow">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-8 sm:mb-10 leading-tight">
              <span className="text-white">Pare de Perder</span>
              <span className="gradient-text block animate-pulse-slow">Dinheiro por Falta</span>
              <span className="text-white">de Dados</span>
            </h2>
            
            <p className="font-body text-lg sm:text-xl md:text-2xl lg:text-3xl text-slate-200 mb-8 sm:mb-12 max-w-4xl mx-auto">
              95% dos traders falham porque não sabem o que estão fazendo errado. 
              <span className="text-emerald-400 font-bold"> Você não precisa ser parte dessa estatística.</span>
            </p>

            <div className="flex flex-col lg:flex-row gap-8 justify-center mb-16">
              <div className="flex items-center space-x-4 text-slate-200">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <span className="text-xl font-medium">Setup em 5 minutos</span>
              </div>
              <div className="flex items-center space-x-4 text-slate-200">
                <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center">
                  <Zap className="w-8 h-8 text-indigo-400" />
                </div>  
                <span className="text-xl font-medium">Resultados imediatos</span>
              </div>
              <div className="flex items-center space-x-4 text-slate-200">
                <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-teal-400" />
                </div>
                <span className="text-xl font-medium">Garantia 30 dias</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Button 
                size="lg"
                onClick={() => setShowRegister(true)}
                className="gradient-emerald-blue hover:scale-105 hover:shadow-2xl transition-all duration-300 px-8 sm:px-12 lg:px-16 py-5 sm:py-6 text-lg sm:text-xl lg:text-2xl font-bold animate-glow"
              >
                Transformar Meus Resultados Agora
                <ArrowRight className="w-7 h-7 ml-4" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/30 hover:border-emerald-400 transition-all duration-300 px-6 sm:px-8 lg:px-12 py-5 sm:py-6 text-lg sm:text-xl lg:text-2xl font-semibold backdrop-blur-sm"
              >
                Ver Demo Completa
              </Button>
            </div>

            <div className="text-center">
              <p className="text-slate-300 mb-6 text-lg">Mais de 1.200 traders já transformaram seus resultados</p>
              <div className="flex items-center justify-center space-x-6">
                <div className="flex text-gold-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-current" />
                  ))}
                </div>
                <span className="text-slate-200 font-semibold text-lg">4.9/5 baseado em 500+ avaliações</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 gradient-purple-blue rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold gradient-text">Métrika</span>
              </div>
              <p className="text-slate-400 max-w-md">
                A plataforma de analytics de trading mais avançada do Brasil. 
                Transforme seus dados em lucro com inteligência artificial.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <div className="space-y-2">
                <a href="#recursos" className="text-slate-400 hover:text-white transition-colors block">Recursos</a>
                <a href="#precos" className="text-slate-400 hover:text-white transition-colors block">Preços</a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors block">Integrações</a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors block">API</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Suporte</h4>
              <div className="space-y-2">
                <a href="#contato" className="text-slate-400 hover:text-white transition-colors block">Contato</a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors block">Documentação</a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors block">Tutoriais</a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors block">Status</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center">
            <p className="text-slate-400">
              © 2025 Métrika. Todos os direitos reservados. 
              <span className="mx-2">•</span>
              Desenvolvido com ❤️ para traders brasileiros.
            </p>
          </div>
        </div>
      </footer>

      <LoginModal 
        open={showLogin} 
        onOpenChange={setShowLogin} 
        onSwitchToRegister={handleSwitchToRegister}
      />
      <RegisterModal 
        open={showRegister} 
        onOpenChange={setShowRegister}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </div>
  );
}
