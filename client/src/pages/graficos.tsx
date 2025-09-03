import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, BarChart3, Activity, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useLanguage } from "@/contexts/LanguageContext";

// TypeScript declarations for TradingView
declare global {
  interface Window {
    TradingView: {
      widget: new (config: any) => void;
    };
  }
}

// Professional chart component with realistic trading data
function AlternativeChart({ symbol, interval }: { symbol: string; interval: string }) {
  const { t } = useLanguage();
  // Generate realistic trading data
  const generateRealisticData = () => {
    const data = [];
    let basePrice = 0;
    let symbolName = '';
    let precision = 2;
    
    // Set realistic base prices for different symbols
    if (symbol.includes('BTC')) {
      basePrice = 45000;
      symbolName = 'Bitcoin (BTC/USDT)';
      precision = 2;
    } else if (symbol.includes('EUR')) {
      basePrice = 5.8;
      symbolName = 'Euro/Real (EUR/BRL)';
      precision = 4;
    } else if (symbol.includes('USD')) {
      basePrice = 5.2;
      symbolName = 'Dólar/Real (USD/BRL)';
      precision = 4;
    } else if (symbol.includes('WIN')) {
      basePrice = 128000;
      symbolName = 'Mini Índice (WIN)';
      precision = 0;
    } else if (symbol.includes('ETH')) {
      basePrice = 3200;
      symbolName = 'Ethereum (ETH/USDT)';
      precision = 2;
    } else {
      basePrice = 100;
      symbolName = symbol;
      precision = 2;
    }
    
    let currentPrice = basePrice;
    const volatility = basePrice * 0.001; // 0.1% volatility
    
    for (let i = 0; i < 200; i++) {
      // Simulate realistic price movement with trending
      const trend = Math.sin(i * 0.02) * volatility * 2;
      const randomMove = (Math.random() - 0.5) * volatility;
      currentPrice += trend + randomMove;
      
      // Ensure price doesn't go negative
      currentPrice = Math.max(currentPrice, basePrice * 0.5);
      
      const timestamp = new Date(Date.now() - (200 - i) * parseInt(interval) * 60 * 1000);
      
      data.push({
        time: timestamp.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        price: parseFloat(currentPrice.toFixed(precision)),
        open: parseFloat((currentPrice + (Math.random() - 0.5) * volatility * 0.5).toFixed(precision)),
        high: parseFloat((currentPrice + Math.random() * volatility).toFixed(precision)),
        low: parseFloat((currentPrice - Math.random() * volatility).toFixed(precision)),
        volume: Math.floor(Math.random() * 1000000) + 100000,
        timestamp: timestamp.getTime()
      });
    }
    return { data, symbolName, currentPrice: parseFloat(currentPrice.toFixed(precision)), basePrice };
  };

  const [chartInfo] = useState(() => generateRealisticData());
  const { data: chartData, symbolName, currentPrice, basePrice } = chartInfo;
  
  // Calculate price change
  const priceChange = currentPrice - basePrice;
  const priceChangePercent = ((priceChange / basePrice) * 100).toFixed(2);
  const isPositive = priceChange >= 0;

  return (
    <div className="w-full h-full bg-slate-900 rounded-lg p-4">
      {/* Header with symbol info */}
      <div className="flex items-center justify-between mb-4 p-4 bg-slate-800/50 border border-slate-600 rounded-lg">
        <div>
          <h3 className="text-lg font-semibold text-white">{symbolName}</h3>
          <p className="text-sm text-slate-400">{t('charts.professional_chart')}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">
            {currentPrice.toLocaleString('pt-BR', { 
              minimumFractionDigits: symbol.includes('WIN') ? 0 : 2,
              maximumFractionDigits: symbol.includes('WIN') ? 0 : 4
            })}
          </p>
          <p className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent}%)
          </p>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '480px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis 
              dataKey="time" 
              stroke="#94a3b8"
              fontSize={11}
              tick={{ fill: '#94a3b8' }}
              interval={Math.floor(chartData.length / 8)}
            />
            <YAxis 
              stroke="#94a3b8"
              fontSize={11}
              tick={{ fill: '#94a3b8' }}
              domain={['dataMin - 10', 'dataMax + 10']}
              tickFormatter={(value) => value.toLocaleString('pt-BR', {
                minimumFractionDigits: symbol.includes('WIN') ? 0 : 2,
                maximumFractionDigits: symbol.includes('WIN') ? 0 : 4
              })}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#e2e8f0',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
              }}
              labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
              formatter={(value: any, name: string) => [
                `${parseFloat(value).toLocaleString('pt-BR')}`,
                name === 'price' ? 'Preço' : name
              ]}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#22c55e" 
              strokeWidth={2}
              fill="url(#priceGradient)"
              name="price"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer info */}
      <div className="mt-4 flex justify-between items-center text-sm text-slate-400 border-t border-slate-700 pt-3">
        <span>⏰ {t('charts.interval_label')} {interval} {t('charts.minutes')}</span>
        <span>📊 {t('charts.simulated_data')}</span>
        <span>🔄 {t('charts.updated')} {new Date().toLocaleTimeString('pt-BR')}</span>
      </div>
    </div>
  );
}

// TradingView widget real implementation
function TradingViewWidget({ symbol, interval }: { symbol: string; interval: string }) {
  const [widgetId] = useState(() => `tradingview_chart_${Math.random().toString(36).substr(2, 9)}`);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    let mounted = true;
    
    // Clean up any existing widget
    const container = document.getElementById(widgetId);
    if (container) {
      container.innerHTML = '';
    }

    const initWidget = () => {
      if (!mounted) return;
      
      try {
        if (window.TradingView && window.TradingView.widget) {
          new window.TradingView.widget({
            width: "100%",
            height: 580,
            symbol: symbol,
            interval: interval,
            timezone: "America/Sao_Paulo",
            theme: "dark",
            style: "1",
            locale: "br",
            container_id: widgetId,
            autosize: true
          });
          setIsReady(true);
        }
      } catch (error) {
        console.log("Widget initialization skipped");
        // Silently fail without showing error
      }
    };

    // Check if script already exists
    const existingScript = document.getElementById("tradingview_script");
    if (existingScript && window.TradingView) {
      setTimeout(initWidget, 100);
      return;
    }

    // Load script if not exists
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "tradingview_script";
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = () => {
        if (mounted) {
          setTimeout(initWidget, 100);
        }
      };
      script.onerror = () => {
        // Silently fail
      };
      document.head.appendChild(script);
    }

    return () => {
      mounted = false;
      const container = document.getElementById(widgetId);
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol, interval, widgetId]);

  return (
    <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden">
      <div id={widgetId} className="w-full h-full" />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <AlternativeChart symbol={symbol} interval={interval} />
        </div>
      )}
    </div>
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
  { value: "1", labelKey: "charts.interval.1min" },
  { value: "5", labelKey: "charts.interval.5min" },
  { value: "15", labelKey: "charts.interval.15min" },
  { value: "30", labelKey: "charts.interval.30min" },
  { value: "60", labelKey: "charts.interval.1hour" },
  { value: "240", labelKey: "charts.interval.4hours" },
  { value: "D", labelKey: "charts.interval.daily" },
  { value: "W", labelKey: "charts.interval.weekly" },
];

export default function Graficos() {
  const { t } = useLanguage();
  const [selectedMarket, setSelectedMarket] = useState<string>("forex");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("FX_IDC:EURBRL");
  const [selectedInterval, setSelectedInterval] = useState<string>("15");
  const [widgetKey, setWidgetKey] = useState<number>(Date.now()); // Use timestamp for unique initial key

  // Force widget refresh when symbol or interval changes
  useEffect(() => {
    setWidgetKey(Date.now());
  }, [selectedSymbol, selectedInterval]);

  // Auto-load widget when component first mounts
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      setWidgetKey(Date.now());
    }, 100);
    
    return () => clearTimeout(timer);
  }, []); // Empty dependency array means this runs only once on mount

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
      {/* Controls */}
      <Card className="rounded-lg border text-card-foreground shadow-sm border-slate-700 bg-[#292727]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {t('charts.chart_settings')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Market Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">{t('charts.market')}</label>
              <Select value={selectedMarket} onValueChange={handleMarketChange}>
                <SelectTrigger className="flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 border-slate-600 text-white bg-[#0f0e0ee0]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="forex" className="text-white hover:bg-slate-600">
                    {t('charts.forex')}
                  </SelectItem>
                  <SelectItem value="crypto" className="text-white hover:bg-slate-600">
                    {t('charts.crypto')}
                  </SelectItem>
                  <SelectItem value="b3" className="text-white hover:bg-slate-600">
                    {t('charts.b3_stocks')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Symbol Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">{t('charts.asset')}</label>
              <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                <SelectTrigger className="flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 border-slate-600 text-white bg-[#0f0e0ee0]">
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
              <label className="text-sm font-medium text-slate-300">{t('charts.timeframe')}</label>
              <Select value={selectedInterval} onValueChange={setSelectedInterval}>
                <SelectTrigger className="flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 border-slate-600 text-white bg-[#0f0e0ee0]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {INTERVALS.map((interval) => (
                    <SelectItem 
                      key={interval.value} 
                      value={interval.value}
                      className="text-white hover:bg-slate-600"
                    >
                      {t(interval.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Current Symbol Info */}
          <div className="mt-4 p-3 rounded-lg border border-slate-600 bg-[#000000d6]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">{t('charts.current_asset')}</span>
              <span className="text-white font-medium">{getCurrentSymbolName()}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-slate-400">{t('charts.current_timeframe')}</span>
              <span className="text-white font-medium">
                {INTERVALS.find(i => i.value === selectedInterval)?.labelKey && t(INTERVALS.find(i => i.value === selectedInterval)!.labelKey)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* TradingView Chart */}
      <Card className="bg-slate-800 border-slate-700">
        
        <CardContent className="p-0">
          <div className="relative rounded-b-lg overflow-hidden" style={{ height: '600px' }}>
            <TradingViewWidget 
              key={`${widgetKey}-${selectedSymbol}-${selectedInterval}`}
              symbol={selectedSymbol} 
              interval={selectedInterval} 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}