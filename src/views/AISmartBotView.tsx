import { useState, useEffect } from 'react';
import {
  Bot, Layers, Coins, Crosshair, Shield, DollarSign, Rocket, Zap,
  TrendingUp, TrendingDown, Check, Loader2, Target, Gauge,
  Activity, Clock, Flame, ArrowRightLeft, CircuitBoard,
  Copy, Grid3x3, PiggyBank, ArrowDownRight, ArrowUpRight, Power,
  TestTube2, AlertOctagon, Lock,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLivePrices } from '@/hooks/useLivePrices';
import { supabase, type RiskSettings, type Bot as BotRecord, type License } from '@/lib/supabase';
import BacktestModal from '@/components/BacktestModal';
import type { BotFactoryDraft } from '@/components/admin/BotFactoryModal';

type MarketType = 'spot' | 'futures';
type OrderType = 'market' | 'limit';
type TradeDirection = 'long' | 'short';
type BotType = 'scalper' | 'dca' | 'grid' | 'copier';
type IndicatorTrigger = 'RSI' | 'MACD' | 'EMA Crossover' | 'SMC Order Blocks' | 'None';
type QuantityMode = 'fixed' | 'percent';
type TpSlMode = 'percentage' | 'fixed';

const indicatorOptions: IndicatorTrigger[] = ['RSI', 'MACD', 'EMA Crossover', 'SMC Order Blocks', 'None'];

const botTypeCards: { id: BotType; label: string; desc: string; icon: typeof Zap }[] = [
  { id: 'scalper', label: 'Scalper', desc: 'Quick in/out trades on micro price movements', icon: Zap },
  { id: 'dca', label: 'DCA', desc: 'Dollar-cost average into positions over time', icon: PiggyBank },
  { id: 'grid', label: 'Grid', desc: 'Place buy/sell orders at set price intervals', icon: Grid3x3 },
  { id: 'copier', label: 'Copier', desc: 'Mirror trades from a signal or master account', icon: Copy },
];

export default function AISmartBotView() {
  const { formatCurrency, currency } = useApp();
  const { coins } = useLivePrices();

  // Market & Asset
  const [marketType, setMarketType] = useState<MarketType>('spot');
  const [leverage, setLeverage] = useState(10);
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [botType, setBotType] = useState<BotType>('scalper');
  const [tradeDirection, setTradeDirection] = useState<TradeDirection>('long');
  const [capital, setCapital] = useState(5000);
  const [launched, setLaunched] = useState(false);
  const [launching, setLaunching] = useState(false);

  // Entry Logic
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [indicatorsEnabled, setIndicatorsEnabled] = useState(false);
  const [indicator, setIndicator] = useState<IndicatorTrigger>('RSI');

  // Position & Execution
  const [quantityMode, setQuantityMode] = useState<QuantityMode>('fixed');
  const [quantityValue, setQuantityValue] = useState(5000);
  const [percentValue, setPercentValue] = useState(10);
  const [maxTradesPerDay, setMaxTradesPerDay] = useState(20);
  const [rrRatio, setRrRatio] = useState(2);

  // Advanced Exit & SL/TP
  const [tpSlMode, setTpSlMode] = useState<TpSlMode>('percentage');
  const [takeProfit, setTakeProfit] = useState(5);
  const [stopLoss, setStopLoss] = useState(2);
  const [tpFixed, setTpFixed] = useState(100);
  const [slFixed, setSlFixed] = useState(50);
  const [trailingEnabled, setTrailingEnabled] = useState(false);
  const [trailingDistance, setTrailingDistance] = useState(1.5);

  // Daily Safety Limits
  const [maxDailyLoss, setMaxDailyLoss] = useState(500);
  const [maxDailyProfit, setMaxDailyProfit] = useState(1000);
  const [cooldownMinutes, setCooldownMinutes] = useState(15);

  // Backtest modal
  const [showBacktest, setShowBacktest] = useState(false);
  const [killSwitch, setKillSwitch] = useState(false);
  const [license, setLicense] = useState<License | null>(null);
  const { session } = useAuth();

  const allowedBotTypes: string[] = license?.allowed_bots ?? [];
  const isBotTypeAllowed = (bt: string) => allowedBotTypes.length === 0 || allowedBotTypes.includes(bt);

  useEffect(() => {
    supabase
      .from('risk_settings')
      .select('*')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        setKillSwitch((data as RiskSettings | null)?.global_kill_switch ?? false);
      });

    if (session?.user?.id) {
      supabase
        .from('licenses')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          setLicense(data as License | null);
        });
    }

    // Load most recently created bot to restore its config
    supabase
      .from('bots')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        const bot = data as BotRecord | null;
        if (!bot) return;
        if (bot.bot_type) setBotType(bot.bot_type);
        if (bot.trade_direction) setTradeDirection(bot.trade_direction);
        if (bot.market_type) setMarketType(bot.market_type);
        if (bot.coin) setSelectedCoin(bot.coin);
        if (bot.leverage != null) setLeverage(bot.leverage);
        if (bot.capital != null) setCapital(Number(bot.capital));
        if (bot.order_type) setOrderType(bot.order_type);
        if (bot.indicators_enabled != null) setIndicatorsEnabled(bot.indicators_enabled);
        if (bot.indicator) setIndicator(bot.indicator as IndicatorTrigger);
        if (bot.quantity_mode) setQuantityMode(bot.quantity_mode);
        if (bot.quantity_value != null) setQuantityValue(Number(bot.quantity_value));
        if (bot.percent_value != null) setPercentValue(Number(bot.percent_value));
        if (bot.max_trades_per_day != null) setMaxTradesPerDay(bot.max_trades_per_day);
        if (bot.rr_ratio != null) setRrRatio(Number(bot.rr_ratio));
        if (bot.tp_sl_mode) setTpSlMode(bot.tp_sl_mode);
        if (bot.take_profit != null) setTakeProfit(Number(bot.take_profit));
        if (bot.stop_loss != null) setStopLoss(Number(bot.stop_loss));
        if (bot.tp_fixed != null) setTpFixed(Number(bot.tp_fixed));
        if (bot.sl_fixed != null) setSlFixed(Number(bot.sl_fixed));
        if (bot.trailing_enabled != null) setTrailingEnabled(bot.trailing_enabled);
        if (bot.trailing_distance != null) setTrailingDistance(Number(bot.trailing_distance));
        if (bot.max_daily_loss != null) setMaxDailyLoss(Number(bot.max_daily_loss));
        if (bot.max_daily_profit != null) setMaxDailyProfit(Number(bot.max_daily_profit));
        if (bot.cooldown_minutes != null) setCooldownMinutes(bot.cooldown_minutes);
      });
  }, [session]);

  const selectedCoinData = coins.find(c => c.symbol === selectedCoin) || coins[0] || { symbol: 'BTC', name: 'Bitcoin', price: 67000, change24h: 0, volume24h: 0, quoteVolume24h: 0, high24h: 0, low24h: 0, sparkline: [] };

  const effectiveCapital = quantityMode === 'fixed' ? quantityValue : (capital * percentValue / 100);
  const positionSize = marketType === 'futures' ? effectiveCapital * leverage : effectiveCapital;
  const coinAmount = positionSize / selectedCoinData.price;

  const tpDisplay = tpSlMode === 'percentage' ? `+${takeProfit}%` : `+${formatCurrency(tpFixed)}`;
  const slDisplay = tpSlMode === 'percentage' ? `-${stopLoss}%` : `-${formatCurrency(slFixed)}`;

  const handleLaunch = async () => {
    setLaunching(true);
    const botName = `Custom Cortex Bot — ${selectedCoin} ${botType.charAt(0).toUpperCase() + botType.slice(1)}`;
    const { error } = await supabase.from('bots').insert({
      name: botName,
      market_type: marketType,
      coin: selectedCoin,
      strategy: botType,
      status: 'running',
      profit_loss: 0,
      trade_direction: tradeDirection,
      bot_type: botType,
      order_type: orderType,
      leverage: marketType === 'futures' ? leverage : 1,
      capital,
      indicators_enabled: indicatorsEnabled,
      indicator: indicatorsEnabled ? indicator : null,
      quantity_mode: quantityMode,
      quantity_value: quantityValue,
      percent_value: percentValue,
      max_trades_per_day: maxTradesPerDay,
      rr_ratio: rrRatio,
      tp_sl_mode: tpSlMode,
      take_profit: takeProfit,
      stop_loss: stopLoss,
      tp_fixed: tpFixed,
      sl_fixed: slFixed,
      trailing_enabled: trailingEnabled,
      trailing_distance: trailingEnabled ? trailingDistance : null,
      max_daily_loss: maxDailyLoss,
      max_daily_profit: maxDailyProfit,
      cooldown_minutes: cooldownMinutes,
    });
    setLaunching(false);
    if (error) {
      console.error('Failed to launch bot:', error.message);
      return;
    }
    setLaunched(true);
    setTimeout(() => setLaunched(false), 4000);
  };

  return (
    <div className="space-y-5 animate-slide-up max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center neon-glow-cyan">
          <Bot className="w-6 h-6 text-neon-cyan" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">AI Smart Bot Builder</h2>
            <span className="px-2 py-0.5 rounded-md bg-neon-green/15 text-neon-green text-[10px] font-bold neon-glow-green">ULTIMATE</span>
          </div>
          <p className="text-sm text-slate-400">Design and launch your custom AI-powered algorithmic trading bot</p>
        </div>
      </div>

      {/* Kill Switch Banner */}
      {killSwitch && (
        <div className="rounded-2xl bg-neon-red/10 border border-neon-red/30 p-4 flex items-center gap-3 animate-slide-up">
          <div className="w-10 h-10 rounded-xl bg-neon-red/15 border border-neon-red/30 flex items-center justify-center flex-shrink-0">
            <AlertOctagon className="w-5 h-5 text-neon-red" />
          </div>
          <div>
            <p className="text-sm font-bold text-neon-red">Platform Execution Paused by Master Admin</p>
            <p className="text-xs text-slate-400 mt-0.5">Bot deployment is temporarily disabled. You can still configure your strategy and run backtests.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Form - 2 cols */}
        <div className="lg:col-span-2 space-y-4">

          {/* 1. Bot Type Selection */}
          <Section icon={CircuitBoard} title="Bot Type Selection" badge="01">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {botTypeCards.map((bt) => {
                const Icon = bt.icon;
                const active = botType === bt.id;
                const allowed = isBotTypeAllowed(bt.id);
                return (
                  <button
                    key={bt.id}
                    onClick={() => allowed && setBotType(bt.id)}
                    disabled={!allowed}
                    className={`p-4 rounded-xl text-left transition-all duration-200 relative overflow-hidden group ${
                      !allowed
                        ? 'glass text-slate-600 cursor-not-allowed opacity-50'
                        : active
                        ? 'bg-neon-cyan/10 text-white border border-neon-cyan/40 neon-glow-cyan'
                        : 'glass text-slate-400 hover:text-slate-200 hover:border-white/[0.12]'
                    }`}
                  >
                    {active && allowed && <div className="absolute -top-6 -right-6 w-20 h-20 bg-neon-cyan/10 rounded-full blur-2xl" />}
                    <div className="relative flex items-start justify-between">
                      <div>
                        <Icon className={`w-5 h-5 mb-2 ${active && allowed ? 'text-neon-cyan' : 'text-slate-500'}`} />
                        <p className="text-sm font-bold">{bt.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{bt.desc}</p>
                      </div>
                      {!allowed && <Lock className="w-4 h-4 text-neon-amber flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* 2. Trade Direction & Market */}
          <Section icon={Layers} title="Trade Direction & Market" badge="02">
            {/* Trade Direction Toggle */}
            <div className="mb-5">
              <label className="text-xs text-slate-400 mb-2 block font-semibold">Trade Direction</label>
              <div className="flex gap-2 p-1 rounded-xl bg-base-800/50">
                <button
                  onClick={() => setTradeDirection('long')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                    tradeDirection === 'long'
                      ? 'bg-neon-green/15 text-neon-green border border-neon-green/30 shadow-[0_0_12px_rgba(0,255,157,0.2)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" /> Long (Buy)
                </button>
                <button
                  onClick={() => setTradeDirection('short')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                    tradeDirection === 'short'
                      ? 'bg-neon-red/15 text-neon-red border border-neon-red/30 shadow-[0_0_12px_rgba(255,68,68,0.2)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" /> Short (Sell)
                </button>
              </div>
            </div>

            {/* Market Type Toggle */}
            <div className="mb-4">
              <label className="text-xs text-slate-400 mb-2 block font-semibold">Market Type</label>
              <div className="grid grid-cols-2 gap-3">
                {(['spot', 'futures'] as MarketType[]).map((mt) => (
                  <button
                    key={mt}
                    onClick={() => setMarketType(mt)}
                    className={`px-4 py-3 rounded-xl text-sm font-semibold capitalize transition-all duration-200 ${
                      marketType === mt
                        ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40'
                        : 'glass text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mt}
                    {mt === 'futures' && <span className="block text-[10px] mt-0.5 opacity-70">Up to 100x leverage</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Leverage Slider */}
            {marketType === 'futures' && (
              <div className="mb-4 animate-slide-up">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Leverage</span>
                  <span className="text-sm font-bold text-neon-amber font-mono">{leverage}x</span>
                </div>
                <input
                  type="range" min="1" max="100" value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer slider-neon"
                  style={{ background: `linear-gradient(to right, #00ff9d 0%, #00e5ff ${leverage}%, #1a1f33 ${leverage}%)` }}
                />
                <div className="flex justify-between mt-1.5 text-[9px] text-slate-600">
                  <span>1x</span><span>25x</span><span>50x</span><span>75x</span>
                  <span className={leverage >= 80 ? 'text-neon-red font-bold' : ''}>100x MAX</span>
                </div>
                {leverage >= 50 && (
                  <p className="mt-2 text-[11px] text-neon-red/80 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    High leverage significantly increases liquidation risk.
                  </p>
                )}
              </div>
            )}

            {/* Coin Selector */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block font-semibold">Coin Selector</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {coins.slice(0, 10).map((c) => (
                  <button
                    key={c.symbol}
                    onClick={() => setSelectedCoin(c.symbol)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      selectedCoin === c.symbol
                        ? 'bg-neon-green/15 text-neon-green border border-neon-green/40'
                        : 'glass text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {c.symbol}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-slate-400">{selectedCoinData.name}</span>
                <span className="font-mono text-slate-200">${selectedCoinData.price.toLocaleString()}</span>
              </div>
            </div>
          </Section>

          {/* 3. Entry Logic */}
          <Section icon={Crosshair} title="Entry Logic" badge="03">
            {/* Order Type */}
            <div className="mb-5">
              <label className="text-xs text-slate-400 mb-2 block font-semibold">Order Type</label>
              <div className="flex gap-2 p-1 rounded-xl bg-base-800/50">
                <button
                  onClick={() => setOrderType('market')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    orderType === 'market' ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-4 h-4" /> Market
                </button>
                <button
                  onClick={() => setOrderType('limit')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    orderType === 'limit' ? 'bg-neon-amber/15 text-neon-amber border border-neon-amber/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Target className="w-4 h-4" /> Limit
                </button>
              </div>
            </div>

            {/* Technical Indicators Toggle */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CircuitBoard className="w-4 h-4 text-neon-cyan" />
                  <div>
                    <p className="text-sm font-semibold text-white">Use Technical Indicators</p>
                    <p className="text-[10px] text-slate-500">Trigger entries based on TA signals</p>
                  </div>
                </div>
                <button
                  onClick={() => setIndicatorsEnabled(!indicatorsEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-200 ${indicatorsEnabled ? 'bg-neon-cyan/30' : 'bg-white/[0.08]'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-200 ${indicatorsEnabled ? 'translate-x-6 bg-neon-cyan neon-glow-cyan' : 'bg-slate-500'}`} />
                </button>
              </div>

              {indicatorsEnabled ? (
                <div className="animate-slide-up">
                  <label className="text-xs text-slate-400 mb-2 block font-semibold">Select Indicator Trigger</label>
                  <div className="flex flex-wrap gap-2">
                    {indicatorOptions.map((ind) => (
                      <button
                        key={ind}
                        onClick={() => setIndicator(ind)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                          indicator === ind
                            ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40 shadow-[0_0_12px_rgba(0,229,255,0.2)]'
                            : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:border-white/[0.14] hover:text-slate-200'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full transition-all ${indicator === ind ? 'bg-neon-cyan shadow-[0_0_6px_rgba(0,229,255,0.8)]' : 'bg-slate-600'}`} />
                          {ind}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in flex items-center gap-2 py-2">
                  <Power className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  <p className="text-xs text-slate-500 italic">
                    Bot will execute based on selected strategy, pure price action, or manual triggers.
                  </p>
                </div>
              )}
            </div>
          </Section>

          {/* 4. Position & Execution */}
          <Section icon={Gauge} title="Position & Execution" badge="04">
            {/* Quantity Mode Toggle */}
            <div className="mb-4">
              <label className="text-xs text-slate-400 mb-2 block font-semibold">Trade Quantity</label>
              <div className="flex gap-2 p-1 rounded-xl bg-base-800/50 mb-3">
                <button
                  onClick={() => setQuantityMode('fixed')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    quantityMode === 'fixed' ? 'bg-neon-green/15 text-neon-green border border-neon-green/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" /> Fixed Amount
                </button>
                <button
                  onClick={() => setQuantityMode('percent')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    quantityMode === 'percent' ? 'bg-neon-green/15 text-neon-green border border-neon-green/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" /> % of Wallet
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={quantityMode === 'fixed' ? quantityValue : percentValue}
                  onChange={(e) => quantityMode === 'fixed' ? setQuantityValue(Math.max(0, Number(e.target.value))) : setPercentValue(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="w-full px-4 py-3 rounded-xl glass text-lg text-white font-mono focus:outline-none focus:border-neon-green/40 transition-colors"
                  step={quantityMode === 'fixed' ? '100' : '1'}
                  min="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-neon-green font-bold">
                  {quantityMode === 'fixed' ? currency : '%'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                {quantityMode === 'fixed'
                  ? `Each trade uses ${formatCurrency(quantityValue)}`
                  : `Each trade uses ${percentValue}% of wallet balance`}
              </p>
            </div>

            {/* R:R Ratio & Max Trades Per Day */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 mb-2 block font-semibold flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3 h-3" /> Risk : Reward Ratio
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-slate-500 font-mono text-center font-bold">
                    1
                  </div>
                  <span className="text-slate-500 font-bold">:</span>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      value={rrRatio}
                      onChange={(e) => setRrRatio(Math.max(0, Number(e.target.value)))}
                      className="w-full px-4 py-2.5 rounded-xl glass text-sm text-white font-mono focus:outline-none focus:border-neon-cyan/40 transition-colors text-center"
                      step="0.5"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-2 block font-semibold flex items-center gap-1.5">
                  <Activity className="w-3 h-3" /> Max Trades / Day
                </label>
                <input
                  type="number"
                  value={maxTradesPerDay}
                  onChange={(e) => setMaxTradesPerDay(Math.max(0, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 rounded-xl glass text-sm text-white font-mono focus:outline-none focus:border-neon-cyan/40 transition-colors"
                  min="0"
                />
              </div>
            </div>
          </Section>

          {/* 5. Advanced Exit & SL/TP */}
          <Section icon={Shield} title="Advanced Exit & Stop Loss" badge="05">
            {/* TP/SL Mode Toggle */}
            <div className="mb-4">
              <label className="text-xs text-slate-400 mb-2 block font-semibold">TP / SL Definition Mode</label>
              <div className="flex gap-2 p-1 rounded-xl bg-base-800/50">
                <button
                  onClick={() => setTpSlMode('percentage')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    tpSlMode === 'percentage' ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Percentage / Points
                </button>
                <button
                  onClick={() => setTpSlMode('fixed')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    tpSlMode === 'fixed' ? 'bg-neon-amber/15 text-neon-amber border border-neon-amber/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Fixed PnL Amount
                </button>
              </div>
            </div>

            {/* TP & SL Inputs */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-400 mb-2 block font-semibold flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-neon-green" /> Take Profit
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={tpSlMode === 'percentage' ? takeProfit : tpFixed}
                    onChange={(e) => tpSlMode === 'percentage' ? setTakeProfit(Math.max(0, Number(e.target.value))) : setTpFixed(Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 rounded-xl glass text-sm text-white font-mono focus:outline-none focus:border-neon-green/40 transition-colors"
                    step={tpSlMode === 'percentage' ? '0.5' : '10'}
                    min="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-green text-sm font-bold">
                    {tpSlMode === 'percentage' ? '%' : currency}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Auto-sell at profit target</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-2 block font-semibold flex items-center gap-1.5">
                  <TrendingDown className="w-3 h-3 text-neon-red" /> Stop Loss
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={tpSlMode === 'percentage' ? stopLoss : slFixed}
                    onChange={(e) => tpSlMode === 'percentage' ? setStopLoss(Math.max(0, Number(e.target.value))) : setSlFixed(Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 rounded-xl glass text-sm text-white font-mono focus:outline-none focus:border-neon-red/40 transition-colors"
                    step={tpSlMode === 'percentage' ? '0.5' : '10'}
                    min="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-red text-sm font-bold">
                    {tpSlMode === 'percentage' ? '%' : currency}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Auto-sell at loss limit</p>
              </div>
            </div>

            {/* Trailing Stop Loss */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-neon-cyan" />
                  <div>
                    <p className="text-sm font-semibold text-white">Trailing Stop Loss</p>
                    <p className="text-[10px] text-slate-500">Dynamically follows price upward</p>
                  </div>
                </div>
                <button
                  onClick={() => setTrailingEnabled(!trailingEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-all duration-200 ${trailingEnabled ? 'bg-neon-cyan/30' : 'bg-white/[0.08]'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-200 ${trailingEnabled ? 'translate-x-6 bg-neon-cyan neon-glow-cyan' : 'bg-slate-500'}`} />
                </button>
              </div>
              {trailingEnabled && (
                <div className="animate-slide-up">
                  <label className="text-xs text-slate-400 mb-1.5 block font-semibold">Trailing Distance (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={trailingDistance}
                      onChange={(e) => setTrailingDistance(Math.max(0, Number(e.target.value)))}
                      className="w-full px-4 py-2.5 rounded-xl glass text-sm text-white font-mono focus:outline-none focus:border-neon-cyan/40 transition-colors"
                      step="0.1"
                      min="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-cyan text-sm font-bold">%</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5">Stop loss trails price by {trailingDistance}% — locks in profit while limiting downside.</p>
                </div>
              )}
            </div>
          </Section>

          {/* 6. Daily Safety Limits */}
          <Section icon={Shield} title="Daily Safety Limits" badge="06">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-400 mb-2 block font-semibold flex items-center gap-1.5">
                  <Flame className="w-3 h-3 text-neon-red" /> Max Daily Loss
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={maxDailyLoss}
                    onChange={(e) => setMaxDailyLoss(Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 rounded-xl glass text-sm text-white font-mono focus:outline-none focus:border-neon-red/40 transition-colors"
                    step="50"
                    min="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-red text-sm font-bold">{currency}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Bot auto-pauses if daily loss hits this</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-2 block font-semibold flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-neon-green" /> Max Daily Profit
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={maxDailyProfit}
                    onChange={(e) => setMaxDailyProfit(Math.max(0, Number(e.target.value)))}
                    className="w-full px-4 py-2.5 rounded-xl glass text-sm text-white font-mono focus:outline-none focus:border-neon-green/40 transition-colors"
                    step="50"
                    min="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-green text-sm font-bold">{currency}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Bot auto-pauses if daily profit hits this</p>
              </div>
            </div>

            {/* Cooldown Timer */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block font-semibold flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-neon-amber" /> Cooldown Timer (after SL hit)
              </label>
              <div className="relative max-w-[200px]">
                <input
                  type="number"
                  value={cooldownMinutes}
                  onChange={(e) => setCooldownMinutes(Math.max(0, Number(e.target.value)))}
                  className="w-full px-4 py-2.5 rounded-xl glass text-sm text-white font-mono focus:outline-none focus:border-neon-amber/40 transition-colors"
                  min="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-amber text-sm font-bold">min</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">Bot pauses for {cooldownMinutes} minute{cooldownMinutes !== 1 ? 's' : ''} after a stop-loss trigger before resuming.</p>
            </div>
          </Section>
        </div>

        {/* Summary Panel - 1 col */}
        <div className="lg:col-span-1">
          <div className="glass-card p-5 sticky top-20">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Rocket className="w-4 h-4 text-neon-green" />
              Bot Summary
            </h3>

            <div className="space-y-3 text-sm">
              <SummaryGroup label="Bot Type" />
              <SummaryRow label="Strategy" value={botType.charAt(0).toUpperCase() + botType.slice(1)} accent="cyan" />

              <SummaryGroup label="Direction & Market" />
              <SummaryRow label="Direction" value={tradeDirection === 'long' ? 'Long (Buy)' : 'Short (Sell)'} accent={tradeDirection === 'long' ? 'green' : 'red'} />
              <SummaryRow label="Market" value={marketType.toUpperCase()} />
              {marketType === 'futures' && (
                <SummaryRow label="Leverage" value={`${leverage}x`} accent="amber" />
              )}
              <SummaryRow label="Coin" value={selectedCoin} />

              <SummaryGroup label="Entry Logic" />
              <SummaryRow label="Order Type" value={orderType.charAt(0).toUpperCase() + orderType.slice(1)} accent={orderType === 'market' ? 'cyan' : 'amber'} />
              <SummaryRow label="Indicators" value={indicatorsEnabled ? indicator : 'Price Action'} accent={indicatorsEnabled ? 'cyan' : undefined} />

              <SummaryGroup label="Position & Execution" />
              <SummaryRow label="Quantity" value={quantityMode === 'fixed' ? formatCurrency(quantityValue) : `${percentValue}% of wallet`} />
              <SummaryRow label="R:R Ratio" value={`1:${rrRatio}`} accent="cyan" />
              <SummaryRow label="Max Trades/Day" value={`${maxTradesPerDay}`} />

              <SummaryGroup label="Exit & SL/TP" />
              <SummaryRow label="Take Profit" value={tpDisplay} accent="green" />
              <SummaryRow label="Stop Loss" value={slDisplay} accent="red" />
              <SummaryRow label="Trailing SL" value={trailingEnabled ? `ON · ${trailingDistance}%` : 'OFF'} accent={trailingEnabled ? 'cyan' : undefined} />

              <SummaryGroup label="Daily Safety" />
              <SummaryRow label="Max Daily Loss" value={formatCurrency(maxDailyLoss)} accent="red" />
              <SummaryRow label="Max Daily Profit" value={formatCurrency(maxDailyProfit)} accent="green" />
              <SummaryRow label="Cooldown" value={`${cooldownMinutes}m`} accent="amber" />

              <div className="h-px bg-white/[0.06] my-3" />
              <SummaryRow label="Trade Capital" value={formatCurrency(effectiveCapital)} />
              <SummaryRow label="Position Size" value={formatCurrency(positionSize)} accent="cyan" bold />
              <SummaryRow label="Coin Amount" value={`${coinAmount.toFixed(6)} ${selectedCoin}`} />
            </div>

            {/* Backtest + Launch buttons */}
            <button
              onClick={() => setShowBacktest(true)}
              disabled={effectiveCapital <= 0}
              className={`mt-5 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                effectiveCapital <= 0
                  ? 'bg-white/[0.03] text-slate-500 border border-white/[0.06] cursor-not-allowed'
                  : 'bg-neon-amber/15 text-neon-amber border border-neon-amber/40 hover:bg-neon-amber/25 neon-glow-amber hover:scale-[1.02]'
              }`}
            >
              <TestTube2 className="w-4 h-4" /> Test Strategy (AI Backtest)
            </button>

            <button
              onClick={handleLaunch}
              disabled={effectiveCapital <= 0 || launching || killSwitch || !isBotTypeAllowed(botType)}
              className={`mt-3 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                launched
                  ? 'bg-neon-green/20 text-neon-green border border-neon-green/50 neon-glow-green'
                  : effectiveCapital <= 0 || launching || killSwitch
                  ? 'bg-white/[0.03] text-slate-500 border border-white/[0.06] cursor-not-allowed'
                  : 'bg-gradient-to-r from-neon-cyan/20 to-neon-green/20 text-white border border-neon-cyan/40 hover:from-neon-cyan/30 hover:to-neon-green/30 neon-glow-cyan hover:scale-[1.02]'
              }`}
            >
              {launching ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Launching...</>
              ) : launched ? (
                <><Check className="w-4 h-4" /> Bot Launched!</>
              ) : killSwitch ? (
                <><AlertOctagon className="w-4 h-4" /> Deploy Disabled (Kill Switch)</>
              ) : (
                <><Rocket className="w-4 h-4" /> Launch Custom Cortex Bot</>
              )}
            </button>

            {launched && (
              <p className="mt-3 text-center text-[11px] text-neon-green animate-fade-in">
                Your bot is now live and scanning the market...
              </p>
            )}
          </div>
        </div>
      </div>

      {showBacktest && (
        <BacktestModal
          draft={{
            name: `Custom Cortex Bot — ${selectedCoin} ${botType.charAt(0).toUpperCase() + botType.slice(1)}`,
            description: '',
            bot_type: botType,
            execution_mode: 'auto',
            market_type: marketType,
            strategies: [],
            indicators: indicatorsEnabled ? [indicator] : [],
            max_drawdown_pct: (maxDailyLoss / effectiveCapital) * 100,
            default_tp_pct: tpSlMode === 'percentage' ? takeProfit : 5,
            default_sl_pct: tpSlMode === 'percentage' ? stopLoss : 2,
            tp_sl_ratio: rrRatio,
            max_leverage: leverage,
            risk_level: leverage > 30 ? 'High' : leverage > 10 ? 'Medium' : 'Low',
            source_exchanges: [],
            win_rate: 75,
            expected_return: '',
          } as BotFactoryDraft}
          onClose={() => setShowBacktest(false)}
        />
      )}
    </div>
  );
}

function Section({ icon: Icon, title, children, badge }: { icon: typeof Layers; title: string; children: React.ReactNode; badge?: string }) {
  return (
    <div className="glass-card p-5 relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Icon className="w-4 h-4 text-neon-cyan" />
          {title}
        </h3>
        {badge && (
          <span className="px-2 py-0.5 rounded-md bg-neon-cyan/10 text-neon-cyan text-[9px] font-bold border border-neon-cyan/20">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function SummaryGroup({ label }: { label: string }) {
  return (
    <div className="pt-2">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">{label}</p>
    </div>
  );
}

function SummaryRow({ label, value, accent, bold }: { label: string; value: string; accent?: string; bold?: boolean }) {
  const color = accent === 'green' ? 'text-neon-green' : accent === 'red' ? 'text-neon-red' : accent === 'amber' ? 'text-neon-amber' : accent === 'cyan' ? 'text-neon-cyan' : 'text-slate-200';
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400 text-xs">{label}</span>
      <span className={`${color} ${bold ? 'font-bold' : 'font-medium'} font-mono text-xs`}>{value}</span>
    </div>
  );
}