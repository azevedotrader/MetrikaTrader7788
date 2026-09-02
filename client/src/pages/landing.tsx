import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
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
  LineChart,
  Upload,
  MessageCircle,
  Smartphone,
  Sparkles,
  Menu,
  X
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { LoginModal } from "@/components/ui/login-modal";
import { RegisterModal } from "@/components/ui/register-modal";
import { LanguageSelector } from "@/components/ui/language-selector";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Landing() {
  const { t } = useLanguage();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');

  const handleSwitchToRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden">
      {/* Header */}
      <header className="relative z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
              <Logo variant="header" className="!h-12 sm:!h-16 md:!h-20 lg:!h-24 max-w-fit" />
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#recursos" className="text-slate-300 hover:text-white transition-colors">
                {t('landing.header.features')}
              </a>
              <a href="#precos" className="text-slate-300 hover:text-white transition-colors">
                {t('landing.header.pricing')}
              </a>
              <a href="mailto:suporte@appmetrika.com.br" className="text-slate-300 hover:text-white transition-colors">
                {t('landing.header.contact')}
              </a>
            </nav>
            <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
              <LanguageSelector />
              <Button 
                variant="ghost" 
                onClick={() => setShowLogin(true)}
                className="hidden sm:flex text-slate-300 hover:text-white text-sm md:text-base px-2 md:px-4 py-2"
              >
                {t('landing.header.login')}
              </Button>
              <Button 
                onClick={() => setShowRegister(true)}
                className="hidden sm:flex gradient-purple-blue hover:opacity-90 transition-opacity text-sm md:text-base px-2 md:px-4 py-2"
              >
                {t('landing.header.start')}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-slate-300 hover:text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-sm border-t border-slate-800">
            <div className="px-4 py-4 space-y-3">
              <a 
                href="#recursos" 
                className="block text-slate-300 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('landing.header.features')}
              </a>
              <a 
                href="#precos" 
                className="block text-slate-300 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('landing.header.pricing')}
              </a>
              <a 
                href="mailto:suporte@appmetrika.com.br" 
                className="block text-slate-300 hover:text-white transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('landing.header.contact')}
              </a>
              <div className="flex flex-col gap-2 pt-3 border-t border-slate-800">
                <Button 
                  variant="ghost" 
                  onClick={() => { setShowLogin(true); setMobileMenuOpen(false); }}
                  className="w-full text-slate-300 hover:text-white justify-center"
                >
                  {t('landing.header.login')}
                </Button>
                <Button 
                  onClick={() => { setShowRegister(true); setMobileMenuOpen(false); }}
                  className="w-full gradient-purple-blue hover:opacity-90 transition-opacity justify-center"
                >
                  {t('landing.header.start')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-slate-900 to-indigo-900/40"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-transparent"></div>
        
        {/* Floating geometric elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-r from-gold-400/20 to-yellow-500/20 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="text-center lg:text-left">
              <h1 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl font-bold mb-4 sm:mb-6 md:mb-8 lg:mb-10 leading-tight">
                <span className="text-white">{t('landing.hero.title1')}</span>
                <span className="gradient-text block animate-pulse-slow">{t('landing.hero.title2')}</span>
                <span className="text-white">{t('landing.hero.title3')}</span>
              </h1>
              
              <p className="font-body text-sm sm:text-lg md:text-xl lg:text-2xl text-slate-200 mb-4 sm:mb-6 md:mb-8 leading-relaxed">
                {t('landing.hero.subtitle')} 
                <span className="text-emerald-400 font-bold"> {t('landing.hero.subtitle_highlight')}</span>
              </p>
              
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8 justify-center lg:justify-start">
                <div className="flex items-center space-x-2 text-slate-300 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                  <span className="break-words">{t('landing.hero.feature1')}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                  <span className="break-words">{t('landing.hero.feature2')}</span>
                </div>
              </div>

              {/* WhatsApp Badge Highlight */}
              <div data-testid="badge-whatsapp-hero" className="mb-8 inline-flex items-center bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/40 rounded-full px-6 py-3 animate-glow">
                <MessageCircle className="w-5 h-5 text-green-400 mr-3" />
                <span className="text-white font-semibold text-sm sm:text-base">
                  ✨ Funcionalidade Inovadora: <span className="text-green-400">Salve trades pelo WhatsApp!</span>
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12 md:mb-16 justify-center lg:justify-start">
                <Button 
                  size="lg"
                  onClick={() => setShowRegister(true)}
                  className="gradient-emerald-blue hover:scale-105 hover:shadow-2xl transition-all duration-300 px-4 sm:px-6 md:px-10 py-3 sm:py-4 md:py-5 text-base sm:text-lg md:text-xl font-bold animate-glow w-full sm:w-auto"
                >
                  <span className="break-words">{t('landing.hero.start_free')}</span>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3 flex-shrink-0" />
                </Button>
              </div>
              
              
            </div>
            
            {/* Device Preview with Toggle */}
            <div className="relative flex flex-col items-center">
              {/* Toggle Desktop / Mobile */}
              <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-full p-1 mb-6 gap-1">
                <button
                  onClick={() => setDeviceView('desktop')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${deviceView === 'desktop' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                  Desktop
                </button>
                <button
                  onClick={() => setDeviceView('mobile')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${deviceView === 'mobile' ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}
                >
                  <Smartphone className="w-4 h-4" />
                  Mobile
                </button>
              </div>

              {/* Desktop Frame */}
              {deviceView === 'desktop' && (
                <div className="w-full animate-in fade-in duration-300">
                  {/* Browser chrome */}
                  <div className="bg-slate-700 rounded-t-xl px-4 py-2 flex items-center gap-2 border border-slate-600 border-b-0">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="flex-1 bg-slate-800 rounded-md px-3 py-1 text-xs text-slate-400 ml-2">appmetrika.com.br/dashboard</div>
                  </div>
                  {/* Screen */}
                  <div className="bg-slate-900 border border-slate-600 border-t-0 rounded-b-xl overflow-hidden shadow-2xl">
                    {/* Mini dashboard */}
                    <div className="flex h-52">
                      {/* Sidebar */}
                      <div className="w-10 bg-slate-800 border-r border-slate-700 flex flex-col items-center py-3 gap-3">
                        <div className="w-6 h-6 bg-emerald-500 rounded-md"></div>
                        {[...Array(5)].map((_,i) => <div key={i} className="w-5 h-1.5 bg-slate-600 rounded"></div>)}
                      </div>
                      {/* Content */}
                      <div className="flex-1 p-3 overflow-hidden">
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-2">
                            <div className="text-[9px] text-slate-400 mb-1">P&L Total</div>
                            <div className="text-xs font-bold text-emerald-400">+R$28.540</div>
                          </div>
                          <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-lg p-2">
                            <div className="text-[9px] text-slate-400 mb-1">Assertividade</div>
                            <div className="text-xs font-bold text-indigo-400">78.5%</div>
                          </div>
                          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-2">
                            <div className="text-[9px] text-slate-400 mb-1">Drawdown</div>
                            <div className="text-xs font-bold text-blue-400">2.5%</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="bg-slate-800 rounded-lg p-2">
                            <div className="text-[9px] text-slate-400 mb-1">Taxa de Acerto</div>
                            <div className="text-xs font-bold text-blue-400">65%</div>
                            <div className="w-full h-1 bg-slate-700 rounded mt-1"><div className="h-1 bg-blue-400 rounded" style={{width:'65%'}}></div></div>
                          </div>
                          <div className="bg-slate-800 rounded-lg p-2">
                            <div className="text-[9px] text-slate-400 mb-1">Risco Retorno</div>
                            <div className="text-xs font-bold text-emerald-400">1:3.05</div>
                            <div className="w-full h-1 bg-slate-700 rounded mt-1"><div className="h-1 bg-emerald-400 rounded" style={{width:'75%'}}></div></div>
                          </div>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-2">
                          <div className="text-[9px] text-slate-400 mb-1">Evolução do Capital</div>
                          <div className="flex items-end gap-0.5 h-8">
                            {[15,20,18,30,25,40,35,50,45,60].map((h,i) => (
                              <div key={i} className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t opacity-80" style={{height:`${h}%`}}></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Frame */}
              {deviceView === 'mobile' && (
                <div className="w-52 animate-in fade-in duration-300">
                  {/* Phone frame */}
                  <div className="bg-slate-700 rounded-[2rem] border-2 border-slate-600 p-2 shadow-2xl">
                    {/* Notch */}
                    <div className="bg-slate-900 rounded-[1.6rem] overflow-hidden">
                      <div className="flex justify-center pt-2 pb-1">
                        <div className="w-16 h-1.5 bg-slate-700 rounded-full"></div>
                      </div>
                      {/* Screen content */}
                      <div className="px-2 pb-4">
                        <div className="text-[9px] font-bold text-white mb-2 text-center">Dashboard</div>
                        <div className="grid grid-cols-2 gap-1 mb-2">
                          <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-1.5">
                            <div className="text-[7px] text-slate-400">P&L Total</div>
                            <div className="text-[10px] font-bold text-emerald-400">+R$28.5k</div>
                          </div>
                          <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-lg p-1.5">
                            <div className="text-[7px] text-slate-400">Acerto</div>
                            <div className="text-[10px] font-bold text-indigo-400">78.5%</div>
                          </div>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-2 mb-2">
                          <div className="text-[7px] text-slate-400 mb-1">Evolução</div>
                          <div className="flex items-end gap-0.5 h-10">
                            {[20,35,25,45,38,55,48,65,58,75].map((h,i) => (
                              <div key={i} className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t opacity-80" style={{height:`${h}%`}}></div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          {['Nova York','Ásia','Londres'].map((s,i) => (
                            <div key={i} className="flex items-center justify-between bg-slate-800 rounded-md px-2 py-1">
                              <span className="text-[7px] text-slate-300">{s}</span>
                              <span className="text-[7px] text-emerald-400">+{(i+1)*1200}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 w-20 h-20 gradient-emerald-blue rounded-full opacity-25 animate-float"></div>
              <div className="absolute -bottom-6 -left-6 w-16 h-16 gradient-teal rounded-full opacity-25 animate-float" style={{ animationDelay: '3s' }}></div>
            </div>
          </div>
        </div>
      </section>
      {/* Problem Statement Section */}
      <section className="py-24 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 break-words">
              <span className="text-red-500">{t('landing.problem.title1')}</span>
              <span className="text-white block">{t('landing.problem.title2')}</span>
              <span className="gradient-text">{t('landing.problem.title3')}</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-4xl mx-auto break-words">
              {t('landing.problem.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[
              {
                problem: t('landing.problem.outdated_sheets'),
                description: t('landing.problem.outdated_sheets_desc'),
                icon: FileText,
                color: "from-red-600 to-red-600"
              },
              {
                problem: t('landing.problem.imprecise_data'),
                description: t('landing.problem.imprecise_data_desc'),
                icon: Database,
                color: "from-orange-500 to-orange-400"
              },
              {
                problem: t('landing.problem.limited_analysis'),
                description: t('landing.problem.limited_analysis_desc'),
                icon: Brain,
                color: "from-yellow-600 to-yellow-600"
              }
            ].map((item, index) => (
              <Card key={index} className="bg-slate-800/80 border-slate-700 hover:border-slate-600 transition-all">
                <CardContent className="p-4 sm:p-6 md:p-8 text-center">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 opacity-20`}>
                    <item.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 break-words">{item.problem}</h3>
                  <p className="text-sm sm:text-base text-slate-400 break-words">{item.description}</p>
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
              {t('landing.solution.badge')}
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 break-words">
              <span className="gradient-text">{t('landing.solution.title1')}</span>
              <span className="text-white block">{t('landing.solution.title2')}</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto break-words">
              {t('landing.solution.subtitle')}
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
                      {t('landing.solution.dashboard_analytics')}
                    </CardTitle>
                    <Badge className="bg-green-600/20 text-green-600">{t('landing.solution.realtime')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Performance Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-600/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-300">{t('landing.solution.total_profit')}</span>
                        <DollarSign className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-green-600">{t('landing.solution.demo_total_profit')}</div>
                      <div className="text-xs text-green-600">{t('landing.solution.monthly_growth')}</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-600/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-300">{t('landing.solution.winning_trades')}</span>
                        <Target className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-2xl font-bold text-blue-600">82.3%</div>
                      <div className="text-xs text-blue-600">{t('landing.solution.trades_stats')}</div>
                    </div>
                  </div>

                  {/* Analytics Chart */}
                  <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-300">{t('landing.solution.monthly_evolution')}</span>
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
                              : 'bg-gradient-to-t from-red-600 to-red-600'
                          }`}
                          style={{ height: `${bar.height}px` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Recent Trades */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-slate-300">{t('landing.solution.recent_trades')}</span>
                    {[
                      { pair: "BTC/USDT", result: t('landing.solution.demo_trade1_result'), positive: true, time: "14:32" },
                      { pair: "ETH/USDT", result: t('landing.solution.demo_trade2_result'), positive: true, time: "13:45" },
                      { pair: "EUR/USD", result: t('landing.solution.demo_trade3_result'), positive: false, time: "12:18" }
                    ].map((trade, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 bg-slate-800/30 rounded">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${trade.positive ? 'bg-green-600' : 'bg-red-500'}`}></div>
                          <span className="text-sm text-slate-300">{trade.pair}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${trade.positive ? 'text-green-600' : 'text-red-500'}`}>
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
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-6 sm:mb-8 break-words">
                {t('landing.solution.features_title1')}
                <span className="gradient-text block">{t('landing.solution.features_title2')}</span>
              </h3>
              
              <div className="space-y-6">
                {[
                  {
                    icon: Zap,
                    title: t('landing.solution.auto_import'),
                    description: t('landing.solution.auto_import_desc'),
                    color: "text-yellow-500"
                  },
                  {
                    icon: Brain,
                    title: t('landing.solution.ai_analytics'),
                    description: t('landing.solution.ai_analytics_desc'),
                    color: "text-purple-600"
                  },
                  {
                    icon: Shield,
                    title: t('landing.solution.risk_management'),
                    description: t('landing.solution.risk_management_desc'),
                    color: "text-blue-600"
                  },
                  {
                    icon: Calendar,
                    title: t('landing.solution.smart_journal'),
                    description: t('landing.solution.smart_journal_desc'),
                    color: "text-green-600"
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3 sm:space-x-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 ${feature.color} bg-current/10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${feature.color}`} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-lg sm:text-xl font-semibold text-white mb-2 break-words">{feature.title}</h4>
                      <p className="text-sm sm:text-base text-slate-300 break-words">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Integration - Exclusive Feature Section */}
      <section data-testid="section-whatsapp-integration" className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-green-900/30 via-slate-900 to-slate-900 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-10 right-10 w-32 sm:w-48 lg:w-64 h-32 sm:h-48 lg:h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-10 left-10 w-24 sm:w-32 lg:w-48 h-24 sm:h-32 lg:h-48 bg-emerald-500/10 rounded-full blur-3xl animate-float"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <Badge data-testid="badge-exclusive-feature" className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-bold mb-4 sm:mb-6 animate-glow">
              ✨ FUNCIONALIDADE INOVADORA
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6">
              <span className="text-white">Salve Trades pelo </span>
              <span className="gradient-text block animate-pulse-slow">WhatsApp!</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-200 max-w-4xl mx-auto mb-6 sm:mb-8 px-2">
              Uma <span className="text-green-400 font-bold">plataforma pioneira</span> que permite registrar suas operações 
              e visualizar estatísticas <span className="text-emerald-400 font-bold">direto do seu celular</span>, sem abrir o navegador!
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* WhatsApp Phone Mockup */}
            <div className="relative">
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-green-500/40 shadow-2xl max-w-md mx-auto">
                <CardHeader className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b border-green-500/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">Métrika Bot</CardTitle>
                      <p className="text-xs text-green-400">online</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-green-600/80 rounded-lg px-4 py-3 max-w-[80%]">
                      <p className="text-white text-sm">
                        Comprei EURUSD 0.5 lotes lucro $250
                      </p>
                      <p className="text-xs text-green-200 text-right mt-1">14:32</p>
                    </div>
                  </div>

                  {/* Bot Response */}
                  <div className="flex justify-start">
                    <div className="bg-slate-700 rounded-lg px-4 py-3 max-w-[80%]">
                      <p className="text-white text-sm mb-3">
                        ✅ Trade salvo com sucesso!
                      </p>
                      <div className="space-y-1 text-xs text-slate-300">
                        <p>📊 Ativo: EURUSD</p>
                        <p>💰 Resultado: +$250</p>
                        <p>📈 Mercado: Forex</p>
                      </div>
                      <p className="text-xs text-slate-400 text-right mt-2">14:32</p>
                    </div>
                  </div>

                  {/* Interactive Buttons */}
                  <div className="space-y-2 pt-4 border-t border-slate-700">
                    <Button 
                      data-testid="button-whatsapp-stats"
                      className="w-full bg-blue-600/80 hover:bg-blue-600 text-white justify-start"
                      size="sm"
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      📊 Ver Estatísticas
                    </Button>
                    <Button 
                      data-testid="button-whatsapp-save-trade"
                      className="w-full bg-green-600/80 hover:bg-green-600 text-white justify-start"
                      size="sm"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      💾 Salvar Novo Trade
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Floating badges - hidden on mobile to prevent overflow */}
              <div className="hidden sm:flex absolute -top-4 sm:-top-6 -left-2 sm:-left-6 bg-green-500/20 backdrop-blur-sm border border-green-500/40 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 items-center space-x-2">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                <span className="text-xs sm:text-sm text-green-400 font-bold">IA Integrada</span>
              </div>
              <div className="hidden sm:flex absolute -bottom-4 sm:-bottom-6 -right-2 sm:-right-6 bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/40 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 items-center space-x-2">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                <span className="text-xs sm:text-sm text-emerald-400 font-bold">Instantâneo</span>
              </div>
            </div>

            {/* Features List */}
            <div className="mt-8 lg:mt-0">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-6 sm:mb-8 text-center lg:text-left">
                Máxima <span className="text-green-400">Praticidade</span>
              </h3>
              
              <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                {[
                  {
                    icon: MessageCircle,
                    title: "Linguagem Natural",
                    description: "Escreva como você fala! Não precisa preencher formulários ou seguir formatos rígidos. Nossa IA entende você.",
                    color: "text-green-500"
                  },
                  {
                    icon: Brain,
                    title: "Detecção Automática",
                    description: "Sistema inteligente detecta automaticamente o mercado (Forex, Crypto, B3), ativos e valores da sua operação.",
                    color: "text-emerald-500"
                  },
                  {
                    icon: Smartphone,
                    title: "Estatísticas no WhatsApp",
                    description: "Consulte seu desempenho, win rate e lucros direto pelo WhatsApp. Não precisa nem abrir o navegador!",
                    color: "text-blue-500"
                  },
                  {
                    icon: Zap,
                    title: "Registro Instantâneo",
                    description: "Saiu de um trade? Registre em segundos pelo celular. Acabou o esquecimento de anotar operações!",
                    color: "text-purple-500"
                  }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3 sm:space-x-4 bg-slate-800/40 rounded-lg p-3 sm:p-4 border border-slate-700 hover:border-green-500/40 transition-all">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 ${feature.color} bg-current/10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${feature.color}`} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-1 sm:mb-2">{feature.title}</h4>
                      <p className="text-sm sm:text-base text-slate-300">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/40">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start space-x-3">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-white mb-2">Funcionalidade Exclusiva!</h4>
                      <p className="text-sm sm:text-base text-slate-200">
                        Uma <span className="text-green-400 font-bold">plataforma pioneira</span> com 
                        integração completa com WhatsApp para gerenciamento de trades. Praticidade incomparável!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
              {t('landing.pricing.badge')}
            </Badge>
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-6xl font-bold mb-4 sm:mb-6 md:mb-8 break-words">
              <span className="text-white">{t('landing.pricing.title1')}</span>
              <span className="gradient-text block animate-pulse-slow">{t('landing.pricing.title2')}</span>
            </h2>
            <p className="font-body text-sm sm:text-base md:text-lg lg:text-xl text-slate-200 max-w-4xl mx-auto break-words">
              {t('landing.pricing.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Plano Mensal - Destaque Principal */}
            <Card className="bg-gradient-to-br from-emerald-600/25 to-indigo-600/25 border-2 border-emerald-500 relative md:scale-105 shadow-2xl animate-glow order-first">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-emerald-500 text-white px-3 py-1 text-xs font-bold">
                  MAIS POPULAR
                </Badge>
              </div>
              <CardContent className="p-4 sm:p-6 md:p-8 pt-6 sm:pt-8">
                <div className="text-center mb-6 sm:mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">{t('landing.pricing.monthly_title')}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl sm:text-4xl font-bold text-white">R$ 97</span>
                    <span className="text-slate-400 ml-2">/mês</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-2">Cobrado mensalmente</p>
                </div>
                
                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  {[
                    t('landing.pricing.monthly_feature1'),
                    t('landing.pricing.monthly_feature2'),
                    t('landing.pricing.monthly_feature3'),
                    t('landing.pricing.monthly_feature4')
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm sm:text-base text-white font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full gradient-emerald-blue hover:scale-105 hover:shadow-2xl transition-all duration-300 text-base sm:text-lg md:text-xl font-bold py-3 sm:py-4 animate-glow"
                  onClick={() => window.open('https://pay.hub.la/CGRfvH9XIZzkXUFTkesn', '_blank')}
                >
                  {t('landing.pricing.monthly_button')}
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2 sm:ml-3" />
                </Button>
              </CardContent>
            </Card>

            {/* Plano Trimestral */}
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 hover:border-slate-600 transition-all relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-600 text-white px-3 py-1 text-xs font-bold">
                  ECONOMIZE 33%
                </Badge>
              </div>
              <CardContent className="p-4 sm:p-6 md:p-8 pt-6 sm:pt-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">{t('landing.pricing.quarterly_title')}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl sm:text-4xl font-bold text-white">R$ 65</span>
                    <span className="text-slate-400 ml-2">/mês</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-2">R$ 197 cobrado a cada 3 meses</p>
                </div>
                
                <div className="space-y-4 mb-8">
                  {[
                    t('landing.pricing.quarterly_feature1'),
                    t('landing.pricing.quarterly_feature2'),
                    t('landing.pricing.quarterly_feature3'),
                    t('landing.pricing.quarterly_feature4')
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                  onClick={() => window.open('https://hub.la/g/lUlRpoibiOjhnJF47H43', '_blank')}
                >
                  {t('landing.pricing.quarterly_button')}
                </Button>
              </CardContent>
            </Card>

            {/* Plano Anual */}
            <Card className="bg-gradient-to-br from-purple-900/40 to-slate-900/80 border-purple-500/50 hover:border-purple-400 transition-all relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 text-xs font-bold">
                  MELHOR VALOR
                </Badge>
              </div>
              <CardContent className="p-4 sm:p-6 md:p-8 pt-6 sm:pt-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">{t('landing.pricing.annual_title')}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-3xl sm:text-4xl font-bold text-white">R$ 45</span>
                    <span className="text-slate-400 ml-2">/mês</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-2">R$ 547 cobrado anualmente</p>
                  <p className="text-green-400 font-semibold mt-2">{t('landing.pricing.annual_savings')}</p>
                </div>
                
                <div className="space-y-4 mb-8">
                  {[
                    t('landing.pricing.annual_feature1'),
                    t('landing.pricing.annual_feature2'),
                    t('landing.pricing.annual_feature3'),
                    t('landing.pricing.annual_feature4'),
                    t('landing.pricing.annual_feature5'),
                    t('landing.pricing.annual_feature6')
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold"
                  onClick={() => window.open('https://pay.hub.la/kUCz3mE6Gon3TeOz1h40', '_blank')}
                >
                  {t('landing.pricing.annual_button')}
                </Button>
              </CardContent>
            </Card>
          </div>

          
        </div>
      </section>
      {/* Features Grid Section */}
      <section id="recursos" className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-slate-800/30 to-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              <span className="gradient-text">{t('landing.features.title1')}</span>
              <span className="text-white block">{t('landing.features.title2')}</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                icon: Zap,
                titleKey: 'landing.features.sync_title',
                descriptionKey: 'landing.features.sync_description',
                color: "from-yellow-600 to-orange-500"
              },
              {
                icon: Brain,
                titleKey: 'landing.features.ai_title',
                descriptionKey: 'landing.features.ai_description',
                color: "from-purple-600 to-pink-500"  
              },
              {
                icon: Target,
                titleKey: 'landing.features.risk_title',
                descriptionKey: 'landing.features.risk_description',
                color: "from-blue-500 to-cyan-500"
              },
              {
                icon: FileText,
                titleKey: 'landing.features.journal_title',
                descriptionKey: 'landing.features.journal_description',
                color: "from-green-500 to-emerald-500"
              },
              {
                icon: PieChart,
                titleKey: 'landing.features.charts_title',
                descriptionKey: 'landing.features.charts_description',
                color: "from-indigo-500 to-purple-600"
              },
              {
                icon: Clock,
                titleKey: 'landing.features.time_title',
                descriptionKey: 'landing.features.time_description',
                color: "from-teal-500 to-green-500"
              },
              {
                icon: Database,
                titleKey: 'landing.features.multiasset_title',
                descriptionKey: 'landing.features.multiasset_description',
                color: "from-rose-500 to-pink-500"
              },
              {
                icon: Upload,
                titleKey: 'Importação CSV',
                descriptionKey: 'Importe seus trades de qualquer corretora via CSV e receba insights inteligentes automáticos',
                color: "from-emerald-500 to-teal-500"
              }
            ].map((feature, index) => (
              <Card key={index} className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 hover:border-slate-600 transition-all group">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{t(feature.titleKey)}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{t(feature.descriptionKey)}</p>
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
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-emerald-600/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16 shadow-2xl animate-glow">
            <h2 className="font-display text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold mb-6 sm:mb-8 lg:mb-10 leading-tight break-words">
              <span className="text-white">{t('landing.cta.title1')}</span>
              <span className="gradient-text block animate-pulse-slow">{t('landing.cta.title2')}</span>
              <span className="text-white">{t('landing.cta.title3')}</span>
            </h2>
            
            <p className="font-body text-sm sm:text-base md:text-lg lg:text-xl text-slate-200 mb-6 sm:mb-8 md:mb-12 max-w-4xl mx-auto break-words">
              {t('landing.cta.subtitle1')} 
              <span className="text-emerald-400 font-bold">{t('landing.cta.subtitle2')}</span>
            </p>

            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 justify-center mb-8 sm:mb-12 lg:mb-16">
              <div className="flex items-center space-x-3 sm:space-x-4 text-slate-200">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-emerald-400" />
                </div>
                <span className="text-sm sm:text-base md:text-lg lg:text-xl font-medium break-words">{t('landing.cta.feature1')}</span>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 text-slate-200">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-indigo-400" />
                </div>  
                <span className="text-sm sm:text-base md:text-lg lg:text-xl font-medium break-words">{t('landing.cta.feature2')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-8 sm:mb-12">
              <Button 
                size="lg"
                onClick={() => setShowRegister(true)}
                className="gradient-emerald-blue hover:scale-105 hover:shadow-2xl transition-all duration-300 px-4 sm:px-6 md:px-8 lg:px-12 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg lg:text-xl font-bold animate-glow w-full sm:w-auto break-words"
              >
                <span className="break-words">{t('landing.cta.main_button')}</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 ml-2 sm:ml-3 md:ml-4 flex-shrink-0" />
              </Button>
            </div>

            <div className="text-center">
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8 sm:py-10 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="sm:col-span-2 md:col-span-2">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4 justify-center sm:justify-start">
                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 gradient-purple-blue rounded-lg flex items-center justify-center flex-shrink-0">
                  <Logo variant="header" className="w-12 h-9 sm:w-14 sm:h-10 md:w-16 md:h-12" />
                </div>
              </div>
              <p className="text-slate-400 max-w-md text-sm sm:text-base break-words text-center sm:text-left">
                {t('landing.footer.description')}
              </p>
            </div>
            
            <div className="text-center sm:text-left">
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base break-words">{t('landing.footer.product')}</h4>
              <div className="space-y-2">
                <a href="#recursos" className="text-slate-400 hover:text-white transition-colors block text-xs sm:text-sm break-words">{t('landing.footer.features')}</a>
                <a href="#precos" className="text-slate-400 hover:text-white transition-colors block text-xs sm:text-sm break-words">{t('landing.footer.pricing')}</a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors block text-xs sm:text-sm break-words">{t('landing.footer.integrations')}</a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors block text-xs sm:text-sm break-words">{t('landing.footer.api')}</a>
              </div>
            </div>
            
            <div className="text-center sm:text-left">
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base break-words">{t('landing.footer.support')}</h4>
              <div className="space-y-2">
                <a href="mailto:suporte@appmetrika.com.br" className="text-slate-400 hover:text-white transition-colors block text-xs sm:text-sm break-words">{t('landing.footer.contact')}</a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors block text-xs sm:text-sm break-words">{t('landing.footer.documentation')}</a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors block text-xs sm:text-sm break-words">{t('landing.footer.tutorials')}</a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors block text-xs sm:text-sm break-words">{t('landing.footer.status')}</a>
                <a href="/politica-privacidade" className="text-slate-400 hover:text-white transition-colors block text-xs sm:text-sm break-words" data-testid="link-privacy-policy">Política de Privacidade</a>
                <a href="/termos-servico" className="text-slate-400 hover:text-white transition-colors block text-xs sm:text-sm break-words" data-testid="link-terms-service">Termos de Serviço</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
            <p className="text-slate-400 text-xs sm:text-sm break-words">
              {t('landing.footer.copyright')} 
              <span className="mx-1 sm:mx-2">•</span>
              {t('landing.footer.made_with_love')}
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
