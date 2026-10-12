import { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, TrendingUp, TrendingDown,
  DollarSign, Bot, Pencil, Trash2, LogIn, X, Check, Zap, Shield,
  Calendar, ChevronDown, ChevronUp, Crown, Sparkles, AlertTriangle, UserCog,
  KeyRound, Rocket, Clock, Plus, Minus, Plug, ArrowUpRight, ArrowDownRight, History,
  Loader2
} from 'lucide-react';
import {
  type AdminClient, type ConnectedExchange,
  allStrategies, allIndicators, licenseCycleConfig, type LicenseCycle,
  indianExchanges,
} from '@/data/adminMockData';

import { useAdminCurrency } from '@/context/AdminCurrencyContext';
import { useAuth } from '@/context/AuthContext';
import { useLivePrices } from '@/hooks/useLivePrices';
import { supabase } from '@/lib/supabase';

const statusConfig = {
  active: 'text-neon-green bg-neon-green/10 border-neon-green/20',
  suspended: 'text-neon-amber bg-neon-amber/10 border-neon-amber/20',
  banned: 'text-neon-red bg-neon-red/10 border-neon-red/20',
};

const planConfig: Record<string, { color: string; icon: typeof Crown }> = {
  Enterprise: { color: 'text-neon-amber', icon: Crown },
  Pro: { color: 'text-neon-green', icon: Sparkles },
  Starter: { color: 'text-neon-cyan', icon: Zap },
};

type ModalMode = 'edit' | 'license' | 'impersonate' | 'remove' | 'trade' | 'history' | null;

interface ClientTrade {
  id: string;
  coin: string;
  market_type: string;
  direction: string;
  entry_price: number;
  quantity: number;
  leverage: number;
  status: string;
  created_at: string;
  executed_by: string;
}

export default function AdminClients() {
  const { formatCurrency } = useAdminCurrency();
  const { user } = useAuth();
  const { coins } = useLivePrices();
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [clientTrades, setClientTrades] = useState<ClientTrade[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<AdminClient | null>(null);
  const [sortField, setSortField] = useState<'totalFunds' | 'unrealizedPnl' | 'activeBots' | 'licenseValidUntil'>('totalFunds');
  const [sortAsc, setSortAsc] = useState(false);

  // License editor state
  const [editCycle, setEditCycle] = useState<LicenseCycle>('monthly');
  const [editBotLimit, setEditBotLimit] = useState(1);
  const [editStrategies, setEditStrategies] = useState<string[]>([]);
  const [editIndicators, setEditIndicators] = useState<string[]>([]);
  const [editValidUntil, setEditValidUntil] = useState('');

  // Edit modal subscription state
  const [editPlan, setEditPlan] = useState<string>('Starter');
  const [editExpiry, setEditExpiry] = useState('');
  const [extendMonths, setExtendMonths] = useState(0);
  const [editExchanges, setEditExchanges] = useState<ConnectedExchange[]>([]);

  // --- MANUAL TRADE MODAL STATE ---
  const [tradeCoin, setTradeCoin] = useState('BTC');
  const [marketType, setMarketType] = useState<'spot' | 'futures'>('futures');
  const [tradeDirection, setTradeDirection] = useState<'long' | 'short'>('long');
  const [inputMode, setInputMode] = useState<'amount' | 'quantity'>('quantity');
  const [tradeAmount, setTradeAmount] = useState<number>(500);
  const [tradeQuantity, setTradeQuantity] = useState<number>(0.1);
  const [tradeLeverage, setTradeLeverage] = useState<number>(10);
  const [takeProfitPct, setTakeProfitPct] = useState<number | ''>(5);
  const [stopLossPct, setStopLossPct] = useState<number | ''>(2);
  const [executingTrade, setExecutingTrade] = useState(false);
  const [tradeSuccessMsg, setTradeSuccessMsg] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ data: profilesData }, { data: fundsData }, { data: botsData }, { data: licensesData }] =
        await Promise.all([
          supabase.from('profiles').select('*'),
          supabase.from('user_funds').select('*'),
          supabase.from('bots').select('*'),
          supabase.from('licenses').select('*'),
        ]);
      if (!mounted) return;
      const profiles = profilesData ?? [];
      const funds = fundsData ?? [];
      const bots = botsData ?? [];
      const licenses = licensesData ?? [];
      const mapped: AdminClient[] = profiles.map((p: { id: string; email: string; created_at: string }) => {
        const fund = funds.find((f: { user_id: string }) => f.user_id === p.id);
        const userBots = bots.filter((b: { user_id: string }) => b.user_id === p.id);
        const license = licenses.find((l: { user_id: string }) => l.user_id === p.id);
        return {
          id: p.id,
          email: p.email,
          name: p.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          plan: license?.plan_name ?? 'Starter',
          status: 'active' as const,
          totalFunds: Number(fund?.balance ?? 0),
          unrealizedPnl: Number(fund?.unrealized_pnl ?? 0),
          realizedPnl: Number(fund?.realized_pnl ?? 0),
          activeBots: userBots.filter((b: { status: string }) => b.status === 'running').length,
          manualTrading: Boolean(fund?.manual_trading_enabled),
          joinedDate: p.created_at?.split('T')[0] ?? '',
          lastActive: '',
          country: 'India',
          licenseValidUntil: license?.valid_until ?? new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          licenseCycle: (license?.plan_name === 'Enterprise' ? 'yearly' : license?.plan_name === 'Pro' ? 'half-yearly' : 'monthly') as LicenseCycle,
          botLimit: Number(license?.bot_limit ?? 2),
          unlockedStrategies: [],
          unlockedIndicators: [],
          connectedExchanges: [] as ConnectedExchange[],
        };
      });
      setClients(mapped);
      setLoadingClients(false);
    })();
    return () => { mounted = false; };
  }, []);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const filtered = [...clients]
    .filter(c =>
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.plan.toLowerCase().includes(search.toLowerCase()) ||
      c.country.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortField === 'licenseValidUntil') {
        return (new Date(a.licenseValidUntil).getTime() - new Date(b.licenseValidUntil).getTime()) * dir;
      }
      return (a[sortField] - b[sortField]) * dir;
    });

  const openEdit = (client: AdminClient) => {
    setSelected(client);
    setEditPlan(client.plan);
    setEditExpiry(client.licenseValidUntil);
    setExtendMonths(0);
    setEditExchanges(client.connectedExchanges.map(e => ({ ...e })));
    setModalMode('edit');
  };

  const openLicense = (client: AdminClient) => {
    setSelected(client);
    setEditCycle(client.licenseCycle);
    setEditBotLimit(client.botLimit);
    setEditStrategies([...client.unlockedStrategies]);
    setEditIndicators([...client.unlockedIndicators]);
    setEditValidUntil(client.licenseValidUntil);
    setModalMode('license');
  };

  const openImpersonate = (client: AdminClient) => {
    setSelected(client);
    setModalMode('impersonate');
  };

  const openRemove = (client: AdminClient) => {
    setSelected(client);
    setModalMode('remove');
  };

  const openTrade = (client: AdminClient) => {
    setSelected(client);
    setTradeCoin('BTC');
    setMarketType('futures');
    setTradeDirection('long');
    setInputMode('quantity');
    setTradeAmount(500);
    setTradeQuantity(0.1);
    setTradeLeverage(10);
    setTakeProfitPct(5);
    setStopLossPct(2);
    setTradeSuccessMsg(false);
    setModalMode('trade');
  };

  const openHistory = useCallback(async (client: AdminClient) => {
    setSelected(client);
    setModalMode('history');
    setLoadingTrades(true);
    const { data } = await supabase
      .from('trades')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false });
    setClientTrades((data as ClientTrade[]) ?? []);
    setLoadingTrades(false);
  }, []);

  const closeModal = () => {
    setModalMode(null);
    setSelected(null);
  };

  const saveLicense = async () => {
    if (!selected) return;
    setClients(prev => prev.map(c => c.id === selected.id ? {
      ...c,
      licenseCycle: editCycle,
      botLimit: editBotLimit,
      unlockedStrategies: editStrategies,
      unlockedIndicators: editIndicators,
      licenseValidUntil: editValidUntil || c.licenseValidUntil,
    } : c));

    try {
      await supabase.from('client_updates').insert({
        client_id: selected.id,
        update_type: 'license_update',
        title: 'License Updated by Admin',
        message: `Your license has been updated: ${editCycle} cycle, ${editBotLimit} bots max, valid until ${editValidUntil || selected.licenseValidUntil}.`,
        severity: 'success',
        executed_by: 'Master Admin',
      });
      console.log('[Admin] License update sent to client_updates table');
    } catch (e) {
      console.error('License update insert error:', e);
    }

    closeModal();
  };

  const saveEdit = async () => {
    if (!selected) return;
    let newExpiry = editExpiry;
    if (extendMonths > 0) {
      const base = new Date(editExpiry);
      base.setMonth(base.getMonth() + extendMonths);
      newExpiry = base.toISOString().split('T')[0];
    }
    const planBotLimits: Record<string, number> = { Starter: 2, Pro: 10, Enterprise: 25 };
    setClients(prev => prev.map(c => c.id === selected.id ? {
      ...c,
      plan: editPlan,
      licenseValidUntil: newExpiry,
      botLimit: planBotLimits[editPlan] ?? c.botLimit,
      connectedExchanges: editExchanges,
    } : c));

    try {
      await supabase.from('client_updates').insert({
        client_id: selected.id,
        update_type: 'plan_change',
        title: `Plan Changed to ${editPlan}`,
        message: `Your subscription plan has been updated to ${editPlan}${extendMonths > 0 ? ` and extended by ${extendMonths} month${extendMonths !== 1 ? 's' : ''}` : ''}. New expiry: ${newExpiry}.`,
        severity: 'info',
        executed_by: 'Master Admin',
      });
      console.log('[Admin] Plan change sent to client_updates table');
    } catch (e) {
      console.error('Plan change insert error:', e);
    }

    closeModal();
  };

  const removeClient = () => {
    if (!selected) return;
    setClients(prev => prev.filter(c => c.id !== selected.id));
    closeModal();
  };

  // Live calculations for manual trade
  const selectedCoinData = coins.find(c => c.symbol === tradeCoin) || coins[0] || { symbol: 'BTC', name: 'Bitcoin', price: 64200, change24h: 0, volume24h: 0, quoteVolume24h: 0, high24h: 0, low24h: 0, sparkline: [] };
  const livePrice = selectedCoinData?.price || 64200;
  const finalQuantity = inputMode === 'quantity' ? Number(tradeQuantity) || 0 : (Number(tradeAmount) || 0) / livePrice;
  const totalNotionalValue = finalQuantity * livePrice;
  const requiredMargin = marketType === 'futures' ? totalNotionalValue / (tradeLeverage || 1) : totalNotionalValue;

  const handleExecuteManualTrade = async () => {
    if (!selected) return;
    setExecutingTrade(true);

    try {
      const { error } = await supabase.from('trades').insert({
        client_id: selected.id,
        client_name: selected.name,
        coin: tradeCoin,
        market_type: marketType,
        direction: tradeDirection,
        entry_price: livePrice,
        amount: requiredMargin,
        quantity: finalQuantity,
        leverage: marketType === 'futures' ? tradeLeverage : 1,
        position_size: totalNotionalValue,
        tp_pct: takeProfitPct === '' ? null : Number(takeProfitPct),
        sl_pct: stopLossPct === '' ? null : Number(stopLossPct),
        status: 'open',
        executed_by: 'Master Admin',
      });
      if (error) console.error('Trade insert error:', error.message);
      else console.log('[Admin] Trade inserted into trades table for client:', selected.name);
    } catch (e) {
      console.error('Trade execution error:', e);
    }

    setExecutingTrade(false);
    setTradeSuccessMsg(true);
    setTimeout(() => {
      closeModal();
      setTradeSuccessMsg(false);
    }, 2000);
  };

  const toggleStrategy = (s: string) => {
    setEditStrategies(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleIndicator = (ind: string) => {
    setEditIndicators(prev => prev.includes(ind) ? prev.filter(x => x !== ind) : [...prev, ind]);
  };

  const licenseExpired = (date: string) => new Date(date) < new Date();
  const daysUntilExpiry = (date: string) => Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Section 1: Client Database */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-neon-cyan" />
          <h2 className="text-xl font-bold text-white">Client Management</h2>
        </div>
        <p className="text-sm text-slate-400">Full client database — funds, PnL, running trades, license validity, and impersonation access</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat label="Total Clients" value={clients.length.toString()} icon={Users} color="text-neon-cyan" />
        <MiniStat label="Active" value={clients.filter(c => c.status === 'active').length.toString()} icon={Check} color="text-neon-green" />
        <MiniStat label="Suspended" value={clients.filter(c => c.status === 'suspended').length.toString()} icon={AlertTriangle} color="text-neon-amber" />
        <MiniStat label="Banned" value={clients.filter(c => c.status === 'banned').length.toString()} icon={Shield} color="text-neon-red" />
      </div>

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, plan, or country..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass text-sm text-white focus:outline-none focus:border-neon-cyan/40 transition-colors" />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 px-3 py-2 rounded-xl glass whitespace-nowrap">
          <span>Sort:</span>
          <span className="text-neon-cyan font-semibold capitalize">{sortField.replace(/([A-Z])/g, ' $1').trim()}</span>
          <button onClick={() => toggleSort(sortField)} className="text-slate-400 hover:text-white">
            {sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Client Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-slate-500">
                <th className="text-left py-3 px-4 font-semibold">Client Name</th>
                <th className="text-right py-3 px-4 font-semibold cursor-pointer select-none hover:text-slate-300" onClick={() => toggleSort('totalFunds')}>
                  <span className="inline-flex items-center gap-1">Total Funds {sortField === 'totalFunds' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</span>
                </th>
                <th className="text-right py-3 px-4 font-semibold cursor-pointer select-none hover:text-slate-300" onClick={() => toggleSort('unrealizedPnl')}>
                  <span className="inline-flex items-center gap-1">Current PnL {sortField === 'unrealizedPnl' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</span>
                </th>
                <th className="text-center py-3 px-4 font-semibold cursor-pointer select-none hover:text-slate-300" onClick={() => toggleSort('activeBots')}>
                  <span className="inline-flex items-center gap-1">Active Trades {sortField === 'activeBots' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</span>
                </th>
                <th className="text-center py-3 px-4 font-semibold cursor-pointer select-none hover:text-slate-300" onClick={() => toggleSort('licenseValidUntil')}>
                  <span className="inline-flex items-center gap-1">License Validity {sortField === 'licenseValidUntil' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</span>
                </th>
                <th className="text-center py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingClients ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-neon-cyan animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Users className="w-10 h-10 text-slate-600 mb-2" />
                      <p className="text-sm text-slate-500">No clients found.</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(c => {
                const expired = licenseExpired(c.licenseValidUntil);
                const days = daysUntilExpiry(c.licenseValidUntil);
                const PlanIcon = planConfig[c.plan]?.icon ?? Zap;
                return (
                  <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                    {/* Client Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-[10px] font-bold text-slate-300 flex-shrink-0">
                          {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white text-sm truncate">{c.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-slate-500 truncate">{c.email}</p>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <PlanIcon className={`w-3 h-3 ${planConfig[c.plan]?.color ?? 'text-slate-400'}`} />
                            <span className={`text-[10px] font-semibold ${planConfig[c.plan]?.color ?? 'text-slate-400'}`}>{c.plan}</span>
                            <span className="text-slate-700">·</span>
                            <span className="text-[10px] text-slate-600">{c.country}</span>
                            <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold border ${statusConfig[c.status]} capitalize`}>{c.status}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Total Funds */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-200 text-sm">{formatCurrency(c.totalFunds)}</td>
                    {/* Current PnL */}
                    <td className="py-3.5 px-4 text-right">
                      <span className={`font-mono font-semibold text-sm ${c.unrealizedPnl >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                        <span className="inline-flex items-center gap-1 justify-end">
                          {c.unrealizedPnl >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {c.unrealizedPnl >= 0 ? '+' : ''}{formatCurrency(c.unrealizedPnl)}
                        </span>
                      </span>
                    </td>
                    {/* Active Trades */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`font-mono font-semibold ${c.activeBots > 0 ? 'text-neon-cyan' : 'text-slate-600'}`}>
                        {c.activeBots}
                      </span>
                      <span className="text-[10px] text-slate-600 ml-1">/ {c.botLimit}</span>
                    </td>
                    {/* License Validity */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`text-xs font-mono ${expired ? 'text-neon-red' : days <= 30 ? 'text-neon-amber' : 'text-slate-300'}`}>
                          {new Date(c.licenseValidUntil).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold ${licenseCycleConfig[c.licenseCycle].badge} mt-0.5`}>
                          {licenseCycleConfig[c.licenseCycle].label}
                        </span>
                        {expired && <span className="text-[8px] text-neon-red font-bold mt-0.5">EXPIRED</span>}
                        {!expired && days <= 30 && <span className="text-[8px] text-neon-amber font-bold mt-0.5">{days}d left</span>}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <ActionButton icon={History} label="Trade History" color="text-neon-amber hover:bg-neon-amber/10" onClick={() => openHistory(c)} />
                        <ActionButton icon={Zap} label="Execute Trade" color="text-neon-cyan hover:bg-neon-cyan/10" onClick={() => openTrade(c)} />
                        <ActionButton icon={Pencil} label="Edit Client" color="text-neon-cyan hover:bg-neon-cyan/10" onClick={() => openEdit(c)} />
                        <ActionButton icon={KeyRound} label="License" color="text-neon-amber hover:bg-neon-amber/10" onClick={() => openLicense(c)} />
                        <ActionButton icon={Trash2} label="Remove" color="text-neon-red hover:bg-neon-red/10" onClick={() => openRemove(c)} />
                        <ActionButton icon={LogIn} label="Access Panel" color="text-neon-green hover:bg-neon-green/10" onClick={() => openImpersonate(c)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Section 2: License & Subscription Manager ===== */}
      <div className="pt-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="w-5 h-5 text-neon-amber" />
          <h2 className="text-xl font-bold text-white">License & Subscription Manager</h2>
        </div>
        <p className="text-sm text-slate-400">Assign subscription cycles, bot limits, and unlock premium strategies & indicators per client</p>
      </div>

      {/* Plan tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { tier: 'Starter', botLimit: 2, color: 'text-neon-cyan', border: 'border-neon-cyan/30', bg: 'bg-neon-cyan/10', strategies: 2, indicators: 2 },
          { tier: 'Pro', botLimit: 10, color: 'text-neon-green', border: 'border-neon-green/30', bg: 'bg-neon-green/10', strategies: 5, indicators: 4 },
          { tier: 'Enterprise', botLimit: 25, color: 'text-neon-amber', border: 'border-neon-amber/30', bg: 'bg-neon-amber/10', strategies: 7, indicators: 8 },
        ].map(plan => (
          <div key={plan.tier} className={`glass-card p-5 relative overflow-hidden ${plan.border}`}>
            <div className={`absolute -top-10 -right-10 w-28 h-28 ${plan.bg} rounded-full blur-3xl opacity-40`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-base font-bold ${plan.color}`}>{plan.tier}</h3>
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${plan.bg} ${plan.color}`}>
                  {clients.filter(c => c.plan === plan.tier).length} users
                </span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" /> Bot Limit</span>
                  <span className={`font-mono font-bold ${plan.color}`}>{plan.botLimit}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Strategies</span>
                  <span className={`font-mono font-bold ${plan.color}`}>{plan.strategies} unlocked</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Indicators</span>
                  <span className={`font-mono font-bold ${plan.color}`}>{plan.indicators} unlocked</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== MODALS ===== */}

      {/* Client Trade History Modal */}
      {modalMode === 'history' && selected && (
        <ModalShell onClose={closeModal} title={`Trade History — ${selected.name}`} icon={History} accent="amber" wide>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] text-xs">
              <div>
                <span className="text-slate-400">Client Email:</span> <strong className="text-white">{selected.email}</strong>
              </div>
              <div>
                <span className="text-slate-400">Wallet Balance:</span> <strong className="text-neon-cyan">{formatCurrency(selected.totalFunds)}</strong>
              </div>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-thin">
              {loadingTrades ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-neon-cyan animate-spin" />
                </div>
              ) : clientTrades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <History className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-xs text-slate-500">No trades found for this client.</p>
                </div>
              ) : clientTrades.map(trade => (
                <div key={trade.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${trade.direction === 'long' ? 'bg-neon-green/15 text-neon-green' : 'bg-neon-red/15 text-neon-red'}`}>
                      {trade.direction} {trade.coin}
                    </span>
                    <div>
                      <p className="text-white font-semibold">{trade.market_type.toUpperCase()} · {trade.leverage}x</p>
                      <p className="text-[10px] text-slate-500">Entry: ${Number(trade.entry_price).toLocaleString()} · Qty: {Number(trade.quantity).toFixed(4)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold capitalize text-slate-300">{trade.status.replace('_', ' ')}</p>
                    <p className="text-[10px] text-slate-400">{new Date(trade.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-white/[0.06]">
              <button
                onClick={closeModal}
                className="w-full py-2.5 rounded-xl glass hover:bg-white/[0.07] text-sm text-slate-300 font-semibold transition-all"
              >
                Close History
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Edit Client Modal */}
      {modalMode === 'edit' && selected && (
        <ModalShell onClose={closeModal} title="Edit Client" icon={UserCog} accent="cyan" wide>
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03]">
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-xs font-bold text-slate-300">
                {selected.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{selected.name}</p>
                <p className="text-[10px] text-slate-500">{selected.email}</p>
              </div>
              <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${statusConfig[selected.status]} capitalize`}>{selected.status}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Client Name">
                <input defaultValue={selected.name} className="modal-input" />
              </Field>
              <Field label="Email">
                <input defaultValue={selected.email} className="modal-input" />
              </Field>
              <Field label="Country">
                <input defaultValue={selected.country} className="modal-input" />
              </Field>
              <Field label="Status">
                <select defaultValue={selected.status} className="modal-input">
                  <option value="active" className="bg-base-850">Active</option>
                  <option value="suspended" className="bg-base-850">Suspended</option>
                  <option value="banned" className="bg-base-850">Banned</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InfoBox label="Total Funds" value={formatCurrency(selected.totalFunds)} icon={DollarSign} color="text-neon-cyan" />
              <InfoBox label="Active Bots" value={`${selected.activeBots}/${selected.botLimit}`} icon={Bot} color="text-neon-amber" />
            </div>

            <div className="pt-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-4 h-4 text-neon-amber" />
                <h3 className="text-sm font-bold text-white">Subscription Management</h3>
              </div>
              <p className="text-[11px] text-slate-500 mb-4">Instantly change the client's plan tier and extend their subscription validity</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] text-slate-500 uppercase mb-1">Current Plan</p>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const PCIcon = planConfig[selected.plan]?.icon ?? Zap;
                      return <PCIcon className={`w-4 h-4 ${planConfig[selected.plan]?.color ?? 'text-slate-400'}`} />;
                    })()}
                    <span className={`text-sm font-bold ${planConfig[selected.plan]?.color ?? 'text-slate-300'}`}>{selected.plan}</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-neon-amber/5 border border-neon-amber/15">
                  <p className="text-[10px] text-neon-amber/70 uppercase mb-1">Current Expiry</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neon-amber" />
                    <span className="text-sm font-mono text-slate-200">
                      {new Date(selected.licenseValidUntil).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2 block">Change Plan Tier</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { tier: 'Starter', icon: Zap, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/40', desc: '2 bots' },
                    { tier: 'Pro', icon: Rocket, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/40', desc: '8 bots' },
                    { tier: 'Enterprise', icon: Crown, color: 'text-neon-amber', bg: 'bg-neon-amber/10', border: 'border-neon-amber/40', desc: '25 bots' },
                  ].map(plan => {
                    const PIcon = plan.icon;
                    const isSelected = editPlan === plan.tier;
                    return (
                      <button
                        key={plan.tier}
                        onClick={() => setEditPlan(plan.tier)}
                        className={`relative p-3 rounded-xl border text-center transition-all overflow-hidden ${
                          isSelected ? `${plan.bg} ${plan.border}` : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]'
                        }`}
                      >
                        <PIcon className={`w-5 h-5 mx-auto mb-1.5 ${isSelected ? plan.color : 'text-slate-400'}`} />
                        <p className={`text-xs font-bold ${isSelected ? plan.color : 'text-slate-300'}`}>{plan.tier}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">{plan.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4">
                <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2 block flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Extend Subscription
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setExtendMonths(Math.max(0, extendMonths - 1))}
                    className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-300 hover:bg-white/[0.07] flex items-center justify-center transition-all active:scale-90"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex-1 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                    <span className="text-sm font-bold text-neon-amber font-mono">+{extendMonths} month{extendMonths !== 1 ? 's' : ''}</span>
                  </div>
                  <button
                    onClick={() => setExtendMonths(Math.min(36, extendMonths + 1))}
                    className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-300 hover:bg-white/[0.07] flex items-center justify-center transition-all active:scale-90"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <ModalButtons onCancel={closeModal} onConfirm={saveEdit} confirmLabel="Save Changes" confirmAccent="cyan" />
          </div>
        </ModalShell>
      )}

      {/* License Manager Modal */}
      {modalMode === 'license' && selected && (
        <ModalShell onClose={closeModal} title="License & Subscription Manager" icon={KeyRound} accent="amber" wide>
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-neon-amber/5 border border-neon-amber/15">
              <div className="w-10 h-10 rounded-xl bg-neon-amber/10 border border-neon-amber/20 flex items-center justify-center text-xs font-bold text-neon-amber">
                {selected.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{selected.name}</p>
                <p className="text-[10px] text-slate-500">{selected.email} · {selected.plan}</p>
              </div>
              <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${statusConfig[selected.status]} capitalize`}>{selected.status}</span>
            </div>

            <div>
              <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2 block">Subscription Cycle</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(licenseCycleConfig) as LicenseCycle[]).map(cycle => (
                  <button
                    key={cycle}
                    onClick={() => setEditCycle(cycle)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      editCycle === cycle
                        ? `${licenseCycleConfig[cycle].badge} border border-current`
                        : 'glass text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {licenseCycleConfig[cycle].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2 block">
                Bot Limit: <span className="text-neon-amber">{editBotLimit}</span> bots max
              </label>
              <div className="flex items-center gap-3">
                <button onClick={() => setEditBotLimit(Math.max(1, editBotLimit - 1))} className="w-9 h-9 rounded-xl glass hover:bg-white/[0.08] text-slate-300 flex items-center justify-center transition-all active:scale-90">
                  <ChevronDown className="w-4 h-4" />
                </button>
                <div className="flex-1 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <span className="text-lg font-bold text-neon-amber font-mono">{editBotLimit}</span>
                </div>
                <button onClick={() => setEditBotLimit(Math.min(50, editBotLimit + 1))} className="w-9 h-9 rounded-xl glass hover:bg-white/[0.08] text-slate-300 flex items-center justify-center transition-all active:scale-90">
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2 block">License Valid Until</label>
              <input
                type="date"
                value={editValidUntil}
                onChange={e => setEditValidUntil(e.target.value)}
                className="modal-input"
              />
            </div>

            <ModalButtons onCancel={closeModal} onConfirm={saveLicense} confirmLabel="Save License" confirmAccent="amber" />
          </div>
        </ModalShell>
      )}

      {/* Impersonate Modal */}
      {modalMode === 'impersonate' && selected && (
        <ModalShell onClose={closeModal} title="Access Client Panel" icon={LogIn} accent="green">
          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 rounded-xl bg-neon-amber/5 border border-neon-amber/20">
              <div className="flex items-center gap-2 text-neon-amber">
                <Shield className="w-5 h-5" />
                <span className="text-xs font-bold">ADMIN IMPERSONATION MODE</span>
              </div>
            </div>
            <p className="text-sm text-slate-300 text-center">
              You are about to log in as <span className="font-bold text-white">{selected.name}</span> and access their full trading panel.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <InfoBox label="Current Funds" value={formatCurrency(selected.totalFunds)} icon={DollarSign} color="text-neon-cyan" />
              <InfoBox label="Active Bots" value={`${selected.activeBots}/${selected.botLimit}`} icon={Bot} color="text-neon-amber" />
              <InfoBox label="Unrealized PnL" value={`${selected.unrealizedPnl >= 0 ? '+' : ''}${formatCurrency(selected.unrealizedPnl)}`} icon={selected.unrealizedPnl >= 0 ? TrendingUp : TrendingDown} color={selected.unrealizedPnl >= 0 ? 'text-neon-green' : 'text-neon-red'} />
              <InfoBox label="License" value={licenseCycleConfig[selected.licenseCycle].label} icon={Calendar} color="text-neon-amber" />
            </div>
            <ModalButtons onCancel={closeModal} onConfirm={closeModal} confirmLabel="Access Panel" confirmAccent="green" />
          </div>
        </ModalShell>
      )}

      {/* Remove Client Modal */}
      {modalMode === 'remove' && selected && (
        <ModalShell onClose={closeModal} title="Remove Client" icon={Trash2} accent="red">
          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 rounded-xl bg-neon-red/5 border border-neon-red/20">
              <div className="flex items-center gap-2 text-neon-red">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-xs font-bold">DANGER ZONE</span>
              </div>
            </div>
            <p className="text-sm text-slate-300 text-center">
              Are you sure you want to permanently remove <span className="font-bold text-white">{selected.name}</span> from the platform?
            </p>
            <ModalButtons onCancel={closeModal} onConfirm={removeClient} confirmLabel="Remove Permanently" confirmAccent="red" />
          </div>
        </ModalShell>
      )}

      {/* ===== MANUAL TRADE EXECUTION MODAL (TP & SL Optional) ===== */}
      {modalMode === 'trade' && selected && (
        <ModalShell onClose={closeModal} title="Execute Manual Trade" icon={Zap} accent="cyan" wide>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div>
                <p className="text-xs text-slate-400">Placing trade for client: <span className="text-neon-cyan font-semibold">{selected.name}</span></p>
              </div>
            </div>

            {tradeSuccessMsg ? (
              <div className="py-12 text-center space-y-3 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-neon-green/20 border border-neon-green/40 text-neon-green flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Trade Executed Successfully!</h4>
                <p className="text-xs text-slate-400">Position has been opened on {selected.name}'s account.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-semibold">Select Asset / Coin</label>
                  <div className="grid grid-cols-5 gap-2">
                    {coins.slice(0, 5).map(c => (
                      <button
                        key={c.symbol}
                        onClick={() => setTradeCoin(c.symbol)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          tradeCoin === c.symbol ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/40' : 'bg-white/[0.03] text-slate-400 border border-white/[0.06]'
                        }`}
                      >
                        {c.symbol}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Live Price of {tradeCoin}: <span className="text-white font-mono font-bold">${livePrice.toLocaleString()}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-semibold">Market Type</label>
                    <div className="flex gap-2">
                      {(['spot', 'futures'] as const).map(mt => (
                        <button
                          key={mt}
                          onClick={() => setMarketType(mt)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                            marketType === mt ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30' : 'bg-white/[0.03] text-slate-400 border border-white/[0.06]'
                          }`}
                        >
                          {mt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-semibold">Direction</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTradeDirection('long')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                          tradeDirection === 'long' ? 'bg-neon-green/15 text-neon-green border border-neon-green/30' : 'bg-white/[0.03] text-slate-400 border border-white/[0.06]'
                        }`}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" /> Long
                      </button>
                      <button
                        onClick={() => setTradeDirection('short')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                          tradeDirection === 'short' ? 'bg-neon-red/15 text-neon-red border border-neon-red/30' : 'bg-white/[0.03] text-slate-400 border border-white/[0.06]'
                        }`}
                      >
                        <ArrowDownRight className="w-3.5 h-3.5" /> Short
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Trade Input Mode</label>
                    <div className="flex gap-1 p-0.5 rounded-lg bg-white/[0.03]">
                      <button
                        onClick={() => setInputMode('quantity')}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${inputMode === 'quantity' ? 'bg-neon-cyan/25 text-neon-cyan' : 'text-slate-400'}`}
                      >
                        Quantity ({tradeCoin})
                      </button>
                      <button
                        onClick={() => setInputMode('amount')}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${inputMode === 'amount' ? 'bg-neon-cyan/25 text-neon-cyan' : 'text-slate-400'}`}
                      >
                        Amount ($)
                      </button>
                    </div>
                  </div>

                  {inputMode === 'quantity' ? (
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        value={tradeQuantity}
                        onChange={e => setTradeQuantity(Number(e.target.value))}
                        className="modal-input font-mono"
                        placeholder="e.g. 0.1, 1.5"
                      />
                    </div>
                  ) : (
                    <div>
                      <input
                        type="number"
                        step="50"
                        value={tradeAmount}
                        onChange={e => setTradeAmount(Number(e.target.value))}
                        className="modal-input font-mono"
                        placeholder="e.g. 500"
                      />
                    </div>
                  )}
                </div>

                {marketType === 'futures' && (
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-semibold">Leverage ({tradeLeverage}x)</label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={tradeLeverage}
                      onChange={e => setTradeLeverage(Number(e.target.value))}
                      className="w-full accent-neon-cyan cursor-pointer"
                    />
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Calculated Quantity:</span>
                    <span className="text-white font-bold">{finalQuantity.toFixed(4)} {tradeCoin}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Position Size (Notional):</span>
                    <span className="text-neon-cyan font-bold">${totalNotionalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-2 border-t border-white/[0.06]">
                    <span>Fund Required (Margin):</span>
                    <span className="text-neon-green font-bold">${requiredMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-semibold">Take Profit (%) <span className="text-[10px] text-slate-500 font-normal">(Optional)</span></label>
                    <input
                      type="number"
                      value={takeProfitPct}
                      onChange={e => setTakeProfitPct(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Optional"
                      className="modal-input font-mono text-neon-green"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-semibold">Stop Loss (%) <span className="text-[10px] text-slate-500 font-normal">(Optional)</span></label>
                    <input
                      type="number"
                      value={stopLossPct}
                      onChange={e => setStopLossPct(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="Optional"
                      className="modal-input font-mono text-neon-red"
                    />
                  </div>
                </div>

                <ModalButtons
                  onCancel={closeModal}
                  onConfirm={handleExecuteManualTrade}
                  confirmLabel={executingTrade ? 'Executing...' : 'Execute Position'}
                  confirmAccent="cyan"
                />
              </div>
            )}
          </div>
        </ModalShell>
      )}
    </div>
  );
}

// ===== Helper Components =====

function MiniStat({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Users; color: string }) {
  return (
    <div className="glass-card p-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <p className="text-lg font-bold text-white font-mono leading-none">{value}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, color, onClick }: { icon: typeof Pencil; label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`p-2 rounded-lg glass transition-all active:scale-90 ${color}`}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function ModalShell({ children, onClose, title, icon: Icon, accent, wide }: {
  children: React.ReactNode; onClose: () => void; title: string; icon: typeof Pencil; accent: 'cyan' | 'amber' | 'green' | 'red'; wide?: boolean;
}) {
  const accentColors = {
    cyan: 'neon-glow-cyan',
    amber: 'neon-glow-amber',
    green: 'neon-glow-green',
    red: 'neon-glow-red',
  };
  const iconColors = {
    cyan: 'text-neon-cyan',
    amber: 'text-neon-amber',
    green: 'text-neon-green',
    red: 'text-neon-red',
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-base-900/80 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-thin`}>
        <div className={`glass-strong ${accentColors[accent]} p-6`}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${iconColors[accent]}`} />
              <h2 className="text-base font-bold text-white">{title}</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-2 block">{label}</label>
      {children}
    </div>
  );
}

function InfoBox({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof DollarSign; color: string }) {
  return (
    <div className="p-3 rounded-xl glass">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-slate-500 uppercase">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className={`text-sm font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}

function ModalButtons({ onCancel, onConfirm, confirmLabel, confirmAccent }: {
  onCancel: () => void; onConfirm: () => void; confirmLabel: string; confirmAccent: 'cyan' | 'amber' | 'green' | 'red';
}) {
  const accents = {
    cyan: 'bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan hover:bg-neon-cyan/30',
    amber: 'bg-neon-amber/20 border-neon-amber/40 text-neon-amber hover:bg-neon-amber/30',
    green: 'bg-neon-green/20 border-neon-green/40 text-neon-green hover:bg-neon-green/30',
    red: 'bg-neon-red/20 border-neon-red/40 text-neon-red hover:bg-neon-red/30',
  };
  return (
    <div className="flex gap-3 pt-2">
      <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl glass hover:bg-white/[0.07] text-sm text-slate-300 transition-all">
        Cancel
      </button>
      <button onClick={onConfirm} className={`flex-1 px-4 py-2.5 rounded-xl border font-semibold text-sm transition-all active:scale-95 ${accents[confirmAccent]}`}>
        {confirmLabel}
      </button>
    </div>
  );
}