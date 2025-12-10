import sgMail from '@sendgrid/mail';

// Configure SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'suporte@appmetrika.com.br';

// Get the correct URL for different environments
const getAppUrl = () => {
  // In production, use the published domain
  if (process.env.REPLIT_DEPLOYMENT) {
    return 'https://metrikai.replit.app';
  }
  // In development, use the Replit dev URL
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  // Fallback
  return 'https://metrikai.replit.app';
};

let APP_URL = getAppUrl();

// Initialize SendGrid if API key is provided
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export async function sendWelcomeEmail(email: string, userName: string): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.log('⚠️ SendGrid não configurado. Email de boas-vindas não enviado.');
    return;
  }

  const msg = {
    to: email,
    from: {
      email: FROM_EMAIL,
      name: 'Métrika - Suporte'
    },
    replyTo: FROM_EMAIL,
    subject: 'Bem-vindo ao Métrika',
    text: `Olá ${userName},

Sua conta no Métrika foi criada com sucesso!

Você já pode acessar a plataforma através do link:
${APP_URL}

O Métrika oferece recursos completos para análise de suas operações de trading, incluindo importação de dados via CSV, gráficos de performance e diário de trading.

Para começar:
1. Faça login com seu email e senha
2. Configure suas corretoras preferidas
3. Importe seu histórico de operações

Se tiver dúvidas, nossa equipe de suporte está disponível através do email ${FROM_EMAIL}.

Atenciosamente,
Equipe Métrika

--
Este é um email automático. Caso não tenha criado uma conta no Métrika, por favor ignore esta mensagem.`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: #667eea;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 32px;
      font-weight: 600;
    }
    .header p {
      color: rgba(255, 255, 255, 0.9);
      margin: 10px 0 0 0;
      font-size: 18px;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #333;
      margin-top: 0;
      margin-bottom: 25px;
      font-size: 24px;
    }
    .content p {
      color: #666;
      margin-bottom: 20px;
    }
    .features {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 25px;
      margin: 30px 0;
    }
    .feature-item {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
    .feature-icon {
      color: #333;
      font-size: 20px;
      margin-right: 12px;
    }
    .feature-text {
      color: #555;
      font-size: 15px;
    }
    .steps {
      background-color: #fff4e6;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      margin: 30px 0;
      border-radius: 4px;
    }
    .steps h3 {
      color: #92400e;
      margin-top: 0;
      margin-bottom: 15px;
      font-size: 18px;
    }
    .steps ol {
      margin: 0;
      padding-left: 20px;
      color: #92400e;
    }
    .steps li {
      margin-bottom: 10px;
      font-size: 14px;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .button {
      display: inline-block;
      padding: 16px 40px;
      background: #667eea;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .help-section {
      background-color: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
      text-align: center;
    }
    .help-section p {
      margin: 0;
      color: #166534;
      font-size: 14px;
    }
    .footer {
      padding: 30px;
      background-color: #f8f9fa;
      text-align: center;
      color: #999;
      font-size: 14px;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      color: #667eea;
      text-decoration: none;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bem-vindo ao Métrika</h1>
      <p>Plataforma de Análise de Trading</p>
    </div>
    <div class="content">
      <h2>Olá, ${userName}</h2>
      <p>
        É com grande prazer que damos as boas-vindas a você no <strong>Métrika</strong>, 
        a plataforma mais completa para análise e gestão de suas operações de trading!
      </p>
      
      <div class="features">
        <h3 style="margin-top: 0; color: #333;">O que você pode fazer:</h3>
        <div class="feature-item">
          <span class="feature-icon">•</span>
          <span class="feature-text">Importar trades automaticamente via CSV de qualquer corretora</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">•</span>
          <span class="feature-text">Visualizar sua performance com gráficos profissionais</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">•</span>
          <span class="feature-text">Identificar seus melhores e piores setups</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">•</span>
          <span class="feature-text">Manter um diário de trading completo</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">•</span>
          <span class="feature-text">Receber insights de IA sobre suas operações</span>
        </div>
      </div>
      
      <div class="steps">
        <h3>Primeiros Passos Recomendados:</h3>
        <ol>
          <li>Faça seu primeiro login na plataforma</li>
          <li>Configure suas corretoras (Tickmill, Clear, Gate.io)</li>
          <li>Importe seu histórico de trades via CSV</li>
          <li>Explore o Dashboard para ver suas estatísticas</li>
          <li>Comece a registrar suas análises no diário</li>
        </ol>
      </div>
      
      <div class="button-container">
        <a href="${APP_URL}" class="button">Acessar Minha Conta</a>
      </div>
      
      <div class="help-section">
        <p>
          <strong>Dica:</strong> Use nosso assistente de IA (canto inferior direito) 
          para tirar dúvidas e receber sugestões personalizadas!
        </p>
      </div>
      
      <p style="text-align: center; font-style: italic; color: #888; margin-top: 30px;">
        "O sucesso no trading não é sobre acertar sempre, mas sobre gerenciar bem quando você erra."
      </p>
    </div>
    <div class="footer">
      <p><strong>Métrika</strong> - Transformando dados em decisões inteligentes</p>
      <div class="social-links">
        <a href="#">Suporte</a>
        <a href="#">Tutoriais</a>
        <a href="#">Comunidade</a>
      </div>
      <p style="font-size: 12px; margin-top: 20px;">
        © 2025 Métrika. Todos os direitos reservados.<br>
        Este é um email automático, por favor não responda.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Email de boas-vindas enviado com sucesso para:', email);
  } catch (error: any) {
    console.error('❌ Erro ao enviar email de boas-vindas:', error);
    if (error.response) {
      console.error('Detalhes do erro:', error.response.body);
    }
    // Não lançar erro para não impedir o registro do usuário
  }
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.log('⚠️ SendGrid não configurado. Configure SENDGRID_API_KEY nas variáveis de ambiente.');
    console.log(`📧 Link de recuperação de senha: ${APP_URL}/reset-password?token=${token}`);
    return;
  }

  // Use the configured app URL with proper SSL
  const resetLink = `${APP_URL}/reset-password?token=${token}`;
  console.log(`🔗 Link de reset gerado: ${resetLink}`);
  console.log(`📧 Email remetente configurado: ${FROM_EMAIL}`);
  
  const msg = {
    to: email,
    from: {
      email: FROM_EMAIL,
      name: 'Métrika - Suporte'
    },
    replyTo: FROM_EMAIL,
    subject: 'Redefinir senha da sua conta Métrika',
    text: `Olá,

Recebemos uma solicitação para redefinir a senha da sua conta no Métrika.

Para criar uma nova senha, acesse o link abaixo:
${resetLink}

Este link é válido por 1 hora. Após esse período, será necessário solicitar um novo link.

Se você não fez esta solicitação, pode ignorar este email com segurança. Sua senha atual permanecerá inalterada.

Atenciosamente,
Equipe Métrika

--
Este é um email automático enviado pelo sistema Métrika. Por favor, não responda a este email.
Se precisar de ajuda, entre em contato através de ${FROM_EMAIL}.`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: #667eea;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #333;
      margin-top: 0;
      margin-bottom: 20px;
      font-size: 22px;
    }
    .content p {
      color: #666;
      margin-bottom: 20px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 30px;
      background: #667eea;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
    }
    .button:hover {
      opacity: 0.9;
    }
    .link-text {
      color: #999;
      font-size: 12px;
      word-break: break-all;
      margin-top: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 6px;
    }
    .footer {
      padding: 20px 30px;
      background-color: #f8f9fa;
      text-align: center;
      color: #999;
      font-size: 14px;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning p {
      margin: 0;
      color: #856404;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Métrika</h1>
    </div>
    <div class="content">
      <h2>Recuperação de Senha</h2>
      <p>Olá!</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta no Métrika.</p>
      
      <div class="button-container">
        <a href="${resetLink}" class="button">Redefinir Senha</a>
      </div>
      
      <div class="warning">
        <p><strong>Este link expira em 1 hora.</strong></p>
      </div>
      
      <p style="font-size: 14px; color: #999;">
        Se o botão não funcionar, você pode copiar e colar o link abaixo no seu navegador:
      </p>
      <div class="link-text">
        ${resetLink}
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #999;">
        Se você não solicitou esta recuperação de senha, pode ignorar este email com segurança.
      </p>
    </div>
    <div class="footer">
      <p>© 2025 Métrika - Plataforma de Análise de Trading</p>
      <p style="font-size: 12px;">Este é um email automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Email de recuperação enviado com sucesso para:', email);
  } catch (error: any) {
    console.error('❌ Erro ao enviar email:', error);
    if (error.response) {
      console.error('Detalhes do erro:', error.response.body);
    }
    throw new Error('Falha ao enviar email de recuperação');
  }
}