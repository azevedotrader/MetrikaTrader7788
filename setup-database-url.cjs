#!/usr/bin/env node

/**
 * Script para configurar DATABASE_URL
 * Este script tenta obter o DATABASE_URL de várias formas e criar um arquivo .env
 */

const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function getDatabaseUrl() {
  console.log('🔍 Verificando DATABASE_URL...\n');

  // Método 1: Verificar variável de ambiente
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
    console.log('✅ DATABASE_URL encontrado nas variáveis de ambiente');
    return process.env.DATABASE_URL;
  }

  // Método 2: Tentar construir a partir de componentes PG*
  const pgHost = process.env.PGHOST;
  const pgPort = process.env.PGPORT || '5432';
  const pgDatabase = process.env.PGDATABASE;
  const pgUser = process.env.PGUSER;
  const pgPassword = process.env.PGPASSWORD;

  if (pgHost && pgDatabase && pgUser && pgPassword) {
    const constructedUrl = `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}`;
    console.log('✅ DATABASE_URL construído a partir de variáveis PG*');
    return constructedUrl;
  }

  // Método 3: Verificar se existe em /tmp/replitdb (para apps publicados)
  if (fs.existsSync('/tmp/replitdb')) {
    try {
      const content = fs.readFileSync('/tmp/replitdb', 'utf8');
      console.log('✅ DATABASE_URL encontrado em /tmp/replitdb');
      return content.trim();
    } catch (error) {
      console.error('❌ Erro ao ler /tmp/replitdb:', error.message);
    }
  }

  return null;
}

async function main() {
  console.log('🚀 Configurando DATABASE_URL...\n');

  const databaseUrl = await getDatabaseUrl();

  if (!databaseUrl) {
    console.error('\n❌ DATABASE_URL não encontrado!');
    console.error('\n📋 Instruções para configurar manualmente:');
    console.error('1. Abra o painel "Secrets" no Replit (ícone de cadeado)');
    console.error('2. Localize o secret DATABASE_URL');
    console.error('3. Copie o valor');
    console.error('4. Cole no arquivo .env assim:');
    console.error('   DATABASE_URL=seu_valor_aqui');
    console.error('\nOu execute este comando no Shell do Replit:');
    console.error('   echo "DATABASE_URL=seu_valor_aqui" > .env\n');
    process.exit(1);
  }

  // Criar ou atualizar .env
  let envContent = '';
  if (fs.existsSync('.env')) {
    envContent = fs.readFileSync('.env', 'utf8');
  }

  // Verificar se DATABASE_URL já existe no .env
  if (envContent.includes('DATABASE_URL=')) {
    console.log('⚠️  DATABASE_URL já existe no arquivo .env');
    console.log('   Não será atualizado para evitar sobrescrever configuração existente.');
  } else {
    // Adicionar DATABASE_URL ao .env
    if (envContent && !envContent.endsWith('\n')) {
      envContent += '\n';
    }
    envContent += `DATABASE_URL=${databaseUrl}\n`;
    fs.writeFileSync('.env', envContent);
    console.log('✅ DATABASE_URL adicionado ao arquivo .env');
  }

  console.log('\n✨ Configuração concluída!');
  console.log('   Execute "npm run dev" para iniciar a aplicação.');
}

main().catch(error => {
  console.error('\n❌ Erro:', error.message);
  process.exit(1);
});
