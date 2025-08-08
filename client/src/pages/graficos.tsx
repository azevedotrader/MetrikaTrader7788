import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, BarChart3, Activity, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Alternative chart component when TradingView is unavailable
function AlternativeChart({ symbol, interval }: { symbol: string; interval: string }) {
  // Generate sample data for demonstration
  const generateSampleData = () => {
    const data = [];
    const basePrice = symbol.includes('BTC') ? 45000 : 
                     symbol.includes('EUR') ? 5.8 : 
                     symbol.includes('WIN') ? 128000 : 100;
    
    for (let i = 0; i < 100; i++) {
      const price = basePrice + (Math.random() - 0.5) * basePrice * 0.02;
      data.push({
        time: new Date(Date.now() - (100 - i) * 15 * 60 * 1000).toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        price: parseFloat(price.toFixed(symbol.includes('BTC') ? 2 : 4)),
        volume: Math.random() * 1000000
      });
    }
    return data;
  };

  const [chartData] = useState(() => generateSampleData());

  return (
    <div className="w-full h-full bg-slate-900 rounded-lg p-4">
      {/* Header with connection issue notice */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-amber-900/20 border border-amber-600 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
        <div>
          <p className="text-sm text-amber-300">
            <strong>TradingView temporariamente indisponível</strong>
          </p>
          <p className="text-xs text-amber-400/70">
            Exibindo gráfico alternativo para demonstração
          </p>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '500px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="time" 
              stroke="#94a3b8"
              fontSize={12}
            />
            <YAxis 
              stroke="#94a3b8"
              fontSize={12}
              domain={['dataMin - 50', 'dataMax + 50']}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#e2e8f0'
              }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#22c55e" 
              strokeWidth={2}
              dot={false}
              name="Preço"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Symbol info */}
      <div className="mt-4 flex justify-between items-center text-sm text-slate-400">
        <span>📈 {symbol}</span>
        <span>Intervalo: {interval} min</span>
      </div>
    </div>
  );
}

// TradingView widget with fallback
function TradingViewWidget({ symbol, interval }: { symbol: string; interval: string }) {
  const [useFallback, setUseFallback] = useState(false);
  const widgetId = `tv-widget-${symbol.replace(/[^a-zA-Z0-9]/g, '')}-${interval}`;
  
  useEffect(() => {
    const container = document.getElementById(widgetId);
    if (!container) return;

    // Clear container
    container.innerHTML = '';

    // Try to load TradingView
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    
    script.onerror = () => {
      console.log('TradingView script failed to load, using fallback');
      setUseFallback(true);
    };

    script.onload = () => {
      // Create widget configuration
      const widgetHTML = `
        <div class="tradingview-widget-container" style="height:100%;width:100%">
          <div class="tradingview-widget-container__widget" style="height:calc(100% - 32px);width:100%"></div>
          <div class="tradingview-widget-copyright" style="height: 32px;">
            <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
              <span style="font-size: 12px; color: #2962FF;">
                Track all markets on TradingView
              </span>
            </a>
          </div>
        </div>
      `;

      container.innerHTML = widgetHTML;

      // Add widget script
      const configScript = document.createElement('script');
      configScript.innerHTML = JSON.stringify({
        autosize: true,
        symbol: symbol,
        interval: interval,
        timezone: "America/Sao_Paulo",
        theme: "dark",
        style: "1",
        locale: "pt_BR",
        enable_publishing: false,
        allow_symbol_change: true,
        calendar: false,
        support_host: "https://www.tradingview.com"
      });

      const widgetContainer = container.querySelector('.tradingview-widget-container__widget');
      if (widgetContainer) {
        widgetContainer.appendChild(configScript);
      }
    };

    container.appendChild(script);

    // Fallback timeout
    setTimeout(() => {
      if (container.innerHTML === '') {
        setUseFallback(true);
      }
    }, 5000);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol, interval, widgetId]);

  if (useFallback) {
    return <AlternativeChart symbol={symbol} interval={interval} />;
  }

  return (
    <div 
      id={widgetId}
      className="w-full h-full bg-slate-900 rounded-lg"
      style={{ 
        height: '600px',
        backgroundColor: '#0f172a'
      }}
    />
  );
}

// Pre-configured symbols for different markets
const SYMBOLS = {
  forex: [
    { symbol: "FX_IDC:EURBRL", name: "EUR/BRL", exchange: "FX_IDC" },
    { symbol: "FX_IDC:USDBRL", name: "USD/BRL", exchange: "FX_IDC" },
    { symbol: "FX:EURUSD", name: "EUR/USD", exchange: "FX" },
    { symbol: "FX:GBPUSD", name: "GBP/USD", exchange: "FX" },
    { symbol: "FX:USDJPY", name: "USD/JPY", exchange: "FX" },
  ],
  crypto: [
    { symbol: "BINANCE:BTCUSDT", name: "BTC/USDT", exchange: "Binance" },
    { symbol: "BINANCE:ETHUSDT", name: "ETH/USDT", exchange: "Binance" },
    { symbol: "BINANCE:ADAUSDT", name: "ADA/USDT", exchange: "Binance" },
    { symbol: "BINANCE:BNBUSDT", name: "BNB/USDT", exchange: "Binance" },
    { symbol: "BINANCE:SOLUSDT", name: "SOL/USDT", exchange: "Binance" },
  ],
  b3: [
    { symbol: "BMFBOVESPA:WINQ25", name: "Mini Índice", exchange: "B3" },
    { symbol: "BMFBOVESPA:WDOQ25", name: "Mini Dólar", exchange: "B3" },
    { symbol: "BMFBOVESPA:PETR4", name: "Petrobras", exchange: "B3" },
    { symbol: "BMFBOVESPA:VALE3", name: "Vale", exchange: "B3" },
    { symbol: "BMFBOVESPA:ITUB4", name: "Itaú", exchange: "B3" },
  ]
};

const INTERVALS = [
  { value: "1", label: "1 minuto" },
  { value: "5", label: "5 minutos" },
  { value: "15", label: "15 minutos" },
  { value: "30", label: "30 minutos" },
  { value: "60", label: "1 hora" },
  { value: "240", label: "4 horas" },
  { value: "D", label: "Diário" },
  { value: "W", label: "Semanal" },
];

export default function Graficos() {
  const [selectedMarket, setSelectedMarket] = useState<string>("forex");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("FX_IDC:EURBRL");
  const [selectedInterval, setSelectedInterval] = useState<string>("15");
  const [widgetKey, setWidgetKey] = useState<number>(0);

  // Force widget refresh when symbol or interval changes
  useEffect(() => {
    setWidgetKey(prev => prev + 1);
  }, [selectedSymbol, selectedInterval]);

  const handleMarketChange = (market: string) => {
    setSelectedMarket(market);
    // Set first symbol of the selected market
    const firstSymbol = SYMBOLS[market as keyof typeof SYMBOLS][0].symbol;
    setSelectedSymbol(firstSymbol);
  };

  const getCurrentSymbols = () => {
    return SYMBOLS[selectedMarket as keyof typeof SYMBOLS] || SYMBOLS.forex;
  };

  const getCurrentSymbolName = () => {
    const currentSymbols = getCurrentSymbols();
    const current = currentSymbols.find(s => s.symbol === selectedSymbol);
    return current?.name || selectedSymbol;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gráficos em Tempo Real</h1>
          <p className="text-slate-400">Análise técnica avançada com TradingView</p>
        </div>
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-6 h-6 text-purple-500" />
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <Activity className="w-6 h-6 text-green-500" />
        </div>
      </div>

      {/* Controls */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Configurações do Gráfico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Market Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Mercado</label>
              <Select value={selectedMarket} onValueChange={handleMarketChange}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="forex" className="text-white hover:bg-slate-600">
                    Forex
                  </SelectItem>
                  <SelectItem value="crypto" className="text-white hover:bg-slate-600">
                    Crypto
                  </SelectItem>
                  <SelectItem value="b3" className="text-white hover:bg-slate-600">
                    B3 (Ações/Futuros)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Symbol Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Ativo</label>
              <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {getCurrentSymbols().map((symbol) => (
                    <SelectItem 
                      key={symbol.symbol} 
                      value={symbol.symbol}
                      className="text-white hover:bg-slate-600"
                    >
                      {symbol.name} ({symbol.exchange})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Interval Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Temporalidade</label>
              <Select value={selectedInterval} onValueChange={setSelectedInterval}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {INTERVALS.map((interval) => (
                    <SelectItem 
                      key={interval.value} 
                      value={interval.value}
                      className="text-white hover:bg-slate-600"
                    >
                      {interval.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Current Symbol Info */}
          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Ativo Atual:</span>
              <span className="text-white font-medium">{getCurrentSymbolName()}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-slate-400">Temporalidade:</span>
              <span className="text-white font-medium">
                {INTERVALS.find(i => i.value === selectedInterval)?.label}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TradingView Chart */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {getCurrentSymbolName()} - Análise Técnica
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative rounded-b-lg overflow-hidden" style={{ height: '600px' }}>
            <TradingViewWidget 
              key={widgetKey}
              symbol={selectedSymbol} 
              interval={selectedInterval} 
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <Button 
              onClick={() => {
                setSelectedMarket("forex");
                setSelectedSymbol("FX_IDC:EURBRL");
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              EUR/BRL (Forex)
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <Button 
              onClick={() => {
                setSelectedMarket("crypto");
                setSelectedSymbol("BINANCE:BTCUSDT");
              }}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              BTC/USDT (Crypto)
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <Button 
              onClick={() => {
                setSelectedMarket("b3");
                setSelectedSymbol("BMFBOVESPA:WINQ25");
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Mini Índice (B3)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}