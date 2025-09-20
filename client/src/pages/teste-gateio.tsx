import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';

interface TestResult {
  connected: boolean;
  message: string;
  accountInfo?: any;
  balanceCount?: number;
  error?: string;
}

export default function TesteGateIO() {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleTest = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) {
      setTestResult({
        connected: false,
        message: 'Por favor, preencha API Key e API Secret',
        error: 'Campos obrigatórios'
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/test/gate-io', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': localStorage.getItem('user-id') || 'test-user'
        },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          apiSecret: apiSecret.trim()
        })
      });

      const result = await response.json();
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        connected: false,
        message: 'Erro de conexão com o servidor',
        error: error.message || 'Erro desconhecido'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setApiKey('');
    setApiSecret('');
    setTestResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              🪙 Credenciais Gate.io
            </CardTitle>
            <CardDescription>
              Insira suas credenciais da API Gate.io para testar a conexão.
              <a 
                href="https://www.gate.io/myaccount/apiv4keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 ml-2 inline-flex items-center gap-1"
              >
                Obter API Keys <ExternalLink className="w-3 h-3" />
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-slate-300">API Key</Label>
              <Input
                id="apiKey"
                type="text"
                placeholder="Digite sua API Key da Gate.io"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiSecret" className="text-slate-300">API Secret</Label>
              <Input
                id="apiSecret"
                type="password"
                placeholder="Digite seu API Secret da Gate.io"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleTest} 
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700 flex-1"
              >
                {isLoading ? '🔄 Testando...' : '🧪 Testar Conexão'}
              </Button>
              <Button 
                onClick={handleClear}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                🗑️ Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {testResult && (
          <Alert className={`border-2 ${
            testResult.connected 
              ? 'border-green-600 bg-green-600/10' 
              : 'border-red-500 bg-red-600/10'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.connected ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <AlertDescription className={`text-lg font-medium ${
                testResult.connected ? 'text-green-600' : 'text-red-600'
              }`}>
                {testResult.connected ? '✅ Conexão Bem-sucedida!' : '❌ Falha na Conexão'}
              </AlertDescription>
            </div>
            
            <AlertDescription className="mt-2 text-slate-300">
              {testResult.message}
            </AlertDescription>

            {testResult.accountInfo && (
              <div className="mt-4 p-3 bg-slate-800 rounded-lg space-y-2">
                <h4 className="text-white font-medium">📊 Informações da Conta:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-400">Email:</span>
                    <span className="text-white ml-2">{testResult.accountInfo.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Nível:</span>
                    <span className="text-white ml-2">{testResult.accountInfo.level || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Estado:</span>
                    <span className="text-green-600 ml-2">{testResult.accountInfo.state || 'ativo'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Saldos:</span>
                    <span className="text-white ml-2">{testResult.balanceCount || 0} moedas</span>
                  </div>
                </div>
              </div>
            )}

            {testResult.error && (
              <div className="mt-3 p-2 bg-red-900/20 rounded text-red-600 text-sm">
                <strong>Erro técnico:</strong> {testResult.error}
              </div>
            )}
          </Alert>
        )}

        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h3 className="text-white font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            Como Obter suas Credenciais Gate.io:
          </h3>
          <ol className="text-slate-300 text-sm space-y-1 list-decimal list-inside">
            <li>Acesse <a href="https://www.gate.io" className="text-blue-400 hover:text-blue-300">Gate.io</a> e faça login</li>
            <li>Vá em Profile → API Management → APIv4 Keys</li>
            <li>Clique em "Create API Key"</li>
            <li>Configure as permissões necessárias (Spot Trading recomendado)</li>
            <li>Copie a API Key e API Secret geradas</li>
            <li>Cole aqui para testar a conexão</li>
          </ol>
          
          <div className="mt-4 p-3 bg-yellow-900/20 rounded border border-yellow-600">
            <p className="text-yellow-600 text-sm">
              <strong>⚠️ Importante:</strong> Certifique-se de que suas credenciais estão corretas. 
              Se você está usando credenciais de teste ou demo, elas podem não funcionar com a API de produção.
              Use apenas credenciais reais da sua conta Gate.io verificada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}