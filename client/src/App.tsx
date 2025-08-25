import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { AIChat } from "@/components/ui/ai-chat";
import { AISuggestionsPopup } from "@/components/ui/ai-suggestions";
import { CsvTipsPopup } from "@/components/ui/csv-tips-popup";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import NovoTrade from "@/pages/novo-trade";
import Graficos from "@/pages/graficos";
import Analises from "@/pages/analises";
import Diario from "@/pages/diario";
import Perfil from "@/pages/perfil";
import Calendario from "@/pages/calendario";
import TesteGateIO from "@/pages/teste-gateio";
import AdminPage from "@/pages/admin";
import AdminLogin from "@/pages/admin-login";
import ResetPassword from "@/pages/reset-password";
import NotFound from "@/pages/not-found";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/novo-trade": "Novo Trade",
  "/graficos": "Gráficos em Tempo Real",
  "/analises": "Análises",
  "/diario": "Diário do Trader",
  "/calendario": "Calendário de Trading",
  "/perfil": "Perfil",
  "/admin": "Painel Administrativo",
  "/teste-gateio": "Teste Gate.io API"
};

function AppContent() {
  const { isAuthenticated } = useAuth();
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
                      title={pageTitles["/dashboard"]} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <Dashboard />
                  </Route>
                  <Route path="/novo-trade">
                    <TopBar 
                      title={pageTitles["/novo-trade"]} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <NovoTrade />
                  </Route>
                  <Route path="/graficos">
                    <TopBar 
                      title={pageTitles["/graficos"]} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <Graficos />
                  </Route>
                  <Route path="/analises">
                    <TopBar 
                      title={pageTitles["/analises"]} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <Analises />
                  </Route>
                  <Route path="/diario">
                    <TopBar 
                      title={pageTitles["/diario"]} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <Diario />
                  </Route>
                  <Route path="/calendario">
                    <TopBar 
                      title={pageTitles["/calendario"]} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <Calendario />
                  </Route>
                  <Route path="/perfil">
                    <TopBar 
                      title={pageTitles["/perfil"]} 
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    <Perfil />
                  </Route>
                  {/* Admin route moved to standalone section */}
                  <Route path="/">
                    <TopBar 
                      title={pageTitles["/dashboard"]} 
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
        <AuthProvider>
          <AdminAuthProvider>
            <Toaster />
            <AppContent />
          </AdminAuthProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
