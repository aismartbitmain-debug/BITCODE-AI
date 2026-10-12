import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface Profile {
  id: string;
  email: string;
  disclaimer_accepted: boolean;
  disclaimer_accepted_at: string | null;
  created_at: string;
}

export interface Bot {
  id: string;
  user_id: string;
  name: string;
  market_type: 'spot' | 'futures';
  coin: string;
  strategy: 'scalping' | 'grid' | 'trailing';
  status: 'running' | 'paused' | 'idle';
  profit_loss: number;
  created_at: string;
  trade_direction: 'long' | 'short' | null;
  bot_type: 'scalper' | 'dca' | 'grid' | 'copier' | null;
  order_type: 'market' | 'limit' | null;
  leverage: number | null;
  capital: number | null;
  indicators_enabled: boolean | null;
  indicator: string | null;
  quantity_mode: 'fixed' | 'percent' | null;
  quantity_value: number | null;
  percent_value: number | null;
  max_trades_per_day: number | null;
  rr_ratio: number | null;
  tp_sl_mode: 'percentage' | 'fixed' | null;
  take_profit: number | null;
  stop_loss: number | null;
  tp_fixed: number | null;
  sl_fixed: number | null;
  trailing_enabled: boolean | null;
  trailing_distance: number | null;
  max_daily_loss: number | null;
  max_daily_profit: number | null;
  cooldown_minutes: number | null;
}

export interface TradeHistory {
  id: string;
  user_id: string;
  timestamp: string;
  pair: string;
  side: 'BUY' | 'SELL';
  amount: number;
  price: number;
  pnl: number;
  strategy: string | null;
}

export interface BrokerKey {
  id: string;
  user_id: string;
  exchange_name: string;
  api_key: string;
  is_connected: boolean;
  created_at: string;
}

export interface Signal {
  id: string;
  coin: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entry: number;
  target: number;
  stop_loss: number;
  timeframe: string;
  source: string;
  created_at: string;
}

export interface BrokerApiLog {
  id: string;
  user_id: string;
  broker: string;
  endpoint: string;
  status: 'success' | 'error' | 'pending';
  latency_ms: number;
  detail: string | null;
  created_at: string;
}

// Admin panel types

export interface License {
  id: string;
  user_id: string | null;
  plan_name: string;
  bot_limit: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  monthly_fee: number;
  license_key: string | null;
  allowed_bots: string[] | null;
  created_at: string;
}

export interface AdminRole {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  role: 'super_admin' | 'sub_admin';
  permissions: Record<string, boolean>;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export interface AdminActivityLog {
  id: string;
  admin_email: string;
  admin_name: string | null;
  action_type: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  created_at: string;
}

export interface UserFund {
  id: string;
  user_id: string;
  exchange_name: string;
  balance: number;
  unrealized_pnl: number;
  realized_pnl: number;
  manual_trading_enabled: boolean;
  last_synced_at: string | null;
  created_at: string;
}

export interface RiskSettings {
  id: string;
  global_kill_switch: boolean;
  max_leverage: number;
  max_daily_loss_pct: number;
  api_health_alerts: boolean;
  auto_disable_on_breach: boolean;
  updated_at: string;
}

export interface BotTemplate {
  id: string;
  name: string;
  description: string | null;
  strategy_type: 'scalping' | 'grid' | 'trailing' | 'dca';
  market_type: 'spot' | 'futures';
  default_tp_pct: number;
  default_sl_pct: number;
  risk_level: 'Low' | 'Medium' | 'High';
  is_public: boolean;
  total_copies: number;
  created_at: string;
  bot_type: 'scalper' | 'dca' | 'grid' | 'copier' | null;
  execution_mode: 'auto' | 'manual' | null;
  strategies: string[] | null;
  indicators: string[] | null;
  max_drawdown_pct: number | null;
  tp_sl_ratio: number | null;
  max_leverage: number | null;
  source_exchanges: string[] | null;
  overall_pnl: number | null;
  active_users: number | null;
  status: 'active' | 'paused' | null;
  win_rate: number | null;
  expected_return: string | null;
}

export interface ApiSettings {
  id: string;
  openai_api_key: string | null;
  anthropic_api_key: string | null;
  deepseek_api_key: string | null;
  coingecko_api_key: string | null;
  coinmarketcap_api_key: string | null;
  tradingview_license_key: string | null;
  binance_api_key: string | null;
  binance_api_secret: string | null;
  coindcx_api_key: string | null;
  coindcx_api_secret: string | null;
  delta_api_key: string | null;
  delta_api_secret: string | null;
  wazirx_api_key: string | null;
  wazirx_api_secret: string | null;
  pi42_api_key: string | null;
  pi42_api_secret: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  client_name: string;
  client_email: string | null;
  plan_name: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  payment_method: string | null;
  created_at: string;
}

export interface Trade {
  id: string;
  client_id: string | null;
  client_name: string | null;
  coin: string;
  market_type: 'spot' | 'futures';
  direction: 'long' | 'short';
  entry_price: number;
  amount: number;
  quantity: number;
  leverage: number;
  position_size: number;
  tp_pct: number | null;
  sl_pct: number | null;
  status: 'open' | 'closed_tp' | 'closed_sl' | 'cancelled';
  executed_by: string;
  created_at: string;
}

export interface ClientUpdate {
  id: string;
  client_id: string | null;
  update_type: 'plan_change' | 'status_change' | 'license_update' | 'risk_action';
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  executed_by: string;
  created_at: string;
}

export interface MasterTrader {
  id: string;
  name: string;
  bio: string | null;
  exchange: string | null;
  strategy: string | null;
  market: string | null;
  roi_percentage: number;
  win_rate: number;
  active_copiers: number;
  risk_level: 'Low' | 'Medium' | 'High';
  max_drawdown: number | null;
  commission_pct: number;
  status: 'active' | 'paused';
  created_at: string;
}
