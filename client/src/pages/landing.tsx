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
  LineChart
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
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Logo variant="header" className="!h-32 lg:!h-32 md:!h-28 sm:!h-24 max-w-fit" />
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#recursos" className="text-slate-300 hover:text-white transition-colors">
                {t('landing.header.features')}
              </a>
              <a href="#precos" className="text-slate-300 hover:text-white transition-colors">
                {t('landing.header.pricing')}
              </a>
              <a href="#contato" className="text-slate-300 hover:text-white transition-colors">
                {t('landing.header.contact')}
              </a>
            </nav>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <LanguageSelector />
              <Button 
                variant="ghost" 
                onClick={() => setShowLogin(true)}
                className="text-slate-300 hover:text-white text-sm sm:text-base px-2 sm:px-4"
              >
                {t('landing.header.login')}
              </Button>
              <Button 
                onClick={() => setShowRegister(true)}
                className="gradient-purple-blue hover:opacity-90 transition-opacity text-sm sm:text-base px-2 sm:px-4"
              >
                <span className="hidden sm:inline">{t('landing.header.start')}</span>
                <span className="sm:hidden">{t('landing.header.start_short')}</span>
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
          

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="text-center lg:text-left">
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-6 sm:mb-8 lg:mb-10 leading-tight">
                <span className="text-white">{t('landing.hero.title1')}</span>
                <span className="gradient-text block animate-pulse-slow">{t('landing.hero.title2')}</span>
                <span className="text-white">{t('landing.hero.title3')}</span>
              </h1>
              
              <p className="font-body text-lg sm:text-xl md:text-2xl lg:text-3xl text-slate-200 mb-6 sm:mb-8 leading-relaxed">
                {t('landing.hero.subtitle')} 
                <span className="text-emerald-400 font-bold"> {t('landing.hero.subtitle_highlight')}</span>
              </p>
              
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8 justify-center lg:justify-start">
                <div className="flex items-center space-x-2 text-slate-300">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>{t('landing.hero.feature1')}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>{t('landing.hero.feature2')}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-12 sm:mb-16 justify-center lg:justify-start">
                <Button 
                  size="lg"
                  onClick={() => setShowRegister(true)}
                  className="gradient-emerald-blue hover:scale-105 hover:shadow-2xl transition-all duration-300 px-6 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-bold animate-glow"
                >
                  {t('landing.hero.start_free')}
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/30 hover:border-emerald-400 transition-all duration-300 px-6 sm:px-10 py-4 sm:py-5 text-lg sm:text-xl font-semibold backdrop-blur-sm"
                >
                  {t('landing.hero.watch_demo')}
                </Button>
              </div>
              
              
            </div>
            
            {/* Enhanced Dashboard Preview */}
            <div className="relative">
              {/* Main Dashboard Card */}
              <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border-emerald-600/30 shadow-2xl transform hover:scale-105 transition-all duration-500 animate-glow">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-24 h-24 sm:w-20 sm:h-20 gradient-emerald-blue rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-12 h-12 text-white" />
                      </div>
                      <span className="text-xl font-bold text-white ml-[75px] mr-[75px]">{t('landing.dashboard.main_title')}</span>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-3 py-1">
                      {t('landing.dashboard.live')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-gradient-to-br from-emerald-500/25 to-teal-500/25 border-emerald-500/40 hover:border-emerald-400/60 transition-all duration-300">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-slate-200">{t('landing.dashboard.total_pnl')}</span>
                          <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="text-3xl font-bold text-emerald-400">+R$ 28.540</div>
                        <div className="text-sm text-emerald-300">{t('landing.dashboard.monthly_growth')}</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-indigo-500/25 to-blue-500/25 border-indigo-500/40 hover:border-indigo-400/60 transition-all duration-300">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-slate-200">{t('landing.dashboard.win_rate')}</span>
                          <Target className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="text-3xl font-bold text-indigo-400">78.5%</div>
                        <div className="text-sm text-indigo-300">{t('landing.dashboard.trades_count')}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Chart Visualization */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-300">{t('landing.dashboard.capital_evolution')}</span>
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
              <span className="text-red-400">{t('landing.problem.title1')}</span>
              <span className="text-white block">{t('landing.problem.title2')}</span>
              <span className="gradient-text">{t('landing.problem.title3')}</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-4xl mx-auto">
              {t('landing.problem.subtitle')}
            </p>
          </div>

          <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                problem: t('landing.problem.outdated_sheets'),
                description: t('landing.problem.outdated_sheets_desc'),
                icon: FileText,
                color: "from-red-500 to-red-400"
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
              {t('landing.solution.badge')}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="gradient-text">{t('landing.solution.title1')}</span>
              <span className="text-white block">{t('landing.solution.title2')}</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
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
                    <Badge className="bg-green-500/20 text-green-400">{t('landing.solution.realtime')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Performance Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-300">{t('landing.solution.total_profit')}</span>
                        <DollarSign className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="text-2xl font-bold text-green-400">R$ 45.230</div>
                      <div className="text-xs text-green-300">{t('landing.solution.monthly_growth')}</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-300">{t('landing.solution.winning_trades')}</span>
                        <Target className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="text-2xl font-bold text-blue-400">82.3%</div>
                      <div className="text-xs text-blue-300">{t('landing.solution.trades_stats')}</div>
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
                              : 'bg-gradient-to-t from-red-500 to-red-400'
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
                {t('landing.solution.features_title1')}
                <span className="gradient-text block">{t('landing.solution.features_title2')}</span>
              </h3>
              
              <div className="space-y-6">
                {[
                  {
                    icon: Zap,
                    title: t('landing.solution.auto_import'),
                    description: t('landing.solution.auto_import_desc'),
                    color: "text-yellow-400"
                  },
                  {
                    icon: Brain,
                    title: t('landing.solution.ai_analytics'),
                    description: t('landing.solution.ai_analytics_desc'),
                    color: "text-purple-400"
                  },
                  {
                    icon: Shield,
                    title: t('landing.solution.risk_management'),
                    description: t('landing.solution.risk_management_desc'),
                    color: "text-blue-400"
                  },
                  {
                    icon: Calendar,
                    title: t('landing.solution.smart_journal'),
                    description: t('landing.solution.smart_journal_desc'),
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
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-6 sm:mb-8">
              <span className="text-white">{t('landing.pricing.title1')}</span>
              <span className="gradient-text block animate-pulse-slow">{t('landing.pricing.title2')}</span>
            </h2>
            <p className="font-body text-lg sm:text-xl lg:text-2xl text-slate-200 max-w-4xl mx-auto">
              {t('landing.pricing.subtitle')}
            </p>
          </div>

          <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Plano Starter */}
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 hover:border-slate-600 transition-all">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{t('landing.pricing.starter_title')}</h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-3xl sm:text-4xl font-bold text-white">{t('landing.pricing.starter_price')}</span>
                    <span className="text-slate-400 ml-2">{t('landing.pricing.starter_period')}</span>
                  </div>
                  <p className="text-slate-400">{t('landing.pricing.starter_trial')}</p>
                </div>
                
                <div className="space-y-4 mb-8">
                  {[
                    t('landing.pricing.starter_feature1'),
                    t('landing.pricing.starter_feature2'),
                    t('landing.pricing.starter_feature3'),
                    t('landing.pricing.starter_feature4')
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
                  {t('landing.pricing.starter_button')}
                </Button>
              </CardContent>
            </Card>

            {/* Plano Pro - Destaque */}
            <Card className="bg-gradient-to-br from-emerald-600/25 to-indigo-600/25 border-emerald-500 relative sm:transform sm:scale-110 shadow-2xl animate-glow">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{t('landing.pricing.pro_title')}</h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-3xl sm:text-4xl font-bold text-white">{t('landing.pricing.pro_price')}</span>
                    <span className="text-slate-400 ml-2">{t('landing.pricing.pro_period')}</span>
                  </div>
                  <p className="text-slate-300">{t('landing.pricing.pro_annual')}</p>
                </div>
                
                <div className="space-y-4 mb-8">
                  {[
                    t('landing.pricing.pro_feature1'),
                    t('landing.pricing.pro_feature2'),
                    t('landing.pricing.pro_feature3'),
                    t('landing.pricing.pro_feature4'),
                    t('landing.pricing.pro_feature5'),
                    t('landing.pricing.pro_feature6')
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
                  {t('landing.pricing.pro_button')}
                  <ArrowRight className="w-6 h-6 ml-3" />
                </Button>
              </CardContent>
            </Card>

            {/* Plano Black */}
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 hover:border-slate-600 transition-all">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{t('landing.pricing.black_title')}</h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-3xl sm:text-4xl font-bold text-white">{t('landing.pricing.black_price')}</span>
                    <span className="text-slate-400 ml-2">{t('landing.pricing.black_period')}</span>
                  </div>
                  <p className="text-slate-400">{t('landing.pricing.black_annual')}</p>
                </div>
                
                <div className="space-y-4 mb-8">
                  {[
                    t('landing.pricing.black_feature1'),
                    t('landing.pricing.black_feature2'),
                    t('landing.pricing.black_feature3'),
                    t('landing.pricing.black_feature4'),
                    t('landing.pricing.black_feature5'),
                    t('landing.pricing.black_feature6')
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
                  {t('landing.pricing.black_button')}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Garantia */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center space-x-2 text-slate-300 bg-slate-800/50 rounded-full px-6 py-3">
              <Shield className="w-5 h-5 text-green-400" />
              <span>{t('landing.pricing.guarantee')}</span>
            </div>
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
                color: "from-yellow-500 to-orange-500"
              },
              {
                icon: Brain,
                titleKey: 'landing.features.ai_title',
                descriptionKey: 'landing.features.ai_description',
                color: "from-purple-500 to-pink-500"  
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
                color: "from-indigo-500 to-purple-500"
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
                icon: Download,
                titleKey: 'landing.features.export_title',
                descriptionKey: 'landing.features.export_description',
                color: "from-slate-500 to-gray-500"
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
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl border border-emerald-600/30 rounded-3xl p-16 shadow-2xl animate-glow">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-8 sm:mb-10 leading-tight">
              <span className="text-white">{t('landing.cta.title1')}</span>
              <span className="gradient-text block animate-pulse-slow">{t('landing.cta.title2')}</span>
              <span className="text-white">{t('landing.cta.title3')}</span>
            </h2>
            
            <p className="font-body text-lg sm:text-xl md:text-2xl lg:text-3xl text-slate-200 mb-8 sm:mb-12 max-w-4xl mx-auto">
              {t('landing.cta.subtitle1')} 
              <span className="text-emerald-400 font-bold">{t('landing.cta.subtitle2')}</span>
            </p>

            <div className="flex flex-col lg:flex-row gap-8 justify-center mb-16">
              <div className="flex items-center space-x-4 text-slate-200">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <span className="text-xl font-medium">{t('landing.cta.feature1')}</span>
              </div>
              <div className="flex items-center space-x-4 text-slate-200">
                <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center">
                  <Zap className="w-8 h-8 text-indigo-400" />
                </div>  
                <span className="text-xl font-medium">{t('landing.cta.feature2')}</span>
              </div>
              <div className="flex items-center space-x-4 text-slate-200">
                <div className="w-16 h-16 bg-teal-500/20 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-teal-400" />
                </div>
                <span className="text-xl font-medium">{t('landing.cta.feature3')}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Button 
                size="lg"
                onClick={() => setShowRegister(true)}
                className="gradient-emerald-blue hover:scale-105 hover:shadow-2xl transition-all duration-300 px-8 sm:px-12 lg:px-16 py-5 sm:py-6 text-lg sm:text-xl lg:text-2xl font-bold animate-glow"
              >
                {t('landing.cta.main_button')}
                <ArrowRight className="w-7 h-7 ml-4" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/30 hover:border-emerald-400 transition-all duration-300 px-6 sm:px-8 lg:px-12 py-5 sm:py-6 text-lg sm:text-xl lg:text-2xl font-semibold backdrop-blur-sm"
              >
                {t('landing.cta.demo_button')}
              </Button>
            </div>

            <div className="text-center">
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
                <div className="w-20 h-20 gradient-purple-blue rounded-lg flex items-center justify-center">
                  <Logo variant="header" className="w-16 h-12" />
                </div>
                
              </div>
              <p className="text-slate-400 max-w-md">
                {t('landing.footer.description')}
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">{t('landing.footer.product')}</h4>
              <div className="space-y-2">
                <a href="#recursos" className="text-slate-400 hover:text-white transition-colors block">{t('landing.footer.features')}</a>
                <a href="#precos" className="text-slate-400 hover:text-white transition-colors block">{t('landing.footer.pricing')}</a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors block">{t('landing.footer.integrations')}</a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors block">{t('landing.footer.api')}</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">{t('landing.footer.support')}</h4>
              <div className="space-y-2">
                <a href="#contato" className="text-slate-400 hover:text-white transition-colors block">{t('landing.footer.contact')}</a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors block">{t('landing.footer.documentation')}</a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors block">{t('landing.footer.tutorials')}</a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors block">{t('landing.footer.status')}</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center">
            <p className="text-slate-400">
              {t('landing.footer.copyright')} 
              <span className="mx-2">•</span>
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
