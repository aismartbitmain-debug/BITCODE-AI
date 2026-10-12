export interface ConnectedExchange {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  apiKeyMasked?: string;
}

export interface AdminClient {
  id: string;
  email: string;
  name: string;
  plan: string;
  status: 'active' | 'suspended' | 'banned';
  totalFunds: number;
  unrealizedPnl: number;
  realizedPnl: number;
  activeBots: number;
  manualTrading: boolean;
  joinedDate: string;
  lastActive: string;
  country: string;
  licenseValidUntil: string;
  licenseCycle: 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';
  botLimit: number;
  unlockedStrategies: string[];
  unlockedIndicators: string[];
  connectedExchanges: ConnectedExchange[];
}

export const indianExchanges = ['Binance', 'CoinDCX', 'Delta Exchange', 'WazirX', 'Pi42'] as const;
export type IndianExchange = typeof indianExchanges[number];

function exchangesFor(...connected: string[]): ConnectedExchange[] {
  return indianExchanges.map(name => ({
    name,
    status: connected.includes(name)
      ? 'connected' as const
      : 'disconnected' as const,
    apiKeyMasked: connected.includes(name) ? '****-****-a8f3' : undefined,
  }));
}

export const adminClients: AdminClient[] = [
  { id: 'c1', email: 'alex.trader@gmail.com', name: 'Alex Trader', plan: 'Enterprise', status: 'active', totalFunds: 245_000, unrealizedPnl: 12_400, realizedPnl: 38_200, activeBots: 8, manualTrading: true, joinedDate: '2026-01-15', lastActive: '2 min ago', country: 'India', licenseValidUntil: '2027-01-15', licenseCycle: 'yearly', botLimit: 25, unlockedStrategies: ['Scalping', 'Grid', 'DCA', 'Arbitrage', 'Mean Reversion', 'Momentum Breakout', 'Trend Following'], unlockedIndicators: ['RSI Pro', 'MACD Divergence', 'Bollinger Bands Pro', 'Volume Profile', 'Ichimoku Cloud', 'Fibonacci Auto', 'Order Blocks', 'Liquidity Zones'], connectedExchanges: exchangesFor('Binance', 'CoinDCX', 'WazirX') },
  { id: 'c2', email: 'priya.sharma@yahoo.in', name: 'Priya Sharma', plan: 'Pro', status: 'active', totalFunds: 87_500, unrealizedPnl: 3_200, realizedPnl: 11_800, activeBots: 5, manualTrading: false, joinedDate: '2026-02-20', lastActive: '14 min ago', country: 'India', licenseValidUntil: '2026-08-20', licenseCycle: 'half-yearly', botLimit: 10, unlockedStrategies: ['Scalping', 'Grid', 'DCA', 'Trend Following', 'Mean Reversion'], unlockedIndicators: ['RSI Pro', 'MACD Divergence', 'Bollinger Bands Pro', 'Volume Profile'], connectedExchanges: exchangesFor('CoinDCX', 'WazirX') },
  { id: 'c3', email: 'marco.rossi@libero.it', name: 'Marco Rossi', plan: 'Pro', status: 'active', totalFunds: 62_300, unrealizedPnl: -1_800, realizedPnl: 7_200, activeBots: 4, manualTrading: false, joinedDate: '2026-03-01', lastActive: '1 hr ago', country: 'India', licenseValidUntil: '2026-06-01', licenseCycle: 'quarterly', botLimit: 10, unlockedStrategies: ['Scalping', 'Grid', 'DCA'], unlockedIndicators: ['RSI Pro', 'MACD Divergence'], connectedExchanges: exchangesFor('Delta Exchange') },
  { id: 'c4', email: 'yuki.tanaka@gmail.com', name: 'Yuki Tanaka', plan: 'Enterprise', status: 'active', totalFunds: 410_000, unrealizedPnl: 28_500, realizedPnl: 62_100, activeBots: 12, manualTrading: true, joinedDate: '2025-12-10', lastActive: '5 min ago', country: 'India', licenseValidUntil: '2026-12-10', licenseCycle: 'yearly', botLimit: 25, unlockedStrategies: ['Scalping', 'Grid', 'DCA', 'Arbitrage', 'Mean Reversion', 'Momentum Breakout', 'Trend Following'], unlockedIndicators: ['RSI Pro', 'MACD Divergence', 'Bollinger Bands Pro', 'Volume Profile', 'Ichimoku Cloud', 'Fibonacci Auto', 'Order Blocks', 'Liquidity Zones'], connectedExchanges: exchangesFor('Binance', 'Delta Exchange', 'Pi42', 'WazirX', 'CoinDCX') },
  { id: 'c5', email: 'sarah.connor@outlook.com', name: 'Sarah Connor', plan: 'Starter', status: 'suspended', totalFunds: 5_200, unrealizedPnl: 0, realizedPnl: -800, activeBots: 0, manualTrading: false, joinedDate: '2026-04-05', lastActive: '3 days ago', country: 'India', licenseValidUntil: '2026-05-05', licenseCycle: 'monthly', botLimit: 2, unlockedStrategies: ['Scalping'], unlockedIndicators: ['RSI Pro'], connectedExchanges: exchangesFor() },
  { id: 'c6', email: 'dmitri.volkov@yandex.ru', name: 'Dmitri Volkov', plan: 'Pro', status: 'active', totalFunds: 134_000, unrealizedPnl: 8_900, realizedPnl: 22_400, activeBots: 6, manualTrading: true, joinedDate: '2026-02-28', lastActive: '22 min ago', country: 'India', licenseValidUntil: '2026-08-28', licenseCycle: 'half-yearly', botLimit: 10, unlockedStrategies: ['Scalping', 'Grid', 'DCA', 'Trend Following', 'Mean Reversion'], unlockedIndicators: ['RSI Pro', 'MACD Divergence', 'Bollinger Bands Pro', 'Volume Profile'], connectedExchanges: exchangesFor('Binance', 'Pi42') },
  { id: 'c7', email: 'li.wei@163.com', name: 'Li Wei', plan: 'Enterprise', status: 'active', totalFunds: 528_000, unrealizedPnl: 41_200, realizedPnl: 89_600, activeBots: 15, manualTrading: true, joinedDate: '2025-11-22', lastActive: '1 min ago', country: 'India', licenseValidUntil: '2026-11-22', licenseCycle: 'yearly', botLimit: 25, unlockedStrategies: ['Scalping', 'Grid', 'DCA', 'Arbitrage', 'Mean Reversion', 'Momentum Breakout', 'Trend Following'], unlockedIndicators: ['RSI Pro', 'MACD Divergence', 'Bollinger Bands Pro', 'Volume Profile', 'Ichimoku Cloud', 'Fibonacci Auto', 'Order Blocks', 'Liquidity Zones'], connectedExchanges: exchangesFor('Binance', 'CoinDCX', 'Delta Exchange', 'WazirX', 'Pi42') },
  { id: 'c8', email: 'carlos.mendez@gmail.com', name: 'Carlos Mendez', plan: 'Starter', status: 'active', totalFunds: 12_800, unrealizedPnl: 420, realizedPnl: 1_900, activeBots: 2, manualTrading: false, joinedDate: '2026-05-12', lastActive: '4 hr ago', country: 'India', licenseValidUntil: '2026-11-12', licenseCycle: 'half-yearly', botLimit: 2, unlockedStrategies: ['Scalping', 'Grid'], unlockedIndicators: ['RSI Pro', 'MACD Divergence'], connectedExchanges: exchangesFor('WazirX') },
  { id: 'c9', email: 'fatima.al@saudi.net', name: 'Fatima Al-Saud', plan: 'Pro', status: 'active', totalFunds: 198_000, unrealizedPnl: 15_600, realizedPnl: 31_200, activeBots: 7, manualTrading: false, joinedDate: '2026-01-30', lastActive: '8 min ago', country: 'India', licenseValidUntil: '2026-07-30', licenseCycle: 'half-yearly', botLimit: 10, unlockedStrategies: ['Scalping', 'Grid', 'DCA', 'Trend Following', 'Mean Reversion'], unlockedIndicators: ['RSI Pro', 'MACD Divergence', 'Bollinger Bands Pro', 'Volume Profile'], connectedExchanges: exchangesFor('Binance', 'CoinDCX', 'Pi42') },
  { id: 'c10', email: 'hans.mueller@gmx.de', name: 'Hans Mueller', plan: 'Starter', status: 'banned', totalFunds: 0, unrealizedPnl: 0, realizedPnl: -3_200, activeBots: 0, manualTrading: false, joinedDate: '2026-03-18', lastActive: '2 weeks ago', country: 'India', licenseValidUntil: '2026-04-18', licenseCycle: 'monthly', botLimit: 2, unlockedStrategies: [], unlockedIndicators: [], connectedExchanges: exchangesFor() },
];

export interface AdminLicense {
  id: string;
  planName: string;
  price: number;
  botLimit: number;
  activeUsers: number;
  maxLeverage: number;
  features: string[];
  color: 'green' | 'cyan' | 'amber';
}

export const adminLicensePlans: AdminLicense[] = [
  { id: 'l1', planName: 'Starter', price: 29, botLimit: 2, activeUsers: 421, maxLeverage: 10, features: ['2 AI Bots', '10x Max Leverage', 'Spot Trading', 'Email Support', 'Basic Signals'], color: 'cyan' },
  { id: 'l2', planName: 'Pro', price: 99, botLimit: 10, activeUsers: 186, maxLeverage: 50, features: ['10 AI Bots', '50x Max Leverage', 'Spot & Futures', 'Priority Support', 'Advanced Signals', 'Copy Trading', 'Custom Strategies'], color: 'green' },
  { id: 'l3', planName: 'Enterprise', price: 499, botLimit: 25, activeUsers: 47, maxLeverage: 125, features: ['Unlimited AI Bots', '125x Max Leverage', 'Unlimited Markets', 'Dedicated Manager', 'API Access', 'Custom Risk Rules', 'White-label', 'Priority Features'], color: 'amber' },
];

export interface SaaSFeature {
  label: string;
  starter: boolean;
  pro: boolean;
  enterprise: boolean;
}

export const saasFeatureMatrix: SaaSFeature[] = [
  { label: 'AI Bots', starter: true, pro: true, enterprise: true },
  { label: '2 Bots Max', starter: true, pro: false, enterprise: false },
  { label: '10 Bots Max', starter: false, pro: true, enterprise: false },
  { label: 'Unlimited Bots', starter: false, pro: false, enterprise: true },
  { label: '10x Max Leverage', starter: true, pro: false, enterprise: false },
  { label: '50x Max Leverage', starter: false, pro: true, enterprise: false },
  { label: '125x Max Leverage', starter: false, pro: false, enterprise: true },
  { label: 'Spot Trading', starter: true, pro: true, enterprise: true },
  { label: 'Futures Trading', starter: false, pro: true, enterprise: true },
  { label: 'Email Support', starter: true, pro: true, enterprise: true },
  { label: 'Basic Signals', starter: true, pro: true, enterprise: true },
  { label: 'Advanced Signals', starter: false, pro: true, enterprise: true },
  { label: 'Copy Trading', starter: false, pro: true, enterprise: true },
  { label: 'Custom Strategies', starter: false, pro: true, enterprise: true },
  { label: 'API Access', starter: false, pro: false, enterprise: true },
  { label: 'Custom Risk Rules', starter: false, pro: false, enterprise: true },
  { label: 'Dedicated Manager', starter: false, pro: false, enterprise: true },
  { label: 'White-label', starter: false, pro: false, enterprise: true },
];

export interface RevenueData {
  month: string;
  revenue: number;
  mrr: number;
}

export const revenueData: RevenueData[] = [
  { month: 'May', revenue: 38_500, mrr: 31_200 },
  { month: 'Jun', revenue: 42_800, mrr: 34_500 },
  { month: 'Jul', revenue: 51_300, mrr: 38_900 },
  { month: 'Aug', revenue: 58_700, mrr: 42_100 },
  { month: 'Sep', revenue: 64_200, mrr: 47_800 },
  { month: 'Oct', revenue: 72_900, mrr: 52_400 },
];

export interface Transaction {
  id: string;
  clientName: string;
  clientEmail: string;
  plan: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
}

export const mockTransactions: Transaction[] = [
  { id: 'tx1', clientName: 'Li Wei', clientEmail: 'li.wei@163.com', plan: 'Enterprise', amount: 4990, date: '2026-10-03', status: 'completed', paymentMethod: 'UPI' },
  { id: 'tx2', clientName: 'Yuki Tanaka', clientEmail: 'yuki.tanaka@gmail.com', plan: 'Enterprise', amount: 4990, date: '2026-10-01', status: 'pending', paymentMethod: 'Credit Card' },
  { id: 'tx3', clientName: 'Alex Trader', clientEmail: 'alex.trader@gmail.com', plan: 'Enterprise', amount: 4990, date: '2026-09-15', status: 'completed', paymentMethod: 'Bank Transfer' },
  { id: 'tx4', clientName: 'Dmitri Volkov', clientEmail: 'dmitri.volkov@yandex.ru', plan: 'Pro', amount: 990, date: '2026-09-01', status: 'completed', paymentMethod: 'UPI' },
  { id: 'tx5', clientName: 'Fatima Al-Saud', clientEmail: 'fatima.al@saudi.net', plan: 'Pro', amount: 990, date: '2026-08-15', status: 'completed', paymentMethod: 'Credit Card' },
  { id: 'tx6', clientName: 'Priya Sharma', clientEmail: 'priya.sharma@yahoo.in', plan: 'Pro', amount: 990, date: '2026-08-01', status: 'completed', paymentMethod: 'UPI' },
  { id: 'tx7', clientName: 'Carlos Mendez', clientEmail: 'carlos.mendez@gmail.com', plan: 'Starter', amount: 290, date: '2026-07-15', status: 'completed', paymentMethod: 'UPI' },
  { id: 'tx8', clientName: 'Marco Rossi', clientEmail: 'marco.rossi@libero.it', plan: 'Pro', amount: 990, date: '2026-07-01', status: 'refunded', paymentMethod: 'Bank Transfer' },
  { id: 'tx9', clientName: 'Sarah Connor', clientEmail: 'sarah.connor@outlook.com', plan: 'Starter', amount: 290, date: '2026-06-15', status: 'failed', paymentMethod: 'Credit Card' },
  { id: 'tx10', clientName: 'Li Wei', clientEmail: 'li.wei@163.com', plan: 'Enterprise', amount: 4990, date: '2026-05-01', status: 'completed', paymentMethod: 'UPI' },
];

export interface ApiHealthLog {
  id: string;
  exchange: string;
  endpoint: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  uptime: number;
  lastCheck: string;
}

export const apiHealthLogs: ApiHealthLog[] = [
  { id: 'h1', exchange: 'Binance', endpoint: 'GET /api/v3/ticker', status: 'healthy', latency: 18, uptime: 99.98, lastCheck: '8s ago' },
  { id: 'h2', exchange: 'Binance', endpoint: 'POST /api/v3/order', status: 'healthy', latency: 42, uptime: 99.95, lastCheck: '8s ago' },
  { id: 'h3', exchange: 'CoinDCX', endpoint: 'GET /market/ticker', status: 'healthy', latency: 35, uptime: 99.92, lastCheck: '12s ago' },
  { id: 'h4', exchange: 'Delta Exchange', endpoint: 'GET /v2/tickers', status: 'degraded', latency: 280, uptime: 98.71, lastCheck: '15s ago' },
  { id: 'h5', exchange: 'WazirX', endpoint: 'GET /api/v2/tickers', status: 'healthy', latency: 52, uptime: 99.88, lastCheck: '10s ago' },
  { id: 'h6', exchange: 'Pi42', endpoint: 'GET /api/v1/ticker', status: 'down', latency: 0, uptime: 97.23, lastCheck: '30s ago' },
];

export interface SystemActivity {
  id: string;
  type: 'login' | 'bot_deploy' | 'trade' | 'license_change' | 'risk_alert' | 'admin_action';
  message: string;
  user: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
}

export const systemActivities: SystemActivity[] = [
  { id: 'a1', type: 'login', message: 'New admin login from IP 192.168.1.42', user: 'admin@cortex.ai', timestamp: '2 min ago', severity: 'info' },
  { id: 'a2', type: 'bot_deploy', message: 'Enterprise user deployed 3 new AI bots', user: 'li.wei@163.com', timestamp: '5 min ago', severity: 'success' },
  { id: 'a3', type: 'risk_alert', message: 'Daily loss limit reached for user sarah.connor', user: 'sarah.connor@outlook.com', timestamp: '18 min ago', severity: 'warning' },
  { id: 'a4', type: 'license_change', message: 'Upgraded from Pro to Enterprise', user: 'yuki.tanaka@gmail.com', timestamp: '1 hr ago', severity: 'success' },
  { id: 'a5', type: 'trade', message: 'Large BTC liquidation executed via Panic Button', user: 'dmitri.volkov@yandex.ru', timestamp: '2 hr ago', severity: 'critical' },
  { id: 'a6', type: 'admin_action', message: 'Sub-admin permissions updated', user: 'admin@cortex.ai', timestamp: '3 hr ago', severity: 'info' },
  { id: 'a7', type: 'risk_alert', message: 'Pi42 API health degraded', user: 'system', timestamp: '4 hr ago', severity: 'warning' },
];

export const allStrategies = [
  'Scalping', 'Grid', 'DCA', 'Arbitrage', 'Mean Reversion',
  'Momentum Breakout', 'Trend Following', 'Breakout Reversal',
  'Order Block Sniper', 'Smart Money Concept', 'Volume Weighted',
];

export const allIndicators = [
  'RSI Pro', 'MACD Divergence', 'Bollinger Bands Pro', 'Volume Profile',
  'Ichimoku Cloud', 'Fibonacci Auto', 'Order Blocks', 'Liquidity Zones',
  'VWAP Anchored', 'Market Structure', 'Smart Money Index', 'CVD Pro',
];

export type LicenseCycle = 'monthly' | 'quarterly' | 'half-yearly' | 'yearly';

export const licenseCycleConfig: Record<LicenseCycle, { label: string; multiplier: number; badge: string }> = {
  monthly: { label: 'Monthly', multiplier: 1, badge: 'bg-neon-cyan/15 text-neon-cyan' },
  quarterly: { label: 'Quarterly', multiplier: 2.7, badge: 'bg-neon-green/15 text-neon-green' },
  'half-yearly': { label: 'Half-Yearly', multiplier: 5.2, badge: 'bg-neon-amber/15 text-neon-amber' },
  yearly: { label: 'Yearly', multiplier: 9.6, badge: 'bg-neon-amber/20 text-neon-amber' },
};

export interface LicensePlanConfig {
  id: 'Starter' | 'Pro' | 'Enterprise';
  label: string;
  monthlyPrice: number;
  botLimit: number;
  maxLeverage: number;
  features: string[];
  color: 'cyan' | 'green' | 'amber';
}

export const licensePlanConfigs: LicensePlanConfig[] = [
  { id: 'Starter', label: 'Starter', monthlyPrice: 29, botLimit: 2, maxLeverage: 10, features: ['2 AI Bots', '10x Max Leverage', 'Spot Trading', 'Email Support', 'Basic Signals'], color: 'cyan' },
  { id: 'Pro', label: 'Pro', monthlyPrice: 99, botLimit: 10, maxLeverage: 50, features: ['10 AI Bots', '50x Max Leverage', 'Spot & Futures', 'Priority Support', 'Advanced Signals', 'Copy Trading', 'Custom Strategies'], color: 'green' },
  { id: 'Enterprise', label: 'Enterprise', monthlyPrice: 499, botLimit: 25, maxLeverage: 125, features: ['Unlimited AI Bots', '125x Max Leverage', 'Unlimited Markets', 'Dedicated Manager', 'API Access', 'Custom Risk Rules', 'White-label', 'Priority Features'], color: 'amber' },
];

export const licenseDurationOptions = [
  { months: 1, label: '1 Month' },
  { months: 2, label: '2 Months' },
  { months: 3, label: '3 Months' },
  { months: 6, label: '6 Months' },
  { months: 12, label: '1 Year' },
];
