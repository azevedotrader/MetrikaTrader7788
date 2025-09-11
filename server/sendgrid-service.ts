// Integração com SendGrid para envio de emails
import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const emailData: any = {
      to: params.to,
      from: params.from,
      subject: params.subject,
    };
    
    if (params.text) {
      emailData.text = params.text;
    }
    
    if (params.html) {
      emailData.html = params.html;
    }
    
    await mailService.send(emailData);
    console.log(`📧 Email enviado com sucesso para: ${params.to}`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar email via SendGrid:', error);
    return false;
  }
}

// Funções específicas para o sistema de trading
export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
  return await sendEmail({
    to: userEmail,
    from: 'noreply@tradingsystem.com', // Substituir pelo seu email verificado no SendGrid
    subject: 'Bem-vindo ao Sistema de Trading!',
    html: `
      <h1>Bem-vindo, ${userName}!</h1>
      <p>Sua conta foi criada com sucesso no nosso sistema de trading.</p>
      <p>Agora você pode:</p>
      <ul>
        <li>Registrar seus trades</li>
        <li>Analisar seu desempenho</li>
        <li>Manter um diário de trading</li>
      </ul>
      <p>Bons trades!</p>
    `,
  });
}

export async function sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<boolean> {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
  
  return await sendEmail({
    to: userEmail,
    from: 'noreply@tradingsystem.com', // Substituir pelo seu email verificado no SendGrid
    subject: 'Redefinição de Senha - Sistema de Trading',
    html: `
      <h1>Redefinição de Senha</h1>
      <p>Você solicitou a redefinição de sua senha.</p>
      <p>Clique no link abaixo para criar uma nova senha:</p>
      <a href="${resetLink}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
        Redefinir Senha
      </a>
      <p>Este link expira em 1 hora.</p>
      <p>Se você não solicitou esta redefinição, ignore este email.</p>
    `,
  });
}

export async function sendPlanUpgradeEmail(userEmail: string, userName: string, planType: string): Promise<boolean> {
  return await sendEmail({
    to: userEmail,
    from: 'noreply@tradingsystem.com', // Substituir pelo seu email verificado no SendGrid
    subject: `Plano ${planType} Ativado com Sucesso!`,
    html: `
      <h1>Parabéns, ${userName}!</h1>
      <p>Seu plano foi atualizado para <strong>${planType}</strong> com sucesso.</p>
      <p>Agora você tem acesso aos recursos premium do sistema.</p>
      <p>Aproveite ao máximo sua experiência de trading!</p>
    `,
  });
}