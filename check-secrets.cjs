#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function checkSecrets() {
  console.log('🔍 Verificando secrets do Replit...\n');

  const secretKeys = ['DATABASE_URL', 'PGHOST', 'PGUSER', 'PGPASSWORD', 'PGDATABASE', 'PGPORT'];
  
  console.log('Método 1: process.env');
  secretKeys.forEach(key => {
    const value = process.env[key];
    if (value && value.trim() !== '') {
      console.log(`  ✅ ${key}: CONFIGURADO (${value.substring(0, 20)}...)`);
    } else {
      console.log(`  ❌ ${key}: VAZIO ou NÃO DEFINIDO`);
    }
  });

  console.log('\nMétodo 2: Verificar via printenv');
  try {
    const { stdout } = await execPromise('printenv | grep -E "^(DATABASE_URL|PGHOST|PGUSER|PGPASSWORD|PGDATABASE|PGPORT)="');
    console.log('  Encontrado via printenv:');
    console.log(stdout.split('\n').map(line => '  ' + line).join('\n'));
  } catch (error) {
    console.log('  ❌ Nenhum secret encontrado via printenv');
  }

  console.log('\nMétodo 3: Verificar arquivo .env');
  const fs = require('fs');
  if (fs.existsSync('.env')) {
    console.log('  ⚠️  Arquivo .env existe (não recomendado para secrets)');
  } else {
    console.log('  ✓ Arquivo .env não existe (correto)');
  }

  console.log('\n📋 Diagnóstico:');
  const hasDbUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '';
  
  if (hasDbUrl) {
    console.log('  ✅ DATABASE_URL está configurado e acessível!');
    console.log('  ✅ A aplicação pode conectar ao banco de dados.');
  } else {
    console.log('  ❌ DATABASE_URL NÃO está acessível via process.env');
    console.log('\n  Possíveis causas:');
    console.log('  1. Os secrets foram adicionados mas o ambiente não foi reiniciado');
    console.log('  2. Há um delay na propagação dos secrets');
    console.log('  3. Os secrets não foram salvos corretamente');
    console.log('\n  Soluções:');
    console.log('  1. Reinicie completamente o Repl (Stop + Run)');
    console.log('  2. Verifique se os secrets aparecem no painel de Secrets (🔒)');
    console.log('  3. Tente re-adicionar os secrets');
  }
}

checkSecrets().catch(console.error);
