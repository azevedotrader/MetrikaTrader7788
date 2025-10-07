import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

interface PrivacyPageProps {
  onMenuClick?: () => void;
}

export default function PoliticaPrivacidade({ onMenuClick }: PrivacyPageProps) {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header simplificado com botão voltar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-7xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Voltar para Home</span>
            <span className="sm:hidden">Voltar</span>
          </Button>
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">Política de Privacidade</h1>
          <div className="w-20 sm:w-32"></div> {/* Spacer para centralizar o título */}
        </div>
      </div>
      
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-5xl">
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-primary leading-tight">
              Política de Privacidade - Métrika Trading
            </CardTitle>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-2">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </CardHeader>
          
          <CardContent className="px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="space-y-4 sm:space-y-6 md:space-y-8 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed max-h-[calc(100vh-250px)] overflow-y-auto pr-2 sm:pr-4">
                
                <section data-testid="section-introducao">
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-primary mb-2 sm:mb-3 md:mb-4">1. Introdução</h2>
                  <p className="mb-3">
                    A Métrika Trading ("nós", "nosso" ou "empresa") está comprometida em proteger e 
                    respeitar sua privacidade. Esta Política de Privacidade explica como coletamos, 
                    usamos, armazenamos e compartilhamos suas informações pessoais quando você usa 
                    nossa plataforma de análise de trading.
                  </p>
                  <p>
                    Ao usar nossos serviços, você concorda com a coleta e uso de informações de 
                    acordo com esta política.
                  </p>
                </section>

                <section data-testid="section-informacoes-coletadas">
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-primary mb-2 sm:mb-3 md:mb-4">2. Informações que Coletamos</h2>
                  
                  <h3 className="text-sm sm:text-base md:text-lg font-medium text-foreground mb-2 sm:mb-3">2.1. Informações Pessoais</h3>
                  <ul className="list-disc pl-4 sm:pl-6 mb-4 space-y-1 sm:space-y-2">
                    <li>Nome completo e endereço de e-mail</li>
                    <li>Número de telefone (quando fornecido)</li>
                    <li>Informações de perfil e preferências</li>
                    <li>Número do WhatsApp (para funcionalidade de bot)</li>
                  </ul>

                  <h3 className="text-sm sm:text-base md:text-lg font-medium text-foreground mb-2 sm:mb-3">2.2. Dados de Trading</h3>
                  <ul className="list-disc pl-4 sm:pl-6 mb-4 space-y-1 sm:space-y-2">
                    <li>Registros de trades e operações</li>
                    <li>Configurações de corretoras e APIs</li>
                    <li>Arquivos CSV importados</li>
                    <li>Dados de performance e estatísticas</li>
                    <li>Entradas do diário de trading</li>
                  </ul>

                  <h3 className="text-sm sm:text-base md:text-lg font-medium text-foreground mb-2 sm:mb-3">2.3. Dados Técnicos</h3>
                  <ul className="list-disc pl-4 sm:pl-6 mb-4 space-y-1 sm:space-y-2">
                    <li>Endereço IP e informações do dispositivo</li>
                    <li>Dados de uso e navegação</li>
                    <li>Logs de sistema e erro</li>
                    <li>Cookies e tecnologias similares</li>
                  </ul>
                </section>

                <section data-testid="section-uso-informacoes">
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-primary mb-2 sm:mb-3 md:mb-4">3. Como Usamos suas Informações</h2>
                  <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2">
                    <li>Fornecer e manter nossos serviços de análise de trading</li>
                    <li>Processar e analisar seus dados de trading</li>
                    <li>Personalizar sua experiência na plataforma</li>
                    <li>Comunicar sobre atualizações e melhorias</li>
                    <li>Fornecer suporte técnico e atendimento ao cliente</li>
                    <li>Processar mensagens via WhatsApp Bot (quando habilitado)</li>
                    <li>Garantir segurança e prevenir fraudes</li>
                    <li>Cumprir obrigações legais e regulamentares</li>
                  </ul>
                </section>

                <section data-testid="section-whatsapp">
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-primary mb-2 sm:mb-3 md:mb-4">4. Funcionalidade WhatsApp Bot</h2>
                  <p className="mb-3">
                    Nossa plataforma oferece integração com WhatsApp para facilitar o registro de trades:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2">
                    <li>Mensagens enviadas via WhatsApp são processadas automaticamente</li>
                    <li>Extraímos dados de trading das mensagens para salvar em sua conta</li>
                    <li>Não armazenamos mensagens completas, apenas dados relevantes de trading</li>
                    <li>Você pode desabilitar esta funcionalidade a qualquer momento</li>
                    <li>Respeitamos os termos de uso do WhatsApp Business API</li>
                  </ul>
                </section>

                <section data-testid="section-compartilhamento">
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-primary mb-2 sm:mb-3 md:mb-4">5. Compartilhamento de Informações</h2>
                  <p className="mb-3">
                    <strong>Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros</strong>, 
                    exceto nas seguintes circunstâncias:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2">
                    <li>Com seu consentimento explícito</li>
                    <li>Para cumprir obrigações legais</li>
                    <li>Para proteger nossos direitos e segurança</li>
                    <li>Com provedores de serviços que auxiliam nossa operação (sob rígidos termos de confidencialidade)</li>
                  </ul>
                </section>

                <section data-testid="section-seguranca">
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-primary mb-2 sm:mb-3 md:mb-4">6. Segurança dos Dados</h2>
                  <p className="mb-3">
                    Implementamos medidas de segurança adequadas para proteger suas informações:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2">
                    <li>Criptografia de dados em trânsito e em repouso</li>
                    <li>Autenticação segura e controle de acesso</li>
                    <li>Monitoramento contínuo de segurança</li>
                    <li>Backup regular e recuperação de dados</li>
                    <li>Treinamento regular da equipe em segurança</li>
                  </ul>
                </section>

                <section data-testid="section-direitos">
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-primary mb-2 sm:mb-3 md:mb-4">7. Seus Direitos</h2>
                  <p className="mb-3">
                    De acordo com a LGPD (Lei Geral de Proteção de Dados), você tem os seguintes direitos:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2">
                    <li>Acessar seus dados pessoais</li>
                    <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                    <li>Solicitar a exclusão de dados pessoais</li>
                    <li>Revogar consentimento a qualquer momento</li>
                    <li>Solicitar portabilidade de dados</li>
                    <li>Obter informações sobre compartilhamento de dados</li>
                  </ul>
                  <p className="mt-3">
                    Para exercer esses direitos, entre em contato através do e-mail: 
                    <span className="font-medium text-primary"> privacidade@metrika.com.br</span>
                  </p>
                </section>

                <section data-testid="section-cookies">
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-primary mb-2 sm:mb-3 md:mb-4">8. Cookies e Tecnologias Similares</h2>
                  <p className="mb-3">
                    Utilizamos cookies e tecnologias similares para:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2">
                    <li>Manter você conectado à plataforma</li>
                    <li>Lembrar suas preferências</li>
                    <li>Analisar o uso da plataforma</li>
                    <li>Melhorar a experiência do usuário</li>
                  </ul>
                  <p className="mt-3">
                    Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.
                  </p>
                </section>

                <section data-testid="section-retencao">
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-primary mb-2 sm:mb-3 md:mb-4">9. Retenção de Dados</h2>
                  <p>
                    Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir as finalidades 
                    descritas nesta política, salvo quando a retenção por período superior for exigida 
                    ou permitida por lei. Dados de trading podem ser mantidos por períodos mais longos 
                    para fins de análise histórica e conformidade regulatória.
                  </p>
                </section>

                <section data-testid="section-internacional">
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-primary mb-2 sm:mb-3 md:mb-4">10. Transferências Internacionais</h2>
                  <p>
                    Alguns de nossos provedores de serviços podem estar localizados fora do Brasil. 
                    Garantimos que todas as transferências internacionais de dados cumpram com os 
                    requisitos da LGPD e implementem salvaguardas adequadas.
                  </p>
                </section>

                <section data-testid="section-alteracoes">
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-primary mb-2 sm:mb-3 md:mb-4">11. Alterações nesta Política</h2>
                  <p>
                    Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre 
                    mudanças significativas através da plataforma ou por e-mail. Recomendamos que 
                    revise esta política regularmente para se manter informado sobre como protegemos 
                    suas informações.
                  </p>
                </section>

                <section data-testid="section-contato">
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-primary mb-2 sm:mb-3 md:mb-4">12. Contato</h2>
                  <p className="mb-3">
                    Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos 
                    seus dados pessoais, entre em contato conosco:
                  </p>
                  <div className="bg-muted p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl w-full">
                    <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
                      <p className="text-sm sm:text-base md:text-lg font-semibold">Métrika Trading</p>
                      <div className="space-y-1 sm:space-y-1.5 md:space-y-2 text-xs sm:text-sm md:text-base">
                        <p>E-mail: <span className="text-primary font-medium">privacidade@metrika.com.br</span></p>
                        <p>E-mail de suporte: <span className="text-primary font-medium">suporte@metrika.com.br</span></p>
                        <p>Através da seção "Suporte" da plataforma</p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="border-t pt-3 sm:pt-4 md:pt-6 mt-4 sm:mt-6 md:mt-8">
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground text-center">
                    Esta Política de Privacidade é válida a partir de {new Date().toLocaleDateString('pt-BR')} 
                    e substitui qualquer versão anterior.
                  </p>
                </div>
                
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}