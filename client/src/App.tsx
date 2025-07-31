import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import NovoTrade from "@/pages/novo-trade";
import Analises from "@/pages/analises";
import Diario from "@/pages/diario";
import Perfil from "@/pages/perfil";
import Calendario from "@/pages/calendario";
import TesteGateIO from "@/pages/teste-gateio";
import NotFound from "@/pages/not-found";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/novo-trade": "Novo Trade",
  "/analises": "Análises",
  "/diario": "Diário do Trader",
  "/calendario": "Calendário de Trading",
  "/perfil": "Perfil",
  "/teste-gateio": "Teste Gate.io API"
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900">
      <Switch>
        {/* Public test page - accessible without authentication */}
        <Route path="/teste-gateio">
          <TesteGateIO />
        </Route>
        
        {/* Protected routes */}
        <Route>
          {!isAuthenticated ? (
            <Landing />
          ) : (
            <>
              <Sidebar />
              <div className="ml-16 min-h-screen transition-all duration-300">
                <Switch>
                  <Route path="/dashboard">
                    <TopBar title={pageTitles["/dashboard"]} />
                    <Dashboard />
                  </Route>
                  <Route path="/novo-trade">
                    <TopBar title={pageTitles["/novo-trade"]} />
                    <NovoTrade />
                  </Route>
                  <Route path="/analises">
                    <TopBar title={pageTitles["/analises"]} />
                    <Analises />
                  </Route>
                  <Route path="/diario">
                    <TopBar title={pageTitles["/diario"]} />
                    <Diario />
                  </Route>
                  <Route path="/calendario">
                    <TopBar title={pageTitles["/calendario"]} />
                    <Calendario />
                  </Route>
                  <Route path="/perfil">
                    <TopBar title={pageTitles["/perfil"]} />
                    <Perfil />
                  </Route>
                  <Route path="/">
                    <TopBar title={pageTitles["/dashboard"]} />
                    <Dashboard />
                  </Route>
                  <Route component={NotFound} />
                </Switch>
              </div>
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
          <Toaster />
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
