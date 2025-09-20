import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Users, Shield } from 'lucide-react';

export default function UserSelector() {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [customUserId, setCustomUserId] = useState<string>('');

  useEffect(() => {
    const userId = localStorage.getItem('user-id') || '';
    setCurrentUserId(userId);
    setCustomUserId(userId);
  }, []);

  const setUser = (userId: string) => {
    localStorage.setItem('user-id', userId);
    setCurrentUserId(userId);
    setCustomUserId(userId);
    // Recarregar a página para aplicar as mudanças
    window.location.reload();
  };

  const quickUsers = [
    { id: 'usuario-a', name: 'Usuário A', color: 'bg-blue-500' },
    { id: 'usuario-b', name: 'Usuário B', color: 'bg-green-600' },
    { id: 'usuario-c', name: 'Usuário C', color: 'bg-purple-500' },
  ];

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Shield className="w-5 h-5" />
          Sistema de Isolamento
        </CardTitle>
        <CardDescription>
          Selecione um usuário para ver apenas seus dados
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Usuário Atual */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <User className="w-4 h-4" />
            Usuário Atual: 
            <span className="text-blue-600 dark:text-blue-400">
              {currentUserId || 'Nenhum'}
            </span>
          </div>
        </div>

        {/* Usuários Rápidos */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuários de Teste
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {quickUsers.map((user) => (
              <Button
                key={user.id}
                variant={currentUserId === user.id ? "default" : "outline"}
                size="sm"
                onClick={() => setUser(user.id)}
                className="justify-start"
              >
                <div className={`w-3 h-3 rounded-full ${user.color} mr-2`} />
                {user.name}
                {currentUserId === user.id && (
                  <span className="ml-auto text-xs">✓ Ativo</span>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Usuário Personalizado */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Usuário Personalizado</h4>
          <div className="flex gap-2">
            <Input
              placeholder="Digite ID do usuário"
              value={customUserId}
              onChange={(e) => setCustomUserId(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => setUser(customUserId)}
              disabled={!customUserId.trim()}
              size="sm"
            >
              Usar
            </Button>
          </div>
        </div>

        {/* Info de Isolamento */}
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            <strong>Isolamento Ativo:</strong> Cada usuário vê apenas seus próprios dados. 
            Trades, CSVs e configurações são completamente separados.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}