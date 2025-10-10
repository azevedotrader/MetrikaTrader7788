import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Trash2, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

interface DataDeletionPageProps {
  onMenuClick?: () => void;
}

export default function ExclusaoDados({ onMenuClick }: DataDeletionPageProps) {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Use TopBar for authenticated users, custom header for public access */}
      {onMenuClick ? (
        <TopBar 
          title="Exclusão de Dados" 
          onMenuClick={onMenuClick}
        />
      ) : (
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-7xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              data-testid="button-voltar"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar para Home</span>
              <span className="sm:hidden">Voltar</span>
            </Button>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Exclusão de Dados</h1>
            <div className="w-20 sm:w-32"></div> {/* Spacer para centralizar o título */}
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-5xl">
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-primary leading-tight">
              Instruções de Exclusão de Dados - Métrika Trading
            </CardTitle>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-2">
              Como solicitar a exclusão dos seus dados pessoais
            </p>
          </CardHeader>
          
          <CardContent className="px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="space-y-4 sm:space-y-6 md:space-y-8 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed md:max-h-[calc(100vh-250px)] overflow-y-auto pr-2 sm:pr-4">
                
                <section data-testid="section-intro" className="text-center py-6">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center">
                      <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                    </div>
                  </div>
                  <p className="text-base sm:text-lg md:text-xl text-foreground max-w-3xl mx-auto">
                    Respeitamos seu direito à privacidade e o controle sobre seus dados pessoais. 
                    Esta página fornece instruções claras sobre como solicitar a exclusão completa 
                    de seus dados da plataforma Métrika Trading.
                  </p>
                </section>

                <section data-testid="section-direito-exclusao">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">1. Seu Direito à Exclusão de Dados</h2>
                  <p className="mb-3">
                    De acordo com a <strong>LGPD (Lei Geral de Proteção de Dados)</strong>, você tem o direito de 
                    solicitar a exclusão permanente de seus dados pessoais a qualquer momento. Isso inclui:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2">
                    <li>Informações de cadastro (nome, e-mail, telefone)</li>
                    <li>Dados de trading e operações registradas</li>
                    <li>Configurações de API e integrações</li>
                    <li>Histórico de importações CSV</li>
                    <li>Entradas do diário de trading</li>
                    <li>Mensagens enviadas via WhatsApp Bot</li>
                    <li>Preferências e configurações da conta</li>
                  </ul>
                </section>

                <section data-testid="section-como-solicitar">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">2. Como Solicitar a Exclusão</h2>
                  
                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3 flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                    Através da Plataforma (Recomendado)
                  </h3>
                  <div className="mb-4 pl-8">
                    <p className="mb-2">Usuários logados podem solicitar a exclusão diretamente pela plataforma:</p>
                    <ol className="list-decimal pl-4 sm:pl-6 space-y-1 sm:space-y-2">
                      <li>Acesse seu <strong>Perfil</strong> na plataforma</li>
                      <li>Role até a seção <strong>"Zona de Perigo"</strong></li>
                      <li>Clique em <strong>"Excluir Conta e Dados"</strong></li>
                      <li>Confirme sua decisão no diálogo de confirmação</li>
                      <li>Seus dados serão excluídos permanentemente em até 48 horas</li>
                    </ol>
                  </div>

                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3 flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                    Via E-mail
                  </h3>
                  <div className="mb-4 pl-8">
                    <p className="mb-2">Se você não consegue acessar sua conta, envie um e-mail para:</p>
                    <div className="bg-muted p-4 rounded-lg my-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-5 h-5 text-primary" />
                        <strong className="text-base sm:text-lg">privacidade@metrika.com.br</strong>
                      </div>
                      <p className="text-sm text-muted-foreground">Assunto: Solicitação de Exclusão de Dados - LGPD</p>
                    </div>
                    <p className="mb-2">Incluir as seguintes informações no e-mail:</p>
                    <ul className="list-disc pl-4 sm:pl-6 space-y-1">
                      <li>Nome completo cadastrado na plataforma</li>
                      <li>E-mail cadastrado</li>
                      <li>Número de telefone (se houver)</li>
                      <li>Confirmação de que deseja excluir todos os dados permanentemente</li>
                    </ul>
                  </div>

                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3 flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                    Via WhatsApp
                  </h3>
                  <div className="pl-8">
                    <p className="mb-2">Você também pode solicitar a exclusão via WhatsApp:</p>
                    <ol className="list-decimal pl-4 sm:pl-6 space-y-1 sm:space-y-2">
                      <li>Entre em contato com nosso suporte no WhatsApp</li>
                      <li>Solicite a exclusão de dados conforme LGPD</li>
                      <li>Confirme sua identidade quando solicitado</li>
                      <li>Receba confirmação da exclusão</li>
                    </ol>
                  </div>
                </section>

                <section data-testid="section-prazo">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">3. Prazo de Processamento</h2>
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                    <p className="text-blue-900 dark:text-blue-100">
                      <strong>Prazo máximo:</strong> Processaremos sua solicitação em até <strong>48 horas úteis</strong> 
                      após a confirmação de identidade. Você receberá uma confirmação por e-mail quando a exclusão for concluída.
                    </p>
                  </div>
                </section>

                <section data-testid="section-o-que-acontece">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">4. O Que Acontece com Seus Dados</h2>
                  <p className="mb-3">Quando sua solicitação for processada:</p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Trash2 className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                      <div>
                        <strong className="block mb-1">Exclusão Permanente</strong>
                        <p className="text-muted-foreground">
                          Todos os seus dados serão removidos permanentemente de nossos servidores. 
                          Esta ação é <strong>irreversível</strong>.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <strong className="block mb-1">Dados Excluídos</strong>
                        <p className="text-muted-foreground">
                          Incluem: trades, importações CSV, configurações de API, diário, mensagens WhatsApp, 
                          e todas as informações pessoais associadas à sua conta.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                      <div>
                        <strong className="block mb-1">Confirmação</strong>
                        <p className="text-muted-foreground">
                          Você receberá um e-mail confirmando que todos os seus dados foram excluídos com sucesso.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section data-testid="section-excecoes">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">5. Exceções Legais</h2>
                  <p className="mb-3">
                    Em alguns casos, podemos ser obrigados por lei a reter certos dados por um período específico:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2">
                    <li><strong>Obrigações fiscais:</strong> Dados de transações podem ser mantidos por 5 anos conforme legislação tributária</li>
                    <li><strong>Processos judiciais:</strong> Dados relacionados a litígios pendentes serão mantidos até resolução</li>
                    <li><strong>Prevenção de fraudes:</strong> Logs de segurança podem ser retidos por período adicional</li>
                  </ul>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Você será informado caso alguma exceção se aplique ao seu caso específico.
                  </p>
                </section>

                <section data-testid="section-whatsapp-especifico">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">6. Exclusão de Dados do WhatsApp Bot</h2>
                  <p className="mb-3">
                    Se você utilizou nossa integração com WhatsApp, os seguintes dados serão excluídos:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2">
                    <li>Número de telefone WhatsApp associado</li>
                    <li>Histórico de mensagens processadas</li>
                    <li>Trades registrados via WhatsApp</li>
                    <li>Configurações de notificações WhatsApp</li>
                  </ul>
                  <p className="mt-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg text-yellow-900 dark:text-yellow-100">
                    <strong>Importante:</strong> A exclusão na Métrika não afeta conversas armazenadas no próprio WhatsApp. 
                    Para excluir conversas do WhatsApp, use as configurações do aplicativo WhatsApp.
                  </p>
                </section>

                <section data-testid="section-reativacao">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">7. Reativação de Conta</h2>
                  <p className="mb-3">
                    <strong>Após a exclusão dos dados, não é possível recuperar sua conta ou informações.</strong>
                  </p>
                  <p>
                    Se desejar usar a Métrika novamente, será necessário criar uma nova conta do zero. 
                    Todos os dados históricos serão perdidos permanentemente.
                  </p>
                </section>

                <section data-testid="section-duvidas">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">8. Dúvidas ou Problemas</h2>
                  <p className="mb-3">
                    Se você tiver dúvidas sobre o processo de exclusão de dados ou encontrar problemas, 
                    entre em contato conosco:
                  </p>
                  <div className="bg-muted p-4 sm:p-6 rounded-lg sm:rounded-xl w-full">
                    <div className="space-y-2 sm:space-y-3">
                      <p className="text-base sm:text-lg font-semibold">Métrika Trading - Privacidade & Proteção de Dados</p>
                      <div className="space-y-1 sm:space-y-2 text-sm sm:text-base">
                        <p>
                          <strong>E-mail LGPD:</strong> <span className="text-primary font-medium">privacidade@metrika.com.br</span>
                        </p>
                        <p>
                          <strong>E-mail Suporte:</strong> <span className="text-primary font-medium">suporte@metrika.com.br</span>
                        </p>
                        <p>
                          <strong>Através da plataforma:</strong> Seção "Suporte"
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="border-t pt-4 sm:pt-6 mt-6 sm:mt-8 bg-blue-50 dark:bg-blue-950/20 p-4 sm:p-6 rounded-lg">
                  <p className="text-sm sm:text-base text-center font-medium text-blue-900 dark:text-blue-100">
                    <Shield className="w-5 h-5 inline mr-2" />
                    Seus dados, seus direitos. Estamos comprometidos com sua privacidade e proteção de dados.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
                    Última atualização: {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>
                
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
