/**
 * Detector de encoding robusto para CSVs brasileiros
 */

import fs from 'fs';
import { createReadStream } from 'fs';
import { Transform } from 'stream';

export function detectFileEncoding(filePath: string): string {
  console.log(`🔍 Detectando encoding de: ${filePath}`);
  
  try {
    // Ler primeiros 1024 bytes para análise
    const buffer = fs.readFileSync(filePath, { encoding: null }).slice(0, 1024);
    
    // Verificar BOM UTF-8
    if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      console.log(`📝 UTF-8 BOM detectado`);
      return 'utf8';
    }
    
    // Verificar se é arquivo Excel/Office (binário)
    const header = buffer.toString('ascii', 0, 10);
    if (header.includes('PK') || header.includes('<?xml')) {
      console.log(`❌ Arquivo Excel/Office detectado - não é CSV puro`);
      throw new Error('Arquivo não é CSV válido - parece ser Excel ou Office');
    }
    
    // Tentar decodificar como UTF-8
    try {
      const utf8Text = buffer.toString('utf8');
      
      // Verificar caracteres de controle inválidos
      const hasInvalidChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/.test(utf8Text);
      
      if (!hasInvalidChars) {
        console.log(`✅ UTF-8 válido detectado`);
        return 'utf8';
      }
    } catch (e) {
      console.log(`⚠️ UTF-8 falhou: ${e}`);
    }
    
    // Tentar Latin1 (ISO-8859-1) - comum no Brasil
    try {
      const latin1Text = buffer.toString('latin1');
      
      // Procurar por caracteres típicos brasileiros em Latin1
      const hasBrazilianChars = /[ÃÇçáéíóúàèìòùâêîôûãõñÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÑ]/.test(latin1Text);
      
      if (hasBrazilianChars) {
        console.log(`🇧🇷 Latin1 com caracteres brasileiros detectado`);
        return 'latin1';
      }
      
      // Verificar se tem estrutura de CSV válida
      const lines = latin1Text.split('\n').slice(0, 3);
      const hasCSVStructure = lines.some(line => 
        (line.includes(';') || line.includes(',')) && 
        line.split(/[;,]/).length > 2
      );
      
      if (hasCSVStructure) {
        console.log(`📊 Estrutura CSV válida em Latin1`);
        return 'latin1';
      }
    } catch (e) {
      console.log(`⚠️ Latin1 falhou: ${e}`);
    }
    
    // Tentar Windows-1252 (CP1252)
    try {
      const win1252Text = buffer.toString('binary');
      console.log(`🪟 Tentando Windows-1252`);
      return 'binary'; // Node.js trata binary como cp1252
    } catch (e) {
      console.log(`⚠️ Windows-1252 falhou: ${e}`);
    }
    
    // Fallback: UTF-8
    console.log(`🔄 Fallback para UTF-8`);
    return 'utf8';
    
  } catch (error) {
    console.error(`❌ Erro na detecção de encoding:`, error);
    return 'utf8';
  }
}

/**
 * Lê arquivo CSV com encoding correto
 */
export function readCSVWithCorrectEncoding(filePath: string): string {
  const encoding = detectFileEncoding(filePath);
  
  try {
    return fs.readFileSync(filePath, { encoding: encoding as BufferEncoding });
  } catch (error) {
    console.warn(`⚠️ Erro lendo com encoding ${encoding}, tentando Latin1`);
    return fs.readFileSync(filePath, { encoding: 'latin1' });
  }
}