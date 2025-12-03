import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

interface TermsPageProps {
  onMenuClick?: () => void;
}

export default function TermosServico({ onMenuClick }: TermsPageProps) {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Use TopBar for authenticated users, custom header for public access */}
      {onMenuClick ? (
        <TopBar 
          title="Termos de Serviço" 
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
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Termos de Serviço</h1>
            <div className="w-20 sm:w-32"></div> {/* Spacer para centralizar o título */}
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 max-w-5xl">
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-primary leading-tight">
              Termos de Serviço - Métrika Trading
            </CardTitle>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-2">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </CardHeader>
          
          <CardContent className="px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="space-y-4 sm:space-y-6 md:space-y-8 text-xs sm:text-sm md:text-base lg:text-lg leading-relaxed md:max-h-[calc(100vh-250px)] overflow-y-auto pr-2 sm:pr-4">
                
                <section data-testid="section-aceitacao">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">1. Aceitação dos Termos</h2>
                  <p className="mb-3">
                    Bem-vindo à Métrika Trading. Ao acessar e usar nossa plataforma de análise de trading, 
                    você concorda em cumprir e estar vinculado a estes Termos de Serviço. Se você não 
                    concorda com qualquer parte destes termos, não utilize nossos serviços.
                  </p>
                  <p>
                    Estes termos constituem um acordo legalmente vinculante entre você ("Usuário", "você" ou "seu") 
                    e a Métrika Trading ("nós", "nosso" ou "Plataforma").
                  </p>
                </section>

                <section data-testid="section-servicos">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">2. Descrição dos Serviços</h2>
                  <p className="mb-3">A Métrika Trading oferece uma plataforma de análise de trading que permite:</p>
                  <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2">
                    <li>Registro e acompanhamento de operações de trading (Crypto, Forex, B3)</li>
                    <li>Importação de dados via CSV de diversas corretoras</li>
                    <li>Integração com APIs de corretoras para sincronização automática</li>
                    <li>Análise de performance e estatísticas detalhadas</li>
                    <li>Diário de trading para registro de estratégias e aprendizados</li>
                    <li>Integração com WhatsApp para registro rápido de trades</li>
                    <li>Visualização de gráficos e indicadores técnicos</li>
                    <li>Relatórios consolidados multi-corretora</li>
                  </ul>
                </section>

                <section data-testid="section-cadastro">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">3. Cadastro e Conta de Usuário</h2>
                  
                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3">3.1. Requisitos de Cadastro</h3>
                  <ul className="list-disc pl-4 sm:pl-6 mb-4 space-y-1 sm:space-y-2">
                    <li>Você deve ter pelo menos 18 anos de idade</li>
                    <li>Fornecer informações verdadeiras, precisas e completas</li>
                    <li>Manter seus dados atualizados</li>
                    <li>Não compartilhar sua conta com terceiros</li>
                  </ul>

                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3">3.2. Responsabilidade da Conta</h3>
                  <p className="mb-3">
                    Você é responsável por manter a confidencialidade de suas credenciais de acesso e por 
                    todas as atividades realizadas em sua conta. Notifique-nos imediatamente sobre qualquer 
                    uso não autorizado.
                  </p>
                </section>

                <section data-testid="section-uso-aceitavel">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">4. Uso Aceitável</h2>
                  <p className="mb-3">Você concorda em NÃO:</p>
                  <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2">
                    <li>Usar a plataforma para atividades ilegais ou não autorizadas</li>
                    <li>Tentar obter acesso não autorizado a sistemas ou dados</li>
                    <li>Interferir ou interromper o funcionamento da plataforma</li>
                    <li>Fazer engenharia reversa, descompilar ou desmontar qualquer parte do serviço</li>
                    <li>Usar bots, scripts ou automação não autorizada</li>
                    <li>Coletar dados de outros usuários sem consentimento</li>
                    <li>Transmitir vírus, malware ou código malicioso</li>
                    <li>Violar direitos de propriedade intelectual</li>
                  </ul>
                </section>

                <section data-testid="section-dados-trading">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">5. Dados de Trading</h2>
                  
                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3">5.1. Propriedade dos Dados</h3>
                  <p className="mb-3">
                    Você mantém todos os direitos sobre seus dados de trading. Concedemos a você uma licença 
                    não exclusiva para usar a plataforma para processar e analisar esses dados.
                  </p>

                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3">5.2. Precisão dos Dados</h3>
                  <p className="mb-3">
                    Você é responsável pela precisão dos dados inseridos na plataforma. A Métrika Trading 
                    não se responsabiliza por decisões tomadas com base em dados incorretos ou incompletos.
                  </p>

                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3">5.3. Integrações de API</h3>
                  <p className="mb-3">
                    Ao conectar APIs de corretoras, você é responsável por manter a segurança de suas 
                    credenciais. Recomendamos usar APIs com permissões apenas de leitura quando possível.
                  </p>
                </section>

                <section data-testid="section-assinaturas">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">6. Assinaturas e Pagamentos</h2>
                  
                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3">6.1. Planos Disponíveis</h3>
                  <p className="mb-3">
                    Oferecemos diferentes planos de assinatura (Starter, Pro, VIP) com recursos e limites específicos. 
                    Os detalhes de cada plano estão disponíveis em nossa página de preços.
                  </p>

                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3">6.2. Renovação e Cancelamento</h3>
                  <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2">
                    <li>Assinaturas renovam automaticamente no final de cada período</li>
                    <li>Você pode cancelar a qualquer momento através do seu perfil</li>
                    <li>Cancelamentos entram em vigor no fim do período pago</li>
                    <li>Não oferecemos reembolso proporcional para cancelamentos antecipados</li>
                  </ul>

                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3 mt-4">6.3. Alterações de Preço</h3>
                  <p className="mb-3">
                    Reservamos o direito de modificar os preços de nossos planos. Você será notificado 
                    com 30 dias de antecedência sobre qualquer alteração que afete sua assinatura.
                  </p>
                </section>

                <section data-testid="section-whatsapp">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">7. Funcionalidade WhatsApp Bot</h2>
                  <p className="mb-3">
                    Nossa integração com WhatsApp permite que você registre trades via mensagens. 
                    Ao usar este recurso, você concorda que:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2">
                    <li>Autoriza o processamento automático de mensagens enviadas ao nosso número</li>
                    <li>As mensagens serão analisadas apenas para extrair dados de trading</li>
                    <li>Não armazenamos o conteúdo completo das mensagens</li>
                    <li>O serviço está sujeito aos termos de uso do WhatsApp Business API</li>
                    <li>Você pode desabilitar esta funcionalidade a qualquer momento</li>
                  </ul>
                </section>

                <section data-testid="section-propriedade-intelectual">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">8. Propriedade Intelectual</h2>
                  <p className="mb-3">
                    Todo o conteúdo da plataforma, incluindo design, código, textos, gráficos, logos 
                    e funcionalidades, é propriedade da Métrika Trading e protegido por leis de propriedade 
                    intelectual.
                  </p>
                  <p>
                    Você não pode copiar, modificar, distribuir ou criar trabalhos derivados sem nossa 
                    autorização expressa por escrito.
                  </p>
                </section>

                <section data-testid="section-limitacao-responsabilidade">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">9. Limitação de Responsabilidade</h2>
                  
                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3">9.1. Uso por Sua Conta e Risco</h3>
                  <p className="mb-3">
                    <strong>A plataforma é fornecida "como está" e "conforme disponível".</strong> Não garantimos 
                    que o serviço será ininterrupto, livre de erros ou seguro.
                  </p>

                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3">9.2. Decisões de Trading</h3>
                  <p className="mb-3">
                    <strong>A Métrika Trading NÃO fornece conselhos financeiros ou de investimento.</strong> Todas 
                    as decisões de trading são de sua exclusiva responsabilidade. Não nos responsabilizamos 
                    por perdas financeiras resultantes do uso da plataforma.
                  </p>

                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3">9.3. Limitação de Danos</h3>
                  <p className="mb-3">
                    Em nenhuma circunstância seremos responsáveis por danos indiretos, incidentais, especiais 
                    ou consequenciais, incluindo perda de lucros, dados ou outras perdas intangíveis.
                  </p>
                </section>

                <section data-testid="section-garantias">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">10. Isenção de Garantias</h2>
                  <p className="mb-3">
                    Nós nos esforçamos para fornecer dados e análises precisas, mas não garantimos:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2">
                    <li>Que a plataforma atenderá a todos os seus requisitos</li>
                    <li>Que os resultados obtidos serão precisos ou confiáveis</li>
                    <li>Que defeitos serão corrigidos em tempo determinado</li>
                    <li>Que a plataforma estará sempre disponível</li>
                    <li>Compatibilidade com integrações de terceiros</li>
                  </ul>
                </section>

                <section data-testid="section-indenizacao">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">11. Indenização</h2>
                  <p>
                    Você concorda em indenizar e isentar a Métrika Trading, seus diretores, funcionários e 
                    parceiros de quaisquer reivindicações, danos, obrigações, perdas, responsabilidades, custos 
                    ou dívidas, e despesas decorrentes de:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-6 mt-3 space-y-1 sm:space-y-2">
                    <li>Seu uso da plataforma</li>
                    <li>Violação destes Termos de Serviço</li>
                    <li>Violação de direitos de terceiros</li>
                    <li>Qualquer conteúdo que você submeter à plataforma</li>
                  </ul>
                </section>

                <section data-testid="section-suspensao">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">12. Suspensão e Encerramento</h2>
                  <p className="mb-3">
                    Reservamos o direito de suspender ou encerrar sua conta imediatamente, sem aviso prévio, 
                    se você:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-6 space-y-1 sm:space-y-2">
                    <li>Violar estes Termos de Serviço</li>
                    <li>Usar a plataforma de forma fraudulenta ou ilegal</li>
                    <li>Não pagar por serviços contratados</li>
                    <li>Causar danos à plataforma ou outros usuários</li>
                  </ul>
                  <p className="mt-3">
                    Você pode encerrar sua conta a qualquer momento através das configurações de perfil.
                  </p>
                </section>

                <section data-testid="section-modificacoes">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">13. Modificações dos Termos</h2>
                  <p className="mb-3">
                    Podemos revisar estes termos periodicamente. A versão mais atual estará sempre disponível 
                    nesta página. Alterações significativas serão notificadas através da plataforma ou por e-mail.
                  </p>
                  <p>
                    Seu uso continuado da plataforma após as alterações constitui sua aceitação dos novos termos.
                  </p>
                </section>

                <section data-testid="section-lei-aplicavel">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">14. Lei Aplicável e Jurisdição</h2>
                  <p className="mb-3">
                    Estes Termos de Serviço são regidos pelas leis da República Federativa do Brasil. 
                    Qualquer disputa será resolvida no foro da comarca de [Cidade], com exclusão de qualquer outro.
                  </p>
                  <p>
                    Faremos o possível para resolver disputas amigavelmente antes de recorrer a processos judiciais.
                  </p>
                </section>

                <section data-testid="section-disposicoes">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">15. Disposições Gerais</h2>
                  
                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3">15.1. Acordo Integral</h3>
                  <p className="mb-3">
                    Estes termos, juntamente com nossa Política de Privacidade, constituem o acordo integral 
                    entre você e a Métrika Trading.
                  </p>

                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3">15.2. Divisibilidade</h3>
                  <p className="mb-3">
                    Se qualquer disposição destes termos for considerada inválida, as disposições restantes 
                    permanecerão em pleno vigor e efeito.
                  </p>

                  <h3 className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3">15.3. Renúncia</h3>
                  <p className="mb-3">
                    Nossa falha em exercer ou fazer valer qualquer direito ou disposição destes termos não 
                    constitui uma renúncia a tal direito ou disposição.
                  </p>
                </section>

                <section data-testid="section-contato">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-primary mb-3 sm:mb-4">16. Contato</h2>
                  <p className="mb-3">
                    Se você tiver dúvidas sobre estes Termos de Serviço, entre em contato conosco:
                  </p>
                  <div className="bg-muted p-4 sm:p-6 rounded-lg sm:rounded-xl w-full">
                    <div className="space-y-2 sm:space-y-3">
                      <p className="text-base sm:text-lg font-semibold">Métrika Trading</p>
                      <div className="space-y-1 sm:space-y-2 text-sm sm:text-base">
                        <p>E-mail: <span className="text-primary font-medium">termos@metrika.com.br</span></p>
                        <p>E-mail de suporte: <span className="text-primary font-medium">suporte@metrika.com.br</span></p>
                        <p>Através da seção "Suporte" da plataforma</p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="border-t pt-4 sm:pt-6 mt-6 sm:mt-8">
                  <p className="text-xs sm:text-sm text-muted-foreground text-center">
                    Estes Termos de Serviço são válidos a partir de {new Date().toLocaleDateString('pt-BR')} 
                    e substituem qualquer versão anterior.
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
                    Ao usar a Métrika Trading, você reconhece ter lido, compreendido e concordado com estes termos.
                  </p>
                </div>
                
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
