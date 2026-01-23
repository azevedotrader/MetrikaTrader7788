--
-- PostgreSQL database dump
--

\restrict 0E6Hdl2FWHNT8QbY3tC45OgNM3zSBEJsTUZv2EUPwDzaBbcyVn26bZiFFiGCAtA

-- Dumped from database version 16.11 (74c6bb6)
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bankroll_managements; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.bankroll_managements (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    bankroll_value numeric(12,2) NOT NULL,
    profile text NOT NULL,
    time_horizon text NOT NULL,
    horizon_days integer NOT NULL,
    risk_per_trade numeric(5,4) NOT NULL,
    daily_profit_target numeric(5,4) NOT NULL,
    projected_growth jsonb NOT NULL,
    target_balance numeric(12,2) NOT NULL,
    auto_adjust boolean DEFAULT true,
    consecutive_wins integer DEFAULT 0,
    consecutive_losses integer DEFAULT 0,
    last_adjustment_at timestamp without time zone,
    last_reset_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    experience_level text,
    trading_objective text,
    trading_markets text[],
    trading_timeframe text,
    custom_win_rate numeric(5,2),
    custom_risk_reward numeric(5,2),
    psychological_profile text,
    loss_reaction_profile text,
    questionnaire_answers jsonb,
    risk_per_operation numeric(5,4) NOT NULL,
    max_daily_risk numeric(5,4) NOT NULL,
    max_weekly_risk numeric(5,4) NOT NULL,
    min_risk_reward_ratio numeric(5,2) NOT NULL,
    drawdown_trigger_losses integer NOT NULL
);


ALTER TABLE public.bankroll_managements OWNER TO neondb_owner;

--
-- Name: broker_api_configs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.broker_api_configs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    broker text NOT NULL,
    api_key text,
    api_secret text,
    is_active boolean DEFAULT false,
    last_sync timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.broker_api_configs OWNER TO neondb_owner;

--
-- Name: csv_imports; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.csv_imports (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    broker text NOT NULL,
    file_name text NOT NULL,
    display_name text,
    trades_imported integer NOT NULL,
    trades_skipped integer DEFAULT 0,
    status text DEFAULT 'completed'::text,
    error_message text,
    created_at timestamp without time zone DEFAULT now(),
    wallet_id character varying
);


ALTER TABLE public.csv_imports OWNER TO neondb_owner;

--
-- Name: diary_entries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.diary_entries (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    date timestamp without time zone NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    emotion text,
    trades integer DEFAULT 0,
    pnl numeric(12,2) DEFAULT '0'::numeric,
    win_rate numeric(5,2),
    lessons text,
    improvements text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.diary_entries OWNER TO neondb_owner;

--
-- Name: diary_images; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.diary_images (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    diary_entry_id character varying,
    file_name text NOT NULL,
    original_name text NOT NULL,
    file_path text NOT NULL,
    file_size integer NOT NULL,
    mime_type text NOT NULL,
    caption text,
    created_at timestamp without time zone DEFAULT now(),
    trade_id character varying
);


ALTER TABLE public.diary_images OWNER TO neondb_owner;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.password_reset_tokens (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.password_reset_tokens OWNER TO neondb_owner;

--
-- Name: platform_stats; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.platform_stats (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    date timestamp without time zone NOT NULL,
    total_users integer NOT NULL,
    active_users integer NOT NULL,
    new_users integer NOT NULL,
    total_trades integer NOT NULL,
    monthly_revenue numeric(12,2) NOT NULL,
    free_users integer NOT NULL,
    premium_users integer NOT NULL,
    vip_users integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.platform_stats OWNER TO neondb_owner;

--
-- Name: questionnaire_states; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.questionnaire_states (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    current_question integer DEFAULT 1 NOT NULL,
    bankroll_value numeric(12,2),
    partial_answers jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    last_activity_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.questionnaire_states OWNER TO neondb_owner;

--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.subscription_plans (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    price numeric(10,2) NOT NULL,
    currency text DEFAULT 'BRL'::text,
    billing_cycle text DEFAULT 'monthly'::text,
    features text[],
    max_trades integer,
    max_csv_imports integer,
    has_api_access boolean DEFAULT false,
    has_advanced_analytics boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.subscription_plans OWNER TO neondb_owner;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.subscriptions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    plan_id character varying NOT NULL,
    status text NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    price numeric(10,2) NOT NULL,
    payment_method text,
    transaction_id text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.subscriptions OWNER TO neondb_owner;

--
-- Name: support_conversations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.support_conversations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    subject text NOT NULL,
    status text DEFAULT 'open'::text,
    priority text DEFAULT 'normal'::text,
    category text DEFAULT 'general'::text,
    last_message_at timestamp without time zone DEFAULT now(),
    last_message_by_admin boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.support_conversations OWNER TO neondb_owner;

--
-- Name: support_messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.support_messages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    conversation_id character varying NOT NULL,
    sender_id character varying NOT NULL,
    message text NOT NULL,
    is_from_admin boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.support_messages OWNER TO neondb_owner;

--
-- Name: trades; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.trades (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    data_hora timestamp without time zone NOT NULL,
    ativo text NOT NULL,
    mercado text NOT NULL,
    setup text,
    capital_utilizado numeric(12,2) NOT NULL,
    stop numeric(12,4),
    alvo numeric(12,4),
    resultado numeric(12,2),
    quantidade numeric(12,4) NOT NULL,
    risco numeric(5,2),
    tipo text NOT NULL,
    comentario text,
    emocao text,
    preco_entrada numeric(12,4),
    preco_saida numeric(12,4),
    corretora text NOT NULL,
    status text DEFAULT 'fechado'::text,
    origem text DEFAULT 'manual'::text,
    external_id text,
    csv_import_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    wallet_id character varying
);


ALTER TABLE public.trades OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text,
    phone character varying,
    whatsapp_number character varying,
    capital_inicial numeric(12,2) DEFAULT '0'::numeric,
    meta_mensal numeric(5,2) DEFAULT '5'::numeric,
    perfil_risco text DEFAULT 'moderado'::text,
    plan_type text DEFAULT 'free'::text,
    plan_expires_at timestamp without time zone,
    is_active boolean DEFAULT true,
    role text DEFAULT 'user'::text,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    google_id text,
    profile_photo text,
    force_logout_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: wallets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.wallets (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    name text NOT NULL,
    description text,
    color text DEFAULT '#8B5CF6'::text,
    icon text DEFAULT 'wallet'::text,
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.wallets OWNER TO neondb_owner;

--
-- Name: whatsapp_messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.whatsapp_messages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    message_id text NOT NULL,
    from_number text NOT NULL,
    user_id character varying,
    message_text text NOT NULL,
    message_type text DEFAULT 'text'::text,
    status text DEFAULT 'received'::text,
    trade_id character varying,
    error_message text,
    processed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.whatsapp_messages OWNER TO neondb_owner;

--
-- Data for Name: bankroll_managements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.bankroll_managements (id, user_id, bankroll_value, profile, time_horizon, horizon_days, risk_per_trade, daily_profit_target, projected_growth, target_balance, auto_adjust, consecutive_wins, consecutive_losses, last_adjustment_at, last_reset_at, created_at, updated_at, experience_level, trading_objective, trading_markets, trading_timeframe, custom_win_rate, custom_risk_reward, psychological_profile, loss_reaction_profile, questionnaire_answers, risk_per_operation, max_daily_risk, max_weekly_risk, min_risk_reward_ratio, drawdown_trigger_losses) FROM stdin;
5a755977-d3cd-4358-99ac-b6a2b39d72a0	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	1500.00	moderado	longo	90	0.0050	0.0000	[]	1500.00	t	0	0	\N	2025-11-14 03:42:33.008475	2025-11-14 03:42:32.988	2025-11-14 03:42:32.988	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.0050	0.0150	0.0720	2.00	4
\.


--
-- Data for Name: broker_api_configs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.broker_api_configs (id, user_id, broker, api_key, api_secret, is_active, last_sync, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: csv_imports; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.csv_imports (id, user_id, broker, file_name, display_name, trades_imported, trades_skipped, status, error_message, created_at, wallet_id) FROM stdin;
2f3a89e1-1494-45eb-ac41-2c9d2e95d311	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	whatsapp	whatsapp_1761351657338.txt	WhatsApp - 25/10/2025, 00:20	1	0	completed	\N	2025-10-25 00:20:57.358306	\N
549825bb-bf63-4b28-9f82-cfe809001fd3	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	whatsapp	whatsapp_1761354315235.txt	WhatsApp - 25/10/2025, 01:05	1	0	completed	\N	2025-10-25 01:05:15.256527	\N
c2250353-1eb1-4158-b711-62fb7306a4dc	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	clear	Relatorio de operaÃ§Ãµes.csv	\N	26	0	completed	Erro ao analisar CSV com ChatGPT:; 400 Unsupported value: 'temperature' does not support 0.05 with this model. Only the default (1) value is supported.; 🔧 Debug info: Error; ℹ️ ChatGPT falhou, sistema tradicional extraiu os dados	2025-10-25 21:27:15.491126	\N
2120ebc7-e839-4215-b34c-985cd353dcd2	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	clear	HistÃ³rico Operacional (1).csv	\N	63	0	completed	Erro ao analisar CSV com ChatGPT:; 400 Unsupported value: 'temperature' does not support 0.05 with this model. Only the default (1) value is supported.; 🔧 Debug info: Error; ℹ️ ChatGPT falhou, sistema tradicional extraiu os dados	2025-11-25 22:39:01.36976	\N
427954a2-df0d-4369-aab4-62831d3334f5	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	clear	Douglas de Sousa (1).csv	testeob	130	0	completed	Erro ao analisar CSV com ChatGPT:; 400 Unsupported value: 'temperature' does not support 0.05 with this model. Only the default (1) value is supported.; 🔧 Debug info: Error; ℹ️ ChatGPT falhou, sistema tradicional extraiu os dados	2025-11-27 14:13:23.85091	\N
\.


--
-- Data for Name: diary_entries; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.diary_entries (id, user_id, date, title, content, emotion, trades, pnl, win_rate, lessons, improvements, created_at, updated_at) FROM stdin;
235ac794-1a99-4ea4-9efb-e0dc3c8c54ec	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-11-08 00:00:00	sdvsdd	dssdvsdv	ansioso	50	800.00	0.00	sdvsdvs	sdvsdvsdv	2025-11-21 19:27:10.278901	2025-11-21 19:27:10.278901
\.


--
-- Data for Name: diary_images; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.diary_images (id, diary_entry_id, file_name, original_name, file_path, file_size, mime_type, caption, created_at, trade_id) FROM stdin;
59923127-4a42-4712-a842-f278c7ed15e5	235ac794-1a99-4ea4-9efb-e0dc3c8c54ec	6b80ef40da7e1492878bf0e63be9d2a0	lucid-origin_Futuristic_neon_soccer_ball_rolling_on_a_glowing_grid_floor_neon_reflections_cyb-0.jpg	uploads/images/6b80ef40da7e1492878bf0e63be9d2a0	581068	image/jpeg	\N	2025-11-21 19:27:11.390341	\N
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.password_reset_tokens (id, user_id, token, expires_at, used, created_at) FROM stdin;
11988cdf-eebd-49a7-a79c-4fe216504a59	c46fe580-8935-4b2e-89d0-6371026f3fe5	5a37963930ca1ebdc01c939483e6a96fa4cf409ffeaec8f114bbc6b0beaec89e	2025-12-10 00:26:12.484+00	f	2025-12-09 23:26:12.579926+00
474a7e6e-5c1a-4a7f-9def-ceed38ff936a	c46fe580-8935-4b2e-89d0-6371026f3fe5	5547a0873f1315e16d33b5b4887ec8e582d6bf75787e7f87d7c1fb865b737a82	2025-12-10 00:26:27.515+00	f	2025-12-09 23:26:27.615385+00
e7d9e9b9-6cfa-47fe-9189-e6e8ec7c0772	c46fe580-8935-4b2e-89d0-6371026f3fe5	306c10fab02eb34e41d68777f10832bf580f09b2141b15fdc10c510e985905c5	2025-12-10 20:19:57.251+00	f	2025-12-10 19:19:57.351266+00
1c7a3b99-ac3d-4834-be32-262f15348cc0	c46fe580-8935-4b2e-89d0-6371026f3fe5	8612e1cca73534bb26b7f2752d90e195c1c0876e88092d5e5ba4944a8395996a	2025-12-10 20:22:37.909+00	f	2025-12-10 19:22:38.005628+00
e872bf62-45b7-4ee9-974f-b37bf86bb249	c46fe580-8935-4b2e-89d0-6371026f3fe5	9348f52d67d1c382bec14a90b6d904e68772f6d0592b28ede870112aab59943e	2025-12-10 20:26:21.393+00	f	2025-12-10 19:26:21.50632+00
a1a7edc7-702f-4c2a-9d4b-15de3c3669aa	c46fe580-8935-4b2e-89d0-6371026f3fe5	e90c81cc9f1588e7c5ee6af1906c165cdeb2cfe14a86933b81e8323a53e0383c	2025-12-10 20:29:37.711+00	f	2025-12-10 19:29:37.812073+00
df31006f-c2a5-4025-9192-1cc2ab0d063c	c46fe580-8935-4b2e-89d0-6371026f3fe5	39d8fee850f78b61905c9662549edf23f54b979a61ce260c182455045ba5d1f7	2025-12-10 20:34:52.252+00	t	2025-12-10 19:34:54.386197+00
3d734cab-268a-41c7-aa4f-c57a96bbf9ea	c46fe580-8935-4b2e-89d0-6371026f3fe5	51a2294318c8524e1f472bccd15a7daee2dcd6bb7fa23540b3fec71f6319c35e	2025-12-10 20:39:44.705+00	t	2025-12-10 19:39:44.820613+00
\.


--
-- Data for Name: platform_stats; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.platform_stats (id, date, total_users, active_users, new_users, total_trades, monthly_revenue, free_users, premium_users, vip_users, created_at) FROM stdin;
\.


--
-- Data for Name: questionnaire_states; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.questionnaire_states (id, user_id, current_question, bankroll_value, partial_answers, created_at, updated_at, last_activity_at) FROM stdin;
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.subscription_plans (id, name, type, price, currency, billing_cycle, features, max_trades, max_csv_imports, has_api_access, has_advanced_analytics, is_active, created_at, updated_at) FROM stdin;
6e57ae28-9d49-4c79-8d74-6eb82b35f000	Gratuito	free	0.00	BRL	monthly	{"Máximo 10 trades","Dashboard básico","Sem análise com IA"}	10	\N	f	f	t	2025-10-24 23:35:10.84479	2025-12-09 22:08:35.425888
871ba830-cf75-4cb9-acf9-eb7e8845258f	Mensal	monthly	97.00	BRL	monthly	{"Trades ilimitados","Análise com IA avançada","Importação CSV ilimitada","Suporte prioritário"}	\N	\N	t	t	t	2025-10-24 23:35:10.84479	2025-12-09 22:08:39.506699
0909a512-194c-4d35-99c0-c566339603fe	Trimestral	quarterly	197.00	BRL	quarterly	{"Tudo do Mensal +","3 meses de acesso","Melhor custo-benefício","Relatórios avançados"}	\N	\N	t	t	t	2025-10-24 23:35:10.84479	2025-12-09 22:08:43.729171
96d29c78-4041-478f-93ed-39ddac02ade4	Anual	annual	547.00	BRL	yearly	{"Tudo do Trimestral +","12 meses de acesso","IA treinada no seu histórico","Suporte VIP dedicado","Gestão de risco personalizada"}	\N	\N	t	t	t	2025-10-24 23:35:10.84479	2025-12-09 22:08:48.118506
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.subscriptions (id, user_id, plan_id, status, start_date, end_date, price, payment_method, transaction_id, created_at) FROM stdin;
\.


--
-- Data for Name: support_conversations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.support_conversations (id, user_id, subject, status, priority, category, last_message_at, last_message_by_admin, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: support_messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.support_messages (id, conversation_id, sender_id, message, is_from_admin, created_at) FROM stdin;
\.


--
-- Data for Name: trades; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.trades (id, user_id, data_hora, ativo, mercado, setup, capital_utilizado, stop, alvo, resultado, quantidade, risco, tipo, comentario, emocao, preco_entrada, preco_saida, corretora, status, origem, external_id, csv_import_id, created_at, updated_at, wallet_id) FROM stdin;
bb403f83-e01e-4dd2-8a75-1ec6e46fee04	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-10-25 00:20:57.289	EURUSD	crypto	WhatsApp	100.00	\N	\N	200.00	1.0000	\N	compra	Via WhatsApp: comprei 500 reais no EURUSD e ganhei 200 reais de lucro	\N	0.0000	0.0000	crypto	fechado	manual	\N	\N	2025-10-25 00:20:57.31491	2025-10-25 00:20:57.31491	\N
6d6022b6-0dd9-4eab-b214-eaf6017c2dfb	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-10-25 01:05:15.189	EURUSD	crypto	WhatsApp	400.00	\N	\N	600.00	1.0000	\N	compra	Via WhatsApp: take no eurusd arrisquei 400 e ganhei 600	\N	0.0000	0.0000	crypto	fechado	manual	\N	\N	2025-10-25 01:05:15.208951	2025-10-25 01:05:15.208951	\N
cfb87538-0fd7-4a0c-be8a-109e553c3241	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-01 11:02:00	BITU25	b3	Clear CSV Import	0.00	0.0000	0.0000	-8.20	1.0000	0.00	venda	Clear: venda 1 contratos - 01/09/2025 11:02:00	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
9a8cd3c9-ba26-4fdd-ac2f-52346327a182	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-01 11:21:00	BITU25	b3	Clear CSV Import	0.00	0.0000	0.0000	-5.20	1.0000	0.00	compra	Clear: compra 1 contratos - 01/09/2025 11:21:00	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
69e9c33a-c7b2-49f6-9b0e-534ff0d5c81a	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-01 11:29:47	BITU25	b3	Clear CSV Import	0.00	0.0000	0.0000	-5.40	1.0000	0.00	compra	Clear: compra 1 contratos - 01/09/2025 11:29:47	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
c4290112-2ea9-43c3-b17c-6dd91967d6d6	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-01 11:34:42	BITU25	b3	Clear CSV Import	0.00	0.0000	0.0000	12.40	1.0000	0.00	compra	Clear: compra 1 contratos - 01/09/2025 11:34:42	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
a9c915d1-f1ab-4162-a0dd-52bdfd212f59	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-01 14:12:44	BITU25	b3	Clear CSV Import	0.00	0.0000	0.0000	20.00	1.0000	0.00	compra	Clear: compra 1 contratos - 01/09/2025 14:12:44	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
b1ca4ef3-ba83-4fe8-9428-a11003696f5c	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-02 10:27:37	BITU25	b3	Clear CSV Import	0.00	0.0000	0.0000	0.00	1.0000	0.00	venda	Clear: venda 1 contratos - 02/09/2025 10:27:37	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
78854aac-fb38-44ba-a80f-c2d5ffe5f47e	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-02 10:33:01	BITU25	b3	Clear CSV Import	0.00	0.0000	0.0000	-9.60	1.0000	0.00	venda	Clear: venda 1 contratos - 02/09/2025 10:33:01	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
adf23f9c-ff6d-4489-b26f-1412154aeade	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-04 10:33:07	WINV25	b3	Clear CSV Import	0.00	0.0000	0.0000	-25.00	1.0000	0.00	compra	Clear: compra 1 contratos - 04/09/2025 10:33:07	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
7db64237-a0a9-485c-99a9-a627e0eca220	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-04 10:42:21	WINV25	b3	Clear CSV Import	0.00	0.0000	0.0000	-18.00	1.0000	0.00	compra	Clear: compra 1 contratos - 04/09/2025 10:42:21	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
7ad5fbbe-4972-4abe-8145-3d9209cfbb17	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-04 10:47:25	WINV25	b3	Clear CSV Import	0.00	0.0000	0.0000	10.00	1.0000	0.00	compra	Clear: compra 1 contratos - 04/09/2025 10:47:25	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
86678fb8-4f3b-4538-b652-b7471e13ceda	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-04 11:09:00	WINV25	b3	Clear CSV Import	0.00	0.0000	0.0000	-9.00	1.0000	0.00	compra	Clear: compra 1 contratos - 04/09/2025 11:09:00	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
70ff8a0b-3df1-4f21-949b-0f234b3471a6	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-04 11:10:53	WINV25	b3	Clear CSV Import	0.00	0.0000	0.0000	0.00	1.0000	0.00	compra	Clear: compra 1 contratos - 04/09/2025 11:10:53	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
234dc68c-1633-45ce-a289-bda197873b06	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-04 11:18:01	WINV25	b3	Clear CSV Import	0.00	0.0000	0.0000	0.00	1.0000	0.00	compra	Clear: compra 1 contratos - 04/09/2025 11:18:01	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
392c3f6c-1db0-41d0-9c9f-1f6834d521fc	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-04 11:37:16	BITU25	b3	Clear CSV Import	0.00	0.0000	0.0000	-4.40	1.0000	0.00	venda	Clear: venda 1 contratos - 04/09/2025 11:37:16	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
dd4a6373-ee16-4411-9a13-4d7da7e856e8	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-04 11:40:07	BITU25	b3	Clear CSV Import	0.00	0.0000	0.0000	20.80	1.0000	0.00	venda	Clear: venda 1 contratos - 04/09/2025 11:40:07	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
1283e72f-3236-47f1-8c1b-d016121d0b65	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-04 14:04:07	BITU25	b3	Clear CSV Import	0.00	0.0000	0.0000	-6.00	1.0000	0.00	venda	Clear: venda 1 contratos - 04/09/2025 14:04:07	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
0e211b95-e049-45f9-a441-39fef4848696	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-08 14:02:47	BITU25	b3	Clear CSV Import	0.00	0.0000	0.0000	-3.60	1.0000	0.00	compra	Clear: compra 1 contratos - 08/09/2025 14:02:47	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
93ae4394-3f1c-4afe-97ae-24bdbcff3268	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-08 14:08:08	BITU25	b3	Clear CSV Import	0.00	0.0000	0.0000	8.00	1.0000	0.00	compra	Clear: compra 1 contratos - 08/09/2025 14:08:08	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
2bf0c528-1a48-4c2d-8d85-e851cf6df522	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-08 14:48:13	BITU25	b3	Clear CSV Import	0.00	0.0000	0.0000	-5.00	1.0000	0.00	compra	Clear: compra 1 contratos - 08/09/2025 14:48:13	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
fae43892-6a19-44ef-8b4c-42de442f48b8	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-08 15:21:35	BITU25	b3	Clear CSV Import	0.00	0.0000	0.0000	0.00	1.0000	0.00	venda	Clear: venda 1 contratos - 08/09/2025 15:21:35	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
ca6ffef9-7bff-4609-a60e-594533222c0b	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-08 15:51:28	BITU25	b3	Clear CSV Import	0.00	0.0000	0.0000	-3.40	1.0000	0.00	venda	Clear: venda 1 contratos - 08/09/2025 15:51:28	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
ad85ff02-d3e8-4099-ac5c-88ad7753e3e8	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-08 15:57:03	BITU25	b3	Clear CSV Import	0.00	0.0000	0.0000	-2.80	1.0000	0.00	venda	Clear: venda 1 contratos - 08/09/2025 15:57:03	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
7c0072ff-7a66-4e33-9f07-0858b5c4af10	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-09 14:43:01	BITU25	b3	Clear CSV Import	0.00	0.0000	0.0000	-4.00	1.0000	0.00	venda	Clear: venda 1 contratos - 09/09/2025 14:43:01	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
9ce25eb5-2662-4ea9-ad98-a0151f1dcaf0	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-09 14:45:00	BITU25	b3	Clear CSV Import	0.00	0.0000	0.0000	-4.00	1.0000	0.00	venda	Clear: venda 1 contratos - 09/09/2025 14:45:00	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
5fa90928-40b7-4173-b1db-fa5c86d7f6cb	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-09 14:46:19	BITU25	b3	Clear CSV Import	0.00	0.0000	0.0000	-4.20	1.0000	0.00	venda	Clear: venda 1 contratos - 09/09/2025 14:46:19	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
0e0796ff-dcd1-4f53-b0d8-ee8a28c90dfb	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-09-09 15:17:07	BITU25	b3	Clear CSV Import	0.00	0.0000	0.0000	-3.00	1.0000	0.00	venda	Clear: venda 1 contratos - 09/09/2025 15:17:07	neutro	0.0000	0.0000	b3	fechado	csv	\N	c2250353-1eb1-4158-b711-62fb7306a4dc	2025-10-25 21:27:15.637027	2025-10-25 21:27:15.637027	\N
11f2897e-2eeb-4327-95a6-8333551f467e	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-09 09:18:53	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-180.00	10.0000	0.00	compra	Clear: compra 10 contratos - 09/06/2025 09:18:53	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
714b09d1-3ba6-424f-b1c8-e8ed86f71d2c	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-09 13:54:38	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	20.00	10.0000	0.00	venda	Clear: venda 10 contratos - 09/06/2025 13:54:38	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
98279244-a4ce-4fb9-9ab1-1188f4080d81	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-09 14:06:25	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-160.00	10.0000	0.00	venda	Clear: venda 10 contratos - 09/06/2025 14:06:25	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
5bad716d-5018-47a0-9cdf-e1488b95cc59	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-09 14:15:20	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-270.00	10.0000	0.00	venda	Clear: venda 10 contratos - 09/06/2025 14:15:20	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
505dc680-4824-4e43-bddb-adb91c96760b	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-10 09:04:23	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-240.00	10.0000	0.00	venda	Clear: venda 10 contratos - 10/06/2025 09:04:23	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
9107784c-e5f4-432a-b2bf-b6a7a5c94ce6	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-10 10:36:10	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	320.00	4.0000	0.00	compra	Clear: compra 4 contratos - 10/06/2025 10:36:10	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
854ad8d8-e834-4c5c-a39e-89dde67f2ceb	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-11 10:55:29	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-180.00	4.0000	0.00	compra	Clear: compra 4 contratos - 11/06/2025 10:55:29	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
1b6dfd2b-a5c4-4bd7-975a-156180cc69e3	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-12 12:19:25	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	10.00	10.0000	0.00	venda	Clear: venda 10 contratos - 12/06/2025 12:19:25	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
44665da3-c277-4f51-bd7a-e6b88ad7bb0a	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-12 15:22:34	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-180.00	10.0000	0.00	venda	Clear: venda 10 contratos - 12/06/2025 15:22:34	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
a290bc18-cc0b-46bd-9124-8ac6face67ac	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-13 11:38:10	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	280.00	10.0000	0.00	venda	Clear: venda 10 contratos - 13/06/2025 11:38:10	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
29fc033e-a0d8-4999-812c-90c321ef9cdd	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-16 14:39:00	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	20.00	10.0000	0.00	compra	Clear: compra 10 contratos - 16/06/2025 14:39:00	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
4c0439c0-cbf0-4486-a4e2-d577215d88d1	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-18 12:17:41	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-180.00	10.0000	0.00	compra	Clear: compra 10 contratos - 18/06/2025 12:17:41	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
80dc6fa8-2831-4d12-8c91-c8ce893f4f89	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-20 11:18:38	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-160.00	10.0000	0.00	compra	Clear: compra 10 contratos - 20/06/2025 11:18:38	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
034ab651-b3ab-43bb-9d3f-3ec7046d58b5	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-20 13:10:32	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-200.00	10.0000	0.00	venda	Clear: venda 10 contratos - 20/06/2025 13:10:32	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
c9faa77b-a91e-46d6-ad8f-91bb278a4fa0	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-20 14:46:47	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-180.00	10.0000	0.00	compra	Clear: compra 10 contratos - 20/06/2025 14:46:47	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
1cd3971c-fee5-4721-8069-447a63aa599d	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-24 13:44:21	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	450.00	10.0000	0.00	venda	Clear: venda 10 contratos - 24/06/2025 13:44:21	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
20afefa4-f167-4fb4-9bd2-d3895291faf1	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-25 13:30:35	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	630.00	10.0000	0.00	venda	Clear: venda 10 contratos - 25/06/2025 13:30:35	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
f8a77803-b759-49f9-be4c-2424ef2835cc	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-27 11:49:23	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	420.00	10.0000	0.00	compra	Clear: compra 10 contratos - 27/06/2025 11:49:23	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
3bebe70b-f61e-4a91-865c-a87075d0b65d	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-30 11:14:04	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-140.00	4.0000	0.00	compra	Clear: compra 4 contratos - 30/06/2025 11:14:04	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
2dcde3e9-e6f8-4025-9d94-8695025bba4e	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-30 12:35:56	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	240.00	10.0000	0.00	compra	Clear: compra 10 contratos - 30/06/2025 12:35:56	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
19bc743c-af1e-4f6a-9df1-4d73298083dd	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-01 13:37:00	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	420.00	4.0000	0.00	compra	Clear: compra 4 contratos - 01/07/2025 13:37:00	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
019d7018-fe33-4a73-88da-bc944866cc8a	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-02 10:28:44	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-160.00	4.0000	0.00	venda	Clear: venda 4 contratos - 02/07/2025 10:28:44	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
7acb8eed-3a7c-4421-a755-aac08c18ffdc	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-02 11:18:18	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	20.00	4.0000	0.00	venda	Clear: venda 4 contratos - 02/07/2025 11:18:18	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
2eaa0024-c4bf-47af-a9c8-b658366c6a83	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-02 13:42:00	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-140.00	10.0000	0.00	venda	Clear: venda 10 contratos - 02/07/2025 13:42:00	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
ec9213d8-17f9-4770-bd4c-102dd3674bb9	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-02 14:06:16	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-230.00	10.0000	0.00	venda	Clear: venda 10 contratos - 02/07/2025 14:06:16	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
e202bc0d-f791-496c-a648-972bd133c226	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-03 09:40:10	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	20.00	4.0000	0.00	compra	Clear: compra 4 contratos - 03/07/2025 09:40:10	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
d8e1e475-a88a-4867-96a4-50887f419049	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-03 11:53:38	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-180.00	10.0000	0.00	compra	Clear: compra 10 contratos - 03/07/2025 11:53:38	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
62ec3e7d-af0c-437a-a835-9bcdae0a92e8	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-03 12:49:46	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-160.00	4.0000	0.00	venda	Clear: venda 4 contratos - 03/07/2025 12:49:46	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
44391aa9-2ac3-4e92-b469-b5d1f02b0c69	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-07 10:21:29	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-250.00	10.0000	0.00	compra	Clear: compra 10 contratos - 07/07/2025 10:21:29	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
acda7ba4-f1b8-4646-a75d-1026d8ba91f9	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-07 10:29:46	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-200.00	10.0000	0.00	compra	Clear: compra 10 contratos - 07/07/2025 10:29:46	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
b58c311d-6365-4b75-90ab-2d0f6861f02c	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-07 10:50:30	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	20.00	4.0000	0.00	compra	Clear: compra 4 contratos - 07/07/2025 10:50:30	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
937d233b-f1f9-4961-8386-12ab2b0077c4	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-07 12:07:55	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-200.00	4.0000	0.00	venda	Clear: venda 4 contratos - 07/07/2025 12:07:55	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
19b9d6c3-2c3a-4664-b7a9-6931e6c80af3	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-08 11:02:16	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	20.00	4.0000	0.00	compra	Clear: compra 4 contratos - 08/07/2025 11:02:16	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
9f8f1e60-6741-45b6-83a0-4c39e6f38c2a	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-08 11:35:39	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	340.00	4.0000	0.00	compra	Clear: compra 4 contratos - 08/07/2025 11:35:39	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
206370d6-a4a9-46a1-b1b9-ac03e2841a7b	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-10 10:40:04	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	970.00	10.0000	0.00	compra	Clear: compra 10 contratos - 10/07/2025 10:40:04	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
eebeffe3-870c-4d52-9490-d4e26ab8de0e	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-11 15:15:38	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-203.00	7.0000	0.00	venda	Clear: venda 7 contratos - 11/07/2025 15:15:38	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
4daea2c5-4db3-4b61-b3ba-79c786da2126	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-14 13:59:25	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	630.00	10.0000	0.00	venda	Clear: venda 10 contratos - 14/07/2025 13:59:25	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
5fdf8b04-479e-4792-bbc8-e8125ab00184	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-15 10:23:03	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	20.00	10.0000	0.00	compra	Clear: compra 10 contratos - 15/07/2025 10:23:03	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
591b0194-cb67-446c-a789-3598c67ae4e0	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-15 11:02:25	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	10.00	10.0000	0.00	compra	Clear: compra 10 contratos - 15/07/2025 11:02:25	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
9b22c4b7-69bc-4e49-a242-d7dd5f3f7a28	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-15 11:09:13	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-200.00	10.0000	0.00	compra	Clear: compra 10 contratos - 15/07/2025 11:09:13	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
b60a5820-3023-4a65-8654-ac37ccb11f71	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-15 11:14:05	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-250.00	10.0000	0.00	compra	Clear: compra 10 contratos - 15/07/2025 11:14:05	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
24fb4a55-a13b-4f6b-98ee-732e83540520	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-15 11:22:02	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	20.00	10.0000	0.00	compra	Clear: compra 10 contratos - 15/07/2025 11:22:02	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
c335dead-9787-46dd-94d2-a8637cf67dcb	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-15 13:16:36	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-140.00	4.0000	0.00	venda	Clear: venda 4 contratos - 15/07/2025 13:16:36	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
847c0419-e1a7-4346-ab7d-823039ec51c1	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-16 11:48:47	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	20.00	10.0000	0.00	compra	Clear: compra 10 contratos - 16/07/2025 11:48:47	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
e7d95db9-2eca-4f3d-9c10-7b5fa076025f	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-17 11:02:00	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	20.00	10.0000	0.00	compra	Clear: compra 10 contratos - 17/07/2025 11:02:00	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
8f33aa3f-45ac-4a6b-92c8-1fd39f08b796	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-17 13:07:57	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	20.00	10.0000	0.00	compra	Clear: compra 10 contratos - 17/07/2025 13:07:57	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
cbd271f4-6d33-4a63-98b1-1bc1935ba570	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-18 12:10:59	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-125.00	5.0000	0.00	compra	Clear: compra 5 contratos - 18/07/2025 12:10:59	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
15be2d9a-0d40-4705-9859-dc966ea7c3ca	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-18 12:14:34	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-250.00	5.0000	0.00	compra	Clear: compra 5 contratos - 18/07/2025 12:14:34	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
2d39ea7e-66a6-4a49-a14d-37aa4a12d3d0	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-21 10:59:59	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	180.00	2.0000	0.00	venda	Clear: venda 2 contratos - 21/07/2025 10:59:59	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
127f7277-0465-4c5b-8356-9b609f905608	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-22 12:21:43	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	10.00	5.0000	0.00	compra	Clear: compra 5 contratos - 22/07/2025 12:21:43	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
299b6645-db6e-41cd-91c4-dd7f0db8f67f	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-22 12:42:52	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	120.00	5.0000	0.00	compra	Clear: compra 5 contratos - 22/07/2025 12:42:52	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
578d2073-ebca-47cb-b6c3-c0738953a778	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-22 13:09:06	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-80.00	5.0000	0.00	compra	Clear: compra 5 contratos - 22/07/2025 13:09:06	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
64c36937-c7be-4964-b2dd-7eaf1b163773	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-22 14:07:46	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-85.00	5.0000	0.00	compra	Clear: compra 5 contratos - 22/07/2025 14:07:46	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
714d159e-367e-43bf-ac64-304e4bfec573	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-24 10:30:52	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-250.00	10.0000	0.00	compra	Clear: compra 10 contratos - 24/07/2025 10:30:52	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
79ce4bba-e11d-4adf-92de-fdd9b2a8d0a3	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-24 11:31:46	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	140.00	4.0000	0.00	compra	Clear: compra 4 contratos - 24/07/2025 11:31:46	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
41852952-eba2-45dc-ad7f-4c5b245b049c	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-24 11:33:24	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	650.00	10.0000	0.00	venda	Clear: venda 10 contratos - 24/07/2025 11:33:24	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
08a5dfb3-1a43-4fdb-b0b8-55a8ac6db3fc	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-25 10:56:57	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	630.00	10.0000	0.00	compra	Clear: compra 10 contratos - 25/07/2025 10:56:57	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
63f6d799-2344-4ab3-839a-9667776887f1	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-30 12:59:35	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-25.00	1.0000	0.00	compra	Clear: compra 1 contratos - 30/07/2025 12:59:35	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
26f62dce-7368-4ba8-912f-98ce62a2c84d	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-30 13:06:12	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-17.00	1.0000	0.00	compra	Clear: compra 1 contratos - 30/07/2025 13:06:12	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
63f0ff46-f97f-4dd8-86ed-b5593172fd81	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-30 13:07:24	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-14.00	1.0000	0.00	compra	Clear: compra 1 contratos - 30/07/2025 13:07:24	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
251fca9c-5790-41ea-b910-ca0ba15726d2	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-08-01 13:12:16	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	360.00	10.0000	0.00	compra	Clear: compra 10 contratos - 01/08/2025 13:12:16	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
f021b26a-c910-4b69-9d05-ba91ad597f3e	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-08-04 10:39:58	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-224.00	7.0000	0.00	compra	Clear: compra 7 contratos - 04/08/2025 10:39:58	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
43501254-42cf-40a7-bc27-f6ef50c5641f	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-08-04 11:37:46	WDOU25	b3	Clear CSV Import	0.00	0.0000	0.0000	380.00	4.0000	0.00	compra	Clear: compra 4 contratos - 04/08/2025 11:37:46	neutro	0.0000	0.0000	b3	fechado	csv	\N	2120ebc7-e839-4215-b34c-985cd353dcd2	2025-11-25 22:39:01.465288	2025-11-25 22:39:01.465288	\N
0f2a7428-e337-48ad-aba4-c3942d64edd8	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-03 11:57:00	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-16.00	1.0000	0.00	venda	Clear: venda 1 contratos - 03/06/2025 11:57:00	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
c2d3db7f-d1da-497d-9b85-51e67bd8abfa	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-03 12:17:12	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-15.00	2.0000	0.00	venda	Clear: venda 2 contratos - 03/06/2025 12:17:12	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
878110a5-0b04-4b4e-a2f8-82e543faba88	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-03 14:17:40	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-15.00	1.0000	0.00	compra	Clear: compra 1 contratos - 03/06/2025 14:17:40	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
22a0d6bf-3067-41db-af07-9643905524bf	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-04 11:00:55	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-26.00	1.0000	0.00	compra	Clear: compra 1 contratos - 04/06/2025 11:00:55	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
915846c0-c4e3-41b6-a578-46a1d60589f4	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-04 11:16:07	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	141.00	2.0000	0.00	venda	Clear: venda 2 contratos - 04/06/2025 11:16:07	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
d9ec80bb-da2e-404f-90ad-e58941570dd3	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-04 12:19:02	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-40.00	1.0000	0.00	venda	Clear: venda 1 contratos - 04/06/2025 12:19:02	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
bdf70d11-9c8c-4f56-b154-377a3835248c	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-04 13:55:45	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-20.00	1.0000	0.00	compra	Clear: compra 1 contratos - 04/06/2025 13:55:45	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
eb425efc-b613-4ff5-a86a-3f108c7c6bab	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-05 10:12:44	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-19.00	1.0000	0.00	compra	Clear: compra 1 contratos - 05/06/2025 10:12:44	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
dfc3b25c-2049-4ce5-b409-6cfe52c2cf96	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-05 10:18:16	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-14.00	2.0000	0.00	compra	Clear: compra 2 contratos - 05/06/2025 10:18:16	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
c8dd6d38-430e-47f6-bd68-6130c32add18	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-05 10:25:28	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	2.00	1.0000	0.00	compra	Clear: compra 1 contratos - 05/06/2025 10:25:28	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
ac3cb8d1-ece7-4804-8e10-52aa5035ff26	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-05 11:02:08	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-39.00	1.0000	0.00	compra	Clear: compra 1 contratos - 05/06/2025 11:02:08	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
686db1c2-7aa7-4e88-a813-45a896a8dc0b	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-06 13:25:44	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-15.00	1.0000	0.00	compra	Clear: compra 1 contratos - 06/06/2025 13:25:44	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
cdc95340-fd0d-498b-899e-ed315e687b41	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-06 13:43:29	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-5.00	1.0000	0.00	compra	Clear: compra 1 contratos - 06/06/2025 13:43:29	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
3103eb7b-100a-40dc-ad68-eb8bda69187f	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-06 13:57:35	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-17.00	1.0000	0.00	compra	Clear: compra 1 contratos - 06/06/2025 13:57:35	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
f606717c-a850-4e3c-a68a-665a2e4b9944	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-06 14:20:42	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	40.00	1.0000	0.00	venda	Clear: venda 1 contratos - 06/06/2025 14:20:42	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
31a73839-703b-41a9-8fc6-5c571141620b	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-06 14:48:24	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-16.00	1.0000	0.00	compra	Clear: compra 1 contratos - 06/06/2025 14:48:24	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
0190fb9f-5aed-47c3-930f-4d4a21ea50c2	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-06 14:54:09	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	21.00	2.0000	0.00	compra	Clear: compra 2 contratos - 06/06/2025 14:54:09	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
83fe5b9a-a5e5-43cd-afe0-b488d5f35f5e	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-06 15:32:56	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-68.00	2.0000	0.00	compra	Clear: compra 2 contratos - 06/06/2025 15:32:56	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
863be226-93ea-4e78-8da9-87240eb5d90a	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-09 11:19:19	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-30.00	2.0000	0.00	compra	Clear: compra 2 contratos - 09/06/2025 11:19:19	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
5d63d97e-ad32-4c9b-8cb2-f7c5298d818a	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-09 11:37:21	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-8.00	1.0000	0.00	compra	Clear: compra 1 contratos - 09/06/2025 11:37:21	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
c1c0a68d-0ab3-4117-8800-996f5cca7f69	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-09 11:46:19	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-54.00	2.0000	0.00	venda	Clear: venda 2 contratos - 09/06/2025 11:46:19	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
8f0f25b5-606b-4414-870d-4f625d9e68db	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-09 13:59:20	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-133.00	2.0000	0.00	venda	Clear: venda 2 contratos - 09/06/2025 13:59:20	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
250856b9-d7c2-47e0-a339-bd70c291de59	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-09 15:30:33	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-41.00	1.0000	0.00	venda	Clear: venda 1 contratos - 09/06/2025 15:30:33	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
e7d7c695-a215-4d79-8f60-11055a73be11	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-10 10:05:38	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	128.00	1.0000	0.00	venda	Clear: venda 1 contratos - 10/06/2025 10:05:38	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
9627c92f-44c8-46e3-9d6b-21e0b04c571a	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-10 10:21:07	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-28.00	1.0000	0.00	compra	Clear: compra 1 contratos - 10/06/2025 10:21:07	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
27d09d85-5f66-45b0-a513-1af4d1929637	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-10 10:32:47	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	83.00	2.0000	0.00	compra	Clear: compra 2 contratos - 10/06/2025 10:32:47	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
050222fe-b5bb-48ac-870d-c714dc386128	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-10 10:46:51	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-110.00	1.0000	0.00	venda	Clear: venda 1 contratos - 10/06/2025 10:46:51	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
342e4609-8242-45dc-a4c2-9a2eb533f2f6	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-10 11:02:54	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	46.00	2.0000	0.00	venda	Clear: venda 2 contratos - 10/06/2025 11:02:54	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
c505ac5f-2f23-44a3-8fde-482fa52aafdc	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-10 11:09:02	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	80.00	1.0000	0.00	venda	Clear: venda 1 contratos - 10/06/2025 11:09:02	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
00efede3-1780-4dcd-9beb-a8c27e899f85	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-11 10:08:22	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	24.00	2.0000	0.00	compra	Clear: compra 2 contratos - 11/06/2025 10:08:22	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
5ab22575-7b38-47d8-806d-c0cb697fd2cc	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-11 10:24:32	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	15.00	2.0000	0.00	venda	Clear: venda 2 contratos - 11/06/2025 10:24:32	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
8f11e5ae-21f6-439d-a0ef-e0abd8760ae6	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-11 10:35:58	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	260.00	1.0000	0.00	venda	Clear: venda 1 contratos - 11/06/2025 10:35:58	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
52c7786b-d0be-4763-8a20-872b165721dd	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-11 12:05:18	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-27.00	1.0000	0.00	compra	Clear: compra 1 contratos - 11/06/2025 12:05:18	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
cf83992a-0975-4069-981c-8deee4ead7d9	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-12 09:59:58	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-25.00	1.0000	0.00	compra	Clear: compra 1 contratos - 12/06/2025 09:59:58	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
fd08024d-7aac-4907-aa39-b5dd00652953	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-12 10:06:12	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	35.00	1.0000	0.00	compra	Clear: compra 1 contratos - 12/06/2025 10:06:12	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
2cec1f15-cc94-45ae-883b-3c0802c8eeef	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-12 11:54:08	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-40.00	1.0000	0.00	venda	Clear: venda 1 contratos - 12/06/2025 11:54:08	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
3cdf4187-d7f4-4e2e-94c3-b3d984fb31fc	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-12 11:58:44	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	20.00	1.0000	0.00	venda	Clear: venda 1 contratos - 12/06/2025 11:58:44	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
a6141105-1d1e-40fd-8d47-ff85cd4786bd	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-12 12:10:35	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-45.00	1.0000	0.00	venda	Clear: venda 1 contratos - 12/06/2025 12:10:35	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
18748cb6-ec17-4a57-9f5e-17166238d272	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-12 12:23:14	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-40.00	1.0000	0.00	venda	Clear: venda 1 contratos - 12/06/2025 12:23:14	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
0571ec40-7732-43dc-9a61-642a4af49df0	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-13 09:16:56	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-30.00	1.0000	0.00	venda	Clear: venda 1 contratos - 13/06/2025 09:16:56	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
3b4283ed-4ac4-4983-ae32-61f00254c078	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-13 09:40:04	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-50.00	1.0000	0.00	venda	Clear: venda 1 contratos - 13/06/2025 09:40:04	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
bf0d6a72-f892-4605-8e4c-26ffc198ee98	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-13 09:52:41	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-80.00	1.0000	0.00	venda	Clear: venda 1 contratos - 13/06/2025 09:52:41	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
9821c9d3-11c9-45bb-a454-360ec0098726	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-13 10:31:49	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	41.00	2.0000	0.00	venda	Clear: venda 2 contratos - 13/06/2025 10:31:49	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
ca8438c3-e770-4a08-b418-4b589c2742cb	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-13 10:36:38	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-80.00	2.0000	0.00	compra	Clear: compra 2 contratos - 13/06/2025 10:36:38	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
3914f105-7c5a-454d-baf5-27dde42dc0f2	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-13 10:39:08	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	45.00	2.0000	0.00	venda	Clear: venda 2 contratos - 13/06/2025 10:39:08	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
bee66121-bd7c-4b10-8444-8df711a8ec95	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-13 11:00:28	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	229.00	2.0000	0.00	venda	Clear: venda 2 contratos - 13/06/2025 11:00:28	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
7380c43f-c0e6-41e9-9aeb-79915b9388db	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-13 12:23:30	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	6.00	2.0000	0.00	venda	Clear: venda 2 contratos - 13/06/2025 12:23:30	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
50c5e82e-7bcb-4c3a-83c0-644169133bd4	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-13 13:36:51	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-8.00	1.0000	0.00	venda	Clear: venda 1 contratos - 13/06/2025 13:36:51	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
9205286d-acc9-4770-9788-6f0a15b7ee7f	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-13 13:38:19	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-25.00	1.0000	0.00	venda	Clear: venda 1 contratos - 13/06/2025 13:38:19	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
81242b83-7ceb-4b56-b18e-34f9bcea84a8	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-13 14:16:10	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	0.00	1.0000	0.00	compra	Clear: compra 1 contratos - 13/06/2025 14:16:10	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
632bfe0f-89ba-4634-b96e-2b2bcc6227fc	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-16 09:15:09	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-46.00	2.0000	0.00	venda	Clear: venda 2 contratos - 16/06/2025 09:15:09	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
1e95112f-084c-4d92-9984-019df6957b0c	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-16 09:21:58	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-62.00	2.0000	0.00	venda	Clear: venda 2 contratos - 16/06/2025 09:21:58	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
56b82bbd-7bb5-4684-822b-deaa926870c9	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-16 09:42:59	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-50.00	2.0000	0.00	venda	Clear: venda 2 contratos - 16/06/2025 09:42:59	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
61a75892-7f89-4901-9a1a-d00ef1d63a09	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-16 09:44:28	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-4.00	2.0000	0.00	compra	Clear: compra 2 contratos - 16/06/2025 09:44:28	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
3af88576-932a-4020-af52-b88eb42f3e7c	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-16 09:53:12	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-50.00	1.0000	0.00	venda	Clear: venda 1 contratos - 16/06/2025 09:53:12	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
c7495b73-8ba5-4824-8b83-80431af5ac65	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-16 09:55:47	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	47.00	2.0000	0.00	venda	Clear: venda 2 contratos - 16/06/2025 09:55:47	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
0f85e7b6-3acc-4d12-a6b6-3b907531d762	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-16 10:04:36	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-82.00	1.0000	0.00	venda	Clear: venda 1 contratos - 16/06/2025 10:04:36	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
263f0b7b-03c6-4405-a7b7-caf72b36cc10	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-16 10:09:53	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	32.00	1.0000	0.00	venda	Clear: venda 1 contratos - 16/06/2025 10:09:53	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
553daee7-48b3-4e30-ba00-4955fdba31d2	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-16 10:12:55	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	124.00	1.0000	0.00	venda	Clear: venda 1 contratos - 16/06/2025 10:12:55	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
8f599f8f-b5b6-45c7-a09f-dfa385205d25	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-16 10:27:19	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-170.00	2.0000	0.00	venda	Clear: venda 2 contratos - 16/06/2025 10:27:19	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
b4baf4f6-b38f-4ce3-bdda-67970b74dae6	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-16 11:45:41	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	152.00	2.0000	0.00	venda	Clear: venda 2 contratos - 16/06/2025 11:45:41	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
d0be82ee-082d-4b6d-90fd-8489b90b1b6e	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-16 14:09:42	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-10.00	2.0000	0.00	compra	Clear: compra 2 contratos - 16/06/2025 14:09:42	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
d39db0b9-773a-4899-926a-23bf28017027	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-16 14:22:11	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-68.00	2.0000	0.00	compra	Clear: compra 2 contratos - 16/06/2025 14:22:11	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
aff0feba-cefa-487b-9505-c4714de49e6c	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-16 14:29:01	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	38.00	1.0000	0.00	compra	Clear: compra 1 contratos - 16/06/2025 14:29:01	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
c942fd69-0274-4d57-b6a0-67e28916ff1f	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-16 14:36:11	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-48.00	1.0000	0.00	compra	Clear: compra 1 contratos - 16/06/2025 14:36:11	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
135c50bc-690c-416d-997a-95914790b09a	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-16 14:39:50	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-10.00	2.0000	0.00	compra	Clear: compra 2 contratos - 16/06/2025 14:39:50	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
c9343914-3f5f-4c1c-a8a6-42ba9ac63085	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-17 09:53:35	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-35.00	1.0000	0.00	compra	Clear: compra 1 contratos - 17/06/2025 09:53:35	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
44e8186e-6fb4-4ca3-9ee9-1493e7ac8b5c	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-17 11:23:59	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-15.00	2.0000	0.00	compra	Clear: compra 2 contratos - 17/06/2025 11:23:59	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
d1160219-908a-42ae-9ace-5a2e666b3ee4	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-17 11:33:44	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	5.00	1.0000	0.00	venda	Clear: venda 1 contratos - 17/06/2025 11:33:44	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
05934d03-72a9-4aa8-be11-422bb9ab44b7	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-17 11:48:23	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-45.00	1.0000	0.00	compra	Clear: compra 1 contratos - 17/06/2025 11:48:23	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
e3955d9f-a5c8-4946-8637-1d08b85e486e	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-17 13:02:07	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	10.00	1.0000	0.00	compra	Clear: compra 1 contratos - 17/06/2025 13:02:07	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
7003fd13-5dd7-4c62-9e8e-040afcc763a3	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-17 14:35:40	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	-41.00	2.0000	0.00	venda	Clear: venda 2 contratos - 17/06/2025 14:35:40	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
846859fb-8ac1-4795-ac20-8e5a6ad5c4e6	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-17 16:37:25	WINM25	b3	Clear CSV Import	0.00	0.0000	0.0000	53.00	2.0000	0.00	venda	Clear: venda 2 contratos - 17/06/2025 16:37:25	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
76272c2f-e92c-4b07-b9d5-cd29316f2639	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-18 14:14:54	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	76.00	3.0000	0.00	venda	Clear: venda 3 contratos - 18/06/2025 14:14:54	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
877eec41-632e-402a-870c-e1177d44cfe9	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-20 15:07:41	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-30.00	1.0000	0.00	venda	Clear: venda 1 contratos - 20/06/2025 15:07:41	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
a83f2638-e7ab-4212-a7b2-52d98196b8d8	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-20 15:11:38	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-2.00	1.0000	0.00	compra	Clear: compra 1 contratos - 20/06/2025 15:11:38	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
26d2734a-e64d-4aa1-beb0-1ed0b236fc41	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-20 15:17:35	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-38.00	1.0000	0.00	venda	Clear: venda 1 contratos - 20/06/2025 15:17:35	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
0e555031-3b01-4bcb-b657-7b51d1f5af0d	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-20 15:46:57	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-12.00	1.0000	0.00	venda	Clear: venda 1 contratos - 20/06/2025 15:46:57	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
8a229cd7-23a4-43c6-b500-3d646c8ea2c1	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-20 16:12:41	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-45.00	1.0000	0.00	venda	Clear: venda 1 contratos - 20/06/2025 16:12:41	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
0d8d3fbc-49c2-41a2-a64f-99469da89973	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-23 09:44:01	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-40.00	1.0000	0.00	compra	Clear: compra 1 contratos - 23/06/2025 09:44:01	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
8127d3cf-ba98-42ac-899a-79d944a1777a	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-23 11:07:23	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-68.00	2.0000	0.00	venda	Clear: venda 2 contratos - 23/06/2025 11:07:23	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
8bf0bc47-4053-458c-831d-78f57c86886c	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-23 11:18:53	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-5.00	1.0000	0.00	compra	Clear: compra 1 contratos - 23/06/2025 11:18:53	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
613af952-3463-4efc-91d8-92e4b215ff1d	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-23 11:55:41	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-10.00	1.0000	0.00	compra	Clear: compra 1 contratos - 23/06/2025 11:55:41	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
60c978a1-4b34-4b1e-ad52-287eee6bd78e	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-24 11:46:53	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-35.00	2.0000	0.00	venda	Clear: venda 2 contratos - 24/06/2025 11:46:53	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
df09ccb8-c766-43a2-b667-a845f8f97682	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-24 11:57:10	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-119.00	1.0000	0.00	venda	Clear: venda 1 contratos - 24/06/2025 11:57:10	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
095cad09-3257-48c8-9f13-e2d99248ebbe	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-24 11:57:55	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	0.00	2.0000	0.00	venda	Clear: venda 2 contratos - 24/06/2025 11:57:55	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
50bfbff6-8b01-40c3-9f76-9e377056e3e5	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-24 14:13:45	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	1.00	1.0000	0.00	venda	Clear: venda 1 contratos - 24/06/2025 14:13:45	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
f72bac2d-936d-4769-b133-e80e866c0056	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-24 14:28:48	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	80.00	2.0000	0.00	compra	Clear: compra 2 contratos - 24/06/2025 14:28:48	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
f407c126-0517-4e7e-8e20-66f3da89f7e4	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-24 15:04:08	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-22.00	2.0000	0.00	compra	Clear: compra 2 contratos - 24/06/2025 15:04:08	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
a9933037-544f-48e3-96c4-95f1f335c7fc	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-24 15:17:14	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-26.00	2.0000	0.00	compra	Clear: compra 2 contratos - 24/06/2025 15:17:14	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
298f846e-91c7-4077-8458-5a9366655a45	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-25 09:02:33	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-44.00	1.0000	0.00	compra	Clear: compra 1 contratos - 25/06/2025 09:02:33	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
f5598bd0-02c7-44ca-b712-e7157884d303	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-25 11:29:45	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	20.00	1.0000	0.00	venda	Clear: venda 1 contratos - 25/06/2025 11:29:45	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
0c6757c1-9a38-4e84-869a-d1080d85e65f	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-25 12:06:04	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-45.00	1.0000	0.00	venda	Clear: venda 1 contratos - 25/06/2025 12:06:04	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
a944a9f0-7dae-4b66-af43-faf630bf6b37	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-26 09:02:02	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-15.00	1.0000	0.00	venda	Clear: venda 1 contratos - 26/06/2025 09:02:02	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
8ddb418e-0b1c-4800-90e2-4487f904f4e1	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-26 09:07:17	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-10.00	1.0000	0.00	venda	Clear: venda 1 contratos - 26/06/2025 09:07:17	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
06b7a50d-cffa-4702-a15d-3b77f89b3def	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-26 12:30:10	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-4.00	1.0000	0.00	venda	Clear: venda 1 contratos - 26/06/2025 12:30:10	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
e184d199-6406-48b4-a92e-80d8e5b2d133	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-26 12:31:45	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-4.00	1.0000	0.00	venda	Clear: venda 1 contratos - 26/06/2025 12:31:45	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
c8a6c76e-a0b1-45df-b4ae-7df8365a4779	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-26 12:33:01	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-30.00	1.0000	0.00	compra	Clear: compra 1 contratos - 26/06/2025 12:33:01	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
725761f1-422e-447f-a3f8-23fda499c506	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-27 10:05:30	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	61.00	1.0000	0.00	compra	Clear: compra 1 contratos - 27/06/2025 10:05:30	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
1c443ae9-a7ff-4cf5-adc6-7670e4ab7da8	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-27 10:12:27	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-17.00	1.0000	0.00	venda	Clear: venda 1 contratos - 27/06/2025 10:12:27	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
e10640cb-5567-49fa-98cc-3cc982c6a290	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-27 10:29:32	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	28.00	1.0000	0.00	compra	Clear: compra 1 contratos - 27/06/2025 10:29:32	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
87aaf924-9073-49de-87fd-b877d0b6fc06	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-27 11:58:11	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-14.00	1.0000	0.00	compra	Clear: compra 1 contratos - 27/06/2025 11:58:11	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
bda6c1e1-b734-4c8f-b73d-6c9e35408fd5	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-27 11:59:22	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	44.00	2.0000	0.00	compra	Clear: compra 2 contratos - 27/06/2025 11:59:22	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
c8c14a1d-0dfc-4ebf-8148-0088523e1b14	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-27 12:16:12	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	15.00	1.0000	0.00	venda	Clear: venda 1 contratos - 27/06/2025 12:16:12	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
6dfd49c8-899c-4b5c-a97b-e1418cbba5c4	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-27 12:36:37	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	-30.00	1.0000	0.00	compra	Clear: compra 1 contratos - 27/06/2025 12:36:37	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
9ee30ff6-ec96-4d2c-b928-b45f03591e45	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-27 12:46:19	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	8.00	1.0000	0.00	venda	Clear: venda 1 contratos - 27/06/2025 12:46:19	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
8103437e-79ac-4af5-afd8-2369fdf02c9b	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-27 12:51:34	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-18.00	1.0000	0.00	venda	Clear: venda 1 contratos - 27/06/2025 12:51:34	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
ec1c9e3a-9041-4c21-9d9e-b98f0590f9d1	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-27 13:16:38	WDON25	b3	Clear CSV Import	0.00	0.0000	0.0000	205.00	1.0000	0.00	compra	Clear: compra 1 contratos - 27/06/2025 13:16:38	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
be7b388b-5ef1-40f0-bf31-fcc21a2b2948	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-30 09:07:20	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-39.00	1.0000	0.00	compra	Clear: compra 1 contratos - 30/06/2025 09:07:20	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
f9ab08b2-7924-467b-8dca-a5e45bbcf891	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-30 09:24:31	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-30.00	1.0000	0.00	venda	Clear: venda 1 contratos - 30/06/2025 09:24:31	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
fb3af4ee-7f13-4c0a-bf8c-5ff61b6cc373	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-30 09:44:58	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	215.00	1.0000	0.00	venda	Clear: venda 1 contratos - 30/06/2025 09:44:58	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
9c0d545b-da14-4e03-9c1c-7528ec874de8	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-30 10:09:10	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	20.00	1.0000	0.00	compra	Clear: compra 1 contratos - 30/06/2025 10:09:10	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
fd7c248e-2d51-4f30-b4df-d29823dc893e	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-30 10:59:45	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	25.00	1.0000	0.00	compra	Clear: compra 1 contratos - 30/06/2025 10:59:45	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
74642741-a066-4472-9ce6-a7d75b1c0ced	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-30 11:14:04	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-70.00	2.0000	0.00	compra	Clear: compra 2 contratos - 30/06/2025 11:14:04	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
bc1e215e-42f1-48ca-91be-11eca7ec965d	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-30 11:18:08	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-40.00	1.0000	0.00	compra	Clear: compra 1 contratos - 30/06/2025 11:18:08	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
1008b53d-8702-4d13-a27f-2efff66c8c46	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-06-30 11:27:38	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-50.00	1.0000	0.00	compra	Clear: compra 1 contratos - 30/06/2025 11:27:38	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
61dabded-301b-4f3d-af41-d89d1d46b7bb	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-01 10:59:38	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-9.00	1.0000	0.00	compra	Clear: compra 1 contratos - 01/07/2025 10:59:38	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
d780e66f-c048-4f83-943d-e8dd117649cb	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-01 13:45:37	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	50.00	2.0000	0.00	compra	Clear: compra 2 contratos - 01/07/2025 13:45:37	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
0ba4275c-413a-4ef6-8dc4-cc3ad0545c6b	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-01 16:16:01	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-40.00	1.0000	0.00	compra	Clear: compra 1 contratos - 01/07/2025 16:16:01	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
e8079a82-bd4a-499e-ad00-e1f46ce2478f	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-01 16:28:50	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	50.00	1.0000	0.00	venda	Clear: venda 1 contratos - 01/07/2025 16:28:50	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
61da86ef-5907-4723-a63e-d24155448ec1	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-01 16:42:29	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-35.00	1.0000	0.00	compra	Clear: compra 1 contratos - 01/07/2025 16:42:29	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
63fcf00b-14dc-4154-90af-80e2f4619827	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-01 16:45:05	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	74.00	1.0000	0.00	compra	Clear: compra 1 contratos - 01/07/2025 16:45:05	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
b9d03834-1080-4b4e-bf5a-5c4f38519a8c	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-01 17:04:30	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	-60.00	1.0000	0.00	venda	Clear: venda 1 contratos - 01/07/2025 17:04:30	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
6256a18b-d4f5-4846-8473-9d34e4d8ae3b	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-02 09:06:09	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	85.00	1.0000	0.00	venda	Clear: venda 1 contratos - 02/07/2025 09:06:09	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
ca383aaf-b595-471e-89fe-07f35f48b271	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-02 09:22:07	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	5.00	1.0000	0.00	compra	Clear: compra 1 contratos - 02/07/2025 09:22:07	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
7c3cdc51-0805-45e1-8662-211775d9ef76	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-02 09:34:41	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	20.00	1.0000	0.00	venda	Clear: venda 1 contratos - 02/07/2025 09:34:41	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
b89d114c-39db-4100-a053-121888dbcb83	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-02 09:43:30	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	11.00	1.0000	0.00	compra	Clear: compra 1 contratos - 02/07/2025 09:43:30	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
7555533b-1c67-46e3-8586-17a50d3afcb6	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-02 09:53:52	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	45.00	1.0000	0.00	venda	Clear: venda 1 contratos - 02/07/2025 09:53:52	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
9423fdf1-029d-4c4c-953d-c9e17d389268	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-03 09:32:20	WDOQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	95.00	1.0000	0.00	venda	Clear: venda 1 contratos - 03/07/2025 09:32:20	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
39c8dc40-f2da-4e6f-baa2-2d25b76d8ef8	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-07-03 09:32:50	WINQ25	b3	Clear CSV Import	0.00	0.0000	0.0000	64.00	2.0000	0.00	compra	Clear: compra 2 contratos - 03/07/2025 09:32:50	neutro	0.0000	0.0000	b3	fechado	csv	\N	427954a2-df0d-4369-aab4-62831d3334f5	2025-11-27 14:13:24.110231	2025-11-27 14:13:24.110231	\N
fa3b14d2-8d4f-4f64-9036-d050ffcd27f5	e2b4862f-2d91-4711-a184-ef97eeaaeebd	2025-11-27 20:38:00	eurusd	forex	Breakout	0.00	1500.0000	18000.0000	1500.00	1.0000	0.00	venda	asdasd	frustrado	0.0000	0.0000	forex	fechado	manual	\N	\N	2025-11-27 20:39:24.520461	2025-11-27 20:47:12.184	\N
e18c8878-9bb3-4d0f-8b97-b937c856ce73	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2025-12-15 06:36:00	tetw	OB QUOTEX	Breakout	0.00	18000.0000	18000.0000	-18000.00	1.0000	0.00	compra		medo	0.0000	0.0000	OB QUOTEX	fechado	manual	\N	\N	2025-12-15 06:36:51.944934	2025-12-15 06:36:51.944934	65bae564-724c-4e8f-b6b6-899586ba0709
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, name, email, password, phone, whatsapp_number, capital_inicial, meta_mensal, perfil_risco, plan_type, plan_expires_at, is_active, role, last_login_at, created_at, updated_at, google_id, profile_photo, force_logout_at) FROM stdin;
cacc0375-4ae6-48d1-84bc-60a61ffa5bc4	Admin Sistema	admin@metrika.com	$2b$10$test.hash.exemplo	+5511999999999	\N	0.00	5.00	moderado	free	\N	t	admin	\N	2025-10-24 23:34:58.349485	2025-10-24 23:34:58.349485	\N	\N	\N
fe017606-55e4-453c-bb05-6491dc7ab54c	Métrica wpp Finality	metricawppfinality@gmail.com	\N	\N	\N	0.00	5.00	moderado	free	\N	t	user	2025-11-11 17:18:47.746	2025-11-11 17:18:47.724493	2025-11-11 17:18:47.746	117431461972080066420	https://lh3.googleusercontent.com/a/ACg8ocLp62yJALz723kkrNXcxtCgY2mh-xDw7JMTjPt65UmTAqxDxw=s96-c	\N
c46fe580-8935-4b2e-89d0-6371026f3fe5	Alexcio	kmargoartilheiro@gmail.com	$2b$10$oOC.EPTNz7njRg3c9A/U5eWs37pnHPCaPx3oRPcEVIpbnFSfgM1g2	61992800343	\N	0.00	5.00	moderado	free	\N	t	user	2025-12-11 16:23:05.744	2025-12-09 23:25:41.72133	2025-12-11 16:23:05.744	\N	\N	\N
e2b4862f-2d91-4711-a184-ef97eeaaeebd	asdasd	po@po.com	$2b$10$AT.xPI4LFpp6l1kU9/u9heU2cCSJ9LxC8zmEl3HL0s8Riu1PtIuaa	6165615156	\N	0.00	5.00	moderado	free	\N	t	user	2025-11-27 20:59:38.667	2025-11-27 20:38:49.762295	2025-11-27 20:59:38.667	\N	\N	\N
3992fbbc-1564-4b3a-917a-e886c5b545b8	Administrador	admin@admin.com	$2b$10$LyFtrR8gerLu4FBhtyCSxOyZ6o04DrUa5jBPM49gXs5n86mxZ6ThW	+5511987654321	\N	0.00	5.00	moderado	black	2026-01-26 01:39:11.604	t	admin	2025-12-27 01:39:11.104	2025-10-24 23:36:39.114992	2025-12-27 01:39:11.604	\N	\N	\N
72b84ed2-e174-46ce-b2d1-fa98cfdd1642	a	a@a.com	$2b$10$tClSYetaANiHEzAmWkos2umtwARq6FdTwCw.kAGNWTZANk/cYxLgq	61992800343	5561992800343	0.00	5.00	moderado	monthly	2026-01-26 01:39:42.963	t	user	2025-12-27 01:40:01.281	2025-10-24 23:36:12.880494	2025-12-27 01:40:01.281	\N	\N	\N
\.


--
-- Data for Name: wallets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.wallets (id, user_id, name, description, color, icon, is_default, created_at, updated_at) FROM stdin;
65bae564-724c-4e8f-b6b6-899586ba0709	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	OB QUOTEX	teste	#10B981	trending	f	2025-12-05 21:07:09.203	2025-12-05 21:07:09.203
c5983a36-a5b6-4693-9065-4172da3fd2fa	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	teste	te	#3B82F6	wallet	f	2025-12-15 06:34:02.781	2025-12-15 06:34:02.781
\.


--
-- Data for Name: whatsapp_messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.whatsapp_messages (id, message_id, from_number, user_id, message_text, message_type, status, trade_id, error_message, processed_at, created_at) FROM stdin;
d22dcdf2-2e06-4034-b33c-6fdc58522bc2	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDI0OEQwRDk4NjI4QzlBOTg5OQA=	556192800343	\N	oi	text	ignored	\N	Usuário não encontrado para este número	\N	2025-10-25 00:17:42.804909
0d04c560-be84-4ea8-a423-a73972cad86d	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMEM4QzBEM0RBNDVENTFDOTFDRQA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	oi	text	menu_sent	\N	\N	2025-10-25 00:20:38.166	2025-10-25 00:20:37.689579
b1383679-faed-4fc7-960d-398979ec21d1	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMEFEMDNBNUYwQkUwNDdEMzg1RQA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	btn_save_trade	interactive	save_trade_instructions_sent	\N	\N	2025-10-25 00:20:42.161	2025-10-25 00:20:41.84197
69106d01-974a-4cd7-bcac-771f0b94ebfe	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDMyMUMyQUU1RjY5ODk5QTNBQwA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	comprei 500 reais no EURUSD e ganhei 200 reais de lucro	text	processed	bb403f83-e01e-4dd2-8a75-1ec6e46fee04	\N	2025-10-25 00:20:57.38	2025-10-25 00:20:57.267969
cc4f3e67-0e9a-4fc2-9bb3-33410a83ed61	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDlEQkEwNzFCM0IzRURCREM5RAA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	oi	text	menu_sent	\N	\N	2025-10-25 00:52:54.526	2025-10-25 00:52:53.919989
e2ecb074-b600-4e9a-ad83-a401aacc430f	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDI1RUJEQkM3MjIxMzQ2MTAwNwA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	btn_statistics	interactive	statistics_sent	\N	\N	2025-10-25 01:01:38.588	2025-10-25 01:01:38.096572
acbb9181-38a2-4ad6-b357-78063be2ba48	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDNCQ0Y4NjYyMDMyRkMxNjkzQQA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	oi	text	menu_sent	\N	\N	2025-10-25 01:04:45.166	2025-10-25 01:04:44.655192
0a916695-85b5-4bf7-af98-c1d3e0ba01a1	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMEJERjQ3MkM1RjdCQjc2Q0M3RQA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	btn_save_trade	interactive	save_trade_instructions_sent	\N	\N	2025-10-25 01:04:54.058	2025-10-25 01:04:53.582129
c7eea046-b7e9-413f-8d30-b74649c13e4d	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDBFMzQyMkQyNjE3RkM0OTgyMQA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	take no eurusd arrisquei 400 e ganhei 600	text	processed	6d6022b6-0dd9-4eab-b214-eaf6017c2dfb	\N	2025-10-25 01:05:15.279	2025-10-25 01:05:15.165699
d7a0fc8b-4af6-4945-ac4b-25953171f1d2	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgUMkFCMzA3QkVBMDFBOTBDOEM5NjAA	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	Ajuda	text	menu_sent	\N	\N	2025-11-05 12:33:56.074	2025-11-05 12:33:55.075596
99af6dff-cd8b-4faa-9bec-8b02ec9e6c6b	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgUMkEyQ0ZDMTgwNEIzNTc5OTAzQjAA	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	Oi	text	menu_sent	\N	\N	2025-11-05 12:34:07.448	2025-11-05 12:34:07.007648
1a57a8af-9c81-4538-8872-865a7068a8be	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgUMkEwNUJFM0YzRDkzODJFQ0Y5MzkA	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	Olá	text	menu_sent	\N	\N	2025-11-05 12:40:19.435	2025-11-05 12:40:18.924153
5f2ef097-7154-4b66-ae57-5354e5ad5c03	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgUMkFFN0M2OTE4NzZDRUYxMTcyMDcA	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	Oi	text	menu_sent	\N	\N	2025-11-05 12:47:10.912	2025-11-05 12:47:09.733454
0340373e-08a9-480d-a77b-c9aeea23e3b0	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgUMkFBMUNDNjkzNjI4QUE1QjJFNDkA	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	Oi	text	menu_sent	\N	\N	2025-11-05 12:58:44.946	2025-11-05 12:58:44.212537
b9352218-2571-4bd1-89d6-c418c07de593	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgUMkFEODE4NTI1QTBFM0RDNzVGMUIA	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	Oi	text	menu_sent	\N	\N	2025-11-05 12:59:02.601	2025-11-05 12:59:02.160937
c915af2f-fd5d-4e42-aa4c-10e1d14e3a26	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgUMkFFRDEzNkQzRUMwRjFFMjdGNjcA	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	Pi	text	menu_sent	\N	\N	2025-11-05 13:02:18.979	2025-11-05 13:02:18.483194
75a1bcd9-2a66-4a0d-a90d-84dd00c2bc34	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDc5RkU5QUREMTZGODgzMDRCNwA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	oi	text	menu_sent	\N	\N	2025-11-13 01:56:22.917	2025-11-13 01:56:21.821026
a8ceab5c-6f3e-4e67-8d69-f031d6c97588	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMEEwQzczMUI4MUNCMDREOEVFQgA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	oi	text	menu_sent	\N	\N	2025-11-13 01:59:31.841	2025-11-13 01:59:31.264209
021cd5d0-edc5-477e-a023-b44fa7d17144	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDNBNzI0QTlENEQ3ODk1RTMxMAA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	oi	text	menu_sent	\N	\N	2025-11-13 02:02:08.11	2025-11-13 02:02:07.448456
2d90051c-92f1-4586-80af-300256b84dd4	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMEU5OUY5RkI1OUI3MTBGQ0E4RAA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	btn_create_bankroll	interactive	create_bankroll_instructions_sent	\N	\N	2025-11-13 02:02:16.116	2025-11-13 02:02:14.993523
49604886-1be2-40ea-b205-196cefe98a13	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMEQ5ODE0NjdFMEM3RjE1QTc1RAA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	oi	text	menu_sent	\N	\N	2025-11-13 02:08:24.836	2025-11-13 02:08:24.200908
f179f826-4983-45cd-a262-3426c45ef004	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDVFMTE5REJBRjEzM0Y5QjU2MwA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	btn_create_bankroll	interactive	waiting_for_bankroll_value	\N	\N	2025-11-13 02:08:28.753	2025-11-13 02:08:28.004164
7510e423-4381-4da8-ba72-1617dd649856	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDMxMTQ3RkVDMEU0NDlGMTVGNQA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	1500	text	questionnaire_started	\N	\N	2025-11-13 02:08:36.354	2025-11-13 02:08:35.596561
2e13088a-c9f4-46e5-9e9e-6dc97effec2d	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMEY1MUUzMkI2RkEzOTg3Q0FFRQA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	B	text	questionnaire_response_processed	\N	\N	2025-11-13 02:08:55.766	2025-11-13 02:08:55.165499
79883f61-823e-43d9-8c82-da0abadbe25a	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDUyRTA2NzE2MjQ2MTNBREUwQgA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	C	text	questionnaire_response_processed	\N	\N	2025-11-13 02:09:08.713	2025-11-13 02:09:08.00656
ae19f20b-0a6a-4413-937a-96358d65d53a	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMEMzM0QzQjU3REU2QzIwQTc5QQA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	D	text	questionnaire_response_processed	\N	\N	2025-11-13 02:10:11.628	2025-11-13 02:10:10.980332
67b20e45-3e33-4805-9ce8-a9588ca5e2e0	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMEE0RkE4NEEzNjVEMDY5RUU2OQA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	A	text	questionnaire_response_processed	\N	\N	2025-11-13 02:10:20.567	2025-11-13 02:10:19.942341
d61d22b4-ac91-449e-81c9-9001e3093514	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMEE5MTE4MzQ5NjIxNjBCQkM0OQA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	48, 2,5	text	questionnaire_response_processed	\N	\N	2025-11-13 02:11:04.848	2025-11-13 02:11:04.137478
5b51866e-bd57-4284-b88a-ab8bca9193ac	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDY0MDgxNDJBOTJBM0JEMzQzRAA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	48, 2.5	text	questionnaire_response_processed	\N	\N	2025-11-13 02:11:19.249	2025-11-13 02:11:18.569681
9e3d1c2c-105c-433e-90af-476092c31f3b	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMEE5MUQzREU0Qjg4Mzc2NzYyMwA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	C	text	questionnaire_response_processed	\N	\N	2025-11-13 02:11:36.872	2025-11-13 02:11:36.111613
b64e6d81-54f9-4cf3-b2ac-978be267a41a	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDJGMEI0MTI0Q0ZBN0EzREY1OAA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	b	text	questionnaire_response_processed	\N	\N	2025-11-13 02:12:34.081	2025-11-13 02:12:33.409391
60830db4-c911-4bd3-b199-f569cd06ba26	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDMwMDU5NjhBREExREU0NzlGRgA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	B	text	questionnaire_response_processed	\N	\N	2025-11-13 02:12:40.971	2025-11-13 02:12:40.342475
b9d141b7-84fe-4124-84db-c0615235d1f2	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMEMwNjczM0U3RUQ1MzZGMTc5MAA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	oi	text	questionnaire_response_processed	\N	\N	2025-11-13 03:17:46.415	2025-11-13 03:17:45.574139
a74e8111-7473-4aeb-a3cc-96ff671ac87a	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDMzNjFGOTYzNDQ4RDA5ODBFNgA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	ajuda	text	questionnaire_response_processed	\N	\N	2025-11-13 03:17:59.224	2025-11-13 03:17:58.626701
5259b590-be99-4330-8d75-954d22007338	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMEIwQTdERUVGMkQzQjc4Njc3RQA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	A	text	questionnaire_response_processed	\N	\N	2025-11-13 03:18:06.961	2025-11-13 03:18:06.305147
28bf845a-eae9-482a-a51b-87348412a015	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMEIwOTJGRjA3MTI5MTk2NUQ2NAA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	resetar	text	questionnaire_response_processed	\N	\N	2025-11-13 03:18:13.269	2025-11-13 03:18:12.62159
7ddf707a-b5a5-43c0-aec8-354159f97461	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDZFRDlCNEI4NUU4MjFDNkI2MgA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	oi	text	questionnaire_response_processed	\N	\N	2025-11-13 03:25:04.496	2025-11-13 03:25:03.760625
c3100188-8c61-4ff4-9993-23684c1058db	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDdFNDkxOTREMzY2OTI4OTQ5QwA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	ajuda	text	menu_sent	\N	\N	2025-11-13 03:25:12.289	2025-11-13 03:25:11.757472
a6d5369a-7647-46f9-bd1c-c7b5b419f734	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMEIzN0NGRDc4NTBCMTJCMDZEQQA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	btn_create_bankroll	interactive	waiting_for_bankroll_value	\N	\N	2025-11-13 03:25:18.56	2025-11-13 03:25:17.188652
8ce44b2e-8409-4658-81d6-3803085d65f3	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDMwQzhDRjg0MkZEMDc1NjI4MQA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2500	text	questionnaire_started	\N	\N	2025-11-13 03:25:27.629	2025-11-13 03:25:26.948028
62f988fc-f73b-4712-a4f4-61a2d12e8d8e	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMEUxQjA1NjcxQTIyNzJFRjlFNwA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	A	text	questionnaire_response_processed	\N	\N	2025-11-13 03:25:34.936	2025-11-13 03:25:33.918278
811241d2-e1c0-4de0-9cef-c31222652f87	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDlCNEJEMzBBMEZEM0IxN0VDOQA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	B	text	questionnaire_response_processed	\N	\N	2025-11-13 03:25:39.19	2025-11-13 03:25:38.43677
1dc79244-4346-4d6e-86a3-5114e7ffc571	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDVBQkE2RDEwRDgwQ0U2MTRFOQA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	A	text	questionnaire_response_processed	\N	\N	2025-11-13 03:25:43.224	2025-11-13 03:25:42.44643
b9404afb-d394-4ed7-99ce-b856dffcc2da	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMEY5OEEwMTZFMjZDQTdCQjY1OQA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	A	text	questionnaire_response_processed	\N	\N	2025-11-13 03:25:47.601	2025-11-13 03:25:46.954644
35b9b2d6-1c3b-4cc2-924a-c4713bc46e01	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDE5QkNENkIyNUI1MkJCMTE4OQA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	80 , 2.8	text	questionnaire_response_processed	\N	\N	2025-11-13 03:26:07.199	2025-11-13 03:26:06.403012
ced2f5a0-85fe-487b-848f-34f4c7e7ff0e	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDBCRkJBMzI5REU0RjRGOUZEMwA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	A	text	questionnaire_response_processed	\N	\N	2025-11-13 03:26:11.465	2025-11-13 03:26:10.780174
d3f89927-722a-4524-80d4-79ff5d856cf4	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDQ4MUI4QTdCMzhGMEZCMDRCQwA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	B	text	questionnaire_response_processed	\N	\N	2025-11-13 03:26:14.497	2025-11-13 03:26:13.921527
a924c6b5-c9ba-43e6-920c-e4d8ed4d4aef	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDRDODg5MTcxNUFGRDQ2QkRGOAA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	ajuda	text	questionnaire_response_processed	\N	\N	2025-11-13 03:30:55.913	2025-11-13 03:30:55.154843
9b48cc99-706d-423d-8929-1c0b3c4c35e3	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDMyREJBRDg0QkQ4NDFDQ0RGNwA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	ajuda	text	menu_sent	\N	\N	2025-11-13 03:31:04.13	2025-11-13 03:31:03.537811
b3db1283-744a-4864-bfbc-6858d207caea	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMENDODY1RTQ4MkFBMTc3MkE2RQA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	btn_create_bankroll	interactive	waiting_for_bankroll_value	\N	\N	2025-11-13 03:31:08.023	2025-11-13 03:31:07.43269
a699eed0-98c7-44a4-8fca-3eb0053bc70d	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDlDMzAzN0RGRjU5NDM5MTNFMgA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	2500	text	questionnaire_started	\N	\N	2025-11-13 03:32:18.073	2025-11-13 03:32:17.143124
d64a3615-0415-47ef-8412-6c67dcb1e44c	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMEZFRTMyNTcyMUE1QjQ0QTJBRAA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	A	text	questionnaire_response_processed	\N	\N	2025-11-13 03:32:21.746	2025-11-13 03:32:21.085035
8ac01f3e-4552-4615-a214-e4a8575d7187	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMEY4OEQ4RDMwMDIwRDQ0MzBCOAA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	B	text	questionnaire_response_processed	\N	\N	2025-11-13 03:32:24.513	2025-11-13 03:32:23.912297
1c89efb4-5f5b-4703-9ac2-b401143a9805	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDhCMUI0OUFEOEQzRTIyQzRDMwA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	C	text	questionnaire_response_processed	\N	\N	2025-11-13 03:32:27.636	2025-11-13 03:32:26.953793
37428034-a969-4cd1-8f33-9fa036994350	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMEI0QUNFMkUzMjQwQzRGQTQ4NAA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	A	text	questionnaire_response_processed	\N	\N	2025-11-13 03:32:30.719	2025-11-13 03:32:30.130611
4d6b880f-aa10-4c8e-b6bc-19149bef5b2e	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDIzQTVCQjk4NkY0REFFRkY0RQA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	80, 2.5	text	questionnaire_response_processed	\N	\N	2025-11-13 03:33:06.445	2025-11-13 03:33:05.608224
fc63ee16-5713-4e8d-90ed-5aa87842721d	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDhFMThBNkMxQTM3M0U4MzdGMwA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	A	text	questionnaire_response_processed	\N	\N	2025-11-13 03:33:09.978	2025-11-13 03:33:09.24184
8a751be9-d753-4620-8514-aa8bb3f7f671	wamid.HBgMNTU2MTkyODAwMzQzFQIAEhgWM0VCMDk3Njc2NkNGQkVENUZCRkYwNgA=	556192800343	72b84ed2-e174-46ce-b2d1-fa98cfdd1642	B	text	questionnaire_response_processed	\N	\N	2025-11-13 03:33:14.987	2025-11-13 03:33:14.372991
\.


--
-- Name: bankroll_managements bankroll_managements_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bankroll_managements
    ADD CONSTRAINT bankroll_managements_pkey PRIMARY KEY (id);


--
-- Name: bankroll_managements bankroll_managements_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bankroll_managements
    ADD CONSTRAINT bankroll_managements_user_id_unique UNIQUE (user_id);


--
-- Name: broker_api_configs broker_api_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.broker_api_configs
    ADD CONSTRAINT broker_api_configs_pkey PRIMARY KEY (id);


--
-- Name: csv_imports csv_imports_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.csv_imports
    ADD CONSTRAINT csv_imports_pkey PRIMARY KEY (id);


--
-- Name: diary_entries diary_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.diary_entries
    ADD CONSTRAINT diary_entries_pkey PRIMARY KEY (id);


--
-- Name: diary_images diary_images_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.diary_images
    ADD CONSTRAINT diary_images_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_unique UNIQUE (token);


--
-- Name: platform_stats platform_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.platform_stats
    ADD CONSTRAINT platform_stats_pkey PRIMARY KEY (id);


--
-- Name: questionnaire_states questionnaire_states_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.questionnaire_states
    ADD CONSTRAINT questionnaire_states_pkey PRIMARY KEY (id);


--
-- Name: questionnaire_states questionnaire_states_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.questionnaire_states
    ADD CONSTRAINT questionnaire_states_user_id_unique UNIQUE (user_id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_type_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_type_unique UNIQUE (type);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: support_conversations support_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_conversations
    ADD CONSTRAINT support_conversations_pkey PRIMARY KEY (id);


--
-- Name: support_messages support_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_pkey PRIMARY KEY (id);


--
-- Name: trades trades_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: wallets wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_pkey PRIMARY KEY (id);


--
-- Name: whatsapp_messages whatsapp_messages_message_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.whatsapp_messages
    ADD CONSTRAINT whatsapp_messages_message_id_unique UNIQUE (message_id);


--
-- Name: whatsapp_messages whatsapp_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.whatsapp_messages
    ADD CONSTRAINT whatsapp_messages_pkey PRIMARY KEY (id);


--
-- Name: bankroll_managements bankroll_managements_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bankroll_managements
    ADD CONSTRAINT bankroll_managements_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: broker_api_configs broker_api_configs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.broker_api_configs
    ADD CONSTRAINT broker_api_configs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: csv_imports csv_imports_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.csv_imports
    ADD CONSTRAINT csv_imports_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: diary_entries diary_entries_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.diary_entries
    ADD CONSTRAINT diary_entries_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: diary_images diary_images_diary_entry_id_diary_entries_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.diary_images
    ADD CONSTRAINT diary_images_diary_entry_id_diary_entries_id_fk FOREIGN KEY (diary_entry_id) REFERENCES public.diary_entries(id) ON DELETE CASCADE;


--
-- Name: diary_images diary_images_trade_id_trades_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.diary_images
    ADD CONSTRAINT diary_images_trade_id_trades_id_fk FOREIGN KEY (trade_id) REFERENCES public.trades(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens password_reset_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: questionnaire_states questionnaire_states_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.questionnaire_states
    ADD CONSTRAINT questionnaire_states_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: subscriptions subscriptions_plan_id_subscription_plans_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_plan_id_subscription_plans_id_fk FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: subscriptions subscriptions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: support_conversations support_conversations_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_conversations
    ADD CONSTRAINT support_conversations_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: support_messages support_messages_conversation_id_support_conversations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_conversation_id_support_conversations_id_fk FOREIGN KEY (conversation_id) REFERENCES public.support_conversations(id) ON DELETE CASCADE;


--
-- Name: support_messages support_messages_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: trades trades_csv_import_id_csv_imports_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_csv_import_id_csv_imports_id_fk FOREIGN KEY (csv_import_id) REFERENCES public.csv_imports(id);


--
-- Name: trades trades_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: wallets wallets_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.wallets
    ADD CONSTRAINT wallets_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: whatsapp_messages whatsapp_messages_trade_id_trades_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.whatsapp_messages
    ADD CONSTRAINT whatsapp_messages_trade_id_trades_id_fk FOREIGN KEY (trade_id) REFERENCES public.trades(id);


--
-- Name: whatsapp_messages whatsapp_messages_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.whatsapp_messages
    ADD CONSTRAINT whatsapp_messages_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict 0E6Hdl2FWHNT8QbY3tC45OgNM3zSBEJsTUZv2EUPwDzaBbcyVn26bZiFFiGCAtA

