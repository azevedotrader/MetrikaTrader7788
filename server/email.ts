import nodemailer from "nodemailer";

// Configuração do transporter será feita quando as credenciais forem fornecidas
let transporter: nodemailer.Transporter | null = null;

export function configureEmailService(email: string, password: string) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: email,
      pass: password, // Senha de aplicativo, não a senha normal
    },
  });
  
  console.log("📧 Serviço de email configurado com sucesso");
}

export async function sendPasswordResetEmail(toEmail: string, resetLink: string): Promise<void> {
  if (!transporter) {
    // Por enquanto, vamos apenas logar o link
    console.log("⚠️ Email não configurado. Link de recuperação:");
    console.log(resetLink);
    return;
  }

  const mailOptions = {
    from: process.env.GMAIL_USER || "noreply@metrika.com",
    to: toEmail,
    subject: "Recuperação de Senha - Métrika",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 50px auto;
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #8B5CF6;
            margin: 0;
          }
          .content {
            color: #333;
            line-height: 1.6;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            margin: 20px 0;
            background-color: #8B5CF6;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
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
            <p>Olá,</p>
            <p>Recebemos uma solicitação para redefinir sua senha. Se você não fez essa solicitação, pode ignorar este email.</p>
            <p>Para redefinir sua senha, clique no botão abaixo:</p>
            <center>
              <a href="${resetLink}" class="button">Redefinir Senha</a>
            </center>
            <p><strong>Importante:</strong> Este link expira em 1 hora por questões de segurança.</p>
            <p>Se o botão não funcionar, você pode copiar e colar o seguinte link no seu navegador:</p>
            <p style="word-break: break-all; color: #8B5CF6;">${resetLink}</p>
          </div>
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>© 2025 Métrika - Todos os direitos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Email de recuperação enviado para ${toEmail}`);
}