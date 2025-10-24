# Configuração do Banco de Dados

## Problema Identificado

O banco de dados PostgreSQL está **provisionado e funcionando** no Replit, mas a variável de ambiente `DATABASE_URL` não está sendo carregada automaticamente no processo Node.js.

### Status Atual

✅ Banco de dados provisionado  
✅ Secrets configurados no Replit  
❌ DATABASE_URL não disponível como variável de ambiente  
✅ Aplicação iniciando (com lazy loading do banco)  

## Solução: Configurar DATABASE_URL Manualmente

Siga estes passos para corrigir o problema:

### Passo 1: Acessar os Secrets do Replit

1. No painel esquerdo do Replit, clique no ícone de **cadeado** (🔒) ou vá em **Tools > Secrets**
2. Procure por `DATABASE_URL` na lista de secrets
3. Clique para revelar o valor e **copie-o completamente**

### Passo 2: Criar o arquivo .env

1. No Replit, crie um novo arquivo chamado `.env` na raiz do projeto (se ainda não existir)
2. Cole o seguinte conteúdo, substituindo o valor pelo que você copiou:

```env
DATABASE_URL=postgresql://usuario:senha@host:porta/database
```

**Exemplo de DATABASE_URL real:**
```env
DATABASE_URL=postgresql://neondb_owner:abc123xyz456@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Passo 3: Reiniciar a Aplicação

Após criar o arquivo `.env`:
1. Pare o servidor atual (se estiver rodando)
2. Execute novamente: `npm run dev`
3. O arquivo `.env` será carregado automaticamente pelo `dotenv`

## Verificar se Funcionou

Após configurar, teste criando um usuário:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste",
    "email": "teste@example.com",
    "password": "senha123",
    "confirmPassword": "senha123"
  }'
```

Se retornar sucesso, o banco está funcionando!

## Migrations do Banco de Dados

Para criar/atualizar as tabelas no banco de dados, execute:

```bash
npm run db:push
```

Ou se houver avisos sobre perda de dados:

```bash
npm run db:push --force
```

## Arquivos Importantes

- `.env` - Contém suas variáveis de ambiente (não commitado no git)
- `.env.example` - Modelo de exemplo (pode ser commitado)
- `shared/schema.ts` - Schema do banco de dados (tabelas)
- `server/db.ts` - Configuração da conexão com o banco

## Tabelas Implementadas

Segundo o schema em `shared/schema.ts`, as seguintes tabelas estão implementadas:

1. **users** - Usuários do sistema
2. **trades** - Operações de trading
3. **broker_api_configs** - Configurações de API das corretoras
4. **csv_imports** - Histórico de importações CSV
5. **subscription_plans** - Planos de assinatura
6. **subscriptions** - Assinaturas dos usuários
7. **platform_stats** - Estatísticas da plataforma
8. **diary_entries** - Entradas do diário de trading
9. **diary_images** - Imagens do diário
10. **password_reset_tokens** - Tokens de recuperação de senha
11. **support_conversations** - Conversas de suporte
12. **support_messages** - Mensagens de suporte
13. **whatsapp_messages** - Mensagens do WhatsApp

## Precisa de Ajuda?

Se ainda tiver problemas:
1. Verifique se o arquivo `.env` foi criado corretamente
2. Confirme que o DATABASE_URL não tem espaços ou quebras de linha
3. Tente reiniciar completamente o Repl (Stop > Run)
