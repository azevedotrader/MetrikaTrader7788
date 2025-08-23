/**
 * Endpoint dedicado para validação de CSV
 * =====================================
 * 
 * Permite validar estrutura de CSV antes do upload completo
 */

import { Express } from "express";
import multer from "multer";
import fs from "fs";
import { validateAndParseCSV } from "./csvValidator";

const upload = multer({ dest: 'uploads/temp/' });

export function setupCSVValidationEndpoint(app: Express) {
  // Endpoint para validação prévia de CSV
  app.post("/api/csv/validate", upload.single('csvFile'), async (req, res) => {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ 
          valid: false, 
          message: "Nenhum arquivo enviado" 
        });
      }
      
      console.log(`🔍 Validando CSV: ${file.originalname}`);
      
      // Executar validação
      const result = await validateAndParseCSV(file.path);
      
      // Limpar arquivo temporário
      fs.unlinkSync(file.path);
      
      if (result.valid) {
        return res.json({
          valid: true,
          message: "CSV válido e pronto para importação",
          preview: {
            headers: result.headers,
            totalTrades: result.rows?.length || 0,
            sampleTrade: result.rows?.[0] || null
          }
        });
      } else {
        return res.status(400).json({
          valid: false,
          message: "CSV inválido",
          reason: result.reason,
          details: {
            expectedColumns: [
              "Abertura/Open Time/Entry Time",
              "Fechamento/Close Time/Exit Time",
              "Ativo/Symbol",
              "Quantidade/Volume",
              "Resultado/Profit"
            ],
            supportedFormats: [
              "DD/MM/YYYY HH:mm:ss",
              "DD/MM/YYYY",
              "YYYY-MM-DD HH:mm:ss", 
              "MM/DD/YYYY HH:mm:ss"
            ]
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Erro na validação:', error);
      
      // Limpar arquivo se existir
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          // Ignorar erro de limpeza
        }
      }
      
      return res.status(500).json({
        valid: false,
        message: "Erro interno na validação",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}