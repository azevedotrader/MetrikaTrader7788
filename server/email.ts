import sgMail from '@sendgrid/mail';

// Configure SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@metrika.com';
const APP_URL = process.env.APP_URL || 'http://localhost:5000';

// Initialize SendGrid if API key is provided
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  if (!SENDGRID_API_KEY) {
    console.log('⚠️ SendGrid não configurado. Configure SENDGRID_API_KEY nas variáveis de ambiente.');
    console.log(`📧 Link de recuperação de senha: ${APP_URL}/reset-password?token=${token}`);
    return;
  }

  const resetLink = `${APP_URL}/reset-password?token=${token}`;
  
  const msg = {
    to: email,
    from: FROM_EMAIL,
    subject: 'Recuperação de Senha - Métrika',
    text: `
Olá!

Você solicitou a recuperação de senha da sua conta no Métrika.

Clique no link abaixo para redefinir sua senha:
${resetLink}

Este link expira em 1 hora.

Se você não solicitou esta recuperação, ignore este email.

Atenciosamente,
Equipe Métrika
    `.trim(),
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      <h1>📊 Métrika</h1>
    </div>
    <div class="content">
      <h2>Recuperação de Senha</h2>
      <p>Olá!</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta no Métrika.</p>
      
      <div class="button-container">
        <a href="${resetLink}" class="button">Redefinir Senha</a>
      </div>
      
      <div class="warning">
        <p>⏰ <strong>Este link expira em 1 hora.</strong></p>
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