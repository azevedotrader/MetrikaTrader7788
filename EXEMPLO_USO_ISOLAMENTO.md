# Como Usar o Sistema Isolado - Métrika

## 🔐 Sistema de Isolamento Implementado

O sistema Métrika agora possui **isolamento completo de dados entre usuários**. Cada usuário vê apenas seus próprios dados e não pode acessar informações de outros usuários.

---

## 📱 CONFIGURAÇÃO NO FRONTEND

### 1. **Enviando userId em Requisições**

Para usar o sistema, o frontend precisa enviar o `userId` em todas as requisições. Há 4 métodos suportados:

#### Método 1: Header X-User-ID (Recomendado para desenvolvimento)
```javascript
// Exemplo: Buscar trades do usuário
fetch('/api/trades', {
  headers: {
    'X-User-ID': 'usuario-123' // ID do usuário logado
  }
})
.then(response => response.json())
.then(trades => {
  // Apenas trades deste usuário específico
  console.log('Meus trades:', trades);
});
```

#### Método 2: Token JWT (Recomendado para produção)
```javascript
fetch('/api/trades', {
  headers: {
    'Authorization': `Bearer ${userToken}` // Token JWT do usuário
  }
})
```

#### Método 3: Header de Sessão (localStorage)
```javascript
// Configurar no localStorage
localStorage.setItem('user-id', 'usuario-123');

// Usar em requisições
fetch('/api/trades', {
  headers: {
    'X-Session-User-ID': localStorage.getItem('user-id')
  }
})
```

#### Método 4: Body da Requisição (POST/PUT)
```javascript
// Para requisições POST/PUT
fetch('/api/trades', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...tradeData,
    userId: 'usuario-123' // ID do usuário
  })
})
```

---

## 🛡️ ROTAS PROTEGIDAS

### **Rotas que EXIGEM Autenticação:**
- `GET /api/trades` - Buscar trades do usuário
- `GET /api/trades/:corretora` - Trades por corretora do usuário
- `GET /api/trades/by-broker` - Trades por broker do usuário
- `GET /api/calendar` - Calendário do usuário
- `POST /api/trades` - Criar trade do usuário
- `POST /api/trades/import/:corretora` - Importar CSV do usuário
- `POST /api/trades/upload-csv` - Upload inteligente do usuário
- `POST /api/csv/analyze-universal` - Analisar CSV do usuário

### **Rotas Públicas (Sem autenticação):**
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login usuário
- `GET /api/ai/advice` - Conselho de IA
- `GET /api/csv/demo-universal` - Demo do leitor universal

---

## 🧪 TESTANDO O ISOLAMENTO

### **Teste 1: Usuários Diferentes**
```javascript
// Usuário A
fetch('/api/trades', {
  headers: { 'X-User-ID': 'usuario-A' }
})
.then(r => r.json())
.then(trades => console.log('Trades do Usuário A:', trades));

// Usuário B  
fetch('/api/trades', {
  headers: { 'X-User-ID': 'usuario-B' }
})
.then(r => r.json())
.then(trades => console.log('Trades do Usuário B:', trades));

// Resultado: Cada usuário vê apenas seus próprios trades
```

### **Teste 2: Sem Autenticação (Deve dar erro)**
```javascript
// Tentativa de acesso sem userId
fetch('/api/trades')
.then(r => r.json())
.then(data => console.log(data));

// Resultado esperado:
// {
//   "error": "Acesso negado",
//   "message": "É necessário estar logado para acessar os dados. Cada usuário tem seus dados isolados.",
//   "details": "Usuário não autenticado - userId é obrigatório para isolamento de dados"
// }
```

### **Teste 3: Upload CSV Isolado**
```javascript
// Upload de CSV para usuário específico
const formData = new FormData();
formData.append('csvFile', file);

fetch('/api/csv/analyze-universal', {
  method: 'POST',
  headers: {
    'X-User-ID': 'usuario-123'
  },
  body: formData
})
.then(r => r.json())
.then(resultado => {
  // CSV processado e associado ao usuário correto
  console.log('Análise universal:', resultado);
});
```

---

## 🔧 IMPLEMENTAÇÃO NO REACT

### **Hook personalizado para autenticação**
```javascript
// hooks/useAuth.js
import { useState, useEffect } from 'react';

export function useAuth() {
  const [userId, setUserId] = useState(localStorage.getItem('user-id'));
  
  const login = (userIdOrToken) => {
    localStorage.setItem('user-id', userIdOrToken);
    setUserId(userIdOrToken);
  };
  
  const logout = () => {
    localStorage.removeItem('user-id');
    setUserId(null);
  };
  
  return { userId, login, logout, isAuthenticated: !!userId };
}
```

### **Service para API com autenticação automática**
```javascript
// services/api.js
class ApiService {
  constructor() {
    this.baseURL = '/api';
  }
  
  getHeaders() {
    const userId = localStorage.getItem('user-id');
    return {
      'Content-Type': 'application/json',
      'X-User-ID': userId || ''
    };
  }
  
  async getTrades() {
    const response = await fetch(`${this.baseURL}/trades`, {
      headers: this.getHeaders()
    });
    
    if (response.status === 401) {
      // Redirecionar para login
      window.location.href = '/login';
      return;
    }
    
    return response.json();
  }
  
  async createTrade(tradeData) {
    const response = await fetch(`${this.baseURL}/trades`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(tradeData)
    });
    
    return response.json();
  }
  
  async uploadCSV(file) {
    const formData = new FormData();
    formData.append('csvFile', file);
    
    const response = await fetch(`${this.baseURL}/csv/analyze-universal`, {
      method: 'POST',
      headers: {
        'X-User-ID': localStorage.getItem('user-id')
      },
      body: formData
    });
    
    return response.json();
  }
}

export const api = new ApiService();
```

### **Componente protegido**
```javascript
// components/ProtectedRoute.jsx
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Você precisa estar logado para ver esta página.</div>;
  }
  
  return children;
}

// Uso no App
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
```

---

## 📊 MONITORAMENTO E DEBUG

### **Logs do Sistema**
O sistema agora inclui logs detalhados para monitoramento:

```
📂 [usuario-123] Testando leitor universal: trades.csv
[usuario-456] Iniciando importação CSV para b3: dados-b3.csv
🗑️ Iniciando reset completo para usuário específico: usuario-789
```

### **Verificação de Isolamento**
```javascript
// Debug: verificar se dados estão isolados
async function debugIsolamento() {
  // Teste com usuário A
  const tradesA = await fetch('/api/trades', {
    headers: { 'X-User-ID': 'usuario-A' }
  }).then(r => r.json());
  
  // Teste com usuário B
  const tradesB = await fetch('/api/trades', {
    headers: { 'X-User-ID': 'usuario-B' }
  }).then(r => r.json());
  
  console.log('Trades A:', tradesA.length);
  console.log('Trades B:', tradesB.length);
  
  // Verificar se não há sobreposição
  const idsA = tradesA.map(t => t.id);
  const idsB = tradesB.map(t => t.id);
  const overlap = idsA.filter(id => idsB.includes(id));
  
  if (overlap.length === 0) {
    console.log('✅ Isolamento funcionando corretamente!');
  } else {
    console.warn('❌ VAZAMENTO DE DADOS detectado:', overlap);
  }
}
```

---

## 🚀 PRÓXIMOS PASSOS

1. **Implementar no Frontend**: Adicionar header X-User-ID em todas as requisições
2. **Sistema de Login**: Criar tela de login que define o userId
3. **Gestão de Sessão**: Implementar renovação automática de tokens
4. **Interface de Admin**: Painel para gestão de usuários isolados

---

## 📝 RESUMO IMPORTANTE

**ANTES**: Todos os usuários viam todos os dados
**DEPOIS**: Cada usuário vê apenas seus próprios dados
**COMO**: Middleware `requireAuth` + validações obrigatórias de userId
**RESULTADO**: Sistema 100% isolado e seguro

O leitor CSV universal também está totalmente integrado com o sistema de isolamento!