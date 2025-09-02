import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'pt' | 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('metrika-language');
    return (saved as Language) || 'pt';
  });

  useEffect(() => {
    localStorage.setItem('metrika-language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['pt'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Traduções
const translations: Record<Language, Record<string, string>> = {
  pt: {
    // Navegação
    'nav.dashboard': 'Dashboard',
    'nav.trades': 'Trades',
    'nav.calendar': 'Calendário',
    'nav.charts': 'Gráficos',
    'nav.journal': 'Diário',
    'nav.brokers': 'Corretoras',
    'nav.profile': 'Perfil',
    'nav.admin': 'Admin',
    'nav.logout': 'Sair',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.overview': 'Visão Geral',
    'dashboard.total_balance': 'Saldo Total',
    'dashboard.monthly_result': 'Resultado Mensal',
    'dashboard.win_rate': 'Taxa de Acerto',
    'dashboard.total_trades': 'Total de Trades',
    'dashboard.avg_rr': 'R/R Médio',
    'dashboard.best_setup': 'Melhor Setup',
    'dashboard.worst_setup': 'Pior Setup',
    'dashboard.recent_trades': 'Trades Recentes',
    'dashboard.performance_chart': 'Gráfico de Performance',
    'dashboard.ai_insights': 'Insights da IA',
    'dashboard.trading_calendar': 'Calendário de Trading',

    // Trades
    'trades.title': 'Trades',
    'trades.add_new': 'Novo Trade',
    'trades.symbol': 'Ativo',
    'trades.market': 'Mercado',
    'trades.setup': 'Setup',
    'trades.capital': 'Capital',
    'trades.stop': 'Stop',
    'trades.target': 'Alvo',
    'trades.result': 'Resultado',
    'trades.quantity': 'Quantidade',
    'trades.risk': 'Risco',
    'trades.type': 'Tipo',
    'trades.comment': 'Comentário',
    'trades.emotion': 'Emoção',
    'trades.entry_price': 'Preço Entrada',
    'trades.exit_price': 'Preço Saída',
    'trades.broker': 'Corretora',
    'trades.status': 'Status',
    'trades.date': 'Data/Hora',
    'trades.actions': 'Ações',
    'trades.edit': 'Editar',
    'trades.delete': 'Excluir',
    'trades.filter_all': 'Todos',
    'trades.no_trades': 'Nenhum trade encontrado',

    // Formulário de Trade
    'trade_form.title_add': 'Adicionar Trade',
    'trade_form.title_edit': 'Editar Trade',
    'trade_form.symbol_placeholder': 'Ex: BTCUSD, WINQ25',
    'trade_form.setup_placeholder': 'Ex: Breakout, Pullback',
    'trade_form.comment_placeholder': 'Observações sobre o trade',
    'trade_form.emotion_placeholder': 'Como você se sentiu',
    'trade_form.take_result': 'Take (ganho)',
    'trade_form.loss_result': 'Loss (perda)',
    'trade_form.save': 'Salvar Trade',
    'trade_form.cancel': 'Cancelar',
    'trade_form.validation_required': 'Campo obrigatório',
    'trade_form.validation_positive': 'Deve ser maior que zero',

    // Calendário
    'calendar.title': 'Calendário de Trading',
    'calendar.week': 'Semana',
    'calendar.trades_count': 'trades',
    'calendar.win': 'win',
    'calendar.diary_entry': 'Entrada do Diário',
    'calendar.add_diary': 'Adicionar ao Diário',
    'calendar.edit_diary': 'Editar Diário',
    'calendar.how_to_use': 'Como Usar o Calendário',
    'calendar.profitable_days': 'Dias Lucrativos',
    'calendar.profitable_days_desc': 'Marcados com ponto verde, mostram o P&L positivo do dia',
    'calendar.loss_days': 'Dias com Prejuízo',
    'calendar.loss_days_desc': 'Marcados com ponto vermelho, mostram o P&L negativo do dia',
    'calendar.weekly_summary': 'Resumo Semanal',
    'calendar.weekly_summary_desc': 'Coluna lateral com totais consolidados por semana',
    'calendar.analysis_tips': 'Dicas de Análise',

    // Gráficos
    'charts.title': 'Gráficos',
    'charts.forex': 'Forex',
    'charts.crypto': 'Crypto',
    'charts.b3': 'B3',

    // Diário
    'journal.title': 'Diário de Trading',
    'journal.add_entry': 'Nova Entrada',
    'journal.date': 'Data',
    'journal.content': 'Conteúdo',
    'journal.mood': 'Humor',
    'journal.lessons': 'Lições Aprendidas',
    'journal.save': 'Salvar',
    'journal.cancel': 'Cancelar',

    // Corretoras
    'brokers.title': 'Corretoras',
    'brokers.csv_import': 'Importar CSV',
    'brokers.api_config': 'Configurar API',
    'brokers.manual_entry': 'Entrada Manual',

    // Perfil
    'profile.title': 'Perfil',
    'profile.personal_info': 'Informações Pessoais',
    'profile.subscription': 'Assinatura',
    'profile.settings': 'Configurações',

    // Formulários gerais
    'form.save': 'Salvar',
    'form.cancel': 'Cancelar',
    'form.delete': 'Excluir',
    'form.edit': 'Editar',
    'form.close': 'Fechar',
    'form.submit': 'Enviar',

    // Landing Page
    'landing.hero_title': 'A Plataforma Completa para Análise de Trading',
    'landing.hero_subtitle': 'Analise seus trades, controle suas emoções e evolua como trader com nossa plataforma alimentada por IA.',
    'landing.start_free': 'Começar Grátis',
    'landing.features': 'Funcionalidades',
    'landing.pricing': 'Preços',
    'landing.testimonials': 'Depoimentos',
    'landing.contact': 'Contato',
    'landing.header.features': 'Recursos',
    'landing.header.pricing': 'Preços',
    'landing.header.contact': 'Contato',
    'landing.header.login': 'Entrar',
    'landing.header.start': 'Começar Agora',
    'landing.hero.title1': 'O Fim das',
    'landing.hero.title2': 'Planilhas',
    'landing.hero.title3': 'de Trading',
    'landing.hero.subtitle': 'A única plataforma que analisa seus trades automaticamente e revela',
    'landing.hero.subtitle_highlight': 'os padrões que geram lucro',
    'landing.auto_import': 'Import automático de trades',
    'landing.ai_analysis': 'Análise IA + insights',
    'landing.real_charts': 'Gráficos reais TradingView',

    // Mensagens
    'messages.success': 'Sucesso!',
    'messages.error': 'Erro',
    'messages.loading': 'Carregando...',
    'messages.no_data': 'Nenhum dado encontrado',
    'messages.confirm_delete': 'Tem certeza que deseja excluir?',

    // Autenticação
    'auth.login': 'Entrar',
    'auth.register': 'Cadastrar',
    'auth.email': 'Email',
    'auth.password': 'Senha',
    'auth.remember_me': 'Lembrar de mim',
    'auth.forgot_password': 'Esqueci minha senha',

    // Métricas e estatísticas
    'metrics.profitable_trades': 'Trades Lucrativos',
    'metrics.losing_trades': 'Trades Perdedores',
    'metrics.average_profit': 'Lucro Médio',
    'metrics.average_loss': 'Perda Média',
    'metrics.best_month': 'Melhor Mês',
    'metrics.worst_month': 'Pior Mês',
    'metrics.recovery_factor': 'Fator de Recuperação',
    'metrics.max_drawdown': 'Drawdown Máximo',
    'metrics.profit_factor': 'Fator de Lucro',

    // Períodos e datas
    'period.daily': 'Diário',
    'period.weekly': 'Semanal',
    'period.monthly': 'Mensal',
    'period.yearly': 'Anual',
    'period.all_time': 'Todo Período',

    // Status e ações
    'status.active': 'Ativo',
    'status.inactive': 'Inativo',
    'status.pending': 'Pendente',
    'status.completed': 'Concluído',
    'action.reset': 'Resetar',
    'action.import': 'Importar',
    'action.export': 'Exportar',
    'action.sync': 'Sincronizar',
    'action.refresh': 'Atualizar',
  },

  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.trades': 'Trades',
    'nav.calendar': 'Calendar',
    'nav.charts': 'Charts',
    'nav.journal': 'Journal',
    'nav.brokers': 'Brokers',
    'nav.profile': 'Profile',
    'nav.admin': 'Admin',
    'nav.logout': 'Logout',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.overview': 'Overview',
    'dashboard.total_balance': 'Total Balance',
    'dashboard.monthly_result': 'Monthly Result',
    'dashboard.win_rate': 'Win Rate',
    'dashboard.total_trades': 'Total Trades',
    'dashboard.avg_rr': 'Avg R/R',
    'dashboard.best_setup': 'Best Setup',
    'dashboard.worst_setup': 'Worst Setup',
    'dashboard.recent_trades': 'Recent Trades',
    'dashboard.performance_chart': 'Performance Chart',
    'dashboard.ai_insights': 'AI Insights',
    'dashboard.trading_calendar': 'Trading Calendar',

    // Trades
    'trades.title': 'Trades',
    'trades.add_new': 'New Trade',
    'trades.symbol': 'Symbol',
    'trades.market': 'Market',
    'trades.setup': 'Setup',
    'trades.capital': 'Capital',
    'trades.stop': 'Stop',
    'trades.target': 'Target',
    'trades.result': 'Result',
    'trades.quantity': 'Quantity',
    'trades.risk': 'Risk',
    'trades.type': 'Type',
    'trades.comment': 'Comment',
    'trades.emotion': 'Emotion',
    'trades.entry_price': 'Entry Price',
    'trades.exit_price': 'Exit Price',
    'trades.broker': 'Broker',
    'trades.status': 'Status',
    'trades.date': 'Date/Time',
    'trades.actions': 'Actions',
    'trades.edit': 'Edit',
    'trades.delete': 'Delete',
    'trades.filter_all': 'All',
    'trades.no_trades': 'No trades found',

    // Trade Form
    'trade_form.title_add': 'Add Trade',
    'trade_form.title_edit': 'Edit Trade',
    'trade_form.symbol_placeholder': 'e.g., BTCUSD, EURUSD',
    'trade_form.setup_placeholder': 'e.g., Breakout, Pullback',
    'trade_form.comment_placeholder': 'Trade observations',
    'trade_form.emotion_placeholder': 'How did you feel',
    'trade_form.take_result': 'Take (profit)',
    'trade_form.loss_result': 'Loss',
    'trade_form.save': 'Save Trade',
    'trade_form.cancel': 'Cancel',
    'trade_form.validation_required': 'Required field',
    'trade_form.validation_positive': 'Must be greater than zero',

    // Calendar
    'calendar.title': 'Trading Calendar',
    'calendar.week': 'Week',
    'calendar.trades_count': 'trades',
    'calendar.win': 'win',
    'calendar.diary_entry': 'Diary Entry',
    'calendar.add_diary': 'Add to Diary',
    'calendar.edit_diary': 'Edit Diary',
    'calendar.how_to_use': 'How to Use Calendar',
    'calendar.profitable_days': 'Profitable Days',
    'calendar.profitable_days_desc': 'Marked with green dot, show positive P&L for the day',
    'calendar.loss_days': 'Loss Days',
    'calendar.loss_days_desc': 'Marked with red dot, show negative P&L for the day',
    'calendar.weekly_summary': 'Weekly Summary',
    'calendar.weekly_summary_desc': 'Side column with consolidated weekly totals',
    'calendar.analysis_tips': 'Analysis Tips',

    // Charts
    'charts.title': 'Charts',
    'charts.forex': 'Forex',
    'charts.crypto': 'Crypto',
    'charts.b3': 'B3',

    // Journal
    'journal.title': 'Trading Journal',
    'journal.add_entry': 'New Entry',
    'journal.date': 'Date',
    'journal.content': 'Content',
    'journal.mood': 'Mood',
    'journal.lessons': 'Lessons Learned',
    'journal.save': 'Save',
    'journal.cancel': 'Cancel',

    // Brokers
    'brokers.title': 'Brokers',
    'brokers.csv_import': 'Import CSV',
    'brokers.api_config': 'API Config',
    'brokers.manual_entry': 'Manual Entry',

    // Profile
    'profile.title': 'Profile',
    'profile.personal_info': 'Personal Information',
    'profile.subscription': 'Subscription',
    'profile.settings': 'Settings',

    // General Forms
    'form.save': 'Save',
    'form.cancel': 'Cancel',
    'form.delete': 'Delete',
    'form.edit': 'Edit',
    'form.close': 'Close',
    'form.submit': 'Submit',

    // Landing Page
    'landing.hero_title': 'The Complete Platform for Trading Analysis',
    'landing.hero_subtitle': 'Analyze your trades, control your emotions, and evolve as a trader with our AI-powered platform.',
    'landing.start_free': 'Start Free',
    'landing.features': 'Features',
    'landing.pricing': 'Pricing',
    'landing.testimonials': 'Testimonials',
    'landing.contact': 'Contact',
    'landing.header.features': 'Features',
    'landing.header.pricing': 'Pricing',
    'landing.header.contact': 'Contact',
    'landing.header.login': 'Login',
    'landing.header.start': 'Get Started',
    'landing.hero.title1': 'The End of',
    'landing.hero.title2': 'Trading',
    'landing.hero.title3': 'Spreadsheets',
    'landing.hero.subtitle': 'The only platform that analyzes your trades automatically and reveals',
    'landing.hero.subtitle_highlight': 'the patterns that generate profit',
    'landing.auto_import': 'Automatic trade import',
    'landing.ai_analysis': 'AI analysis + insights',
    'landing.real_charts': 'Real TradingView charts',

    // Messages
    'messages.success': 'Success!',
    'messages.error': 'Error',
    'messages.loading': 'Loading...',
    'messages.no_data': 'No data found',
    'messages.confirm_delete': 'Are you sure you want to delete?',

    // Authentication
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.remember_me': 'Remember me',
    'auth.forgot_password': 'Forgot password',

    // Metrics and statistics
    'metrics.profitable_trades': 'Profitable Trades',
    'metrics.losing_trades': 'Losing Trades',
    'metrics.average_profit': 'Average Profit',
    'metrics.average_loss': 'Average Loss',
    'metrics.best_month': 'Best Month',
    'metrics.worst_month': 'Worst Month',
    'metrics.recovery_factor': 'Recovery Factor',
    'metrics.max_drawdown': 'Max Drawdown',
    'metrics.profit_factor': 'Profit Factor',

    // Periods and dates
    'period.daily': 'Daily',
    'period.weekly': 'Weekly',
    'period.monthly': 'Monthly',
    'period.yearly': 'Yearly',
    'period.all_time': 'All Time',

    // Status and actions
    'status.active': 'Active',
    'status.inactive': 'Inactive',
    'status.pending': 'Pending',
    'status.completed': 'Completed',
    'action.reset': 'Reset',
    'action.import': 'Import',
    'action.export': 'Export',
    'action.sync': 'Sync',
    'action.refresh': 'Refresh',
  },

  es: {
    // Navegación
    'nav.dashboard': 'Panel',
    'nav.trades': 'Operaciones',
    'nav.calendar': 'Calendario',
    'nav.charts': 'Gráficos',
    'nav.journal': 'Diario',
    'nav.brokers': 'Brokers',
    'nav.profile': 'Perfil',
    'nav.admin': 'Admin',
    'nav.logout': 'Salir',

    // Dashboard
    'dashboard.title': 'Panel',
    'dashboard.overview': 'Resumen',
    'dashboard.total_balance': 'Saldo Total',
    'dashboard.monthly_result': 'Resultado Mensual',
    'dashboard.win_rate': 'Tasa de Acierto',
    'dashboard.total_trades': 'Total Operaciones',
    'dashboard.avg_rr': 'R/R Promedio',
    'dashboard.best_setup': 'Mejor Setup',
    'dashboard.worst_setup': 'Peor Setup',
    'dashboard.recent_trades': 'Operaciones Recientes',
    'dashboard.performance_chart': 'Gráfico de Rendimiento',
    'dashboard.ai_insights': 'Insights de IA',
    'dashboard.trading_calendar': 'Calendario de Trading',

    // Trades
    'trades.title': 'Operaciones',
    'trades.add_new': 'Nueva Operación',
    'trades.symbol': 'Símbolo',
    'trades.market': 'Mercado',
    'trades.setup': 'Setup',
    'trades.capital': 'Capital',
    'trades.stop': 'Stop',
    'trades.target': 'Objetivo',
    'trades.result': 'Resultado',
    'trades.quantity': 'Cantidad',
    'trades.risk': 'Riesgo',
    'trades.type': 'Tipo',
    'trades.comment': 'Comentario',
    'trades.emotion': 'Emoción',
    'trades.entry_price': 'Precio Entrada',
    'trades.exit_price': 'Precio Salida',
    'trades.broker': 'Broker',
    'trades.status': 'Estado',
    'trades.date': 'Fecha/Hora',
    'trades.actions': 'Acciones',
    'trades.edit': 'Editar',
    'trades.delete': 'Eliminar',
    'trades.filter_all': 'Todos',
    'trades.no_trades': 'No se encontraron operaciones',

    // Formulario de Trade
    'trade_form.title_add': 'Agregar Operación',
    'trade_form.title_edit': 'Editar Operación',
    'trade_form.symbol_placeholder': 'ej: BTCUSD, EURUSD',
    'trade_form.setup_placeholder': 'ej: Breakout, Pullback',
    'trade_form.comment_placeholder': 'Observaciones de la operación',
    'trade_form.emotion_placeholder': 'Cómo te sentiste',
    'trade_form.take_result': 'Take (ganancia)',
    'trade_form.loss_result': 'Loss (pérdida)',
    'trade_form.save': 'Guardar Operación',
    'trade_form.cancel': 'Cancelar',
    'trade_form.validation_required': 'Campo requerido',
    'trade_form.validation_positive': 'Debe ser mayor que cero',

    // Calendario
    'calendar.title': 'Calendario de Trading',
    'calendar.week': 'Semana',
    'calendar.trades_count': 'operaciones',
    'calendar.win': 'acierto',
    'calendar.diary_entry': 'Entrada del Diario',
    'calendar.add_diary': 'Agregar al Diario',
    'calendar.edit_diary': 'Editar Diario',
    'calendar.how_to_use': 'Cómo Usar el Calendario',
    'calendar.profitable_days': 'Días Rentables',
    'calendar.profitable_days_desc': 'Marcados con punto verde, muestran P&L positivo del día',
    'calendar.loss_days': 'Días con Pérdidas',
    'calendar.loss_days_desc': 'Marcados con punto rojo, muestran P&L negativo del día',
    'calendar.weekly_summary': 'Resumen Semanal',
    'calendar.weekly_summary_desc': 'Columna lateral con totales consolidados por semana',
    'calendar.analysis_tips': 'Consejos de Análisis',

    // Gráficos
    'charts.title': 'Gráficos',
    'charts.forex': 'Forex',
    'charts.crypto': 'Crypto',
    'charts.b3': 'B3',

    // Diario
    'journal.title': 'Diario de Trading',
    'journal.add_entry': 'Nueva Entrada',
    'journal.date': 'Fecha',
    'journal.content': 'Contenido',
    'journal.mood': 'Estado de Ánimo',
    'journal.lessons': 'Lecciones Aprendidas',
    'journal.save': 'Guardar',
    'journal.cancel': 'Cancelar',

    // Brokers
    'brokers.title': 'Brokers',
    'brokers.csv_import': 'Importar CSV',
    'brokers.api_config': 'Configurar API',
    'brokers.manual_entry': 'Entrada Manual',

    // Perfil
    'profile.title': 'Perfil',
    'profile.personal_info': 'Información Personal',
    'profile.subscription': 'Suscripción',
    'profile.settings': 'Configuraciones',

    // Formularios generales
    'form.save': 'Guardar',
    'form.cancel': 'Cancelar',
    'form.delete': 'Eliminar',
    'form.edit': 'Editar',
    'form.close': 'Cerrar',
    'form.submit': 'Enviar',

    // Landing Page
    'landing.hero_title': 'La Plataforma Completa para Análisis de Trading',
    'landing.hero_subtitle': 'Analiza tus operaciones, controla tus emociones y evoluciona como trader con nuestra plataforma potenciada por IA.',
    'landing.start_free': 'Comenzar Gratis',
    'landing.features': 'Características',
    'landing.pricing': 'Precios',
    'landing.testimonials': 'Testimonios',
    'landing.contact': 'Contacto',
    'landing.header.features': 'Características',
    'landing.header.pricing': 'Precios',
    'landing.header.contact': 'Contacto',
    'landing.header.login': 'Iniciar Sesión',
    'landing.header.start': 'Comenzar Ahora',
    'landing.hero.title1': 'El Fin de las',
    'landing.hero.title2': 'Hojas de Cálculo',
    'landing.hero.title3': 'de Trading',
    'landing.hero.subtitle': 'La única plataforma que analiza tus operaciones automáticamente y revela',
    'landing.hero.subtitle_highlight': 'los patrones que generan ganancias',
    'landing.auto_import': 'Importación automática de trades',
    'landing.ai_analysis': 'Análisis IA + insights',
    'landing.real_charts': 'Gráficos reales TradingView',

    // Mensajes
    'messages.success': '¡Éxito!',
    'messages.error': 'Error',
    'messages.loading': 'Cargando...',
    'messages.no_data': 'No se encontraron datos',
    'messages.confirm_delete': '¿Estás seguro de que quieres eliminar?',

    // Autenticación
    'auth.login': 'Iniciar Sesión',
    'auth.register': 'Registrarse',
    'auth.email': 'Correo',
    'auth.password': 'Contraseña',
    'auth.remember_me': 'Recordarme',
    'auth.forgot_password': 'Olvidé mi contraseña',

    // Métricas y estadísticas
    'metrics.profitable_trades': 'Operaciones Rentables',
    'metrics.losing_trades': 'Operaciones Perdedoras',
    'metrics.average_profit': 'Ganancia Promedio',
    'metrics.average_loss': 'Pérdida Promedio',
    'metrics.best_month': 'Mejor Mes',
    'metrics.worst_month': 'Peor Mes',
    'metrics.recovery_factor': 'Factor de Recuperación',
    'metrics.max_drawdown': 'Drawdown Máximo',
    'metrics.profit_factor': 'Factor de Ganancia',

    // Períodos y fechas
    'period.daily': 'Diario',
    'period.weekly': 'Semanal',
    'period.monthly': 'Mensual',
    'period.yearly': 'Anual',
    'period.all_time': 'Todo el Tiempo',

    // Estado y acciones
    'status.active': 'Activo',
    'status.inactive': 'Inactivo',
    'status.pending': 'Pendiente',
    'status.completed': 'Completado',
    'action.reset': 'Resetear',
    'action.import': 'Importar',
    'action.export': 'Exportar',
    'action.sync': 'Sincronizar',
    'action.refresh': 'Actualizar',
  }
};