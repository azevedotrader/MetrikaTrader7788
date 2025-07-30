import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, ChartBar, Link2, TrendingUp } from "lucide-react";
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
            <div className="space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setShowLogin(true)}
                className="text-slate-300 hover:text-white"
              >
                Entrar
              </Button>
              <Button 
                onClick={() => setShowRegister(true)}
                className="gradient-purple-blue hover:opacity-90 transition-opacity"
              >
                Começar Agora
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-slate-900 to-blue-900/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Tudo que você sempre
                <span className="gradient-text block">quis saber</span>
                sobre seus trades...
              </h1>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                ...mas suas planilhas nunca te disseram.
              </p>
              <p className="text-slate-400 mb-8">
                Métrika mostra as métricas que importam e os comportamentos que levam ao 
                lucro com o poder do journaling e analytics.
              </p>
              <Button 
                size="lg"
                onClick={() => setShowRegister(true)}
                className="gradient-purple-blue hover:opacity-90 transition-opacity transform hover:scale-105"
              >
                Começar Agora
              </Button>
              
              {/* Trust Indicators */}
              <div className="mt-12">
                <div className="flex items-center justify-center lg:justify-start space-x-4 mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>⭐</span>
                    ))}
                  </div>
                  <span className="text-slate-300">4.9 • 500+ Avaliações</span>
                </div>
                <p className="text-sm text-slate-400">Confiado por traders profissionais</p>
              </div>
            </div>
            
            {/* Hero Dashboard Preview */}
            <div className="relative">
              <Card className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm border-slate-700 shadow-2xl">
                <CardContent className="p-6">
                  {/* Mock Dashboard Interface */}
                  <Card className="bg-slate-800 mb-4">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-slate-300">Resumo do Mês</h3>
                        <span className="text-xs text-slate-400">Janeiro 2024</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-700 rounded p-3">
                          <p className="text-xs text-slate-400">P&L Total</p>
                          <p className="text-lg font-bold text-green-400">+R$ 12.580</p>
                        </div>
                        <div className="bg-slate-700 rounded p-3">
                          <p className="text-xs text-slate-400">Taxa de Acerto</p>
                          <p className="text-lg font-bold text-blue-400">73.2%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Mock Chart */}
                  <Card className="bg-slate-800">
                    <CardContent className="p-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Evolução do Capital</h4>
                      <div className="h-24 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded flex items-end justify-between px-2">
                        {[8, 12, 16, 20, 24, 20, 22].map((height, i) => (
                          <div 
                            key={i}
                            className="w-2 bg-gradient-to-t from-purple-500 to-blue-500 rounded-t"
                            style={{ height: `${height}px` }}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "50K+", label: "Trades Analisados" },
              { value: "200+", label: "Traders Ativos" },
              { value: "1M+", label: "Trades Compartilhados" },
              { value: "98%", label: "Satisfação" }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="gradient-text">Journaling Poderoso e Automatizado</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Você foca no trading enquanto nós focamos em te ajudar a melhorar. 
              Com journaling automatizado, fazemos o trabalho pesado para você.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border-purple-500/20 hover:border-purple-500/40 transition-all">
              <CardContent className="p-8">
                <div className="w-12 h-12 gradient-purple-blue rounded-lg flex items-center justify-center mb-6">
                  <ChartBar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">Journaling Automatizado</h3>
                <p className="text-slate-400 mb-6">
                  Métodos fáceis como auto-sync, file upload, ou até manual auto-side. 
                  Tudo é automatizado.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <Link2 className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-sm text-slate-300">Conectar</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm text-slate-300">+ Upload file</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm border-blue-500/20 hover:border-blue-500/40 transition-all">
              <CardContent className="p-8">
                <div className="w-12 h-12 gradient-purple-blue rounded-lg flex items-center justify-center mb-6">
                  <Link2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">Conecte 20+ Contas</h3>
                <p className="text-slate-400 mb-6">
                  Alterne instantaneamente entre 20 contas de trading diferentes para 
                  ficar no topo do seu progresso.
                </p>
                <Card className="bg-slate-800/50">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">MetaTrader 5</span>
                        <span className="text-xs text-green-400">Conectado</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Demo Casa</span>
                        <span className="text-xs text-green-400">Ativo</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Binance</span>
                        <span className="text-xs text-blue-400">Em breve</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-sm border-green-500/20 hover:border-green-500/40 transition-all">
              <CardContent className="p-8">
                <div className="w-12 h-12 gradient-purple-blue rounded-lg flex items-center justify-center mb-6">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-white">Estatísticas Automatizadas</h3>
                <p className="text-slate-400 mb-6">
                  Chega de cálculos manuais. Apresentamos automaticamente suas estatísticas 
                  de trading em um painel limpo.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 rounded p-2 text-center">
                    <div className="text-lg font-bold text-green-400">R$ 32.039,50</div>
                    <div className="text-xs text-slate-400">P&L Total</div>
                  </div>
                  <div className="bg-slate-800/50 rounded p-2 text-center">
                    <div className="text-lg font-bold text-blue-400">1.24</div>
                    <div className="text-xs text-slate-400">Fator Lucro</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-slate-800">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Você tem uma <span className="gradient-text">Estratégia Lucrativa?</span>
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            Crie playbooks para acompanhar sua estratégia de trading e regras. 
            Descubra se sua estratégia está funcionando para você.
          </p>
          <Button 
            size="lg"
            onClick={() => setShowRegister(true)}
            className="gradient-purple-blue hover:opacity-90 transition-opacity transform hover:scale-105"
          >
            Começar Análise Gratuita
          </Button>
        </div>
      </section>

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
