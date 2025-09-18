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
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import NovoTrade from "@/pages/novo-trade";
import Graficos from "@/pages/graficos";
import Analises from "@/pages/analises";
import RiskManagement from "@/pages/risk-management";
import Diario from "@/pages/diario";
import Perfil from "@/pages/perfil";
import Calendario from "@/pages/calendario";
import Suporte from "@/pages/suporte";
import Aprendizado from "@/pages/aprendizado";
import Importacoes from "@/pages/importacoes";
import TesteGateIO from "@/pages/teste-gateio";
import AdminPage from "@/pages/admin";
import AdminLogin from "@/pages/admin-login";
import ResetPassword from "@/pages/reset-password";
import NotFound from "@/pages/not-found";

// Títulos das páginas agora são chaves de tradução
const pageTitleKeys: Record<string, string> = {
  "/dashboard": "nav.dashboard",
  "/novo-trade": "trades.add_new",
  "/graficos": "charts.title",
  "/analises": "nav.trades",
  "/gestao": "risk_management.title",
  "/diario": "journal.title",
  "/calendario": "calendar.title",
  "/aprendizado": "learning.title",
  "/importacoes": "dashboard.imports_and_trades",
  "/perfil": "profile.title",
  "/suporte": "support.title",
  "/admin": "nav.admin",
  "/teste-gateio": "Teste Gate.io API"
};

function AppContent() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <Switch>
        {/* Public test page - accessible without authentication */}
        <Route path="/teste-gateio">
          <TesteGateIO />
        </Route>
        
        {/* Password reset route - public */}
        <Route path="/reset-password">
          <ResetPassword />
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
          ) : (
            <>
              <Sidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)}
              />
              <div className={`min-h-screen transition-all duration-300 ${
                isMobile ? 'ml-0' : 'ml-16'
              }`}>
                <Switch>
                  <Route path="/dashboard">
                    <TopBar 
                      title={t(pageTitleKeys["/dashboard"])} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <Dashboard />
                  </Route>
                  <Route path="/novo-trade">
                    <TopBar 
                      title={t(pageTitleKeys["/novo-trade"])} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <NovoTrade />
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
                  <Route path="/diario">
                    <TopBar 
                      title={t(pageTitleKeys["/diario"])} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <Diario />
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
                  <Route path="/aprendizado">
                    <TopBar 
                      title={t(pageTitleKeys["/aprendizado"])} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <Aprendizado />
                  </Route>
                  <Route path="/importacoes">
                    <TopBar 
                      title={t(pageTitleKeys["/importacoes"])} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <Importacoes />
                  </Route>
                  {/* Admin route moved to standalone section */}
                  <Route path="/">
                    <TopBar 
                      title={t(pageTitleKeys["/dashboard"])} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <Dashboard />
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
