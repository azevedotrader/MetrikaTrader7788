import { useState, useEffect, useRef } from "react";
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
  Smartphone,
  Menu,
  X
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import dashboardPreview from "@assets/dashboard-preview.png";
import dashboardPreviewMobile from "@assets/dashboard-preview-mobile.png";
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
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHoveringDevice, setIsHoveringDevice] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleDeviceMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (y - 0.5) * -18, y: (x - 0.5) * 22 });
    setGlare({ x: x * 100, y: y * 100, opacity: 0.13 });
    setIsHoveringDevice(true);
  };

  const handleDeviceMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setGlare(g => ({ ...g, opacity: 0 }));
    setIsHoveringDevice(false);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

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
      <style>{`
        [data-animate] { opacity: 0; transform: translateY(28px); transition: opacity 0.6s ease, transform 0.6s ease; }
        [data-animate].visible { opacity: 1; transform: translateY(0); }
        [data-animate][data-delay="1"] { transition-delay: 0.1s; }
        [data-animate][data-delay="2"] { transition-delay: 0.2s; }
        [data-animate][data-delay="3"] { transition-delay: 0.3s; }
        [data-animate][data-delay="4"] { transition-delay: 0.4s; }
      `}</style>

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

      {/* ─── 1. HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative py-20 sm:py-28 lg:py-36 overflow-hidden bg-slate-900">
        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(16,185,129,0.13)_0%,rgba(99,102,241,0.08)_50%,transparent_80%)]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center" data-animate>
          {/* Badge pill */}
          <div className="inline-flex items-center gap-2 border border-emerald-500/40 bg-emerald-500/10 rounded-full px-4 py-1.5 mb-8">
            <span className="text-emerald-400 text-xs font-semibold tracking-wide">✦ Controle total da sua operação</span>
          </div>

          {/* H1 */}
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold leading-tight mb-6">
            <span className="text-white block">O FIM DAS</span>
            <span className="gradient-text block animate-pulse-slow">PLANILHAS DE TRADE</span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed uppercase tracking-wide font-medium">
            O Metrika te permite enxergar sua evolução com clareza,{" "}
            <span className="text-[#6EE000] font-bold">mostrando os pontos de melhoria</span>{" "}
            para ter resultados cada vez melhores.
          </p>

          {/* 3 checkmarks */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-10 text-slate-300 text-sm sm:text-base">
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" /> B3, Forex e Cripto</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" /> Importação automática por CSV</span>
            <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" /> Dashboard com IA</span>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Button
              size="lg"
              onClick={() => setShowRegister(true)}
              className="gradient-emerald-blue hover:scale-105 hover:shadow-2xl transition-all duration-300 px-10 py-5 text-lg font-bold animate-glow"
            >
              Quero Evoluir Agora
              <ArrowRight className="w-5 h-5 ml-2 flex-shrink-0" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => setShowLogin(true)}
              className="border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white px-10 py-5 text-lg"
            >
              Já tenho conta
            </Button>
          </div>

          {/* Below buttons note */}
          <p className="text-slate-500 text-sm mb-16">✓ Acesso imediato &nbsp;•&nbsp; Sem fidelidade &nbsp;•&nbsp; Cancele quando quiser</p>

          {/* Device Preview — full width */}
          <div className="relative flex flex-col items-center w-full mt-4">
            {/* Toggle Desktop / Mobile */}
            <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-full p-1 mb-8 gap-1 relative z-10">
              <button
                onClick={() => setDeviceView('desktop')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${deviceView === 'desktop' ? 'bg-emerald-500 text-slate-900 shadow-[0_0_16px_rgba(52,211,153,0.5)]' : 'text-slate-400 hover:text-white'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                Desktop
              </button>
              <button
                onClick={() => setDeviceView('mobile')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${deviceView === 'mobile' ? 'bg-emerald-500 text-slate-900 shadow-[0_0_16px_rgba(52,211,153,0.5)]' : 'text-slate-400 hover:text-white'}`}
              >
                <Smartphone className="w-4 h-4" />
                Mobile
              </button>
            </div>

            {/* Ambient glow orbs */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(110,224,0,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            <div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full pointer-events-none animate-float"
              style={{ background: 'radial-gradient(circle, rgba(68,138,255,0.08) 0%, transparent 70%)', filter: 'blur(30px)', animationDelay: '1s' }} />
            <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full pointer-events-none animate-float"
              style={{ background: 'radial-gradient(circle, rgba(110,224,0,0.06) 0%, transparent 70%)', filter: 'blur(25px)', animationDelay: '2.5s' }} />

            {/* 3D tilt wrapper */}
            <div
              className="w-full max-w-5xl"
              style={{ perspective: '1400px' }}
              onMouseMove={handleDeviceMouseMove}
              onMouseLeave={handleDeviceMouseLeave}
            >
              <div
                className={`w-full ${isHoveringDevice ? '' : 'animate-device-idle'}`}
                style={{
                  transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHoveringDevice ? 1.025 : 1})`,
                  transition: !isHoveringDevice
                    ? 'transform 0.9s cubic-bezier(0.23, 1, 0.32, 1)'
                    : 'transform 0.08s linear',
                  transformStyle: 'preserve-3d',
                  position: 'relative',
                }}
              >
                {/* Desktop Frame */}
                {deviceView === 'desktop' && (
                  <div className="w-full animate-in fade-in duration-300">
                    <div className="bg-slate-700 rounded-t-xl px-4 py-3 flex items-center gap-2 border border-slate-600 border-b-0"
                      style={{ boxShadow: isHoveringDevice ? '0 -4px 30px rgba(110,224,0,0.12)' : 'none', transition: 'box-shadow 0.3s ease' }}>
                      <div className="flex gap-1.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-red-500/80"></div>
                        <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80"></div>
                        <div className="w-3.5 h-3.5 rounded-full bg-green-500/80"></div>
                      </div>
                      <div className="flex-1 bg-slate-800 rounded-md px-3 py-1.5 text-xs text-slate-400 ml-2">appmetrika.com.br/dashboard</div>
                    </div>
                    <div
                      className="border border-slate-600 border-t-0 rounded-b-xl overflow-hidden relative"
                      style={{
                        height: '360px',
                        boxShadow: isHoveringDevice
                          ? '0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(110,224,0,0.15), 0 8px 40px rgba(110,224,0,0.08)'
                          : '0 20px 60px rgba(0,0,0,0.5)',
                        transition: 'box-shadow 0.3s ease',
                      }}
                    >
                      <img
                        src={dashboardPreview}
                        alt="Metrika Dashboard"
                        className="w-full animate-dashboard-scroll"
                        style={{ display: 'block' }}
                      />
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}) 0%, transparent 55%)`,
                          transition: 'background 0.05s linear',
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                        style={{ background: 'linear-gradient(to top, rgba(15,15,26,0.6) 0%, transparent 100%)' }} />
                    </div>
                  </div>
                )}

                {/* Mobile Frame */}
                {deviceView === 'mobile' && (
                  <div className="w-72 animate-in fade-in duration-300 mx-auto">
                    <div
                      className="bg-gradient-to-b from-slate-600 to-slate-700 rounded-[2.5rem] border-[3px] border-slate-500/80 p-2.5 relative"
                      style={{
                        boxShadow: isHoveringDevice
                          ? '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(110,224,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                          : '0 25px 70px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
                        transition: 'box-shadow 0.3s ease',
                      }}
                    >
                      <div className="absolute -right-[5px] top-20 w-[4px] h-10 bg-slate-500 rounded-r-sm" />
                      <div className="absolute -left-[5px] top-16 w-[4px] h-7 bg-slate-500 rounded-l-sm" />
                      <div className="absolute -left-[5px] top-28 w-[4px] h-7 bg-slate-500 rounded-l-sm" />

                      <div className="bg-slate-900 rounded-[2rem] overflow-hidden relative">
                        <div className="flex justify-center pt-3 pb-1">
                          <div className="w-20 h-2 bg-slate-800 rounded-full" />
                        </div>
                        <div className="overflow-hidden relative" style={{ height: '520px' }}>
                          <img
                            src={dashboardPreviewMobile}
                            alt="Metrika Dashboard Mobile"
                            className="w-full animate-dashboard-scroll-mobile"
                            style={{ display: 'block' }}
                          />
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}) 0%, transparent 55%)`,
                              transition: 'background 0.05s linear',
                            }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
                            style={{ background: 'linear-gradient(to top, rgba(15,15,26,0.5) 0%, transparent 100%)' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Floating badge chips */}
            <div className="absolute -top-2 -right-4 hidden lg:flex items-center gap-1.5 bg-slate-800/90 border border-emerald-500/30 rounded-full px-3 py-1.5 animate-float shadow-lg"
              style={{ animationDelay: '0.5s', backdropFilter: 'blur(8px)' }}>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-300">Live</span>
            </div>
            <div className="absolute -bottom-2 -left-4 hidden lg:flex items-center gap-1.5 bg-slate-800/90 border border-blue-500/30 rounded-full px-3 py-1.5 animate-float shadow-lg"
              style={{ animationDelay: '2s', backdropFilter: 'blur(8px)' }}>
              <Activity className="w-3 h-3 text-blue-400" />
              <span className="text-xs font-semibold text-blue-300">+78.5% precisão</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. FEATURES SECTION ─────────────────────────────────────────────── */}
      <section id="recursos" className="py-20 sm:py-28 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-animate>
          <div className="text-center mb-14">
            <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-3">FUNCIONALIDADES</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">Por que o Metrika vai te ajudar</h2>
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
              Não é só um dashboard de números. O Metrika foi construído para acompanhar o seu processo — do registro ao relatório de evolução.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                color: "bg-emerald-500/20 text-emerald-400",
                title: "Registre trades com imagem",
                desc: "Anexe o print do gráfico no momento da entrada, saída ou revisão. Volte nele depois e entenda exatamente o contexto que te levou àquela decisão."
              },
              {
                icon: Brain,
                color: "bg-blue-500/20 text-blue-400",
                title: "Descreva o trade em texto livre",
                desc: "Escreva como você quiser — o Metrika organiza as informações automaticamente, estruturando ativo, direção, resultado e notas de forma padronizada."
              },
              {
                icon: ChartBar,
                color: "bg-purple-500/20 text-purple-400",
                title: "Relatório de análise com IA",
                desc: "Receba um relatório completo alinhando seus pontos fortes e o que precisa ser melhorado — gerado com base no seu histórico real de operações."
              },
              {
                icon: Target,
                color: "bg-pink-500/20 text-pink-400",
                title: "Métricas que revelam seu padrão",
                desc: "Taxa de acerto, RR médio, drawdown, sequências de ganhos e perdas — calculados automaticamente para você enxergar o que seus olhos não veem nas planilhas."
              },
              {
                icon: Clock,
                color: "bg-yellow-500/20 text-yellow-400",
                title: "Descubra seu horário de ouro",
                desc: "O Metrika mapeia em quais sessões e horários você tem melhor performance. Opere menos e melhor — no seu pico, não no horário do costume."
              },
              {
                icon: Activity,
                color: "bg-teal-500/20 text-teal-400",
                title: "Curva de capital em tempo real",
                desc: "Visualize a evolução do seu capital mês a mês. Identifique viradas, sequências negativas e períodos de consistência com clareza total."
              },
              {
                icon: Shield,
                color: "bg-orange-500/20 text-orange-400",
                title: "Guardião do seu plano",
                desc: "Configure limites de perda diária e ganho máximo. Quando você estiver perto de quebrar seu próprio plano, o Metrika avisa antes que aconteça."
              },
              {
                icon: Upload,
                color: "bg-indigo-500/20 text-indigo-400",
                title: "Importação de qualquer corretora",
                desc: "Suba seu CSV de B3, Forex ou Cripto em segundos. O MetrikAI processa e organiza tudo automaticamente — sem configuração manual, sem dor de cabeça."
              },
              {
                icon: LineChart,
                color: "bg-green-500/20 text-green-400",
                title: "Performance por setup e ativo",
                desc: "Filtre seus resultados por ativo, mercado ou tipo de operação. Saiba quais setups realmente funcionam — e quais estão destruindo sua média silenciosamente."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-xl p-6 hover:-translate-y-1 hover:border-emerald-500/30 transition-all duration-200 group">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${feature.color} group-hover:scale-110 transition-transform duration-200`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-white font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. TESTIMONIALS SECTION ─────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-animate>
          <div className="text-center mb-12">
            <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-3">RESULTADOS REAIS</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Quem usa o Metrika opera diferente
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "Antes eu usava planilha e ficava horas tentando entender onde estava errando. Com o Metrika vi em 10 minutos que perdia dinheiro toda sexta-feira. Mudei minha rotina e o resultado veio.",
                name: "Guilherme Reis",
                sub: "Day Trader · Forex & B3",
                initials: "GR",
                gradient: "from-emerald-500 to-teal-500"
              },
              {
                quote: "Como mentor, precisava mostrar evolução real para os alunos. O dashboard do Metrika virou parte das minhas aulas — os dados não mentem e a curva de capital fala por si só.",
                name: "José Alcede",
                sub: "Trader & Mentor",
                initials: "JA",
                gradient: "from-blue-500 to-indigo-500"
              },
              {
                quote: "Opero cripto há 3 anos e nunca tive clareza de verdade sobre o meu RR médio. O Metrika me mostrou que eu fechava ganhos cedo e deixava perdas correrem. Simples assim.",
                name: "Douglas Silva",
                sub: "Swing Trader · Cripto",
                initials: "DS",
                gradient: "from-purple-500 to-pink-500"
              }
            ].map((t, i) => (
              <div key={i} className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 flex flex-col gap-4">
                <p className="text-slate-300 italic text-sm leading-relaxed flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-slate-400 text-xs">{t.sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. PRICING SECTION ──────────────────────────────────────────────── */}
      <section id="precos" className="py-20 sm:py-28 bg-gradient-to-br from-slate-900 via-emerald-900/10 to-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8" data-animate>
          <div className="text-center mb-12">
            <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-3">INVISTA NA SUA EVOLUÇÃO</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Um plano único. Acesso total.
            </h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto">
              Sem tier básico. Sem funcionalidade travada. Escolha o ciclo e tenha tudo que o Metrika oferece desde o primeiro dia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
            {/* Plano Mensal */}
            <div className="bg-[#0f0f1a] border border-[#1e1e2e] rounded-2xl p-8 flex flex-col">
              <h3 className="text-white font-bold text-xl mb-6 tracking-wide">PLANO MENSAL</h3>
              <div className="mb-1">
                <span className="text-4xl font-bold text-white">R$ 97,00</span>
                <span className="text-slate-400 text-sm ml-1">/mês</span>
              </div>
              <p className="text-slate-500 text-sm mb-8">Cobrado mensalmente</p>
              <Button
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold mt-auto"
                onClick={() => window.open('https://hub.la/g/CGRfvH9XIZzkXUFTkesn', '_blank')}
              >
                Assinar Mensal
              </Button>
            </div>

            {/* Plano Anual — highlighted */}
            <div className="relative bg-gradient-to-br from-emerald-900/30 to-slate-900 border-2 border-emerald-500 rounded-2xl p-8 flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-emerald-500 text-slate-900 text-xs font-bold px-4 py-1 rounded-full">ECONOMIZE 21%</span>
              </div>
              <h3 className="text-white font-bold text-xl mb-6 tracking-wide">PLANO ANUAL</h3>
              <div className="mb-1">
                <span className="text-slate-500 line-through text-sm mr-2">R$ 1.164,00</span>
              </div>
              <div className="mb-1">
                <span className="text-4xl font-bold text-white">R$ 697,00</span>
                <span className="text-slate-400 text-sm ml-1">/ano</span>
              </div>
              <p className="text-emerald-400 text-sm mb-8">Equivale a R$ 58,08/mês</p>
              <Button
                className="w-full gradient-emerald-blue hover:scale-105 hover:shadow-2xl transition-all duration-300 font-bold animate-glow mt-auto"
                onClick={() => window.open('https://hub.la/g/kUCz3mE6Gon3TeOz1h40', '_blank')}
              >
                Garantir Desconto
              </Button>
            </div>
          </div>

          {/* Todos os planos incluem */}
          <div className="max-w-3xl mx-auto bg-[#0f0f1a] border border-[#1e1e2e] rounded-2xl p-8">
            <h4 className="text-white font-semibold mb-6 text-center">O que está incluso em qualquer plano:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Dashboard completo com todas as métricas de performance",
                "Importação de CSV para B3, Forex e Cripto",
                "Histórico ilimitado de operações",
                "Análise por horário, ativo, setup e carteira",
                "Gestão de risco e alertas de plano",
                "Atualizações gratuitas sem custo extra",
                "Pagamento seguro via cartão ou PIX",
                "Cancele a qualquer momento, sem burocracia"
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. FAQ SECTION ──────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8" data-animate>
          <div className="text-center mb-12">
            <p className="text-emerald-400 text-xs font-semibold tracking-widest uppercase mb-3">DÚVIDAS COMUNS</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Antes de começar</h2>
            <p className="text-slate-400 text-base">
              As respostas para o que você provavelmente quer saber antes de assinar.
            </p>
          </div>

          <div className="divide-y divide-slate-800">
            {[
              {
                q: "O Metrika vai operar no meu lugar?",
                a: "Não. O Metrika é uma plataforma de análise e diário de trading — ele te dá clareza sobre o que você já fez. A decisão de compra e venda continua sendo 100% sua."
              },
              {
                q: "Preciso instalar alguma coisa?",
                a: "Não. O Metrika roda direto no navegador, em qualquer dispositivo. Acesse do computador, celular ou tablet sem precisar instalar nada."
              },
              {
                q: "Funciona para qualquer mercado?",
                a: "Sim. O Metrika suporta B3 (ações, mini índice, mini dólar), Forex e Criptomoedas. Você pode importar de múltiplas corretoras e consolidar tudo em um único painel."
              },
              {
                q: "E se eu já tiver histórico de trades em planilha?",
                a: "Você pode importar via CSV no formato padrão de cada mercado. O MetrikAI processa o arquivo e já entrega os dados organizados e analisados automaticamente."
              },
              {
                q: "Quais formas de pagamento são aceitas?",
                a: "Aceitamos cartão de crédito, débito e PIX. O processamento é feito de forma segura e você recebe acesso imediato após a confirmação."
              },
              {
                q: "Posso cancelar quando quiser?",
                a: "Sim, sem multa e sem burocracia. Acesse sua conta, cancele com um clique e pronto. Não enviamos cobranças surpresas."
              }
            ].map((faq, i) => (
              <div key={i} className="py-5">
                <button
                  className="w-full flex justify-between items-center text-left gap-4 cursor-pointer"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-white font-medium text-base">{faq.q}</span>
                  <span className="text-emerald-400 text-xl font-bold flex-shrink-0">
                    {openFaq === i ? "−" : "+"}
                  </span>
                </button>
                {openFaq === i && (
                  <p className="text-slate-400 text-sm mt-3 pb-1 leading-relaxed">{faq.a}</p>
                )}
              </div>
            ))}
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
