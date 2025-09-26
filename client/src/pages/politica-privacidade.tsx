import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";

interface PrivacyPageProps {
  onMenuClick?: () => void;
}

export default function PoliticaPrivacidade({ onMenuClick }: PrivacyPageProps) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <TopBar 
        title="Política de Privacidade" 
        onMenuClick={onMenuClick}
      />
      
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">
              Política de Privacidade - Métrika Trading
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </CardHeader>
          
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-6 text-sm leading-relaxed">
                
                <section data-testid="section-introducao">
                  <h2 className="text-lg font-semibold text-primary mb-3">1. Introdução</h2>
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
                  <h2 className="text-lg font-semibold text-primary mb-3">2. Informações que Coletamos</h2>
                  
                  <h3 className="font-medium text-foreground mb-2">2.1. Informações Pessoais</h3>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Nome completo e endereço de e-mail</li>
                    <li>Número de telefone (quando fornecido)</li>
                    <li>Informações de perfil e preferências</li>
                    <li>Número do WhatsApp (para funcionalidade de bot)</li>
                  </ul>

                  <h3 className="font-medium text-foreground mb-2">2.2. Dados de Trading</h3>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Registros de trades e operações</li>
                    <li>Configurações de corretoras e APIs</li>
                    <li>Arquivos CSV importados</li>
                    <li>Dados de performance e estatísticas</li>
                    <li>Entradas do diário de trading</li>
                  </ul>

                  <h3 className="font-medium text-foreground mb-2">2.3. Dados Técnicos</h3>
                  <ul className="list-disc pl-6 mb-4 space-y-1">
                    <li>Endereço IP e informações do dispositivo</li>
                    <li>Dados de uso e navegação</li>
                    <li>Logs de sistema e erro</li>
                    <li>Cookies e tecnologias similares</li>
                  </ul>
                </section>

                <section data-testid="section-uso-informacoes">
                  <h2 className="text-lg font-semibold text-primary mb-3">3. Como Usamos suas Informações</h2>
                  <ul className="list-disc pl-6 space-y-2">
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
                  <h2 className="text-lg font-semibold text-primary mb-3">4. Funcionalidade WhatsApp Bot</h2>
                  <p className="mb-3">
                    Nossa plataforma oferece integração com WhatsApp para facilitar o registro de trades:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Mensagens enviadas via WhatsApp são processadas automaticamente</li>
                    <li>Extraímos dados de trading das mensagens para salvar em sua conta</li>
                    <li>Não armazenamos mensagens completas, apenas dados relevantes de trading</li>
                    <li>Você pode desabilitar esta funcionalidade a qualquer momento</li>
                    <li>Respeitamos os termos de uso do WhatsApp Business API</li>
                  </ul>
                </section>

                <section data-testid="section-compartilhamento">
                  <h2 className="text-lg font-semibold text-primary mb-3">5. Compartilhamento de Informações</h2>
                  <p className="mb-3">
                    <strong>Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros</strong>, 
                    exceto nas seguintes circunstâncias:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Com seu consentimento explícito</li>
                    <li>Para cumprir obrigações legais</li>
                    <li>Para proteger nossos direitos e segurança</li>
                    <li>Com provedores de serviços que auxiliam nossa operação (sob rígidos termos de confidencialidade)</li>
                  </ul>
                </section>

                <section data-testid="section-seguranca">
                  <h2 className="text-lg font-semibold text-primary mb-3">6. Segurança dos Dados</h2>
                  <p className="mb-3">
                    Implementamos medidas de segurança adequadas para proteger suas informações:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Criptografia de dados em trânsito e em repouso</li>
                    <li>Autenticação segura e controle de acesso</li>
                    <li>Monitoramento contínuo de segurança</li>
                    <li>Backup regular e recuperação de dados</li>
                    <li>Treinamento regular da equipe em segurança</li>
                  </ul>
                </section>

                <section data-testid="section-direitos">
                  <h2 className="text-lg font-semibold text-primary mb-3">7. Seus Direitos</h2>
                  <p className="mb-3">
                    De acordo com a LGPD (Lei Geral de Proteção de Dados), você tem os seguintes direitos:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
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
                  <h2 className="text-lg font-semibold text-primary mb-3">8. Cookies e Tecnologias Similares</h2>
                  <p className="mb-3">
                    Utilizamos cookies e tecnologias similares para:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
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
                  <h2 className="text-lg font-semibold text-primary mb-3">9. Retenção de Dados</h2>
                  <p>
                    Mantemos seus dados pessoais apenas pelo tempo necessário para cumprir as finalidades 
                    descritas nesta política, salvo quando a retenção por período superior for exigida 
                    ou permitida por lei. Dados de trading podem ser mantidos por períodos mais longos 
                    para fins de análise histórica e conformidade regulatória.
                  </p>
                </section>

                <section data-testid="section-internacional">
                  <h2 className="text-lg font-semibold text-primary mb-3">10. Transferências Internacionais</h2>
                  <p>
                    Alguns de nossos provedores de serviços podem estar localizados fora do Brasil. 
                    Garantimos que todas as transferências internacionais de dados cumpram com os 
                    requisitos da LGPD e implementem salvaguardas adequadas.
                  </p>
                </section>

                <section data-testid="section-alteracoes">
                  <h2 className="text-lg font-semibold text-primary mb-3">11. Alterações nesta Política</h2>
                  <p>
                    Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre 
                    mudanças significativas através da plataforma ou por e-mail. Recomendamos que 
                    revise esta política regularmente para se manter informado sobre como protegemos 
                    suas informações.
                  </p>
                </section>

                <section data-testid="section-contato">
                  <h2 className="text-lg font-semibold text-primary mb-3">12. Contato</h2>
                  <p className="mb-3">
                    Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos 
                    seus dados pessoais, entre em contato conosco:
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <p><strong>Métrika Trading</strong></p>
                    <p>E-mail: <span className="text-primary">privacidade@metrika.com.br</span></p>
                    <p>E-mail de suporte: <span className="text-primary">suporte@metrika.com.br</span></p>
                    <p>Através da seção "Suporte" da plataforma</p>
                  </div>
                </section>

                <div className="border-t pt-6 mt-8">
                  <p className="text-xs text-muted-foreground text-center">
                    Esta Política de Privacidade é válida a partir de {new Date().toLocaleDateString('pt-BR')} 
                    e substitui qualquer versão anterior.
                  </p>
                </div>
                
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}