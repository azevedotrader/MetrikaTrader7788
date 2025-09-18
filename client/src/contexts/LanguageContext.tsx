import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type Language = "pt" | "en" | "es";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("metrika-language");
    return (saved as Language) || "pt";
  });

  useEffect(() => {
    localStorage.setItem("metrika-language", language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language]?.[key] || translations["pt"][key] || key;
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
    "nav.dashboard": "Dashboard",
    "nav.trades": "Trades",
    "nav.calendar": "Calendário",
    "nav.charts": "Gráficos",
    "nav.journal": "Diário",
    "nav.brokers": "Corretoras",
    "nav.learning": "Aprendizado",
    "nav.profile": "Perfil",
    "nav.admin": "Admin",
    "nav.logout": "Sair",

    // Gestão de Risco
    "risk_management.title": "Gestão de Risco",
    "risk_management.description": "Calcule o tamanho ideal da posição e projete seu crescimento",
    "risk_management.settings": "Configurações",
    "risk_management.settings_description": "Insira os dados da sua conta e operação",
    "risk_management.account_balance": "Saldo da Conta",
    "risk_management.risk_percentage": "Risco por Operação",
    "risk_management.stop_loss_pips": "Stop Loss (pips)",
    "risk_management.risk_reward_ratio": "Razão Risco:Retorno",
    "risk_management.calculate": "Calcular",
    "risk_management.results": "Resultados",
    "risk_management.risk_amount": "Valor em Risco",
    "risk_management.potential_profit": "Lucro Potencial",
    "risk_management.expected_profit_per_trade": "Lucro Esperado/Trade",
    "risk_management.daily_growth_expected": "Crescimento Diário Esperado",
    "risk_management.position_size": "Tamanho da Posição",
    "risk_management.daily_growth": "Crescimento Diário",
    "risk_management.growth_projection": "Projeção de Crescimento",
    "risk_management.growth_projection_description": "Baseado em performance consistente",
    "risk_management.growth_simulation_title": "Simulação de Crescimento (90 dias)",
    "risk_management.growth_simulation_description": "Projeção baseada em probabilidades realísticas com volatilidade",
    "risk_management.projected_balance": "Saldo Projetado",
    "risk_management.accumulated_gain": "Ganho Acumulado",
    "risk_management.realistic_goals": "Metas Realísticas",
    "risk_management.expected_growth_based": "Crescimento esperado baseado em desempenho consistente",
    "risk_management.days_business_days": "{days} dias ({tradingDays}d úteis)",
    "risk_management.expected_gain": "Ganho esperado",
    "risk_management.possible_loss": "Perda possível",
    "risk_management.trades": "trades",
    "risk_management.after_days": "Após {days} dias",
    "risk_management.enter_balance_to_start": "Insira o saldo da conta para começar",
    "risk_management.how_to_use": "Como Usar a Gestão de Risco",
    "risk_management.essential_tips": "Dicas essenciais para maximizar seus resultados",
    "risk_management.risk_by_profile": "Gestão de Risco por Perfil",
    "risk_management.position_size_title": "Tamanho da Posição",
    "risk_management.position_size_desc": "Use nossa calculadora para determinar exatamente quantos lotes operar baseado no seu stop loss e tolerância ao risco.",
    "risk_management.important": "Importante",
    "risk_management.disclaimer": "Os resultados são projeções baseadas em dados históricos. Performance passada não garante resultados futuros.",
    "risk_management.steps_to_use": "Passos para usar:",
    "risk_management.step1": "Insira o saldo real da sua conta",
    "risk_management.step2": "Escolha seu perfil de risco",
    "risk_management.conservative_desc": "Conservador: Mantenha sempre 0.25% por operação para preservar capital a longo prazo. Máximo 1% de risco diário.",
    "risk_management.moderate_desc": "Moderado: Use 0.6% por operação, equilibrando crescimento e segurança. Máximo 2.4% de risco diário.",
    "risk_management.high_risk_desc": "Alto Risco: Até 2.5% por operação para traders experientes com alta tolerância ao risco. Máximo 10% de risco diário.",
    "risk_management.no_profile_desc": "Selecione um perfil para ver recomendações específicas de risco por operação.",

    // Suporte
    "support.title": "Suporte",
    "support.description":
      "Entre em contato conosco para obter ajuda com sua conta",
    "support.new_conversation": "Nova Conversa",
    "support.subject_label": "Assunto",
    "support.subject_placeholder": "Descreva brevemente o problema",
    "support.category_label": "Categoria",
    "support.category_technical": "Problema Técnico",
    "support.category_billing": "Cobrança",
    "support.category_feature": "Solicitação de Recurso",
    "support.category_general": "Pergunta Geral",
    "support.priority_label": "Prioridade",
    "support.priority_low": "Baixa",
    "support.priority_medium": "Média",
    "support.priority_high": "Alta",
    "support.message_label": "Mensagem",
    "support.message_placeholder":
      "Descreva detalhadamente sua dúvida ou problema...",
    "support.send_button": "Enviar Mensagem",
    "support.start_conversation": "Iniciar Conversa",
    "support.no_conversations": "Nenhuma conversa ainda",
    "support.no_conversations_desc": 'Clique em "Nova Conversa" para começar',
    "support.status_open": "Aberta",
    "support.status_in_progress": "Em Andamento",
    "support.status_resolved": "Resolvida",
    "support.status_closed": "Fechada",
    "support.conversation_started": "Conversa iniciada com sucesso!",
    "support.message_sent": "Mensagem enviada!",
    "support.loading": "Carregando...",
    "support.error": "Erro ao carregar suporte",

    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.overview": "Visão Geral",
    "dashboard.total_balance": "Saldo Total",
    "dashboard.monthly_result": "Resultado Mensal",
    "dashboard.win_rate": "Assertividade",
    "dashboard.total_trades": "Total de Trades",
    "dashboard.avg_rr": "R/R Médio",
    "dashboard.best_setup": "Melhor Setup",
    "dashboard.worst_setup": "Pior Setup",
    "dashboard.recent_trades": "Trades Recentes",
    "dashboard.performance_chart": "Gráfico de Performance",
    "dashboard.ai_insights": "Insights da IA",
    "dashboard.trading_calendar": "Calendário de Trading",
    "dashboard.best_trade": "Melhor Trade",
    "dashboard.worst_trade": "Pior Trade",
    "dashboard.frequent_emotion": "Emoção Frequente",
    "dashboard.capital_curve": "Curva de Capital",
    "dashboard.detailed_temporal_performance": "Performance Temporal Detalhada",
    "dashboard.imports_and_trades": "Histórico de Importações e Trades",
    "dashboard.consolidated_total": "Resultado Total Consolidado",
    "dashboard.market_distribution": "Distribuição por Mercado",
    "dashboard.your_metrika_score": "Seu Métrika Score",
    "dashboard.insufficient_data_for_score": "Sem dados suficientes para calcular o score",
    "dashboard.register_trades_for_score": "Registre trades para ver seu Métrika Score",

    // Tabs
    "tabs.imports": "Importações",
    "tabs.consolidated": "Consolidado",

    // Filtros de tempo
    "time.7_days": "7 Dias",
    "time.1_year": "1 Ano",
    "time.times": "vezes",
    "time.trades_today": "Trades Hoje",

    // Emoções
    "emotion.neutral": "neutro",

    // Consolidação
    "consolidated.summary": "Resumo Consolidado",
    "consolidated.market_analysis":
      "Análise consolidada dos diferentes mercados",

    // Gráficos e Métricas
    "metrics.accumulated_profitability": "Rentabilidade Acumulada",
    "metrics.period_result": "Resultado do Período",
    "metrics.profits": "✅ Lucros",
    "metrics.losses": "❌ Perdas",
    "metrics.total_profits": "Total de Lucros",
    "metrics.total_losses": "Total de Perdas",
    "metrics.period_result_short": "Resultado Período",
    "metrics.total_profitability": "Rentabilidade Total",
    "metrics.general_result": "Resultado geral",
    "metrics.profitability_chart": "Gráfico de Rentabilidade ao Longo do Tempo",
    "metrics.result": "Resultado",
    "metrics.win_rate": "Win %",
    "metrics.profit_factor": "Profit Factor",
    "metrics.avg_win_loss": "Avg Win/Loss",
    "metrics.max_drawdown": "Max Drawdown",
    "metrics.recovery_factor": "Recovery Factor",
    "metrics.consistency": "Consistency",

    // Trades
    "trades.title": "Trades",
    "trades.add_new": "Novo Trade",
    "trades.symbol": "Ativo",
    "trades.market": "Mercado",
    "trades.setup": "Setup",
    "trades.capital": "Capital",
    "trades.stop": "Stop",
    "trades.target": "Alvo",
    "trades.result": "Resultado",
    "trades.quantity": "Quantidade",
    "trades.risk": "Risco",
    "trades.type": "Tipo",
    "trades.comment": "Comentário",
    "trades.emotion": "Emoção",
    "trades.entry_price": "Preço Entrada",
    "trades.exit_price": "Preço Saída",
    "trades.broker": "Corretora",
    "trades.status": "Status",
    "trades.date": "Data/Hora",
    "trades.actions": "Ações",
    "trades.edit": "Editar",
    "trades.delete": "Excluir",
    "trades.filter_all": "Todos",
    "trades.no_trades": "Nenhum trade encontrado",

    // Formulário de Trade
    "trade_form.title_add": "Adicionar Trade",
    "trade_form.title_edit": "Editar Trade",
    "trade_form.symbol_placeholder": "Ex: BTCUSD, WINQ25",
    "trade_form.setup_placeholder": "Ex: Breakout, Pullback",
    "trade_form.comment_placeholder": "Observações sobre o trade",
    "trade_form.emotion_placeholder": "Como você se sentiu",
    "trade_form.take_result": "Take (ganho)",
    "trade_form.loss_result": "Loss (perda)",
    "trade_form.save": "Salvar Trade",
    "trade_form.cancel": "Cancelar",
    "trade_form.validation_required": "Campo obrigatório",
    "trade_form.validation_positive": "Deve ser maior que zero",

    // Gráficos
    "charts.title": "Gráfico",

    // Calendário
    "calendar.title": "Calendário de Trading",
    "calendar.trades_count": "trades",
    "calendar.win": "win",
    "calendar.diary_entry": "Entrada do Diário",
    "calendar.add_diary": "Adicionar ao Diário",
    "calendar.edit_diary": "Editar Diário",
    "calendar.how_to_use": "Como Usar o Calendário",
    "calendar.profitable_days": "Dias Lucrativos",
    "calendar.profitable_days_desc":
      "Marcados com ponto verde, mostram o P&L positivo do dia",
    "calendar.loss_days": "Dias com Prejuízo",
    "calendar.loss_days_desc":
      "Marcados com ponto vermelho, mostram o P&L negativo do dia",
    "calendar.weekly_summary": "Resumo Semanal",
    "calendar.weekly_summary_desc":
      "Coluna lateral com totais consolidados por semana",
    "calendar.analysis_tips": "Dicas de Análise",
    "calendar.temporal_patterns": "📈 Padrões Temporais",
    "calendar.improvement_strategies": "🎯 Estratégias de Melhoria",
    "calendar.tip1": "Identifique quais dias da semana são mais lucrativos",
    "calendar.tip2": "Observe se há padrões em sequências de wins/losses",
    "calendar.tip3": "Analise a performance em diferentes semanas do mês",
    "calendar.tip4": "Compare meses para identificar sazonalidade",
    "calendar.strategy1": "Evite trading em dias consistentemente negativos",
    "calendar.strategy2": "Aumente volume em dias/períodos mais lucrativos",
    "calendar.strategy3": "Use breaks após sequências de perdas",
    "calendar.strategy4": "Documente o que funcionou nos dias verdes",

    // Dias da semana abreviados
    "calendar.sun_short": "Dom",
    "calendar.mon_short": "Seg",
    "calendar.tue_short": "Ter",
    "calendar.wed_short": "Qua",
    "calendar.thu_short": "Qui",
    "calendar.fri_short": "Sex",
    "calendar.sat_short": "Sáb",

    // Resumos e estatísticas
    "calendar.summary_of": "Resumo de",
    "calendar.pnl_total": "P&L Total",
    "calendar.day": "dia",
    "calendar.days": "dias",
    "calendar.week": "Semana",
    "calendar.trading_days": "Dias de Trading",
    "calendar.total_trades": "Total de Trades",
    "calendar.win_rate": "Assertividade",

    // Aprendizado
    "learning.title": "Centro de Aprendizado", 
    "learning.tour": "Tour pela Plataforma",
    "learning.videos": "Videoaulas",
    "learning.progress": "Seu Progresso",
    "learning.description": "Domine a plataforma de trading com nossos tutoriais e faça um tour guiado por todas as funcionalidades",
    "learning.tour_interactive": "Tour Interativo pela Plataforma",
    "learning.tour_description": "Faça um tour completo e interativo pela plataforma! O sistema irá navegar automaticamente por cada seção, destacando elementos importantes e explicando como usar cada funcionalidade.",
    "learning.tour_features.auto_nav": "Navegação automática entre páginas",
    "learning.tour_features.highlights": "Destaques visuais em elementos",
    "learning.tour_features.explanations": "Explicações contextuais detalhadas",
    "learning.tour_features.steps": "13 passos completos",
    "learning.tour_start": "Iniciar Tour Interativo",
    "learning.sections.basics": "Primeiros Passos",
    "learning.sections.basics_desc": "Aprenda o básico para começar a usar a plataforma",
    "learning.sections.analysis": "Análise e Relatórios",
    "learning.sections.analysis_desc": "Domine as ferramentas de análise da plataforma",
    "learning.sections.advanced": "Recursos Avançados",
    "learning.sections.advanced_desc": "Aproveite ao máximo as funcionalidades premium",
    "learning.videos.first_trade": "Como registrar seu primeiro trade",
    "learning.videos.csv_import": "Importando dados via CSV",
    "learning.videos.goals": "Configurando suas metas",
    "learning.videos.dashboard": "Lendo métricas do dashboard",
    "learning.videos.calendar": "Usando o calendário de trading",
    "learning.videos.charts": "Interpretando gráficos de performance",
    "learning.videos.ai_csv": "IA para análise de CSV",
    "learning.videos.risk": "Gestão avançada de risco",
    "learning.videos.journal": "Diário de trading e insights",
    "learning.stats.videos_watched": "Vídeos Assistidos",
    "learning.stats.general_progress": "Progresso Geral",
    "learning.stats.time_watched": "Tempo Assistido",

    // Tour
    "tour.welcome.title": "Bem-vindo ao METRIKA!",
    "tour.welcome.description": "Vamos fazer um tour completo pela plataforma de análise de trading. Você aprenderá como usar cada funcionalidade.",
    "tour.dashboard_overview.title": "Dashboard - Visão Geral",
    "tour.dashboard_overview.description": "Este é seu painel principal. Aqui você visualiza um resumo completo da sua performance, incluindo rentabilidade total, número de trades e principais métricas.",
    "tour.metrics_cards.title": "Cartões de Métricas",
    "tour.metrics_cards.description": "Estes cartões mostram suas principais estatísticas: rentabilidade, total de trades, taxa de acerto e outros indicadores importantes para acompanhar seu desempenho.",
    "tour.performance_chart.title": "Gráfico de Performance",
    "tour.performance_chart.description": "Visualize a evolução da sua rentabilidade ao longo do tempo. Este gráfico ajuda a identificar tendências e períodos de melhor ou pior performance.",
    "tour.sidebar_navigation.title": "Navegação Lateral",
    "tour.sidebar_navigation.description": "Use a barra lateral para navegar entre as diferentes seções da plataforma. Cada ícone representa uma funcionalidade específica.",
    "tour.new_trade.title": "Novo Trade",
    "tour.new_trade.description": "Aqui você pode registrar novos trades manualmente ou importar dados via CSV. É o ponto de entrada para todos os seus dados de trading.",
    "tour.csv_analysis.title": "Análise de CSV com IA",
    "tour.csv_analysis.description": "Nossa IA pode analisar seus arquivos CSV automaticamente, detectando trades e extraindo informações importantes, independente do formato do arquivo.",
    "tour.risk_management.title": "Gestão de Risco",
    "tour.risk_management.description": "Calcule o tamanho ideal das suas posições, gerencie o risco por operação e projete o crescimento do seu capital com base nas suas metas.",
    "tour.trading_calendar.title": "Calendário de Trading",
    "tour.trading_calendar.description": "Visualize sua performance diária, identifique padrões temporais e analise seus melhores e piores dias de trading em formato de calendário.",
    "tour.trading_journal.title": "Diário de Trading",
    "tour.trading_journal.description": "Mantenha um registro detalhado das suas reflexões, emoções e lições aprendidas. O diário é fundamental para sua evolução como trader.",
    "tour.ai_chat.title": "Chat com IA",
    "tour.ai_chat.description": "Converse com nossa IA para obter insights sobre seus trades, estratégias e performance. Ela pode ajudar a analisar padrões e sugerir melhorias.",
    "tour.support.title": "Suporte",
    "tour.support.description": "Precisa de ajuda? Nossa seção de suporte oferece respostas para dúvidas frequentes e canal direto para entrar em contato conosco.",
    "tour.complete.title": "Tour Concluído!",
    "tour.complete.description": "Parabéns! Agora você conhece todas as principais funcionalidades da plataforma. Continue explorando e aproveite ao máximo suas ferramentas de análise.",

    // Novo Trade e CSV
    "trade.manual": "Manual",
    "trade.import_csv": "Importar CSV",
    "trade.csv_file": "Arquivo CSV",
    "trade.csv_format_by_market": "Formato do CSV por Mercado",
    "trade.analyzing_ai": "Analisando com IA...",
    "trade.import_with_ai": "🤖 Importar com IA",
    "trade.import_fast": "⚡ Importar Rápido",
    "trade.csv_rejected": "❌ Arquivo CSV rejeitado:",
    "trade.processing": "Processando...",
    "trade.import_trades_csv": "Importar Trades via CSV",
    "trade.select_csv_exported":
      "Selecione um arquivo CSV exportado do seu mercado",
    "trade.analysis_complete": "✨ Análise Profunda Concluída",
    "trade.insights_generated":
      "insights detalhados gerados! Visualize a análise completa na tela.",
    "trade.import_csv_first":
      "Importe um arquivo CSV primeiro para usar a análise IA.",

    // Formulário de Trade Manual
    "form.trade_data": "Dados da Operação",
    "form.date_time": "Data e Hora",
    "form.asset": "Ativo",
    "form.market": "Mercado",
    "form.select_market": "Selecione o mercado",
    "form.crypto": "₿ Crypto",
    "form.forex": "$ Forex",
    "form.b3": "▲ B3",
    "form.type": "Tipo",
    "form.buy_or_sell": "Compra ou Venda",
    "form.buy": "Compra",
    "form.sell": "Venda",
    "form.take_profit": "Take Profit (valor de ganho)",
    "form.stop_loss": "Stop Loss (valor de perda)",
    "form.trade_result": "Resultado da Operação",
    "form.select_result_warning":
      "⚠️ Selecione o resultado para calcular o valor financeiro",
    "form.take": "Take",
    "form.loss": "Loss",
    "form.auto_calculations": "Cálculos Automáticos",
    "form.risk_reward_ratio": "Razão Risco/Retorno",
    "form.financial_result": "Resultado Financeiro",
    "form.excellent_ratio": "● Excelente (≥3:1)",
    "form.good_ratio": "▲ Bom (≥2:1)",
    "form.risky_ratio": "■ Arriscado (<2:1)",
    "form.emotion": "Emoção Percebida",
    "form.how_felt": "Como você se sentiu?",
    "form.trade_comment": "Comentário sobre o Trade",
    "form.comment_placeholder":
      "Descreva seu raciocínio, observações sobre o mercado, lições aprendidas...",
    "form.saving": "Salvando...",
    "form.save_trade": "Salvar Trade",
    "form.clear": "Limpar",
    "form.analyze_ai": "🤖 Analisar com IA",
    "form.required_fields": "Campos obrigatórios",
    "form.fill_required":
      "Preencha pelo menos: Ativo, Mercado e Tipo para análise.",
    "form.select_market_label": "Selecione o Mercado",
    "form.crypto_b3_forex": "Crypto, B3 ou Forex",
    "form.crypto_icon": "🪙 Crypto",
    "form.b3_icon": "📈 B3",
    "form.forex_icon": "🏦 Forex",
    "form.analysis_method": "Método de Análise",
    "form.choose_processing": "Escolha o método de processamento",
    "form.ai_analysis": "🤖 Análise Por IA (Beta)",
    "form.traditional_analysis": "⚡ Análise MetrikAI (Recomendado)",
    "form.ai_description":
      "✨ IA: Mais inteligente, interpreta qualquer formato, mas pode ser mais lento",
    "form.traditional_description":
      "⚡ Tradicional: Mais rápido e consistente, ideal para formatos padrão",

    // Gráficos/Charts
    "charts.chart_settings": "Configurações do Gráfico",
    "charts.market": "Mercado",
    "charts.asset": "Ativo",
    "charts.timeframe": "Temporalidade",
    "charts.forex": "Forex",
    "charts.crypto": "Crypto",
    "charts.b3_stocks": "B3 (Ações/Futuros)",
    "charts.current_asset": "Ativo Atual:",
    "charts.current_timeframe": "Temporalidade:",
    "charts.interval.1min": "1 minuto",
    "charts.interval.5min": "5 minutos",
    "charts.interval.15min": "15 minutos",
    "charts.interval.30min": "30 minutos",
    "charts.interval.1hour": "1 hora",
    "charts.interval.4hours": "4 horas",
    "charts.interval.daily": "Diário",
    "charts.interval.weekly": "Semanal",
    "charts.professional_chart": "Gráfico profissional integrado",
    "charts.interval_label": "Intervalo:",
    "charts.simulated_data": "Dados em tempo real simulados",
    "charts.updated": "Atualizado:",
    "charts.minutes": "minutos",

    // Diário
    "journal.title": "Diário de Trading",
    "journal.add_entry": "Nova Entrada",
    "journal.date": "Data",
    "journal.content": "Conteúdo",
    "journal.mood": "Humor",
    "journal.lessons": "Lições Aprendidas",
    "journal.save": "Salvar",
    "journal.cancel": "Cancelar",
    "journal.no_entries": "Nenhuma entrada ainda",
    "journal.start_recording":
      "Comece registrando suas reflexões e análises de trading",
    "journal.create_first": "Criar primeira entrada",
    "journal.trades_performed": "trades realizados",
    "journal.accuracy_rate": "de acerto",
    "journal.lessons_label": "Lições:",
    "journal.improvements_label": "Melhorias:",
    "journal.edit_entry": "Editar Entrada",
    "journal.new_entry": "Nova Entrada no Diário",
    "journal.title_field": "Título",
    "journal.title_placeholder": "Ex: Sessão de trading matinal",
    "journal.session_description": "Descrição da Sessão",
    "journal.session_placeholder":
      "Descreva como foi sua sessão de trading hoje...",
    "journal.emotional_state": "Estado Emocional",
    "journal.how_felt": "Como você se sentiu?",
    "journal.number_trades": "Número de Trades",
    "journal.pnl": "P&L (R$)",
    "journal.win_rate": "Assertividade (%)",
    "journal.lessons_learned": "Lições Aprendidas",
    "journal.lessons_placeholder": "O que você aprendeu hoje?",
    "journal.improvements": "Pontos de Melhoria",
    "journal.improvements_placeholder":
      "O que você pode melhorar na próxima sessão?",
    "journal.images": "Imagens",
    "journal.image_added_pending": "Imagem adicionada!",
    "journal.image_added_pending_desc": "A imagem será enviada quando você salvar a entrada.",
    "journal.pending_status": "Pendente",
    "journal.add_images_message": "Adicione imagens que serão salvas junto com a entrada",
    "journal.saving": "Salvando...",
    "journal.update": "Atualizar",
    "journal.delete_confirm": "Tem certeza que deseja deletar esta entrada?",
    "journal.emotion.confident": "Confiante 😎",
    "journal.emotion.anxious": "Ansioso 😰",
    "journal.emotion.impulsive": "Impulsivo 🏃‍♂️",
    "journal.emotion.calm": "Calmo 😌",
    "journal.emotion.euphoric": "Eufórico 🤩",
    "journal.emotion.frustrated": "Frustrado 😤",
    "journal.emotion.neutral": "Neutro 😐",
    "journal.toast.created": "Entrada criada!",
    "journal.toast.created_desc":
      "Sua entrada do diário foi criada com sucesso.",
    "journal.toast.updated": "Entrada atualizada!",
    "journal.toast.updated_desc":
      "Sua entrada do diário foi atualizada com sucesso.",
    "journal.toast.deleted": "Entrada deletada!",
    "journal.toast.deleted_desc":
      "Sua entrada do diário foi deletada com sucesso.",
    "journal.toast.error_save": "Erro ao salvar",
    "journal.toast.error_save_desc":
      "Não foi possível salvar a entrada. Tente novamente.",
    "journal.toast.error_delete": "Erro ao deletar",
    "journal.toast.error_delete_desc":
      "Não foi possível deletar a entrada. Tente novamente.",

    // Corretoras
    "brokers.title": "Corretoras",
    "brokers.csv_import": "Analisar CSVs com IA",
    "brokers.api_config": "Configurar API",
    "brokers.manual_entry": "Entrada Manual",

    // Perfil
    "profile.title": "Perfil",
    "profile.personal_info": "Informações Pessoais",
    "profile.subscription": "Assinatura",
    "profile.settings": "Configurações",

    // Formulários gerais
    "form.save": "Salvar",
    "form.cancel": "Cancelar",
    "form.delete": "Excluir",
    "form.edit": "Editar",
    "form.close": "Fechar",
    "form.submit": "Enviar",

    // Landing Page - Header
    "landing.header.features": "Recursos",
    "landing.header.pricing": "Preços",
    "landing.header.contact": "Contato",
    "landing.header.login": "Entrar",
    "landing.header.start": "Começar Agora",
    "landing.header.start_short": "Começar",

    // Landing Page - Hero Section
    "landing.hero.announcement":
      "✨ Novo: Integração com Gate.io + 3 Corretoras",
    "landing.hero.announcement_mobile": "✨ Novo: Integração Gate.io",
    "landing.hero.title1": "O Fim das",
    "landing.hero.title2": "Planilhas",
    "landing.hero.title3": "de Trading",
    "landing.hero.subtitle":
      "A única plataforma que analisa seus trades automaticamente e revela",
    "landing.hero.subtitle_highlight": "os padrões que geram lucro",
    "landing.hero.feature1": "Import automático de trades",
    "landing.hero.feature2": "Analytics avançado",
    "landing.hero.start_free": "Começar Grátis",
    "landing.hero.watch_demo": "Ver Demo",
    "landing.hero.social_proof1": "1.200+ traders ativos",
    "landing.hero.social_proof2": "2M+ trades analisados",

    // Landing Page - Dashboard Preview
    "landing.dashboard.main_title": "Dashboard Principal",
    "landing.dashboard.live": "Live",
    "landing.dashboard.total_pnl": "P&L Total",
    "landing.dashboard.monthly_growth": "+12.4% este mês",
    "landing.dashboard.win_rate": "Assertividade",
    "landing.dashboard.trades_count": "156/199 trades",
    "landing.dashboard.capital_evolution": "Evolução do Capital",
    "landing.dashboard.connected_brokers": "Corretoras Conectadas",
    "landing.dashboard.synchronized": "Sincronizado",
    "landing.dashboard.active": "Ativo",
    "landing.dashboard.connected": "Conectado",
    "landing.dashboard.demo_total_pnl": "+R$ 28.540",
    "landing.solution.demo_total_profit": "R$ 45.230",
    "landing.solution.demo_trade1_result": "+R$ 1.250",
    "landing.solution.demo_trade2_result": "+R$ 890", 
    "landing.solution.demo_trade3_result": "-R$ 320",

    // Landing Page - Problem Section
    "landing.problem.title1": "95% dos Traders",
    "landing.problem.title2": "Falham Por Não Saberem",
    "landing.problem.title3": "O Que Estão Fazendo Errado",
    "landing.problem.subtitle":
      "Sem dados precisos e análises consistentes, você está operando no escuro. Métrika revela exatamente onde você perde dinheiro e como corrigir.",
    "landing.problem.outdated_sheets": "Planilhas Desatualizadas",
    "landing.problem.outdated_sheets_desc":
      "Você perde tempo preenchendo planilhas manualmente em vez de focar nas operações",
    "landing.problem.imprecise_data": "Dados Imprecisos",
    "landing.problem.imprecise_data_desc":
      "Erros de cálculo e dados inconsistentes levam a decisões erradas",
    "landing.problem.limited_analysis": "Análise Limitada",
    "landing.problem.limited_analysis_desc":
      "Sem insights profundos sobre seus padrões de trading, você repete os mesmos erros",

    // Landing Page - Solution Section
    "landing.solution.badge": "A Solução Definitiva",
    "landing.solution.title1": "Screenshots Reais",
    "landing.solution.title2": "da Plataforma",
    "landing.solution.subtitle":
      "Veja exatamente como o Métrika transforma seus dados de trading em insights acionáveis",
    "landing.solution.dashboard_analytics": "Dashboard Analytics",
    "landing.solution.realtime": "Real-time",
    "landing.solution.total_profit": "Lucro Total",
    "landing.solution.monthly_growth": "+18.5% no mês",
    "landing.solution.winning_trades": "Trades Vencedores",
    "landing.solution.trades_stats": "234/284 trades",
    "landing.solution.monthly_evolution": "Evolução Mensal",
    "landing.solution.recent_trades": "Últimos Trades",
    "landing.solution.features_title1": "Tudo Que Você Precisa Para",
    "landing.solution.features_title2": "Dominar Seus Trades",
    "landing.solution.auto_import": "Import Automático",
    "landing.solution.auto_import_desc":
      "Conecte suas corretoras e tenha todos os trades importados automaticamente. Zero trabalho manual.",
    "landing.solution.ai_analytics": "IA Analytics",
    "landing.solution.ai_analytics_desc":
      "Algoritmos avançados identificam seus padrões de lucro e perda, revelando insights invisíveis.",
    "landing.solution.risk_management": "Risk Management",
    "landing.solution.risk_management_desc":
      "Monitore seu risco em tempo real e receba alertas antes de comprometer seu capital.",
    "landing.solution.smart_journal": "Journal Inteligente",
    "landing.solution.smart_journal_desc":
      "Sistema de journaling que aprende com seus trades e sugere melhorias automáticas.",

    // Landing Page - Statistics
    "landing.stats.title": "Resultados Comprovados",
    "landing.stats.subtitle":
      "Números reais de traders que transformaram seus resultados",
    "landing.stats.trades_analyzed": "Trades Analisados",
    "landing.stats.active_traders": "Traders Ativos",
    "landing.stats.improvement_avg": "Média de Melhoria",
    "landing.stats.satisfaction": "Satisfação",

    // Landing Page - Pricing
    "landing.pricing.badge": "Planos e Preços",
    "landing.pricing.title1": "Escolha o Plano",
    "landing.pricing.title2": "Perfeito para Você",
    "landing.pricing.subtitle":
      "Transforme sua análise de trading hoje mesmo. Cancele quando quiser.",
    "landing.pricing.starter_title": "Trader Starter",
    "landing.pricing.starter_price": "R$ 29,90",
    "landing.pricing.starter_period": "/mês",
    "landing.pricing.starter_trial": "7 dias grátis",
    "landing.pricing.starter_feature1":
      "Acesso completo às métricas dos seus trades",
    "landing.pricing.starter_feature2": "Backup seguro de todo histórico",
    "landing.pricing.starter_feature3": "Anotações detalhadas para cada trade",
    "landing.pricing.starter_feature4":
      "Filtros avançados por mercado e período",
    "landing.pricing.starter_button": "Teste 7 Dias Grátis",
    "landing.pricing.pro_title": "Trader Pro",
    "landing.pricing.pro_price": "R$ 49,90",
    "landing.pricing.pro_period": "/mês",
    "landing.pricing.pro_annual": "Anual: R$ 42/mês",
    "landing.pricing.pro_feature1": "Tudo do Starter +",
    "landing.pricing.pro_feature2": "Suporte integrado direto no app",
    "landing.pricing.pro_feature3": "Análise mensal das suas métricas",
    "landing.pricing.pro_feature4": "Sugestões para melhoria",
    "landing.pricing.pro_feature5": "Integração TradingView",
    "landing.pricing.pro_feature6": "Acompanhamento profissional",
    "landing.pricing.pro_button": "Começar Agora",
    "landing.pricing.black_title": "Trader Black",
    "landing.pricing.black_price": "R$ 97",
    "landing.pricing.black_period": "/mês",
    "landing.pricing.black_annual": "Anual: R$ 80/mês",
    "landing.pricing.black_feature1": "IA treinada no seu histórico",
    "landing.pricing.black_feature2": "Relatórios inteligentes completos",
    "landing.pricing.black_feature3": "Suporte 24h via IA",
    "landing.pricing.black_feature4": "Análise 2x/mês com estratégias",
    "landing.pricing.black_feature5": "Gestão de risco personalizada",
    "landing.pricing.black_feature6": "Call mensal com equipe profissional",
    "landing.pricing.black_button": "Nível Máximo",
    "landing.pricing.guarantee": "Garantia de 30 dias ou seu dinheiro de volta",

    // Landing Page - Testimonials
    "landing.testimonials.title": "O Que Nossos Traders Dizem",
    "landing.testimonials.subtitle":
      "Resultados reais de quem usa o Métrika todos os dias",
    "landing.testimonials.carlos_name": "Carlos Rodrigues",
    "landing.testimonials.carlos_role": "Day Trader • São Paulo",
    "landing.testimonials.carlos_content":
      "Métrika me fez economizar 4 horas por semana que eu gastava com planilhas. Agora posso focar 100% no trading. Meu win rate subiu de 62% para 78%.",
    "landing.testimonials.carlos_improvement": "+R$ 23.400 em 3 meses",
    "landing.testimonials.ana_name": "Ana Silva",
    "landing.testimonials.ana_role": "Swing Trader • Rio de Janeiro",
    "landing.testimonials.ana_content":
      "A integração com Gate.io foi um divisor de águas. Todos os meus trades crypto são importados automaticamente. O analytics revelou padrões que eu nunca tinha notado.",
    "landing.testimonials.ana_improvement": "Assertividade: 65% → 81%",
    "landing.testimonials.pedro_name": "Pedro Santos",
    "landing.testimonials.pedro_role": "Forex Trader • Belo Horizonte",
    "landing.testimonials.pedro_content":
      "Testei várias plataformas de journaling, mas nenhuma chega perto do Métrika. O sistema de IA realmente aprende com meus trades e me dá insights valiosos.",
    "landing.testimonials.pedro_improvement": "Capital cresceu 340%",

    // Landing Page - Features Grid
    "landing.features.title1": "Recursos Exclusivos",
    "landing.features.title2": "que Farão a Diferença",
    "landing.features.subtitle":
      "Cada função foi pensada para acelerar seu progresso e maximizar seus lucros",
    "landing.features.auto_sync": "Sync Automático",
    "landing.features.auto_sync_desc":
      "Importe seus trades e tenha controle sobre cada mercado com todas métricas de visualização organizada.",
    "landing.features.ai_analytics": "IA Analytics",
    "landing.features.ai_analytics_desc":
      "Integração com inteligência artificial para estudar as métricas da sua conta detalhada mostrando as melhores correções e ajustes para potencializar resultados.",
    "landing.features.risk_manager": "Risk Manager",
    "landing.features.risk_manager_desc":
      "Monitore risco em tempo real e receba alertas antes de comprometer capital.",
    "landing.features.smart_journal": "Journal Inteligente",
    "landing.features.smart_journal_desc":
      "Sistema aprende com seus trades e sugere melhorias automaticamente.",
    "landing.features.advanced_charts": "Charts Avançados",
    "landing.features.advanced_charts_desc":
      "Visualizações interativas que revelam padrões ocultos nos seus dados.",
    "landing.features.time_analytics": "Time Analytics",
    "landing.features.time_analytics_desc":
      "Descubra seus ativos, horários e dias mais lucrativos com uma análise de dados eficiente e organizada.",
    "landing.features.multi_asset": "Multi-Asset",
    "landing.features.multi_asset_desc":
      "Forex, Crypto, Ações, Futuros - todos os mercados em uma plataforma.",
    "landing.features.complete_export": "Export Completo",
    "landing.features.complete_export_desc":
      "Exporte relatórios profissionais em PDF para clientes e investidores.",

    // Landing Page - Final CTA
    "landing.cta.title1": "Pare de Perder",
    "landing.cta.title2": "Dinheiro por Falta",
    "landing.cta.title3": "de Dados",
    "landing.cta.subtitle1":
      "95% dos traders falham porque não sabem o que estão fazendo errado.",
    "landing.cta.subtitle2": "Você não precisa ser parte dessa estatística.",
    "landing.cta.feature1": "Setup em 5 minutos",
    "landing.cta.feature2": "Resultados imediatos",
    "landing.cta.feature3": "Garantia 30 dias",
    "landing.cta.main_button": "Transformar Meus Resultados Agora",
    "landing.cta.demo_button": "Ver Demo Completa",
    "landing.cta.social_proof":
      "Mais de 1.200 traders já transformaram seus resultados",
    "landing.cta.rating": "4.9/5 baseado em 500+ avaliações",

    // Landing Page - Footer
    "landing.footer.description":
      "A plataforma de analytics de trading mais avançada do Mundo. Transforme seus dados em lucro com inteligência artificial.",
    "landing.footer.product": "Produto",
    "landing.footer.features": "Recursos",
    "landing.footer.pricing": "Preços",
    "landing.footer.integrations": "Integrações",
    "landing.footer.api": "API",
    "landing.footer.support": "Suporte",
    "landing.footer.contact": "Contato",
    "landing.footer.documentation": "Documentação",
    "landing.footer.tutorials": "Tutoriais",
    "landing.footer.status": "Status",
    "landing.footer.copyright":
      "© 2025 Métrika. Todos os direitos reservados.",
    "landing.footer.made_with_love":
      "Desenvolvido com ❤️ para traders consistentes.",

    // Mensagens
    "messages.success": "Sucesso!",
    "messages.error": "Erro",
    "messages.loading": "Carregando...",
    "messages.no_data": "Nenhum dado encontrado",
    "messages.confirm_delete": "Tem certeza que deseja excluir?",

    // Autenticação
    "auth.login": "Entrar",
    "auth.register": "Cadastrar",
    "auth.email": "Email",
    "auth.password": "Senha",
    "auth.remember_me": "Lembrar de mim",
    "auth.forgot_password": "Esqueci minha senha",

    // Métricas e estatísticas
    "metrics.profitable_trades": "Trades Lucrativos",
    "metrics.losing_trades": "Trades Perdedores",
    "metrics.average_profit": "Lucro Médio",
    "metrics.average_loss": "Perda Média",
    "metrics.best_month": "Melhor Mês",
    "metrics.worst_month": "Pior Mês",

    // Períodos e datas
    "period.daily": "Diário",
    "period.weekly": "Semanal",
    "period.monthly": "Mensal",
    "period.yearly": "Anual",
    "period.all_time": "Todo Período",

    // Status e ações
    "status.active": "Ativo",
    "status.inactive": "Inativo",
    "status.pending": "Pendente",
    "status.completed": "Concluído",
    "action.reset": "Resetar",
    "action.import": "Importar",
    "action.export": "Exportar",
    "action.sync": "Sincronizar",
    "action.refresh": "Atualizar",

    // Corretoras e mercados
    "broker.forex.name": "Forex",
    "broker.forex.type": "Câmbio",
    "broker.forex.description": "Trading Forex com importação CSV",
    "broker.b3.name": "B3",
    "broker.b3.type": "Ações BR",
    "broker.b3.description": "Ações brasileiras B3 com importação CSV",
    "broker.crypto.name": "Crypto",
    "broker.crypto.type": "Criptomoedas",
    "broker.crypto.description": "Trading de criptomoedas com importação CSV",

    // Setups de trading
    "setup.breakout": "Breakout",
    "setup.pullback": "Pullback",
    "setup.reversao": "Reversão",
    "setup.tendencia": "Tendência",
    "setup.support_resistance": "Support/Resistance",
    "setup.fibonacci": "Fibonacci",
    "setup.candlestick": "Candlestick Pattern",
    "setup.divergencia": "Divergência",
    "setup.scalping": "Scalping",
    "setup.swing": "Swing",

    // Emoções
    "emotion.confiante": "Confiante",
    "emotion.ansioso": "Ansioso",
    "emotion.impulsivo": "Impulsivo",
    "emotion.calmo": "Calmo",
    "emotion.euforico": "Eufórico",
    "emotion.frustrado": "Frustrado",
    "emotion.neutro": "Neutro",

    // Labels de gráficos
    "chart.profitability_accumulated": "Rentabilidade Acumulada",
    "chart.period_result": "Resultado do Período",
    "chart.daily": "Dia",
    "chart.weekly": "Semana",
    "chart.monthly": "Mês",
    "chart.yearly": "Ano",
    "chart.all_months": "Todos",
    "chart.specific_month": "Mês Específico",
    "chart.select_month": "Selecione o mês",

    // Períodos de tempo
    "time.day": "Dia",
    "time.week": "Semana",
    "time.month": "Mês",
    "time.year": "Ano",
    "time.all": "Todos",

    // Filtros
    "filter.consolidate_all_data": "Consolidar Todos os Dados",
    "filter.filter_by_market": "Filtrar por Mercado",
    "filter.filter_by_csv": "Filtrar por CSVs Importados",

    // Importações
    "imports.manage_description":
      "Gerencie suas importações CSV e trades manuais",
    "imports.csv_imported": "CSV Importados",
    "imports.manual_trades": "Trades Manuais",

    // Estados vazios
    "empty.no_csv_imports": "Nenhuma importação CSV realizada ainda",
    "empty.no_manual_trades": "Nenhum trade manual criado ainda",

    // Trades
    "trades.edit_manual_trade": "Editar Trade Manual",
    "trades.edit_trade_description":
      "Altere as informações do trade selecionado",
    "trades.asset": "Ativo",

    // Gráficos
    "charts.register_trades_to_see":
      "Registre alguns trades para ver o gráfico",

    // Ações comuns
    "common.cancel": "Cancelar",
    "common.save": "Salvar",
    "common.saving": "Salvando...",

    // Métricas
    "metrics.operations_precision": "Precisão das operações",
    "metrics.operations_performed": "Operações realizadas",
    "metrics.risk_vs_return": "Risco vs Retorno",
    "metrics.general_risk_return": "Risco/Retorno geral",
    "metrics.sum_all_brokers": "Soma de todas as corretoras",
    "metrics.weighted_average": "Média ponderada",
    "metrics.win_rate": "Assertividade",
    "metrics.net_pnl": "PnL Líquido",
    "metrics.day_win_rate": "Dias Lucrativos %",
    "metrics.risk_reward": "Risco/Retorno",
    "metrics.avg_win_loss": "Ganho/Perda Médio",
    "metrics.daily_net_pnl": "PnL Diário Líquido",
    "metrics.progress_tracker": "Rastreamento de Progresso",

    // Placeholders e dicas
    "placeholder.select_month": "Selecione o mês",
    "placeholder.select_option": "Selecione uma opção",
    "placeholder.select_view_mode": "Selecione o modo de visualização",
    "placeholder.select_market": "Selecione o Mercado",
    "placeholder.search": "Pesquisar...",

    // Upload e importação
    "upload.csv_import": "Importação CSV",
    "upload.select_file": "Selecionar arquivo",
    "upload.analyzing": "Analisando...",
    "upload.processing": "Processando...",
    "upload.success": "Sucesso!",
    "upload.error": "Erro no upload",

    // Dias da semana
    "weekdays.sunday": "Domingo",
    "weekdays.monday": "Segunda",
    "weekdays.tuesday": "Terça",
    "weekdays.wednesday": "Quarta",
    "weekdays.thursday": "Quinta",
    "weekdays.friday": "Sexta",
    "weekdays.saturday": "Sábado",

    // Mensagens de estado vazio
    "empty.no_trades_period": "Nenhum trade no período selecionado",

    // Assistente IA
    "ai.chat_title": "Assistente IA",
    "ai.chat_title_short": "IA",
    "ai.welcome_message":
      "Olá! Sou seu assistente de trading. Como posso ajudá-lo hoje? Posso analisar seus trades, dar sugerências de mercado ou tirar dúvidas sobre estratégias.",
    "ai.error_message":
      "Desculpe, ocorreu um erro. Tente novamente em alguns instantes.",
    "ai.input_placeholder": "Digite sua mensagem...",
    "ai.send_button": "Enviar",
    "ai.minimize_button": "Minimizar",
    "ai.maximize_button": "Maximizar",
    "ai.close_button": "Fechar",

    // Landing Page - Features Grid
    "landing.features.sync_title": "Sync Automático",
    "landing.features.sync_description":
      "Importe seus trades e tenha controle sobre cada mercado com todas métricas de visualização organizada.",
    "landing.features.ai_title": "IA Analytics",
    "landing.features.ai_description":
      "Integração com inteligência artificial para estudar as métricas da sua conta detalhada mostrando as melhores correções e ajustes para potencializar resultados.",
    "landing.features.risk_title": "Risk Manager",
    "landing.features.risk_description":
      "Monitore risco em tempo real e receba alertas antes de comprometer capital.",
    "landing.features.journal_title": "Journal Inteligente",
    "landing.features.journal_description":
      "Sistema aprende com seus trades e sugere melhorias automaticamente.",
    "landing.features.charts_title": "Charts Avançados",
    "landing.features.charts_description":
      "Visualizações interativas que revelam padrões ocultos nos seus dados.",
    "landing.features.time_title": "Time Analytics",
    "landing.features.time_description":
      "Descubra seus ativos, horários e dias mais lucrativos com uma análise de dados eficiente e organizada.",
    "landing.features.multiasset_title": "Multi-Asset",
    "landing.features.multiasset_description":
      "Forex, Crypto, Ações, Futuros - todos os mercados em uma plataforma.",
    "landing.features.export_title": "Export Completo",
    "landing.features.export_description":
      "Exporte relatórios profissionais em PDF para clientes e investidores",

    // Login Modal
    "login.title": "Entrar no Métrika",
    "login.subtitle": "Acesse sua conta para continuar",
    "login.email_label": "Email",
    "login.email_placeholder": "seu@email.com",
    "login.password_label": "Senha",
    "login.password_placeholder": "••••••••",
    "login.remember_me": "Lembrar de mim",
    "login.forgot_password": "Esqueceu a senha?",
    "login.submit_button": "Entrar",
    "login.loading_button": "Entrando...",
    "login.no_account": "Não tem conta?",
    "login.create_account": "Criar conta gratuita",

    // Register Modal
    "register.title": "Criar Conta no Métrika",
    "register.subtitle": "Comece sua jornada para melhores resultados",
    "register.name_label": "Nome Completo",
    "register.name_placeholder": "João Silva",
    "register.email_label": "Email",
    "register.phone_label": "Telefone",
    "register.phone_placeholder": "(11) 99999-9999",
    "register.email_placeholder": "seu@email.com",
    "register.password_label": "Senha",
    "register.password_placeholder": "••••••••",
    "register.confirm_password_label": "Confirmar Senha",
    "register.confirm_password_placeholder": "••••••••",
    "register.terms_agreement": "Aceito os",
    "register.terms_link": "Termos de Uso",
    "register.and": "e",
    "register.privacy_link": "Política de Privacidade",
    "register.submit_button": "Criar Conta Gratuita",
    "register.loading_button": "Criando conta...",
    "register.already_have_account": "Já tem conta?",
    "register.login_link": "Fazer login",
    "register.success_title": "Conta criada com sucesso!",
    "register.success_description":
      "Agora você pode fazer login com suas credenciais.",
    "register.error_title": "Erro ao criar conta",
    "register.error_description": "Tente novamente mais tarde.",
  },

  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.trades": "Trades",
    "nav.calendar": "Calendar",
    "nav.charts": "Charts",
    "nav.journal": "Journal",
    "nav.brokers": "Brokers",
    "nav.profile": "Profile",
    "nav.admin": "Admin",
    "nav.logout": "Logout",

    // Support
    "support.title": "Support",
    "support.description": "Contact us for help with your account",
    "support.new_conversation": "New Conversation",
    "support.subject_label": "Subject",
    "support.subject_placeholder": "Briefly describe the problem",
    "support.category_label": "Category",
    "support.category_technical": "Technical Issue",
    "support.category_billing": "Billing",
    "support.category_feature": "Feature Request",
    "support.category_general": "General Question",
    "support.priority_label": "Priority",
    "support.priority_low": "Low",
    "support.priority_medium": "Medium",
    "support.priority_high": "High",
    "support.message_label": "Message",
    "support.message_placeholder":
      "Describe your question or problem in detail...",
    "support.send_button": "Send Message",
    "support.start_conversation": "Start Conversation",
    "support.no_conversations": "No conversations yet",
    "support.no_conversations_desc": 'Click "New Conversation" to start',
    "support.status_open": "Open",
    "support.status_in_progress": "In Progress",
    "support.status_resolved": "Resolved",
    "support.status_closed": "Closed",
    "support.conversation_started": "Conversation started successfully!",
    "support.message_sent": "Message sent!",
    "support.loading": "Loading...",
    "support.error": "Error loading support",

    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.overview": "Overview",
    "dashboard.total_balance": "Total Balance",
    "dashboard.monthly_result": "Monthly Result",
    "dashboard.win_rate": "Win Rate",
    "dashboard.total_trades": "Total Trades",
    "dashboard.avg_rr": "Avg R/R",
    "dashboard.best_setup": "Best Setup",
    "dashboard.worst_setup": "Worst Setup",
    "dashboard.recent_trades": "Recent Trades",
    "dashboard.performance_chart": "Performance Chart",
    "dashboard.ai_insights": "AI Insights",
    "dashboard.trading_calendar": "Trading Calendar",
    "dashboard.best_trade": "Best Trade",
    "dashboard.worst_trade": "Worst Trade",
    "dashboard.frequent_emotion": "Frequent Emotion",
    "dashboard.capital_curve": "Capital Curve",
    "dashboard.detailed_temporal_performance": "Detailed Temporal Performance",
    "dashboard.imports_and_trades": "Imports and Trades History",
    "dashboard.consolidated_total": "Total Consolidated Result",
    "dashboard.market_distribution": "Market Distribution",

    // Tabs
    "tabs.imports": "Imports",
    "tabs.consolidated": "Consolidated",

    // Time filters
    "time.7_days": "7 Days",
    "time.1_year": "1 Year",
    "time.times": "times",
    "time.trades_today": "Trades Today",

    // Emotions
    "emotion.neutral": "neutral",

    // Consolidation
    "consolidated.summary": "Consolidated Summary",
    "consolidated.market_analysis":
      "Consolidated analysis of different markets",

    // Charts and Metrics
    "metrics.accumulated_profitability": "Accumulated Profitability",
    "metrics.period_result": "Period Result",
    "metrics.profits": "✅ Profits",
    "metrics.losses": "❌ Losses",
    "metrics.total_profits": "Total Profits",
    "metrics.total_losses": "Total Losses",
    "metrics.period_result_short": "Period Result",
    "metrics.total_profitability": "Total Profitability",
    "metrics.general_result": "General result",
    "metrics.profitability_chart": "Profitability Chart Over Time",
    "metrics.result": "Result",

    // Trades
    "trades.title": "Trades",
    "trades.add_new": "New Trade",
    "trades.symbol": "Symbol",
    "trades.market": "Market",
    "trades.setup": "Setup",
    "trades.capital": "Capital",
    "trades.stop": "Stop",
    "trades.target": "Target",
    "trades.result": "Result",
    "trades.quantity": "Quantity",
    "trades.risk": "Risk",
    "trades.type": "Type",
    "trades.comment": "Comment",
    "trades.emotion": "Emotion",
    "trades.entry_price": "Entry Price",
    "trades.exit_price": "Exit Price",
    "trades.broker": "Broker",
    "trades.status": "Status",
    "trades.date": "Date/Time",
    "trades.actions": "Actions",
    "trades.edit": "Edit",
    "trades.delete": "Delete",
    "trades.filter_all": "All",
    "trades.no_trades": "No trades found",

    // Trade Form
    "trade_form.title_add": "Add Trade",
    "trade_form.title_edit": "Edit Trade",
    "trade_form.symbol_placeholder": "e.g., BTCUSD, EURUSD",
    "trade_form.setup_placeholder": "e.g., Breakout, Pullback",
    "trade_form.comment_placeholder": "Trade observations",
    "trade_form.emotion_placeholder": "How did you feel",
    "trade_form.take_result": "Take (profit)",
    "trade_form.loss_result": "Loss",
    "trade_form.save": "Save Trade",
    "trade_form.cancel": "Cancel",
    "trade_form.validation_required": "Required field",
    "trade_form.validation_positive": "Must be greater than zero",

    // Charts
    "charts.title": "Chart",

    // Calendar
    "calendar.title": "Trading Calendar",
    "calendar.trades_count": "trades",
    "calendar.win": "win",
    "calendar.diary_entry": "Diary Entry",
    "calendar.add_diary": "Add to Diary",
    "calendar.edit_diary": "Edit Diary",
    "calendar.how_to_use": "How to Use Calendar",
    "calendar.profitable_days": "Profitable Days",
    "calendar.profitable_days_desc":
      "Marked with green dot, show positive P&L for the day",
    "calendar.loss_days": "Loss Days",
    "calendar.loss_days_desc":
      "Marked with red dot, show negative P&L for the day",
    "calendar.weekly_summary": "Weekly Summary",
    "calendar.weekly_summary_desc":
      "Side column with consolidated weekly totals",
    "calendar.analysis_tips": "Analysis Tips",
    "calendar.temporal_patterns": "📈 Temporal Patterns",
    "calendar.improvement_strategies": "🎯 Improvement Strategies",
    "calendar.tip1": "Identify which days of the week are most profitable",
    "calendar.tip2": "Observe patterns in win/loss sequences",
    "calendar.tip3": "Analyze performance across different weeks of the month",
    "calendar.tip4": "Compare months to identify seasonality",
    "calendar.strategy1": "Avoid trading on consistently negative days",
    "calendar.strategy2": "Increase volume on more profitable days/periods",
    "calendar.strategy3": "Take breaks after losing streaks",
    "calendar.strategy4": "Document what worked on green days",

    // Abbreviated weekdays
    "calendar.sun_short": "Sun",
    "calendar.mon_short": "Mon",
    "calendar.tue_short": "Tue",
    "calendar.wed_short": "Wed",
    "calendar.thu_short": "Thu",
    "calendar.fri_short": "Fri",
    "calendar.sat_short": "Sat",

    // Summaries and statistics
    "calendar.summary_of": "Summary of",
    "calendar.pnl_total": "Total P&L",
    "calendar.day": "day",
    "calendar.days": "days",
    "calendar.week": "Week",
    "calendar.trading_days": "Trading Days",
    "calendar.total_trades": "Total Trades",
    "calendar.win_rate": "Win Rate",

    // Learning
    "learning.title": "Learning Center",
    "learning.tour": "Platform Tour",
    "learning.videos": "Video Lessons",
    "learning.progress": "Your Progress",
    "learning.description": "Master the trading platform with our tutorials and take a guided tour through all features",
    "learning.tour_interactive": "Interactive Platform Tour",
    "learning.tour_description": "Take a complete and interactive tour of the platform! The system will automatically navigate through each section, highlighting important elements and explaining how to use each feature.",
    "learning.tour_features.auto_nav": "Automatic navigation between pages",
    "learning.tour_features.highlights": "Visual highlights on elements",
    "learning.tour_features.explanations": "Detailed contextual explanations",
    "learning.tour_features.steps": "13 complete steps",
    "learning.tour_start": "Start Interactive Tour",
    "learning.sections.basics": "Getting Started",
    "learning.sections.basics_desc": "Learn the basics to start using the platform",
    "learning.sections.analysis": "Analysis & Reports",
    "learning.sections.analysis_desc": "Master the platform's analysis tools",
    "learning.sections.advanced": "Advanced Features",
    "learning.sections.advanced_desc": "Make the most of premium features",
    "learning.videos.first_trade": "How to record your first trade",
    "learning.videos.csv_import": "Importing data via CSV",
    "learning.videos.goals": "Setting up your goals",
    "learning.videos.dashboard": "Reading dashboard metrics",
    "learning.videos.calendar": "Using the trading calendar",
    "learning.videos.charts": "Interpreting performance charts",
    "learning.videos.ai_csv": "AI for CSV analysis",
    "learning.videos.risk": "Advanced risk management",
    "learning.videos.journal": "Trading journal and insights",
    "learning.stats.videos_watched": "Videos Watched",
    "learning.stats.general_progress": "Overall Progress",
    "learning.stats.time_watched": "Time Watched",

    // Tour
    "tour.welcome.title": "Welcome to METRIKA!",
    "tour.welcome.description": "Let's take a complete tour of the trading analysis platform. You'll learn how to use each feature.",
    "tour.dashboard_overview.title": "Dashboard - Overview",
    "tour.dashboard_overview.description": "This is your main dashboard. Here you can view a complete summary of your performance, including total profitability, number of trades, and key metrics.",
    "tour.metrics_cards.title": "Metrics Cards",
    "tour.metrics_cards.description": "These cards show your main statistics: profitability, total trades, hit rate and other important indicators to track your performance.",
    "tour.performance_chart.title": "Performance Chart",
    "tour.performance_chart.description": "Visualize the evolution of your profitability over time. This chart helps identify trends and periods of better or worse performance.",
    "tour.sidebar_navigation.title": "Side Navigation",
    "tour.sidebar_navigation.description": "Use the sidebar to navigate between different sections of the platform. Each icon represents a specific functionality.",
    "tour.new_trade.title": "New Trade",
    "tour.new_trade.description": "Here you can register new trades manually or import data via CSV. It's the entry point for all your trading data.",
    "tour.csv_analysis.title": "CSV Analysis with AI",
    "tour.csv_analysis.description": "Our AI can analyze your CSV files automatically, detecting trades and extracting important information, regardless of file format.",
    "tour.risk_management.title": "Risk Management",
    "tour.risk_management.description": "Calculate the ideal position size, manage risk per operation and project your capital growth based on your goals.",
    "tour.trading_calendar.title": "Trading Calendar",
    "tour.trading_calendar.description": "Visualize your daily performance, identify temporal patterns and analyze your best and worst trading days in calendar format.",
    "tour.trading_journal.title": "Trading Journal",
    "tour.trading_journal.description": "Keep a detailed record of your thoughts, emotions and lessons learned. The journal is fundamental for your evolution as a trader.",
    "tour.ai_chat.title": "AI Chat",
    "tour.ai_chat.description": "Chat with our AI to get insights about your trades, strategies and performance. It can help analyze patterns and suggest improvements.",
    "tour.support.title": "Support",
    "tour.support.description": "Need help? Our support section offers answers to frequent questions and direct channel to contact us.",
    "tour.complete.title": "Tour Complete!",
    "tour.complete.description": "Congratulations! Now you know all the main features of the platform. Keep exploring and make the most of your analysis tools.",

    // New Trade and CSV
    "trade.manual": "Manual",
    "trade.import_csv": "Import CSV",
    "trade.csv_file": "CSV File",
    "trade.csv_format_by_market": "CSV Format by Market",
    "trade.analyzing_ai": "Analyzing with AI...",
    "trade.import_with_ai": "🤖 Import with AI",
    "trade.import_fast": "⚡ Import Fast",
    "trade.csv_rejected": "❌ CSV file rejected:",
    "trade.processing": "Processing...",
    "trade.import_trades_csv": "Import Trades via CSV",
    "trade.select_csv_exported": "Select a CSV file exported from your market",
    "trade.analysis_complete": "✨ Deep Analysis Complete",
    "trade.insights_generated":
      "detailed insights generated! View the complete analysis on screen.",
    "trade.import_csv_first": "Import a CSV file first to use AI analysis.",

    // Manual Trade Form
    "form.trade_data": "Trade Data",
    "form.date_time": "Date and Time",
    "form.asset": "Asset",
    "form.market": "Market",
    "form.select_market": "Select market",
    "form.crypto": "₿ Crypto",
    "form.forex": "$ Forex",
    "form.b3": "▲ B3",
    "form.type": "Type",
    "form.buy_or_sell": "Buy or Sell",
    "form.buy": "Buy",
    "form.sell": "Sell",
    "form.take_profit": "Take Profit (gain value)",
    "form.stop_loss": "Stop Loss (loss value)",
    "form.trade_result": "Trade Result",
    "form.select_result_warning":
      "⚠️ Select result to calculate financial value",
    "form.take": "Take",
    "form.loss": "Loss",
    "form.auto_calculations": "Automatic Calculations",
    "form.risk_reward_ratio": "Risk/Reward Ratio",
    "form.financial_result": "Financial Result",
    "form.excellent_ratio": "● Excellent (≥3:1)",
    "form.good_ratio": "▲ Good (≥2:1)",
    "form.risky_ratio": "■ Risky (<2:1)",
    "form.emotion": "Perceived Emotion",
    "form.how_felt": "How did you feel?",
    "form.trade_comment": "Trade Comment",
    "form.comment_placeholder":
      "Describe your reasoning, market observations, lessons learned...",
    "form.saving": "Saving...",
    "form.save_trade": "Save Trade",
    "form.clear": "Clear",
    "form.analyze_ai": "🤖 Analyze with AI",
    "form.required_fields": "Required fields",
    "form.fill_required": "Fill at least: Asset, Market and Type for analysis.",
    "form.select_market_label": "Select Market",
    "form.crypto_b3_forex": "Crypto, B3 or Forex",
    "form.crypto_icon": "🪙 Crypto",
    "form.b3_icon": "📈 B3",
    "form.forex_icon": "🏦 Forex",
    "form.analysis_method": "Analysis Method",
    "form.choose_processing": "Choose processing method",
    "form.ai_analysis": "🤖 AI Analysis (Beta)",
    "form.traditional_analysis": "⚡ MetrikAI Analysis (Recommended)",
    "form.ai_description":
      "✨ AI: Smarter, interprets any format, but may be slower",
    "form.traditional_description":
      "⚡ Traditional: Faster and consistent, ideal for standard formats",

    // Charts
    "charts.chart_settings": "Chart Settings",
    "charts.market": "Market",
    "charts.asset": "Asset",
    "charts.timeframe": "Timeframe",
    "charts.forex": "Forex",
    "charts.crypto": "Crypto",
    "charts.b3_stocks": "B3 (Stocks/Futures)",
    "charts.current_asset": "Current Asset:",
    "charts.current_timeframe": "Timeframe:",
    "charts.interval.1min": "1 minute",
    "charts.interval.5min": "5 minutes",
    "charts.interval.15min": "15 minutes",
    "charts.interval.30min": "30 minutes",
    "charts.interval.1hour": "1 hour",
    "charts.interval.4hours": "4 hours",
    "charts.interval.daily": "Daily",
    "charts.interval.weekly": "Weekly",
    "charts.professional_chart": "Professional integrated chart",
    "charts.interval_label": "Interval:",
    "charts.simulated_data": "Real-time simulated data",
    "charts.updated": "Updated:",
    "charts.minutes": "minutes",

    // Journal
    "journal.title": "Trading Journal",
    "journal.add_entry": "New Entry",
    "journal.date": "Date",
    "journal.content": "Content",
    "journal.mood": "Mood",
    "journal.lessons": "Lessons Learned",
    "journal.save": "Save",
    "journal.cancel": "Cancel",
    "journal.no_entries": "No entries yet",
    "journal.start_recording":
      "Start recording your trading thoughts and analysis",
    "journal.create_first": "Create first entry",
    "journal.trades_performed": "trades performed",
    "journal.accuracy_rate": "accuracy rate",
    "journal.lessons_label": "Lessons:",
    "journal.improvements_label": "Improvements:",
    "journal.edit_entry": "Edit Entry",
    "journal.new_entry": "New Diary Entry",
    "journal.title_field": "Title",
    "journal.title_placeholder": "Ex: Morning trading session",
    "journal.session_description": "Session Description",
    "journal.session_placeholder":
      "Describe how your trading session went today...",
    "journal.emotional_state": "Emotional State",
    "journal.how_felt": "How did you feel?",
    "journal.number_trades": "Number of Trades",
    "journal.pnl": "P&L ($)",
    "journal.win_rate": "Win Rate (%)",
    "journal.lessons_learned": "Lessons Learned",
    "journal.lessons_placeholder": "What did you learn today?",
    "journal.improvements": "Improvement Points",
    "journal.improvements_placeholder":
      "What can you improve in the next session?",
    "journal.images": "Images",
    "journal.image_added_pending": "Image added!",
    "journal.image_added_pending_desc": "The image will be uploaded when you save the entry.",
    "journal.pending_status": "Pending",
    "journal.add_images_message": "Add images that will be saved with the entry",
    "journal.saving": "Saving...",
    "journal.update": "Update",
    "journal.delete_confirm": "Are you sure you want to delete this entry?",
    "journal.emotion.confident": "Confident 😎",
    "journal.emotion.anxious": "Anxious 😰",
    "journal.emotion.impulsive": "Impulsive 🏃‍♂️",
    "journal.emotion.calm": "Calm 😌",
    "journal.emotion.euphoric": "Euphoric 🤩",
    "journal.emotion.frustrated": "Frustrated 😤",
    "journal.emotion.neutral": "Neutral 😐",
    "journal.toast.created": "Entry created!",
    "journal.toast.created_desc": "Your diary entry was created successfully.",
    "journal.toast.updated": "Entry updated!",
    "journal.toast.updated_desc": "Your diary entry was updated successfully.",
    "journal.toast.deleted": "Entry deleted!",
    "journal.toast.deleted_desc": "Your diary entry was deleted successfully.",
    "journal.toast.error_save": "Error saving",
    "journal.toast.error_save_desc":
      "Could not save the entry. Please try again.",
    "journal.toast.error_delete": "Error deleting",
    "journal.toast.error_delete_desc":
      "Could not delete the entry. Please try again.",

    // Brokers
    "brokers.title": "Brokers",
    "brokers.csv_import": "Import CSV",
    "brokers.api_config": "API Config",
    "brokers.manual_entry": "Manual Entry",

    // Profile
    "profile.title": "Profile",
    "profile.personal_info": "Personal Information",
    "profile.subscription": "Subscription",
    "profile.settings": "Settings",

    // General Forms
    "form.save": "Save",
    "form.cancel": "Cancel",
    "form.delete": "Delete",
    "form.edit": "Edit",
    "form.close": "Close",
    "form.submit": "Submit",

    // Landing Page - Header
    "landing.header.features": "Features",
    "landing.header.pricing": "Pricing",
    "landing.header.contact": "Contact",
    "landing.header.login": "Login",
    "landing.header.start": "Get Started",
    "landing.header.start_short": "Start",

    // Landing Page - Hero Section
    "landing.hero.announcement": "✨ New: Integration with Gate.io + 3 Brokers",
    "landing.hero.announcement_mobile": "✨ New: Gate.io Integration",
    "landing.hero.title1": "The End of",
    "landing.hero.title2": "Trading",
    "landing.hero.title3": "Spreadsheets",
    "landing.hero.subtitle":
      "The only platform that analyzes your trades automatically and reveals",
    "landing.hero.subtitle_highlight": "the patterns that generate profit",
    "landing.hero.feature1": "Automatic trade import",
    "landing.hero.feature2": "Advanced analytics",
    "landing.hero.start_free": "Start Free",
    "landing.hero.watch_demo": "Watch Demo",
    "landing.hero.social_proof1": "1,200+ active traders",
    "landing.hero.social_proof2": "2M+ trades analyzed",

    // Landing Page - Dashboard Preview
    "landing.dashboard.main_title": "Main Dashboard",
    "landing.dashboard.live": "Live",
    "landing.dashboard.total_pnl": "Total P&L",
    "landing.dashboard.monthly_growth": "+12.4% this month",
    "landing.dashboard.win_rate": "Win Rate",
    "landing.dashboard.trades_count": "156/199 trades",
    "landing.dashboard.capital_evolution": "Capital Evolution",
    "landing.dashboard.connected_brokers": "Connected Brokers",
    "landing.dashboard.synchronized": "Synchronized",
    "landing.dashboard.active": "Active",
    "landing.dashboard.connected": "Connected",
    "landing.dashboard.demo_total_pnl": "+$28,540",
    "landing.solution.demo_total_profit": "$45,230",
    "landing.solution.demo_trade1_result": "+$1,250",
    "landing.solution.demo_trade2_result": "+$890", 
    "landing.solution.demo_trade3_result": "-$320",

    // Landing Page - Problem Section
    "landing.problem.title1": "95% of Traders",
    "landing.problem.title2": "Fail Because They Don't Know",
    "landing.problem.title3": "What They're Doing Wrong",
    "landing.problem.subtitle":
      "Without accurate data and consistent analysis, you're trading in the dark. Métrika reveals exactly where you lose money and how to fix it.",
    "landing.problem.outdated_sheets": "Outdated Spreadsheets",
    "landing.problem.outdated_sheets_desc":
      "You waste time filling spreadsheets manually instead of focusing on trades",
    "landing.problem.imprecise_data": "Imprecise Data",
    "landing.problem.imprecise_data_desc":
      "Calculation errors and inconsistent data lead to wrong decisions",
    "landing.problem.limited_analysis": "Limited Analysis",
    "landing.problem.limited_analysis_desc":
      "Without deep insights into your trading patterns, you repeat the same mistakes",

    // Landing Page - Solution Section
    "landing.solution.badge": "The Definitive Solution",
    "landing.solution.title1": "Real Screenshots",
    "landing.solution.title2": "of the Platform",
    "landing.solution.subtitle":
      "See exactly how Métrika transforms your trading data into actionable insights",
    "landing.solution.dashboard_analytics": "Dashboard Analytics",
    "landing.solution.realtime": "Real-time",
    "landing.solution.total_profit": "Total Profit",
    "landing.solution.monthly_growth": "+18.5% this month",
    "landing.solution.winning_trades": "Winning Trades",
    "landing.solution.trades_stats": "234/284 trades",
    "landing.solution.monthly_evolution": "Monthly Evolution",
    "landing.solution.recent_trades": "Recent Trades",
    "landing.solution.features_title1": "Everything You Need To",
    "landing.solution.features_title2": "Master Your Trades",
    "landing.solution.auto_import": "Auto Import",
    "landing.solution.auto_import_desc":
      "Connect your brokers and have all trades imported automatically. Zero manual work.",
    "landing.solution.ai_analytics": "AI Analytics",
    "landing.solution.ai_analytics_desc":
      "Advanced algorithms identify your profit and loss patterns, revealing invisible insights.",
    "landing.solution.risk_management": "Risk Management",
    "landing.solution.risk_management_desc":
      "Monitor your risk in real-time and receive alerts before compromising your capital.",
    "landing.solution.smart_journal": "Smart Journal",
    "landing.solution.smart_journal_desc":
      "Journaling system that learns from your trades and suggests automatic improvements.",

    // Landing Page - Statistics
    "landing.stats.title": "Proven Results",
    "landing.stats.subtitle":
      "Real numbers from traders who transformed their results",
    "landing.stats.trades_analyzed": "Trades Analyzed",
    "landing.stats.active_traders": "Active Traders",
    "landing.stats.improvement_avg": "Average Improvement",
    "landing.stats.satisfaction": "Satisfaction",

    // Landing Page - Pricing
    "landing.pricing.badge": "Plans and Pricing",
    "landing.pricing.title1": "Choose the Plan",
    "landing.pricing.title2": "Perfect for You",
    "landing.pricing.subtitle":
      "Transform your trading analysis today. Cancel anytime.",
    "landing.pricing.starter_title": "Trader Starter",
    "landing.pricing.starter_price": "$19.99",
    "landing.pricing.starter_period": "/month",
    "landing.pricing.starter_trial": "7 days free",
    "landing.pricing.starter_feature1": "Complete access to your trade metrics",
    "landing.pricing.starter_feature2": "Secure backup of entire history",
    "landing.pricing.starter_feature3": "Detailed notes for each trade",
    "landing.pricing.starter_feature4": "Advanced filters by market and period",
    "landing.pricing.starter_button": "Try 7 Days Free",
    "landing.pricing.pro_title": "Trader Pro",
    "landing.pricing.pro_price": "$29.99",
    "landing.pricing.pro_period": "/month",
    "landing.pricing.pro_annual": "Annual: $25/month",
    "landing.pricing.pro_feature1": "Everything in Starter +",
    "landing.pricing.pro_feature2": "Integrated support directly in app",
    "landing.pricing.pro_feature3": "Monthly analysis of your metrics",
    "landing.pricing.pro_feature4": "Improvement suggestions",
    "landing.pricing.pro_feature5": "TradingView integration",
    "landing.pricing.pro_feature6": "Professional monitoring",
    "landing.pricing.pro_button": "Start Now",
    "landing.pricing.black_title": "Trader Black",
    "landing.pricing.black_price": "$59",
    "landing.pricing.black_period": "/month",
    "landing.pricing.black_annual": "Annual: $49/month",
    "landing.pricing.black_feature1": "AI trained on your history",
    "landing.pricing.black_feature2": "Complete intelligent reports",
    "landing.pricing.black_feature3": "24h AI support",
    "landing.pricing.black_feature4": "2x/month analysis with strategies",
    "landing.pricing.black_feature5": "Personalized risk management",
    "landing.pricing.black_feature6": "Monthly call with professional team",
    "landing.pricing.black_button": "Maximum Level",
    "landing.pricing.guarantee": "30-day guarantee or your money back",

    // Landing Page - Testimonials
    "landing.testimonials.title": "What Our Traders Say",
    "landing.testimonials.subtitle":
      "Real results from those who use Métrika every day",
    "landing.testimonials.carlos_name": "Carlos Rodrigues",
    "landing.testimonials.carlos_role": "Day Trader • São Paulo",
    "landing.testimonials.carlos_content":
      "Métrika saved me 4 hours per week that I spent on spreadsheets. Now I can focus 100% on trading. My win rate went from 62% to 78%.",
    "landing.testimonials.carlos_improvement": "+$15,600 in 3 months",
    "landing.testimonials.ana_name": "Ana Silva",
    "landing.testimonials.ana_role": "Swing Trader • Rio de Janeiro",
    "landing.testimonials.ana_content":
      "The Gate.io integration was a game changer. All my crypto trades are imported automatically. Analytics revealed patterns I had never noticed.",
    "landing.testimonials.ana_improvement": "Assertividade: 65% → 81%",
    "landing.testimonials.pedro_name": "Pedro Santos",
    "landing.testimonials.pedro_role": "Forex Trader • Belo Horizonte",
    "landing.testimonials.pedro_content":
      "I tested several journaling platforms, but none come close to Métrika. The AI system really learns from my trades and gives me valuable insights.",
    "landing.testimonials.pedro_improvement": "Capital grew 340%",

    // Landing Page - Features Grid
    "landing.features.title1": "Exclusive Features",
    "landing.features.title2": "that Make the Difference",
    "landing.features.subtitle":
      "Each function was designed to accelerate your progress and maximize your profits",
    "landing.features.auto_sync": "Auto Sync",
    "landing.features.auto_sync_desc":
      "Import your trades and have control over each market with all organized visualization metrics.",
    "landing.features.ai_analytics": "AI Analytics",
    "landing.features.ai_analytics_desc":
      "Artificial intelligence integration to study your account metrics in detail showing the best corrections and adjustments to boost results.",
    "landing.features.risk_manager": "Risk Manager",
    "landing.features.risk_manager_desc":
      "Monitor risk in real-time and receive alerts before compromising capital.",
    "landing.features.smart_journal": "Smart Journal",
    "landing.features.smart_journal_desc":
      "System learns from your trades and suggests improvements automatically.",
    "landing.features.advanced_charts": "Advanced Charts",
    "landing.features.advanced_charts_desc":
      "Interactive visualizations that reveal hidden patterns in your data.",
    "landing.features.time_analytics": "Time Analytics",
    "landing.features.time_analytics_desc":
      "Discover your most profitable assets, times and days with efficient and organized data analysis.",
    "landing.features.multi_asset": "Multi-Asset",
    "landing.features.multi_asset_desc":
      "Forex, Crypto, Stocks, Futures - all markets in one platform.",
    "landing.features.complete_export": "Complete Export",
    "landing.features.complete_export_desc":
      "Export professional PDF reports for clients and investors.",

    // Landing Page - Final CTA
    "landing.cta.title1": "Stop Losing",
    "landing.cta.title2": "Money for Lack",
    "landing.cta.title3": "of Data",
    "landing.cta.subtitle1":
      "95% of traders fail because they don't know what they're doing wrong.",
    "landing.cta.subtitle2": "You don't need to be part of this statistic.",
    "landing.cta.feature1": "5-minute setup",
    "landing.cta.feature2": "Immediate results",
    "landing.cta.feature3": "30-day guarantee",
    "landing.cta.main_button": "Transform My Results Now",
    "landing.cta.demo_button": "Watch Full Demo",
    "landing.cta.social_proof":
      "Over 1,200 traders have already transformed their results",
    "landing.cta.rating": "4.9/5 based on 500+ reviews",

    // Landing Page - Footer
    "landing.footer.description":
      "Brazil's most advanced trading analytics platform. Transform your data into profit with artificial intelligence.",
    "landing.footer.product": "Product",
    "landing.footer.features": "Features",
    "landing.footer.pricing": "Pricing",
    "landing.footer.integrations": "Integrations",
    "landing.footer.api": "API",
    "landing.footer.support": "Support",
    "landing.footer.contact": "Contact",
    "landing.footer.documentation": "Documentation",
    "landing.footer.tutorials": "Tutorials",
    "landing.footer.status": "Status",
    "landing.footer.copyright": "© 2025 Métrika. All rights reserved.",
    "landing.footer.made_with_love": "Made with ❤️ for Brazilian traders.",

    // Messages
    "messages.success": "Success!",
    "messages.error": "Error",
    "messages.loading": "Loading...",
    "messages.no_data": "No data found",
    "messages.confirm_delete": "Are you sure you want to delete?",

    // Authentication
    "auth.login": "Login",
    "auth.register": "Register",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.remember_me": "Remember me",
    "auth.forgot_password": "Forgot password",

    // Metrics and statistics
    "metrics.profitable_trades": "Profitable Trades",
    "metrics.losing_trades": "Losing Trades",
    "metrics.average_profit": "Average Profit",
    "metrics.average_loss": "Average Loss",
    "metrics.best_month": "Best Month",
    "metrics.worst_month": "Worst Month",
    "metrics.recovery_factor": "Recovery Factor",
    "metrics.max_drawdown": "Max Drawdown",
    "metrics.profit_factor": "Profit Factor",

    // Periods and dates
    "period.daily": "Daily",
    "period.weekly": "Weekly",
    "period.monthly": "Monthly",
    "period.yearly": "Yearly",
    "period.all_time": "All Time",

    // Status and actions
    "status.active": "Active",
    "status.inactive": "Inactive",
    "status.pending": "Pending",
    "status.completed": "Completed",
    "action.reset": "Reset",
    "action.import": "Import",
    "action.export": "Export",
    "action.sync": "Sync",
    "action.refresh": "Refresh",

    // Brokers and markets
    "broker.forex.name": "Forex",
    "broker.forex.type": "Currency",
    "broker.forex.description": "Forex trading with CSV import",
    "broker.b3.name": "B3",
    "broker.b3.type": "BR Stocks",
    "broker.b3.description": "Brazilian B3 stocks with CSV import",
    "broker.crypto.name": "Crypto",
    "broker.crypto.type": "Cryptocurrencies",
    "broker.crypto.description": "Cryptocurrency trading with CSV import",

    // Trading setups
    "setup.breakout": "Breakout",
    "setup.pullback": "Pullback",
    "setup.reversao": "Reversal",
    "setup.tendencia": "Trend",
    "setup.support_resistance": "Support/Resistance",
    "setup.fibonacci": "Fibonacci",
    "setup.candlestick": "Candlestick Pattern",
    "setup.divergencia": "Divergence",
    "setup.scalping": "Scalping",
    "setup.swing": "Swing",

    // Emotions
    "emotion.confiante": "Confident",
    "emotion.ansioso": "Anxious",
    "emotion.impulsivo": "Impulsive",
    "emotion.calmo": "Calm",
    "emotion.euforico": "Euphoric",
    "emotion.frustrado": "Frustrated",
    "emotion.neutro": "Neutral",

    // Chart labels
    "chart.profitability_accumulated": "Accumulated Profitability",
    "chart.period_result": "Period Result",
    "chart.daily": "Day",
    "chart.weekly": "Week",
    "chart.monthly": "Month",
    "chart.yearly": "Year",
    "chart.all_months": "All",
    "chart.specific_month": "Specific Month",
    "chart.select_month": "Select month",

    // Time periods
    "time.day": "Day",
    "time.week": "Week",
    "time.month": "Month",
    "time.year": "Year",
    "time.all": "All",

    // Filters
    "filter.consolidate_all_data": "Consolidate All Data",
    "filter.filter_by_market": "Filter by Market",
    "filter.filter_by_csv": "Filter by Imported CSVs",

    // Imports
    "imports.manage_description": "Manage your CSV imports and manual trades",
    "imports.csv_imported": "Imported CSVs",
    "imports.manual_trades": "Manual Trades",

    // Empty states
    "empty.no_csv_imports": "No CSV imports performed yet",
    "empty.no_manual_trades": "No manual trades created yet",

    // Trades
    "trades.edit_manual_trade": "Edit Manual Trade",
    "trades.edit_trade_description":
      "Modify the information of the selected trade",
    "trades.asset": "Asset",

    // Charts
    "charts.register_trades_to_see": "Register some trades to see the chart",

    // Common actions
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.saving": "Saving...",

    // Metrics
    "metrics.operations_precision": "Operations Precision",
    "metrics.operations_performed": "Operations Performed",
    "metrics.risk_vs_return": "Risk vs Return",
    "metrics.general_risk_return": "Overall Risk/Return",
    "metrics.sum_all_brokers": "Sum of all brokers",
    "metrics.weighted_average": "Weighted Average",
    "metrics.win_rate": "Win Rate",
    "metrics.net_pnl": "Net PnL",
    "metrics.day_win_rate": "Day Win %",
    "metrics.risk_reward": "Risk/Reward",
    "metrics.avg_win_loss": "Avg Win/Loss",
    "metrics.daily_net_pnl": "Daily Net PnL",
    "metrics.progress_tracker": "Progress Tracker",

    // Risk Management
    "risk_management.title": "Risk Management",
    "risk_management.description": "Calculate ideal position size and project your growth",
    "risk_management.settings": "Settings",
    "risk_management.settings_description": "Enter your account and operation data",
    "risk_management.account_balance": "Account Balance",
    "risk_management.risk_percentage": "Risk per Operation",
    "risk_management.stop_loss_pips": "Stop Loss (pips)",
    "risk_management.risk_reward_ratio": "Risk:Reward Ratio",
    "risk_management.calculate": "Calculate",
    "risk_management.results": "Results",
    "risk_management.risk_amount": "Amount at Risk",
    "risk_management.potential_profit": "Potential Profit",
    "risk_management.expected_profit_per_trade": "Expected Profit/Trade",
    "risk_management.daily_growth_expected": "Expected Daily Growth",
    "risk_management.position_size": "Position Size",
    "risk_management.daily_growth": "Daily Growth",
    "risk_management.growth_projection": "Growth Projection",
    "risk_management.growth_projection_description": "Based on consistent performance",
    "risk_management.growth_simulation_title": "Growth Simulation (90 days)",
    "risk_management.growth_simulation_description": "Projection based on realistic probabilities with volatility",
    "risk_management.projected_balance": "Projected Balance",
    "risk_management.accumulated_gain": "Accumulated Gain",
    "risk_management.realistic_goals": "Realistic Goals",
    "risk_management.expected_growth_based": "Expected growth based on consistent performance",
    "risk_management.days_business_days": "{days} days ({tradingDays}d business)",
    "risk_management.expected_gain": "Expected gain",
    "risk_management.possible_loss": "Possible loss",
    "risk_management.trades": "trades",
    "risk_management.after_days": "After {days} days",
    "risk_management.enter_balance_to_start": "Enter account balance to start",
    "risk_management.how_to_use": "How to Use Risk Management",
    "risk_management.essential_tips": "Essential tips to maximize your results",
    "risk_management.risk_by_profile": "Risk Management by Profile",
    "risk_management.position_size_title": "Position Size",
    "risk_management.position_size_desc": "Use our calculator to determine exactly how many lots to trade based on your stop loss and risk tolerance.",
    "risk_management.important": "Important",
    "risk_management.disclaimer": "Results are projections based on historical data. Past performance does not guarantee future results.",
    "risk_management.steps_to_use": "Steps to use:",
    "risk_management.step1": "Enter your real account balance",
    "risk_management.step2": "Choose your risk profile",
    "risk_management.conservative_desc": "Conservative: Always maintain 0.25% per operation to preserve capital long term. Max 1% daily risk.",
    "risk_management.moderate_desc": "Moderate: Use 0.6% per operation, balancing growth and safety. Max 2.4% daily risk.",
    "risk_management.high_risk_desc": "High Risk: Up to 2.5% per operation for experienced traders with high risk tolerance. Max 10% daily risk.",
    "risk_management.no_profile_desc": "Select a profile to see specific risk per operation recommendations.",

    // Placeholders and hints
    "placeholder.select_month": "Select month",
    "placeholder.select_option": "Select an option",
    "placeholder.select_view_mode": "Select view mode",
    "placeholder.select_market": "Select Market",
    "placeholder.search": "Search...",

    // Upload and import
    "upload.csv_import": "CSV Import",
    "upload.select_file": "Select file",
    "upload.analyzing": "Analyzing...",
    "upload.processing": "Processing...",
    "upload.success": "Success!",
    "upload.error": "Upload error",

    // Weekdays
    "weekdays.sunday": "Sunday",
    "weekdays.monday": "Monday",
    "weekdays.tuesday": "Tuesday",
    "weekdays.wednesday": "Wednesday",
    "weekdays.thursday": "Thursday",
    "weekdays.friday": "Friday",
    "weekdays.saturday": "Saturday",

    // Empty state messages
    "empty.no_trades_period": "No trades in selected period",

    // AI Assistant
    "ai.chat_title": "AI Assistant",
    "ai.chat_title_short": "AI",
    "ai.welcome_message":
      "Hello! I'm your trading assistant. How can I help you today? I can analyze your trades, provide market suggestions, or answer questions about strategies.",
    "ai.error_message":
      "Sorry, an error occurred. Please try again in a few moments.",
    "ai.input_placeholder": "Type your message...",
    "ai.send_button": "Send",
    "ai.minimize_button": "Minimize",
    "ai.maximize_button": "Maximize",
    "ai.close_button": "Close",

    // Landing Page - Features Grid
    "landing.features.sync_title": "Auto Sync",
    "landing.features.sync_description":
      "Import your trades and have control over each market with all organized visualization metrics.",
    "landing.features.ai_title": "AI Analytics",
    "landing.features.ai_description":
      "Integration with artificial intelligence to study your account metrics in detail showing the best corrections and adjustments to boost results.",
    "landing.features.risk_title": "Risk Manager",
    "landing.features.risk_description":
      "Monitor risk in real-time and receive alerts before compromising capital.",
    "landing.features.journal_title": "Smart Journal",
    "landing.features.journal_description":
      "System learns from your trades and suggests improvements automatically.",
    "landing.features.charts_title": "Advanced Charts",
    "landing.features.charts_description":
      "Interactive visualizations that reveal hidden patterns in your data.",
    "landing.features.time_title": "Time Analytics",
    "landing.features.time_description":
      "Discover your most profitable assets, times and days with efficient and organized data analysis.",
    "landing.features.multiasset_title": "Multi-Asset",
    "landing.features.multiasset_description":
      "Forex, Crypto, Stocks, Futures - all markets in one platform.",
    "landing.features.export_title": "Complete Export",
    "landing.features.export_description":
      "Export professional reports in PDF for clients and investors",

    // Login Modal
    "login.title": "Login to Métrika",
    "login.subtitle": "Access your account to continue",
    "login.email_label": "Email",
    "login.email_placeholder": "your@email.com",
    "login.password_label": "Password",
    "login.password_placeholder": "••••••••",
    "login.remember_me": "Remember me",
    "login.forgot_password": "Forgot password?",
    "login.submit_button": "Login",
    "login.loading_button": "Logging in...",
    "login.no_account": "Don't have an account?",
    "login.create_account": "Create free account",

    // Register Modal
    "register.title": "Create Account on Métrika",
    "register.subtitle": "Start your journey to better results",
    "register.name_label": "Full Name",
    "register.name_placeholder": "John Silva",
    "register.email_label": "Email",
    "register.phone_label": "Phone",
    "register.phone_placeholder": "(11) 99999-9999",
    "register.email_placeholder": "your@email.com",
    "register.password_label": "Password",
    "register.password_placeholder": "••••••••",
    "register.confirm_password_label": "Confirm Password",
    "register.confirm_password_placeholder": "••••••••",
    "register.terms_agreement": "I accept the",
    "register.terms_link": "Terms of Service",
    "register.and": "and",
    "register.privacy_link": "Privacy Policy",
    "register.submit_button": "Create Free Account",
    "register.loading_button": "Creating account...",
    "register.already_have_account": "Already have an account?",
    "register.login_link": "Sign in",
    "register.success_title": "Account created successfully!",
    "register.success_description": "You can now login with your credentials.",
    "register.error_title": "Error creating account",
    "register.error_description": "Please try again later.",
  },

  es: {
    // Navegación
    "nav.dashboard": "Panel",
    "nav.trades": "Operaciones",
    "nav.calendar": "Calendario",
    "nav.charts": "Gráficos",
    "nav.journal": "Diario",
    "nav.brokers": "Brokers",
    "nav.profile": "Perfil",
    "nav.admin": "Admin",
    "nav.logout": "Salir",

    // Soporte
    "support.title": "Soporte",
    "support.description": "Contáctanos para ayuda con tu cuenta",
    "support.new_conversation": "Nueva Conversación",
    "support.subject_label": "Asunto",
    "support.subject_placeholder": "Describe brevemente el problema",
    "support.category_label": "Categoría",
    "support.category_technical": "Problema Técnico",
    "support.category_billing": "Facturación",
    "support.category_feature": "Solicitud de Función",
    "support.category_general": "Pregunta General",
    "support.priority_label": "Prioridad",
    "support.priority_low": "Baja",
    "support.priority_medium": "Media",
    "support.priority_high": "Alta",
    "support.message_label": "Mensaje",
    "support.message_placeholder":
      "Describe tu pregunta o problema en detalle...",
    "support.send_button": "Enviar Mensaje",
    "support.start_conversation": "Iniciar Conversación",
    "support.no_conversations": "Aún no hay conversaciones",
    "support.no_conversations_desc":
      'Haz clic en "Nueva Conversación" para empezar',
    "support.status_open": "Abierto",
    "support.status_in_progress": "En Progreso",
    "support.status_resolved": "Resuelto",
    "support.status_closed": "Cerrado",
    "support.conversation_started": "¡Conversación iniciada con éxito!",
    "support.message_sent": "¡Mensaje enviado!",
    "support.loading": "Cargando...",
    "support.error": "Error cargando soporte",

    // Dashboard
    "dashboard.title": "Panel",
    "dashboard.overview": "Resumen",
    "dashboard.total_balance": "Saldo Total",
    "dashboard.monthly_result": "Resultado Mensual",
    "dashboard.win_rate": "Tasa de Acierto",
    "dashboard.total_trades": "Total Operaciones",
    "dashboard.avg_rr": "R/R Promedio",
    "dashboard.best_setup": "Mejor Setup",
    "dashboard.worst_setup": "Peor Setup",
    "dashboard.recent_trades": "Operaciones Recientes",
    "dashboard.performance_chart": "Gráfico de Rendimiento",
    "dashboard.ai_insights": "Insights de IA",
    "dashboard.trading_calendar": "Calendario de Trading",
    "dashboard.best_trade": "Mejor Operación",
    "dashboard.worst_trade": "Peor Operación",
    "dashboard.frequent_emotion": "Emoción Frecuente",
    "dashboard.capital_curve": "Curva de Capital",
    "dashboard.detailed_temporal_performance": "Rendimiento Temporal Detallado",
    "dashboard.imports_and_trades": "Historial de Importaciones y Operaciones",
    "dashboard.consolidated_total": "Resultado Total Consolidado",
    "dashboard.market_distribution": "Distribución por Mercado",

    // Tabs
    "tabs.imports": "Importaciones",
    "tabs.consolidated": "Consolidado",

    // Filtros de tiempo
    "time.7_days": "7 Días",
    "time.1_year": "1 Año",
    "time.times": "veces",
    "time.trades_today": "Operaciones Hoy",

    // Emociones
    "emotion.neutral": "neutro",

    // Consolidación
    "consolidated.summary": "Resumen Consolidado",
    "consolidated.market_analysis":
      "Análisis consolidado de diferentes mercados",

    // Gráficos y Métricas
    "metrics.accumulated_profitability": "Rentabilidad Acumulada",
    "metrics.period_result": "Resultado del Período",
    "metrics.profits": "✅ Ganancias",
    "metrics.losses": "❌ Pérdidas",
    "metrics.total_profits": "Total Ganancias",
    "metrics.total_losses": "Total Pérdidas",
    "metrics.period_result_short": "Resultado Período",
    "metrics.total_profitability": "Rentabilidad Total",
    "metrics.general_result": "Resultado general",
    "metrics.profitability_chart": "Gráfico de Rentabilidad en el Tiempo",
    "metrics.result": "Resultado",

    // Trades
    "trades.title": "Operaciones",
    "trades.add_new": "Nueva Operación",
    "trades.symbol": "Símbolo",
    "trades.market": "Mercado",
    "trades.setup": "Setup",
    "trades.capital": "Capital",
    "trades.stop": "Stop",
    "trades.target": "Objetivo",
    "trades.result": "Resultado",
    "trades.quantity": "Cantidad",
    "trades.risk": "Riesgo",
    "trades.type": "Tipo",
    "trades.comment": "Comentario",
    "trades.emotion": "Emoción",
    "trades.entry_price": "Precio Entrada",
    "trades.exit_price": "Precio Salida",
    "trades.broker": "Broker",
    "trades.status": "Estado",
    "trades.date": "Fecha/Hora",
    "trades.actions": "Acciones",
    "trades.edit": "Editar",
    "trades.delete": "Eliminar",
    "trades.filter_all": "Todos",
    "trades.no_trades": "No se encontraron operaciones",

    // Formulario de Trade
    "trade_form.title_add": "Agregar Operación",
    "trade_form.title_edit": "Editar Operación",
    "trade_form.symbol_placeholder": "ej: BTCUSD, EURUSD",
    "trade_form.setup_placeholder": "ej: Breakout, Pullback",
    "trade_form.comment_placeholder": "Observaciones de la operación",
    "trade_form.emotion_placeholder": "Cómo te sentiste",
    "trade_form.take_result": "Take (ganancia)",
    "trade_form.loss_result": "Loss (pérdida)",
    "trade_form.save": "Guardar Operación",
    "trade_form.cancel": "Cancelar",
    "trade_form.validation_required": "Campo requerido",
    "trade_form.validation_positive": "Debe ser mayor que cero",

    // Gráficos
    "charts.title": "Gráfico",

    // Calendario
    "calendar.title": "Calendario de Trading",
    "calendar.trades_count": "operaciones",
    "calendar.win": "acierto",
    "calendar.diary_entry": "Entrada del Diario",
    "calendar.add_diary": "Agregar al Diario",
    "calendar.edit_diary": "Editar Diario",
    "calendar.how_to_use": "Cómo Usar el Calendario",
    "calendar.profitable_days": "Días Rentables",
    "calendar.profitable_days_desc":
      "Marcados con punto verde, muestran P&L positivo del día",
    "calendar.loss_days": "Días con Pérdidas",
    "calendar.loss_days_desc":
      "Marcados con punto rojo, muestran P&L negativo del día",
    "calendar.weekly_summary": "Resumen Semanal",
    "calendar.weekly_summary_desc":
      "Columna lateral con totales consolidados por semana",
    "calendar.analysis_tips": "Consejos de Análisis",
    "calendar.temporal_patterns": "📈 Patrones Temporales",
    "calendar.improvement_strategies": "🎯 Estrategias de Mejora",
    "calendar.tip1": "Identifica qué días de la semana son más rentables",
    "calendar.tip2": "Observa patrones en secuencias de aciertos/fallos",
    "calendar.tip3": "Analiza el rendimiento en diferentes semanas del mes",
    "calendar.tip4": "Compara meses para identificar estacionalidad",
    "calendar.strategy1": "Evita trading en días consistentemente negativos",
    "calendar.strategy2": "Aumenta volumen en días/períodos más rentables",
    "calendar.strategy3": "Usa descansos después de secuencias de pérdidas",
    "calendar.strategy4": "Documenta lo que funcionó en los días verdes",

    // Días de la semana abreviados
    "calendar.sun_short": "Dom",
    "calendar.mon_short": "Lun",
    "calendar.tue_short": "Mar",
    "calendar.wed_short": "Mié",
    "calendar.thu_short": "Jue",
    "calendar.fri_short": "Vie",
    "calendar.sat_short": "Sáb",

    // Resúmenes y estadísticas
    "calendar.summary_of": "Resumen de",
    "calendar.pnl_total": "P&L Total",
    "calendar.day": "día",
    "calendar.days": "días",
    "calendar.week": "Semana",
    "calendar.trading_days": "Días de Trading",
    "calendar.total_trades": "Total Operaciones",
    "calendar.win_rate": "Tasa de Acierto",

    // Aprendizaje
    "learning.title": "Centro de Aprendizaje",
    "learning.tour": "Tour de la Plataforma", 
    "learning.videos": "Video Lecciones",
    "learning.progress": "Tu Progreso",
    "learning.description": "Domina la plataforma de trading con nuestros tutoriales y haz un tour guiado por todas las funcionalidades",
    "learning.tour_interactive": "Tour Interactivo de la Plataforma",
    "learning.tour_description": "¡Haz un tour completo e interactivo de la plataforma! El sistema navegará automáticamente por cada sección, destacando elementos importantes y explicando cómo usar cada funcionalidad.",
    "learning.tour_features.auto_nav": "Navegación automática entre páginas",
    "learning.tour_features.highlights": "Destacados visuales en elementos",
    "learning.tour_features.explanations": "Explicaciones contextuales detalladas",
    "learning.tour_features.steps": "13 pasos completos",
    "learning.tour_start": "Iniciar Tour Interactivo",
    "learning.sections.basics": "Primeros Pasos",
    "learning.sections.basics_desc": "Aprende lo básico para empezar a usar la plataforma",
    "learning.sections.analysis": "Análisis e Informes",
    "learning.sections.analysis_desc": "Domina las herramientas de análisis de la plataforma",
    "learning.sections.advanced": "Funciones Avanzadas",
    "learning.sections.advanced_desc": "Aprovecha al máximo las funcionalidades premium",
    "learning.videos.first_trade": "Cómo registrar tu primera operación",
    "learning.videos.csv_import": "Importando datos vía CSV",
    "learning.videos.goals": "Configurando tus objetivos",
    "learning.videos.dashboard": "Leyendo métricas del panel",
    "learning.videos.calendar": "Usando el calendario de trading",
    "learning.videos.charts": "Interpretando gráficos de rendimiento",
    "learning.videos.ai_csv": "IA para análisis de CSV",
    "learning.videos.risk": "Gestión avanzada de riesgo",
    "learning.videos.journal": "Diario de trading e insights",
    "learning.stats.videos_watched": "Videos Vistos",
    "learning.stats.general_progress": "Progreso General",
    "learning.stats.time_watched": "Tiempo Visto",

    // Tour
    "tour.welcome.title": "¡Bienvenido a METRIKA!",
    "tour.welcome.description": "Vamos a hacer un tour completo por la plataforma de análisis de trading. Aprenderás cómo usar cada funcionalidad.",
    "tour.dashboard_overview.title": "Panel - Visión General",
    "tour.dashboard_overview.description": "Este es tu panel principal. Aquí puedes ver un resumen completo de tu rendimiento, incluyendo rentabilidad total, número de operaciones y métricas clave.",
    "tour.metrics_cards.title": "Tarjetas de Métricas",
    "tour.metrics_cards.description": "Estas tarjetas muestran tus principales estadísticas: rentabilidad, total de operaciones, tasa de acierto y otros indicadores importantes para seguir tu rendimiento.",
    "tour.performance_chart.title": "Gráfico de Rendimiento",
    "tour.performance_chart.description": "Visualiza la evolución de tu rentabilidad a lo largo del tiempo. Este gráfico ayuda a identificar tendencias y períodos de mejor o peor rendimiento.",
    "tour.sidebar_navigation.title": "Navegación Lateral",
    "tour.sidebar_navigation.description": "Usa la barra lateral para navegar entre las diferentes secciones de la plataforma. Cada icono representa una funcionalidad específica.",
    "tour.new_trade.title": "Nueva Operación",
    "tour.new_trade.description": "Aquí puedes registrar nuevas operaciones manualmente o importar datos vía CSV. Es el punto de entrada para todos tus datos de trading.",
    "tour.csv_analysis.title": "Análisis de CSV con IA",
    "tour.csv_analysis.description": "Nuestra IA puede analizar tus archivos CSV automáticamente, detectando operaciones y extrayendo información importante, independientemente del formato del archivo.",
    "tour.risk_management.title": "Gestión de Riesgo",
    "tour.risk_management.description": "Calcula el tamaño ideal de posición, gestiona el riesgo por operación y proyecta el crecimiento de tu capital basado en tus objetivos.",
    "tour.trading_calendar.title": "Calendario de Trading",
    "tour.trading_calendar.description": "Visualiza tu rendimiento diario, identifica patrones temporales y analiza tus mejores y peores días de trading en formato calendario.",
    "tour.trading_journal.title": "Diario de Trading",
    "tour.trading_journal.description": "Mantén un registro detallado de tus reflexiones, emociones y lecciones aprendidas. El diario es fundamental para tu evolución como trader.",
    "tour.ai_chat.title": "Chat con IA",
    "tour.ai_chat.description": "Conversa con nuestra IA para obtener insights sobre tus operaciones, estrategias y rendimiento. Puede ayudar a analizar patrones y sugerir mejoras.",
    "tour.support.title": "Soporte",
    "tour.support.description": "¿Necesitas ayuda? Nuestra sección de soporte ofrece respuestas a preguntas frecuentes y canal directo para contactarnos.",
    "tour.complete.title": "¡Tour Completado!",
    "tour.complete.description": "¡Felicitaciones! Ahora conoces todas las principales funcionalidades de la plataforma. Sigue explorando y aprovecha al máximo tus herramientas de análisis.",

    // Nuevo Trade y CSV
    "trade.manual": "Manual",
    "trade.import_csv": "Importar CSV",
    "trade.csv_file": "Archivo CSV",
    "trade.csv_format_by_market": "Formato CSV por Mercado",
    "trade.analyzing_ai": "Analizando con IA...",
    "trade.import_with_ai": "🤖 Importar con IA",
    "trade.import_fast": "⚡ Importar Rápido",
    "trade.csv_rejected": "❌ Archivo CSV rechazado:",
    "trade.processing": "Procesando...",
    "trade.import_trades_csv": "Importar Operaciones vía CSV",
    "trade.select_csv_exported":
      "Selecciona un archivo CSV exportado de tu mercado",
    "trade.analysis_complete": "✨ Análisis Profundo Completo",
    "trade.insights_generated":
      "insights detallados generados! Visualiza el análisis completo en pantalla.",
    "trade.import_csv_first":
      "Importa un archivo CSV primero para usar el análisis IA.",

    // Formulario de Operación Manual
    "form.trade_data": "Datos de la Operación",
    "form.date_time": "Fecha y Hora",
    "form.asset": "Activo",
    "form.market": "Mercado",
    "form.select_market": "Selecciona mercado",
    "form.crypto": "₿ Crypto",
    "form.forex": "$ Forex",
    "form.b3": "▲ B3",
    "form.type": "Tipo",
    "form.buy_or_sell": "Compra o Venta",
    "form.buy": "Compra",
    "form.sell": "Venta",
    "form.take_profit": "Take Profit (valor de ganancia)",
    "form.stop_loss": "Stop Loss (valor de pérdida)",
    "form.trade_result": "Resultado de la Operación",
    "form.select_result_warning":
      "⚠️ Selecciona el resultado para calcular el valor financiero",
    "form.take": "Take",
    "form.loss": "Loss",
    "form.auto_calculations": "Cálculos Automáticos",
    "form.risk_reward_ratio": "Razón Riesgo/Recompensa",
    "form.financial_result": "Resultado Financiero",
    "form.excellent_ratio": "● Excelente (≥3:1)",
    "form.good_ratio": "▲ Bueno (≥2:1)",
    "form.risky_ratio": "■ Arriesgado (<2:1)",
    "form.emotion": "Emoción Percibida",
    "form.how_felt": "¿Cómo te sentiste?",
    "form.trade_comment": "Comentario sobre la Operación",
    "form.comment_placeholder":
      "Describe tu razonamiento, observaciones del mercado, lecciones aprendidas...",
    "form.saving": "Guardando...",
    "form.save_trade": "Guardar Operación",
    "form.clear": "Limpiar",
    "form.analyze_ai": "🤖 Analizar con IA",
    "form.required_fields": "Campos requeridos",
    "form.fill_required":
      "Completa al menos: Activo, Mercado y Tipo para análisis.",
    "form.select_market_label": "Seleccionar Mercado",
    "form.crypto_b3_forex": "Crypto, B3 o Forex",
    "form.crypto_icon": "🪙 Crypto",
    "form.b3_icon": "📈 B3",
    "form.forex_icon": "🏦 Forex",
    "form.analysis_method": "Método de Análisis",
    "form.choose_processing": "Elige método de procesamiento",
    "form.ai_analysis": "🤖 Análisis por IA (Beta)",
    "form.traditional_analysis": "⚡ Análisis MetrikAI (Recomendado)",
    "form.ai_description":
      "✨ IA: Más inteligente, interpreta cualquier formato, pero puede ser más lento",
    "form.traditional_description":
      "⚡ Tradicional: Más rápido y consistente, ideal para formatos estándar",

    // Gráficos
    "charts.all_months": "Todos",
    "charts.specific_month": "Mes Específico",
    "charts.chart_settings": "Configuración de Gráficos",
    "charts.market": "Mercado",
    "charts.asset": "Activo",
    "charts.timeframe": "Marco Temporal",
    "charts.forex": "Forex",
    "charts.crypto": "Crypto",
    "charts.b3_stocks": "B3 (Acciones/Futuros)",
    "charts.current_asset": "Activo Actual:",
    "charts.current_timeframe": "Marco Temporal:",
    "charts.interval.1min": "1 minuto",
    "charts.interval.5min": "5 minutos",
    "charts.interval.15min": "15 minutos",
    "charts.interval.30min": "30 minutos",
    "charts.interval.1hour": "1 hora",
    "charts.interval.4hours": "4 horas",
    "charts.interval.daily": "Diario",
    "charts.interval.weekly": "Semanal",
    "charts.professional_chart": "Gráfico profesional integrado",
    "charts.interval_label": "Intervalo:",
    "charts.simulated_data": "Datos en tiempo real simulados",
    "charts.updated": "Actualizado:",
    "charts.minutes": "minutos",

    // Diario
    "journal.title": "Diario de Trading",
    "journal.add_entry": "Nueva Entrada",
    "journal.date": "Fecha",
    "journal.content": "Contenido",
    "journal.mood": "Estado de Ánimo",
    "journal.lessons": "Lecciones Aprendidas",
    "journal.save": "Guardar",
    "journal.cancel": "Cancelar",
    "journal.no_entries": "Aún no hay entradas",
    "journal.start_recording":
      "Comienza registrando tus reflexiones y análisis de trading",
    "journal.create_first": "Crear primera entrada",
    "journal.trades_performed": "operaciones realizadas",
    "journal.accuracy_rate": "de acierto",
    "journal.lessons_label": "Lecciones:",
    "journal.improvements_label": "Mejoras:",
    "journal.edit_entry": "Editar Entrada",
    "journal.new_entry": "Nueva Entrada en el Diario",
    "journal.title_field": "Título",
    "journal.title_placeholder": "Ej: Sesión de trading matutina",
    "journal.session_description": "Descripción de la Sesión",
    "journal.session_placeholder":
      "Describe cómo fue tu sesión de trading hoy...",
    "journal.emotional_state": "Estado Emocional",
    "journal.how_felt": "¿Cómo te sentiste?",
    "journal.number_trades": "Número de Operaciones",
    "journal.pnl": "P&L ($)",
    "journal.win_rate": "Tasa de Acierto (%)",
    "journal.lessons_learned": "Lecciones Aprendidas",
    "journal.lessons_placeholder": "¿Qué aprendiste hoy?",
    "journal.improvements": "Puntos de Mejora",
    "journal.improvements_placeholder":
      "¿Qué puedes mejorar en la próxima sesión?",
    "journal.images": "Imágenes",
    "journal.image_added_pending": "¡Imagen añadida!",
    "journal.image_added_pending_desc": "La imagen se subirá cuando guardes la entrada.",
    "journal.pending_status": "Pendiente",
    "journal.add_images_message": "Añade imágenes que se guardarán junto con la entrada",
    "journal.saving": "Guardando...",
    "journal.update": "Actualizar",
    "journal.delete_confirm":
      "¿Estás seguro de que quieres eliminar esta entrada?",
    "journal.emotion.confident": "Confiado 😎",
    "journal.emotion.anxious": "Ansioso 😰",
    "journal.emotion.impulsive": "Impulsivo 🏃‍♂️",
    "journal.emotion.calm": "Tranquilo 😌",
    "journal.emotion.euphoric": "Eufórico 🤩",
    "journal.emotion.frustrated": "Frustrado 😤",
    "journal.emotion.neutral": "Neutral 😐",
    "journal.toast.created": "¡Entrada creada!",
    "journal.toast.created_desc": "Tu entrada del diario se creó con éxito.",
    "journal.toast.updated": "¡Entrada actualizada!",
    "journal.toast.updated_desc":
      "Tu entrada del diario se actualizó con éxito.",
    "journal.toast.deleted": "¡Entrada eliminada!",
    "journal.toast.deleted_desc": "Tu entrada del diario se eliminó con éxito.",
    "journal.toast.error_save": "Error al guardar",
    "journal.toast.error_save_desc":
      "No se pudo guardar la entrada. Inténtalo de nuevo.",
    "journal.toast.error_delete": "Error al eliminar",
    "journal.toast.error_delete_desc":
      "No se pudo eliminar la entrada. Inténtalo de nuevo.",

    // Brokers
    "brokers.title": "Brokers",
    "brokers.csv_import": "Analisar CSVs com IA",
    "brokers.api_config": "Configurar API",
    "brokers.manual_entry": "Entrada Manual",

    // Perfil
    "profile.title": "Perfil",
    "profile.personal_info": "Información Personal",
    "profile.subscription": "Suscripción",
    "profile.settings": "Configuraciones",

    // Formularios generales
    "form.save": "Guardar",
    "form.cancel": "Cancelar",
    "form.delete": "Eliminar",
    "form.edit": "Editar",
    "form.close": "Cerrar",
    "form.submit": "Enviar",

    // Landing Page - Header
    "landing.header.features": "Recursos",
    "landing.header.pricing": "Precios",
    "landing.header.contact": "Contacto",
    "landing.header.login": "Iniciar Sesión",
    "landing.header.start": "Comenzar Ahora",
    "landing.header.start_short": "Comenzar",

    // Landing Page - Hero Section
    "landing.hero.announcement":
      "✨ Nuevo: Integración con Gate.io + 3 Brokers",
    "landing.hero.announcement_mobile": "✨ Nuevo: Integración Gate.io",
    "landing.hero.title1": "El Fin de las",
    "landing.hero.title2": "Hojas de Cálculo",
    "landing.hero.title3": "de Trading",
    "landing.hero.subtitle":
      "La única plataforma que analiza tus operaciones automáticamente y revela",
    "landing.hero.subtitle_highlight": "los patrones que generan ganancias",
    "landing.hero.feature1": "Importación automática de operaciones",
    "landing.hero.feature2": "Analytics avanzado",
    "landing.hero.start_free": "Comenzar Gratis",
    "landing.hero.watch_demo": "Ver Demo",
    "landing.hero.social_proof1": "1.200+ traders activos",
    "landing.hero.social_proof2": "2M+ operaciones analizadas",

    // Landing Page - Dashboard Preview
    "landing.dashboard.main_title": "Panel Principal",
    "landing.dashboard.live": "En Vivo",
    "landing.dashboard.total_pnl": "P&L Total",
    "landing.dashboard.monthly_growth": "+12.4% este mes",
    "landing.dashboard.win_rate": "Tasa de Acierto",
    "landing.dashboard.trades_count": "156/199 operaciones",
    "landing.dashboard.capital_evolution": "Evolución del Capital",
    "landing.dashboard.connected_brokers": "Brokers Conectados",
    "landing.dashboard.synchronized": "Sincronizado",
    "landing.dashboard.active": "Activo",
    "landing.dashboard.connected": "Conectado",
    "landing.dashboard.demo_total_pnl": "+$28,540",
    "landing.solution.demo_total_profit": "$45,230",
    "landing.solution.demo_trade1_result": "+$1,250",
    "landing.solution.demo_trade2_result": "+$890", 
    "landing.solution.demo_trade3_result": "-$320",

    // Landing Page - Problem Section
    "landing.problem.title1": "95% de los Traders",
    "landing.problem.title2": "Fallan Porque No Saben",
    "landing.problem.title3": "Lo Que Están Haciendo Mal",
    "landing.problem.subtitle":
      "Sin datos precisos y análisis consistentes, estás operando a ciegas. Métrika revela exactamente dónde pierdes dinero y cómo corregirlo.",
    "landing.problem.outdated_sheets": "Hojas de Cálculo Desactualizadas",
    "landing.problem.outdated_sheets_desc":
      "Pierdes tiempo llenando hojas de cálculo manualmente en lugar de enfocarte en las operaciones",
    "landing.problem.imprecise_data": "Datos Imprecisos",
    "landing.problem.imprecise_data_desc":
      "Errores de cálculo y datos inconsistentes llevan a decisiones erróneas",
    "landing.problem.limited_analysis": "Análisis Limitado",
    "landing.problem.limited_analysis_desc":
      "Sin insights profundos sobre tus patrones de trading, repites los mismos errores",

    // Landing Page - Solution Section
    "landing.solution.badge": "La Solución Definitiva",
    "landing.solution.title1": "Capturas Reales",
    "landing.solution.title2": "de la Plataforma",
    "landing.solution.subtitle":
      "Ve exactamente cómo Métrika transforma tus datos de trading en insights accionables",
    "landing.solution.dashboard_analytics": "Panel de Analytics",
    "landing.solution.realtime": "Tiempo Real",
    "landing.solution.total_profit": "Ganancia Total",
    "landing.solution.monthly_growth": "+18.5% este mes",
    "landing.solution.winning_trades": "Operaciones Ganadoras",
    "landing.solution.trades_stats": "234/284 operaciones",
    "landing.solution.monthly_evolution": "Evolución Mensual",
    "landing.solution.recent_trades": "Últimas Operaciones",
    "landing.solution.features_title1": "Todo Lo Que Necesitas Para",
    "landing.solution.features_title2": "Dominar Tus Operaciones",
    "landing.solution.auto_import": "Importación Automática",
    "landing.solution.auto_import_desc":
      "Conecta tus brokers y ten todas las operaciones importadas automáticamente. Cero trabajo manual.",
    "landing.solution.ai_analytics": "IA Analytics",
    "landing.solution.ai_analytics_desc":
      "Algoritmos avanzados identifican tus patrones de ganancia y pérdida, revelando insights invisibles.",
    "landing.solution.risk_management": "Gestión de Riesgo",
    "landing.solution.risk_management_desc":
      "Monitorea tu riesgo en tiempo real y recibe alertas antes de comprometer tu capital.",
    "landing.solution.smart_journal": "Diario Inteligente",
    "landing.solution.smart_journal_desc":
      "Sistema de diario que aprende de tus operaciones y sugiere mejoras automáticas.",

    // Landing Page - Statistics
    "landing.stats.title": "Resultados Comprobados",
    "landing.stats.subtitle":
      "Números reales de traders que transformaron sus resultados",
    "landing.stats.trades_analyzed": "Operaciones Analizadas",
    "landing.stats.active_traders": "Traders Activos",
    "landing.stats.improvement_avg": "Promedio de Mejora",
    "landing.stats.satisfaction": "Satisfacción",

    // Landing Page - Pricing
    "landing.pricing.badge": "Planes y Precios",
    "landing.pricing.title1": "Elige el Plan",
    "landing.pricing.title2": "Perfecto para Ti",
    "landing.pricing.subtitle":
      "Transforma tu análisis de trading hoy mismo. Cancela cuando quieras.",
    "landing.pricing.starter_title": "Trader Starter",
    "landing.pricing.starter_price": "$19.99",
    "landing.pricing.starter_period": "/mes",
    "landing.pricing.starter_trial": "7 días gratis",
    "landing.pricing.starter_feature1":
      "Acceso completo a las métricas de tus operaciones",
    "landing.pricing.starter_feature2": "Respaldo seguro de todo el historial",
    "landing.pricing.starter_feature3": "Notas detalladas para cada operación",
    "landing.pricing.starter_feature4":
      "Filtros avanzados por mercado y período",
    "landing.pricing.starter_button": "Prueba 7 Días Gratis",
    "landing.pricing.pro_title": "Trader Pro",
    "landing.pricing.pro_price": "$29.99",
    "landing.pricing.pro_period": "/mes",
    "landing.pricing.pro_annual": "Anual: $25/mes",
    "landing.pricing.pro_feature1": "Todo en Starter +",
    "landing.pricing.pro_feature2": "Soporte integrado directo en la app",
    "landing.pricing.pro_feature3": "Análisis mensual de tus métricas",
    "landing.pricing.pro_feature4": "Sugerencias de mejora",
    "landing.pricing.pro_feature5": "Integración TradingView",
    "landing.pricing.pro_feature6": "Seguimiento profesional",
    "landing.pricing.pro_button": "Comenzar Ahora",
    "landing.pricing.black_title": "Trader Black",
    "landing.pricing.black_price": "$59",
    "landing.pricing.black_period": "/mes",
    "landing.pricing.black_annual": "Anual: $49/mes",
    "landing.pricing.black_feature1": "IA entrenada en tu historial",
    "landing.pricing.black_feature2": "Reportes inteligentes completos",
    "landing.pricing.black_feature3": "Soporte 24h vía IA",
    "landing.pricing.black_feature4": "Análisis 2x/mes con estrategias",
    "landing.pricing.black_feature5": "Gestión de riesgo personalizada",
    "landing.pricing.black_feature6": "Llamada mensual con equipo profesional",
    "landing.pricing.black_button": "Nivel Máximo",
    "landing.pricing.guarantee": "Garantía de 30 días o devolución del dinero",

    // Landing Page - Testimonials
    "landing.testimonials.title": "Lo Que Dicen Nuestros Traders",
    "landing.testimonials.subtitle":
      "Resultados reales de quienes usan Métrika todos los días",
    "landing.testimonials.carlos_name": "Carlos Rodrigues",
    "landing.testimonials.carlos_role": "Day Trader • São Paulo",
    "landing.testimonials.carlos_content":
      "Métrika me ahorró 4 horas por semana que gastaba en hojas de cálculo. Ahora puedo enfocarme 100% en el trading. Mi tasa de acierto subió del 62% al 78%.",
    "landing.testimonials.carlos_improvement": "+$15.600 en 3 meses",
    "landing.testimonials.ana_name": "Ana Silva",
    "landing.testimonials.ana_role": "Swing Trader • Rio de Janeiro",
    "landing.testimonials.ana_content":
      "La integración con Gate.io fue un cambio de juego. Todas mis operaciones crypto se importan automáticamente. El analytics reveló patrones que nunca había notado.",
    "landing.testimonials.ana_improvement": "Tasa de acierto: 65% → 81%",
    "landing.testimonials.pedro_name": "Pedro Santos",
    "landing.testimonials.pedro_role": "Forex Trader • Belo Horizonte",
    "landing.testimonials.pedro_content":
      "Probé varias plataformas de diario, pero ninguna se acerca a Métrika. El sistema de IA realmente aprende de mis operaciones y me da insights valiosos.",
    "landing.testimonials.pedro_improvement": "Capital creció 340%",

    // Landing Page - Features Grid
    "landing.features.title1": "Recursos Exclusivos",
    "landing.features.title2": "que Marcan la Diferencia",
    "landing.features.subtitle":
      "Cada función fue diseñada para acelerar tu progreso y maximizar tus ganancias",
    "landing.features.auto_sync": "Sincronización Automática",
    "landing.features.auto_sync_desc":
      "Importa tus operaciones y ten control sobre cada mercado con todas las métricas de visualización organizadas.",
    "landing.features.ai_analytics": "IA Analytics",
    "landing.features.ai_analytics_desc":
      "Integración con inteligencia artificial para estudiar las métricas de tu cuenta detalladamente mostrando las mejores correcciones y ajustes para potenciar resultados.",
    "landing.features.risk_manager": "Gestor de Riesgo",
    "landing.features.risk_manager_desc":
      "Monitorea el riesgo en tiempo real y recibe alertas antes de comprometer el capital.",
    "landing.features.smart_journal": "Diario Inteligente",
    "landing.features.smart_journal_desc":
      "El sistema aprende de tus operaciones y sugiere mejoras automáticamente.",
    "landing.features.advanced_charts": "Gráficos Avanzados",
    "landing.features.advanced_charts_desc":
      "Visualizaciones interactivas que revelan patrones ocultos en tus datos.",
    "landing.features.time_analytics": "Análisis Temporal",
    "landing.features.time_analytics_desc":
      "Descubre tus activos, horarios y días más rentables con un análisis de datos eficiente y organizado.",
    "landing.features.multi_asset": "Multi-Activo",
    "landing.features.multi_asset_desc":
      "Forex, Crypto, Acciones, Futuros - todos los mercados en una plataforma.",
    "landing.features.complete_export": "Exportación Completa",
    "landing.features.complete_export_desc":
      "Exporta reportes profesionales en PDF para clientes e inversores.",

    // Landing Page - Final CTA
    "landing.cta.title1": "Deja de Perder",
    "landing.cta.title2": "Dinero por Falta",
    "landing.cta.title3": "de Datos",
    "landing.cta.subtitle1":
      "95% de los traders fallan porque no saben qué están haciendo mal.",
    "landing.cta.subtitle2": "No necesitas ser parte de esta estadística.",
    "landing.cta.feature1": "Configuración en 5 minutos",
    "landing.cta.feature2": "Resultados inmediatos",
    "landing.cta.feature3": "Garantía 30 días",
    "landing.cta.main_button": "Transformar Mis Resultados Ahora",
    "landing.cta.demo_button": "Ver Demo Completa",
    "landing.cta.social_proof":
      "Más de 1.200 traders ya transformaron sus resultados",
    "landing.cta.rating": "4.9/5 basado en 500+ evaluaciones",

    // Landing Page - Footer
    "landing.footer.description":
      "La plataforma de analytics de trading más avanzada de Brasil. Transforma tus datos en ganancias con inteligencia artificial.",
    "landing.footer.product": "Producto",
    "landing.footer.features": "Recursos",
    "landing.footer.pricing": "Precios",
    "landing.footer.integrations": "Integraciones",
    "landing.footer.api": "API",
    "landing.footer.support": "Soporte",
    "landing.footer.contact": "Contacto",
    "landing.footer.documentation": "Documentación",
    "landing.footer.tutorials": "Tutoriales",
    "landing.footer.status": "Estado",
    "landing.footer.copyright":
      "© 2025 Métrika. Todos los derechos reservados.",
    "landing.footer.made_with_love":
      "Desarrollado con ❤️ para traders brasileros.",

    // Mensajes
    "messages.success": "¡Éxito!",
    "messages.error": "Error",
    "messages.loading": "Cargando...",
    "messages.no_data": "No se encontraron datos",
    "messages.confirm_delete": "¿Estás seguro de que quieres eliminar?",

    // Autenticación
    "auth.login": "Iniciar Sesión",
    "auth.register": "Registrarse",
    "auth.email": "Correo",
    "auth.password": "Contraseña",
    "auth.remember_me": "Recordarme",
    "auth.forgot_password": "Olvidé mi contraseña",

    // Métricas y estadísticas
    "metrics.profitable_trades": "Operaciones Rentables",
    "metrics.losing_trades": "Operaciones Perdedoras",
    "metrics.average_profit": "Ganancia Promedio",
    "metrics.average_loss": "Pérdida Promedio",
    "metrics.best_month": "Mejor Mes",
    "metrics.worst_month": "Peor Mes",
    "metrics.recovery_factor": "Factor de Recuperación",
    "metrics.max_drawdown": "Drawdown Máximo",
    "metrics.profit_factor": "Factor de Ganancia",

    // Períodos y fechas
    "period.daily": "Diario",
    "period.weekly": "Semanal",
    "period.monthly": "Mensual",
    "period.yearly": "Anual",
    "period.all_time": "Todo el Tiempo",

    // Estado y acciones
    "status.active": "Activo",
    "status.inactive": "Inactivo",
    "status.pending": "Pendiente",
    "status.completed": "Completado",
    "action.reset": "Resetear",
    "action.import": "Importar",
    "action.export": "Exportar",
    "action.sync": "Sincronizar",
    "action.refresh": "Actualizar",

    // Días de la semana
    "weekdays.sunday": "Domingo",
    "weekdays.monday": "Lunes",
    "weekdays.tuesday": "Martes",
    "weekdays.wednesday": "Miércoles",
    "weekdays.thursday": "Jueves",
    "weekdays.friday": "Viernes",
    "weekdays.saturday": "Sábado",

    // Filtros
    "filter.consolidate_all_data": "Consolidar Todos los Datos",
    "filter.filter_by_market": "Filtrar por Mercado",
    "filter.filter_by_csv": "Filtrar por CSVs Importados",

    // Importaciones
    "imports.manage_description":
      "Gestiona tus importaciones CSV y trades manuales",
    "imports.csv_imported": "CSVs Importados",
    "imports.manual_trades": "Trades Manuales",

    // Estados vacíos
    "empty.no_csv_imports": "Ninguna importación CSV realizada aún",
    "empty.no_manual_trades": "Ningún trade manual creado aún",

    // Trades
    "trades.edit_manual_trade": "Editar Trade Manual",
    "trades.edit_trade_description":
      "Modifica la información del trade seleccionado",
    "trades.asset": "Activo",

    // Gráficos
    "charts.register_trades_to_see":
      "Registra algunos trades para ver el gráfico",

    // Acciones comunes
    "common.cancel": "Cancelar",
    "common.save": "Guardar",
    "common.saving": "Guardando...",

    // Métricas
    "metrics.operations_precision": "Precisión de las operaciones",
    "metrics.operations_performed": "Operaciones realizadas",
    "metrics.risk_vs_return": "Riesgo vs Retorno",
    "metrics.general_risk_return": "Riesgo/Retorno general",
    "metrics.sum_all_brokers": "Suma de todos los brokers",
    "metrics.weighted_average": "Promedio ponderado",
    "metrics.win_rate": "Tasa de Éxito",
    "metrics.net_pnl": "PnL Neto",
    "metrics.day_win_rate": "Días Ganadores %",
    "metrics.risk_reward": "Riesgo/Recompensa",
    "metrics.avg_win_loss": "Ganancia/Pérdida Promedio",
    "metrics.daily_net_pnl": "PnL Diario Neto",
    "metrics.progress_tracker": "Seguimiento de Progreso",

    // Gestión de Riesgo
    "risk_management.title": "Gestión de Riesgo",
    "risk_management.description": "Calcula el tamaño ideal de posición y proyecta tu crecimiento",
    "risk_management.settings": "Configuraciones",
    "risk_management.settings_description": "Ingresa los datos de tu cuenta y operación",
    "risk_management.account_balance": "Saldo de la Cuenta",
    "risk_management.risk_percentage": "Riesgo por Operación",
    "risk_management.stop_loss_pips": "Stop Loss (pips)",
    "risk_management.risk_reward_ratio": "Ratio Riesgo:Retorno",
    "risk_management.calculate": "Calcular",
    "risk_management.results": "Resultados",
    "risk_management.risk_amount": "Monto en Riesgo",
    "risk_management.potential_profit": "Ganancia Potencial",
    "risk_management.expected_profit_per_trade": "Ganancia Esperada/Operación",
    "risk_management.daily_growth_expected": "Crecimiento Diario Esperado",
    "risk_management.position_size": "Tamaño de Posición",
    "risk_management.daily_growth": "Crecimiento Diario",
    "risk_management.growth_projection": "Proyección de Crecimiento",
    "risk_management.growth_projection_description": "Basado en rendimiento consistente",
    "risk_management.growth_simulation_title": "Simulación de Crecimiento (90 días)",
    "risk_management.growth_simulation_description": "Proyección basada en probabilidades realistas con volatilidad",
    "risk_management.projected_balance": "Saldo Proyectado",
    "risk_management.accumulated_gain": "Ganancia Acumulada",
    "risk_management.realistic_goals": "Metas Realistas",
    "risk_management.expected_growth_based": "Crecimiento esperado basado en rendimiento consistente",
    "risk_management.days_business_days": "{days} días ({tradingDays}d hábiles)",
    "risk_management.expected_gain": "Ganancia esperada",
    "risk_management.possible_loss": "Pérdida posible",
    "risk_management.trades": "operaciones",
    "risk_management.after_days": "Después de {days} días",
    "risk_management.enter_balance_to_start": "Ingresa el saldo de la cuenta para comenzar",
    "risk_management.how_to_use": "Cómo Usar la Gestión de Riesgo",
    "risk_management.essential_tips": "Consejos esenciales para maximizar tus resultados",
    "risk_management.risk_by_profile": "Gestión de Riesgo por Perfil",
    "risk_management.position_size_title": "Tamaño de Posición",
    "risk_management.position_size_desc": "Usa nuestra calculadora para determinar exactamente cuántos lotes operar basado en tu stop loss y tolerancia al riesgo.",
    "risk_management.important": "Importante",
    "risk_management.disclaimer": "Los resultados son proyecciones basadas en datos históricos. El rendimiento pasado no garantiza resultados futuros.",
    "risk_management.steps_to_use": "Pasos para usar:",
    "risk_management.step1": "Ingresa el saldo real de tu cuenta",
    "risk_management.step2": "Elige tu perfil de riesgo",
    "risk_management.conservative_desc": "Conservador: Mantén siempre 0.25% por operación para preservar capital a largo plazo. Máximo 1% riesgo diario.",
    "risk_management.moderate_desc": "Moderado: Usa 0.6% por operación, equilibrando crecimiento y seguridad. Máximo 2.4% riesgo diario.",
    "risk_management.high_risk_desc": "Alto Riesgo: Hasta 2.5% por operación para traders experimentados con alta tolerancia al riesgo. Máximo 10% riesgo diario.",
    "risk_management.no_profile_desc": "Selecciona un perfil para ver recomendaciones específicas de riesgo por operación.",

    // Placeholders y consejos
    "placeholder.select_month": "Seleccionar mes",
    "placeholder.select_option": "Seleccionar una opción",
    "placeholder.select_view_mode": "Seleccionar modo de visualización",
    "placeholder.select_market": "Seleccionar Mercado",
    "placeholder.search": "Buscar...",

    // Mensajes de estado vacío
    "empty.no_trades_period": "Ninguna operación en el período seleccionado",

    // Assistente IA
    "ai.chat_title": "Asistente IA",
    "ai.chat_title_short": "IA",
    "ai.welcome_message":
      "¡Hola! Soy tu asistente de trading. ¿Cómo puedo ayudarte hoy? Puedo analizar tus operaciones, dar sugerencias de mercado o resolver dudas sobre estrategias.",
    "ai.error_message":
      "Lo siento, ocurrió un error. Inténtalo de nuevo en unos momentos.",
    "ai.input_placeholder": "Escribe tu mensaje...",
    "ai.send_button": "Enviar",
    "ai.minimize_button": "Minimizar",
    "ai.maximize_button": "Maximizar",
    "ai.close_button": "Cerrar",

    // Landing Page - Features Grid
    "landing.features.sync_title": "Sync Automático",
    "landing.features.sync_description":
      "Importa tus operaciones y ten control sobre cada mercado con todas las métricas de visualización organizadas.",
    "landing.features.ai_title": "IA Analytics",
    "landing.features.ai_description":
      "Integración con inteligencia artificial para estudiar las métricas de tu cuenta detalladamente mostrando las mejores correcciones y ajustes para potenciar resultados.",
    "landing.features.risk_title": "Gestor de Riesgo",
    "landing.features.risk_description":
      "Monitorea el riesgo en tiempo real y recibe alertas antes de comprometer el capital.",
    "landing.features.journal_title": "Diario Inteligente",
    "landing.features.journal_description":
      "El sistema aprende de tus operaciones y sugiere mejoras automáticamente.",
    "landing.features.charts_title": "Gráficos Avanzados",
    "landing.features.charts_description":
      "Visualizaciones interactivas que revelan patrones ocultos en tus datos.",
    "landing.features.time_title": "Análisis Temporal",
    "landing.features.time_description":
      "Descubre tus activos, horarios y días más rentables con un análisis de datos eficiente y organizado.",
    "landing.features.multiasset_title": "Multi-Activo",
    "landing.features.multiasset_description":
      "Forex, Crypto, Acciones, Futuros - todos los mercados en una plataforma.",
    "landing.features.export_title": "Exportación Completa",
    "landing.features.export_description":
      "Exporta reportes profesionales en PDF para clientes e inversores",

    // Login Modal
    "login.title": "Entrar a Métrika",
    "login.subtitle": "Accede a tu cuenta para continuar",
    "login.email_label": "Email",
    "login.email_placeholder": "tu@email.com",
    "login.password_label": "Contraseña",
    "login.password_placeholder": "••••••••",
    "login.remember_me": "Recordarme",
    "login.forgot_password": "¿Olvidaste tu contraseña?",
    "login.submit_button": "Entrar",
    "login.loading_button": "Entrando...",
    "login.no_account": "¿No tienes cuenta?",
    "login.create_account": "Crear cuenta gratuita",

    // Register Modal
    "register.title": "Crear Cuenta en Métrika",
    "register.subtitle": "Comienza tu camino hacia mejores resultados",
    "register.name_label": "Nombre Completo",
    "register.name_placeholder": "Juan Silva",
    "register.email_label": "Email",
    "register.phone_label": "Teléfono",
    "register.phone_placeholder": "(11) 99999-9999",
    "register.email_placeholder": "tu@email.com",
    "register.password_label": "Contraseña",
    "register.password_placeholder": "••••••••",
    "register.confirm_password_label": "Confirmar Contraseña",
    "register.confirm_password_placeholder": "••••••••",
    "register.terms_agreement": "Acepto los",
    "register.terms_link": "Términos de Uso",
    "register.and": "y",
    "register.privacy_link": "Política de Privacidad",
    "register.submit_button": "Crear Cuenta Gratuita",
    "register.loading_button": "Creando cuenta...",
    "register.already_have_account": "¿Ya tienes cuenta?",
    "register.login_link": "Iniciar sesión",
    "register.success_title": "¡Cuenta creada con éxito!",
    "register.success_description":
      "Ahora puedes iniciar sesión con tus credenciales.",
    "register.error_title": "Error al crear la cuenta",
    "register.error_description": "Inténtalo de nuevo más tarde.",
  },
};
