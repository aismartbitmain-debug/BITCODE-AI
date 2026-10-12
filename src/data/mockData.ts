export interface Signal {
  id: string;
  coin: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entry: number;
  target: number;
  stopLoss: number;
  timeframe: string;
  source: string;
  timestamp: string;
}

export interface Trade {
  id: string;
  pair: string;
  side: 'BUY' | 'SELL';
  amount: number;
  price: number;
  pnl: number;
  status: 'filled' | 'pending' | 'cancelled';
  strategy: string;
  timestamp: string;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  expectedReturn: string;
  winRate: number;
  activeTraders: number;
  icon: string;
  accent: 'green' | 'cyan' | 'amber';
  features: string[];
}

export const strategies: Strategy[] = [
  {
    id: 'aggressive-bull-scalper',
    name: 'Aggressive Bull Scalper',
    description: 'High-frequency scalping bot that rides micro-trends with tight spreads. Optimized for volatile bull markets with rapid entry/exit cycles.',
    riskLevel: 'High',
    expectedReturn: '15-35% / month',
    winRate: 68.5,
    activeTraders: 1248,
    icon: 'Rocket',
    accent: 'green',
    features: ['1m-5m timeframe', 'Auto risk scaling', 'Multi-coin parallel', 'Slippage protection'],
  },
  {
    id: 'ai-smart-dca',
    name: 'AI Smart DCA',
    description: 'Dollar-cost averaging powered by AI sentiment analysis. Buys the dip intelligently and adjusts order sizes based on market momentum.',
    riskLevel: 'Low',
    expectedReturn: '5-12% / month',
    winRate: 82.3,
    activeTraders: 3421,
    icon: 'Brain',
    accent: 'cyan',
    features: ['Sentiment-weighted buys', 'Dynamic interval', 'Portfolio balancing', 'Long-term focus'],
  },
  {
    id: 'sideways-sniper',
    name: 'Sideways Market Sniper',
    description: 'Detects consolidation ranges and executes grid trades within support/resistance bands. Profits in flat markets where most traders lose.',
    riskLevel: 'Medium',
    expectedReturn: '8-18% / month',
    winRate: 74.1,
    activeTraders: 892,
    icon: 'Crosshair',
    accent: 'amber',
    features: ['Range detection AI', 'Grid auto-placement', 'Breakout alerts', 'Rebalance engine'],
  },
];

export const signals: Signal[] = [
  { id: 's1', coin: 'BTC', type: 'BUY', confidence: 87, entry: 67200, target: 69500, stopLoss: 65800, timeframe: '4H', source: 'Cortex Neural Engine v3', timestamp: '2 min ago' },
  { id: 's2', coin: 'ETH', type: 'BUY', confidence: 79, entry: 3470, target: 3650, stopLoss: 3380, timeframe: '1D', source: 'Sentiment Fusion AI', timestamp: '12 min ago' },
  { id: 's3', coin: 'SOL', type: 'BUY', confidence: 92, entry: 167, target: 182, stopLoss: 159, timeframe: '4H', source: 'Momentum Scanner', timestamp: '28 min ago' },
  { id: 's4', coin: 'BNB', type: 'SELL', confidence: 71, entry: 615, target: 588, stopLoss: 625, timeframe: '1D', source: 'Cortex Neural Engine v3', timestamp: '45 min ago' },
  { id: 's5', coin: 'AVAX', type: 'BUY', confidence: 84, entry: 38, target: 44, stopLoss: 35.5, timeframe: '4H', source: 'Breakout Hunter AI', timestamp: '1 hr ago' },
  { id: 's6', coin: 'ADA', type: 'HOLD', confidence: 63, entry: 0.45, target: 0.48, stopLoss: 0.42, timeframe: '1D', source: 'Range Analysis Bot', timestamp: '2 hr ago' },
  { id: 's7', coin: 'LINK', type: 'BUY', confidence: 76, entry: 14.7, target: 16.2, stopLoss: 13.9, timeframe: '4H', source: 'Oracle Momentum AI', timestamp: '3 hr ago' },
];

export const trades: Trade[] = [
  { id: 't1', pair: 'BTC/USDT', side: 'BUY', amount: 0.05, price: 67100, pnl: 142.5, status: 'filled', strategy: 'Aggressive Bull Scalper', timestamp: '2026-10-03 14:32:08' },
  { id: 't2', pair: 'ETH/USDT', side: 'SELL', amount: 1.2, price: 3492, pnl: 38.4, status: 'filled', strategy: 'AI Smart DCA', timestamp: '2026-10-03 14:18:55' },
  { id: 't3', pair: 'SOL/USDT', side: 'BUY', amount: 15, price: 166.8, pnl: 255.0, status: 'filled', strategy: 'Sideways Market Sniper', timestamp: '2026-10-03 13:45:12' },
  { id: 't4', pair: 'BNB/USDT', side: 'SELL', amount: 3, price: 614, pnl: -18.2, status: 'filled', strategy: 'Aggressive Bull Scalper', timestamp: '2026-10-03 13:20:33' },
  { id: 't5', pair: 'AVAX/USDT', side: 'BUY', amount: 50, price: 37.9, pnl: 0, status: 'pending', strategy: 'Custom Cortex Bot', timestamp: '2026-10-03 12:55:01' },
  { id: 't6', pair: 'BTC/USDT', side: 'BUY', amount: 0.02, price: 66850, pnl: 80.0, status: 'filled', strategy: 'Aggressive Bull Scalper', timestamp: '2026-10-03 12:30:44' },
  { id: 't7', pair: 'ETH/USDT', side: 'BUY', amount: 0.8, price: 3460, pnl: 16.0, status: 'filled', strategy: 'AI Smart DCA', timestamp: '2026-10-03 11:15:22' },
  { id: 't8', pair: 'LINK/USDT', side: 'SELL', amount: 100, price: 14.6, pnl: 20.0, status: 'cancelled', strategy: 'Custom Cortex Bot', timestamp: '2026-10-03 10:48:09' },
];

export interface BotStatus {
  name: string;
  status: 'running' | 'paused' | 'idle';
  uptime: string;
  pnl: number;
  tradesToday: number;
  pair: string;
}

export const botStatuses: BotStatus[] = [
  { name: 'Aggressive Bull Scalper', status: 'running', uptime: '14h 22m', pnl: 342.5, tradesToday: 47, pair: 'BTC/USDT' },
  { name: 'AI Smart DCA', status: 'running', uptime: '3d 6h', pnl: 128.7, tradesToday: 12, pair: 'ETH/USDT' },
  { name: 'Sideways Market Sniper', status: 'paused', uptime: '8h 15m', pnl: 87.2, tradesToday: 23, pair: 'SOL/USDT' },
  { name: 'Custom Cortex Bot #1', status: 'idle', uptime: '0h', pnl: 0, tradesToday: 0, pair: 'AVAX/USDT' },
];

