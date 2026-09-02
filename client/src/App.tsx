import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { TourProvider } from "@/contexts/TourContext";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { AIChat } from "@/components/ui/ai-chat";
import { AISuggestionsPopup } from "@/components/ui/ai-suggestions";
import { CsvTipsPopup } from "@/components/ui/csv-tips-popup";
import { TourOverlay } from "@/components/ui/tour-overlay";
import { NoPlanScreen } from "@/components/ui/no-plan-screen";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserPlan, isPaidPlan } from "@/hooks/useUserPlan";
import { useState, useEffect } from "react";
import { CookieConsent } from "@/components/ui/cookie-consent";
import { initPixelIfConsented } from "@/hooks/useMetaPixel";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import NovoTrade from "@/pages/novo-trade";
import ImportarCSV from "@/pages/importar-csv";
import WhatsAppPage from "@/pages/whatsapp";
import Graficos from "@/pages/graficos";
import Analises from "@/pages/analises";
import RiskManagement from "@/pages/risk-management";
import Diario from "@/pages/diario";
import Perfil from "@/pages/perfil";
import Calendario from "@/pages/calendario";
import Suporte from "@/pages/suporte";
import Aprendizado from "@/pages/aprendizado";
import Importacoes from "@/pages/importacoes";
import Carteiras from "@/pages/carteiras";
import TesteGateIO from "@/pages/teste-gateio";
import AdminPage from "@/pages/admin";
import AdminLogin from "@/pages/admin-login";
import ResetPassword from "@/pages/reset-password";
import PoliticaPrivacidade from "@/pages/politica-privacidade";
import TermosServico from "@/pages/termos-servico";
import ExclusaoDados from "@/pages/exclusao-dados";
import NotFound from "@/pages/not-found";
import ClubeDoGrafico from "@/pages/clube-do-grafico";

// Títulos das páginas agora são chaves de tradução
const pageTitleKeys: Record<string, string> = {
  "/dashboard": "nav.dashboard",
  "/novo-trade": "trades.add_new",
  "/importar-csv": "trade.import_csv",
  "/whatsapp": "whatsapp.title",
  "/graficos": "charts.title",
  "/analises": "nav.trades",
  "/gestao": "risk_management.title",
  "/diario": "journal.title",
  "/calendario": "calendar.title",
  "/aprendizado": "learning.title",
  "/importacoes": "dashboard.imports_and_trades",
  "/carteiras": "Carteiras",
  "/perfil": "profile.title",
  "/suporte": "support.title",
  "/politica-privacidade": "Política de Privacidade",
  "/termos-servico": "Termos de Serviço",
  "/exclusao-dados": "Exclusão de Dados",
  "/admin": "nav.admin",
  "/teste-gateio": "Teste Gate.io API",
  "/clube-do-grafico": "Relatório Clube do Gráfico"
};

function AppContent() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { planType, isLoading: planLoading } = useUserPlan();
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('metrika-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    // Inicializa Meta Pixel se o usuário já tinha aceitado anteriormente
    initPixelIfConsented();
  }, []);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {/* Banner de consentimento LGPD + Meta Pixel */}
      <CookieConsent />
      <Switch>
        {/* Public test page - accessible without authentication */}
        <Route path="/teste-gateio">
          <TesteGateIO />
        </Route>
        
        {/* Password reset route - public */}
        <Route path="/reset-password">
          <ResetPassword />
        </Route>
        
        {/* Legal pages - accessible both public and authenticated */}
        <Route path="/politica-privacidade">
          <PoliticaPrivacidade 
            onMenuClick={isAuthenticated ? () => setIsSidebarOpen(true) : undefined}
          />
        </Route>
        
        <Route path="/termos-servico">
          <TermosServico 
            onMenuClick={isAuthenticated ? () => setIsSidebarOpen(true) : undefined}
          />
        </Route>
        
        <Route path="/exclusao-dados">
          <ExclusaoDados 
            onMenuClick={isAuthenticated ? () => setIsSidebarOpen(true) : undefined}
          />
        </Route>
        
        {/* Admin routes - separate from regular app */}
        <Route path="/admin/login">
          <AdminLogin />
        </Route>
        
        <Route path="/admin">
          <AdminPage />
        </Route>
        
        {/* Protected routes */}
        <Route>
          {!isAuthenticated ? (
            <Landing />
          ) : planLoading ? (
            /* Aguarda verificação do plano antes de renderizar qualquer coisa */
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#6EE000] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !isPaidPlan(planType) ? (
            <NoPlanScreen />
          ) : (
            <>
              <Sidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)}
              />
              <div className={`min-h-screen transition-all duration-300 pt-20 ${
                isMobile ? 'ml-0' : 'ml-16'
              }`}>
                <Switch>
                  <Route path="/dashboard">
                    {/* Dashboard will handle its own TopBar with filters */}
                    <Dashboard onMenuClick={() => setIsSidebarOpen(true)} />
                  </Route>
                  <Route path="/novo-trade">
                    <TopBar 
                      title={t(pageTitleKeys["/novo-trade"])} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <NovoTrade />
                  </Route>
                  <Route path="/importar-csv">
                    <TopBar 
                      title={t(pageTitleKeys["/importar-csv"])} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <ImportarCSV />
                  </Route>
                  <Route path="/gestao">
                    <TopBar 
                      title={t(pageTitleKeys["/gestao"])} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <RiskManagement />
                  </Route>
                  <Route path="/graficos">
                    <TopBar 
                      title={t(pageTitleKeys["/graficos"])} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <Graficos />
                  </Route>
                  <Route path="/analises">
                    <TopBar 
                      title={t(pageTitleKeys["/analises"])} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <Analises />
                  </Route>
                  <Route path="/calendario">
                    <TopBar 
                      title={t(pageTitleKeys["/calendario"])} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <Calendario />
                  </Route>
                  <Route path="/perfil">
                    <TopBar 
                      title={t(pageTitleKeys["/perfil"])} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <Perfil />
                  </Route>
                  <Route path="/suporte">
                    <TopBar 
                      title={t(pageTitleKeys["/suporte"])} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <Suporte />
                  </Route>
                  <Route path="/importacoes">
                    <TopBar 
                      title={t(pageTitleKeys["/importacoes"])} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <Importacoes />
                  </Route>
                  <Route path="/carteiras">
                    <TopBar
                      title={pageTitleKeys["/carteiras"]}
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <Carteiras />
                  </Route>
                  <Route path="/clube-do-grafico">
                    <TopBar
                      title={pageTitleKeys["/clube-do-grafico"]}
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <ClubeDoGrafico />
                  </Route>
                  {/* Legal pages are handled by public routes above with conditional onMenuClick */}
                  {/* Admin route moved to standalone section */}
                  <Route path="/">
                    {/* Dashboard will handle its own TopBar with filters */}
                    <Dashboard onMenuClick={() => setIsSidebarOpen(true)} />
                  </Route>
                  <Route component={NotFound} />
                </Switch>
              </div>
              
              {/* AI Components */}
              <AIChat 
                isOpen={isChatOpen} 
                onToggle={() => setIsChatOpen(!isChatOpen)}
                isMinimized={isChatMinimized}
                onMinimize={() => setIsChatMinimized(!isChatMinimized)}
              />
              <AISuggestionsPopup />
              <CsvTipsPopup />
              
              {/* Tour Overlay - Global */}
              <TourOverlay />
            </>
          )}
        </Route>
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <AuthProvider>
            <AdminAuthProvider>
              <TourProvider>
                <Toaster />
                <AppContent />
              </TourProvider>
            </AdminAuthProvider>
          </AuthProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
