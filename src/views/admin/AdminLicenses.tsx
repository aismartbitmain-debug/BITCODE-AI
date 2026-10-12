import { useEffect, useState } from 'react';
import {
  KeyRound, Loader2, Plus, Check, Zap, Users, TrendingUp,
  Calendar, Copy, Sparkles, Crown, Rocket, X, Clock, CheckCircle2, Sliders, Shield, AlertTriangle
} from 'lucide-react';
import { supabase, type License } from '@/lib/supabase';
import {
  adminLicensePlans, type AdminLicense,
  licensePlanConfigs, licenseDurationOptions,
  saasFeatureMatrix, allStrategies, allIndicators
} from '@/data/adminMockData';
import { useAdminCurrency } from '@/context/AdminCurrencyContext';

const planColors = {
  green: { text: 'text-neon-green', border: 'border-neon-green/30', bg: 'bg-neon-green/10', glow: 'neon-glow-green' },
  cyan: { text: 'text-neon-cyan', border: 'border-neon-cyan/30', bg: 'bg-neon-cyan/10', glow: 'neon-glow-cyan' },
  amber: { text: 'text-neon-amber', border: 'border-neon-amber/30', bg: 'bg-neon-amber/10', glow: '' },
};

const tierIconMap: Record<string, typeof Zap> = {
  Starter: Zap,
  Pro: Rocket,
  Enterprise: Crown,
  Custom: Sliders,
};

function randomKey(tier: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let seg = '';
  for (let i = 0; i < 4; i++) seg += chars[Math.floor(Math.random() * chars.length)];
  return `CORTEX-${tier.toUpperCase()}-${seg}`;
}

export default function AdminLicenses() {
  const { formatCurrency, symbol, currency } = useAdminCurrency();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);

  // Generate modal state
  const [selectedTier, setSelectedTier] = useState<string>('Pro');
  const [selectedDuration, setSelectedDuration] = useState<number>(3); // in months
  const [customAmount, setCustomAmount] = useState<number>(0);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- CUSTOM LICENSE ADVANCED STATE ---
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customDays, setCustomDays] = useState<number>(7);
  const [customBotLimit, setCustomBotLimit] = useState<number>(5);
  const [customMaxLeverage, setCustomMaxLeverage] = useState<number>(20);
  const [customStrategies, setCustomStrategies] = useState<string[]>(['SMC Breakout', 'RSI Divergence']);
  const [customIndicators, setCustomIndicators] = useState<string[]>(['MACD Crossover', 'Bollinger Bands']);

  // Allowed bots per license (bot_type values from bot_templates)
  const allBotTypes = ['scalper', 'dca', 'grid', 'copier'] as const;
  const [allowedBots, setAllowedBots] = useState<string[]>(['scalper', 'dca', 'grid']);

  const toggleAllowedBot = (bt: string) => {
    setAllowedBots(prev => prev.includes(bt) ? prev.filter(x => x !== bt) : [...prev, bt]);
    setGeneratedKey(null);
  };

  const fetchLicenses = async () => {
    const { data } = await supabase.from('licenses').select('*').order('created_at', { ascending: false });
    setLicenses((data as License[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  // Auto-fill default amount when tier or duration changes
  useEffect(() => {
    if (isCustomMode) return;
    const tier = licensePlanConfigs.find(t => t.id === selectedTier);
    if (tier) {
      setCustomAmount(tier.monthlyPrice * selectedDuration);
    }
  }, [selectedTier, selectedDuration, isCustomMode]);

  const toggleActive = async (id: string, current: boolean) => {
    setLicenses(prev => prev.map(l => l.id === id ? { ...l, is_active: !current } : l));
    await supabase.from('licenses').update({ is_active: !current }).eq('id', id);
  };

  const handleGenerateKey = () => {
    setCopied(false);
    const tierKey = isCustomMode ? 'CUSTOM' : selectedTier;
    setGeneratedKey(randomKey(tierKey));
  };

  const handleCopy = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveLicense = async () => {
    if (!generatedKey) return;
    setSaving(true);
    
    let planName = selectedTier;
    let botLimit = 5;
    let monthlyFee = customAmount;
    const now = new Date();
    const validUntil = new Date(now);

    if (isCustomMode) {
      planName = 'Custom Tailored';
      botLimit = customBotLimit;
      validUntil.setDate(validUntil.getDate() + customDays);
    } else {
      const tier = licensePlanConfigs.find(t => t.id === selectedTier)!;
      botLimit = tier.botLimit;
      monthlyFee = tier.monthlyPrice;
      validUntil.setMonth(validUntil.getMonth() + selectedDuration);
    }

    const { data } = await supabase.from('licenses').insert({
      plan_name: planName,
      bot_limit: botLimit,
      is_active: true,
      valid_from: now.toISOString(),
      valid_until: validUntil.toISOString(),
      monthly_fee: monthlyFee,
      license_key: generatedKey,
      allowed_bots: allowedBots.length > 0 ? allowedBots : null,
    }).select('*');

    if (data) {
      setLicenses(prev => [data[0] as License, ...prev]);
    }

    await supabase.from('transactions').insert({
      client_name: isCustomMode ? 'Custom License Client' : 'New License',
      plan_name: planName,
      amount: customAmount,
      currency: 'USD',
      status: 'completed',
      payment_method: isCustomMode ? 'Tailored Custom Admin Allotment' : 'Manual Assignment',
    });

    setSaving(false);
    setShowGenerate(false);
    setGeneratedKey(null);
    setCopied(false);
  };

  const openGenerate = () => {
    setIsCustomMode(false);
    setSelectedTier('Pro');
    setSelectedDuration(3);
    setCustomDays(7);
    setCustomBotLimit(5);
    setCustomMaxLeverage(20);
    setAllowedBots(['scalper', 'dca', 'grid']);
    setGeneratedKey(null);
    setCopied(false);
    setShowGenerate(true);
  };

  const toggleCustomStrategy = (s: string) => {
    setCustomStrategies(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleCustomIndicator = (ind: string) => {
    setCustomIndicators(prev => prev.includes(ind) ? prev.filter(x => x !== ind) : [...prev, ind]);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-neon-cyan animate-spin" /></div>;
  }

  // --- DASHBOARD METRICS CALCULATION ---
  const totalLicenses = licenses.length;
  const activeLicensesCount = licenses.filter(l => l.is_active && (!l.valid_until || new Date(l.valid_until) > new Date())).length;
  const expiredLicensesCount = licenses.filter(l => l.valid_until && new Date(l.valid_until) <= new Date()).length;
  const customLicensesCount = licenses.filter(l => l.plan_name === 'Custom Tailored').length;

  const convertedAmount = currency === 'INR' ? customAmount * 83 : customAmount;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-neon-cyan" /> License & Subscription Manager
          </h2>
          <p className="text-sm text-slate-400">Track active/expired licenses, generate keys, and manage SaaS plans</p>
        </div>
        <button
          onClick={openGenerate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 hover:neon-glow-cyan text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4" /> Generate & Allot License
        </button>
      </div>

      {/* --- LICENSE DASHBOARD STATS --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card p-4 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-neon-cyan/10 rounded-full blur-2xl opacity-50" />
          <div className="relative">
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Total Licenses</p>
            <p className="text-2xl font-bold text-white font-mono mt-1">{totalLicenses}</p>
            <p className="text-[10px] text-neon-cyan mt-0.5">All generated keys</p>
          </div>
        </div>
        <div className="glass-card p-4 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-neon-green/10 rounded-full blur-2xl opacity-50" />
          <div className="relative">
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Active Licenses</p>
            <p className="text-2xl font-bold text-neon-green font-mono mt-1">{activeLicensesCount}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Currently valid</p>
          </div>
        </div>
        <div className="glass-card p-4 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-neon-red/10 rounded-full blur-2xl opacity-50" />
          <div className="relative">
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Expired Licenses</p>
            <p className="text-2xl font-bold text-neon-red font-mono mt-1">{expiredLicensesCount}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Validity passed</p>
          </div>
        </div>
        <div className="glass-card p-4 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-neon-amber/10 rounded-full blur-2xl opacity-50" />
          <div className="relative">
            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Custom Tailored</p>
            <p className="text-2xl font-bold text-neon-amber font-mono mt-1">{customLicensesCount}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Special packages</p>
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {adminLicensePlans.map((plan: AdminLicense) => {
          const a = planColors[plan.color];
          return (
            <div key={plan.id} className={`glass-card p-6 relative overflow-hidden ${a.border}`}>
              <div className={`absolute -top-12 -right-12 w-32 h-32 ${a.bg} rounded-full blur-3xl opacity-40`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold ${a.text}`}>{plan.planName}</h3>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${a.bg} ${a.text} ${a.border} border`}>
                    {plan.activeUsers} active
                  </span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">
                  {symbol}{currency === 'INR' ? (plan.price * 83) : plan.price}<span className="text-sm text-slate-500 font-normal">/mo</span>
                </p>
                <div className="flex items-center gap-4 mt-4 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Zap className={`w-4 h-4 ${a.text}`} />
                    <span className="text-sm text-slate-300">{plan.botLimit === 25 ? 'Unlimited' : `${plan.botLimit}`} bots</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className={`w-4 h-4 ${a.text}`} />
                    <span className="text-sm text-slate-300">{plan.maxLeverage}x max</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-slate-400">
                      <Check className={`w-3.5 h-3.5 ${a.text} flex-shrink-0`} /> {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active licenses table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-neon-cyan" /> License Tracking & Database
          </h3>
          <span className="text-xs text-slate-500 font-mono">Showing {licenses.length} records</span>
        </div>
        {licenses.length === 0 ? (
          <div className="p-12 text-center">
            <KeyRound className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">No licenses assigned yet</p>
            <p className="text-xs text-slate-500 mt-1">Generate a license key or assign plans to clients.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="text-left py-3 px-4 font-semibold">Plan Tier</th>
                  <th className="text-left py-3 px-4 font-semibold">License Key</th>
                  <th className="text-right py-3 px-4 font-semibold">Bot Limit</th>
                  <th className="text-right py-3 px-4 font-semibold hidden sm:table-cell">Monthly Fee</th>
                  <th className="text-left py-3 px-4 font-semibold hidden md:table-cell">Valid Until</th>
                  <th className="text-center py-3 px-4 font-semibold">Status</th>
                  <th className="text-center py-3 px-4 font-semibold">Toggle Action</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map(l => {
                  const isExpired = l.valid_until && new Date(l.valid_until) < new Date();
                  return (
                    <tr key={l.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {l.plan_name}
                        {l.plan_name === 'Custom Tailored' && <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-neon-amber/15 text-neon-amber font-mono">CUSTOM</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        {l.license_key ? (
                          <span className="font-mono text-xs text-neon-cyan bg-neon-cyan/5 px-2.5 py-1 rounded-md border border-neon-cyan/15">
                            {l.license_key}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600 italic">No key</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">{l.bot_limit}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-200 hidden sm:table-cell">{formatCurrency(Number(l.monthly_fee))}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-400 hidden md:table-cell font-mono">
                        {l.valid_until ? new Date(l.valid_until).toLocaleDateString() : 'Unlimited'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isExpired ? (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold text-neon-red bg-neon-red/10 border border-neon-red/25">
                            EXPIRED
                          </span>
                        ) : l.is_active ? (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold text-neon-green bg-neon-green/10 border border-neon-green/25">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold text-slate-500 bg-white/[0.03] border border-white/[0.06]">
                            INACTIVE
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button 
                          onClick={() => toggleActive(l.id, l.is_active)} 
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            l.is_active ? 'bg-neon-green/10 text-neon-green border-neon-green/20 hover:bg-neon-green/20' : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:text-white'
                          }`}
                        >
                          {l.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate & Customize License Modal */}
      {showGenerate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="absolute inset-0 bg-base-900/85 backdrop-blur-md" onClick={() => setShowGenerate(false)} />
          <div className="relative w-full max-w-2xl animate-scale-in">
            <div className="glass-strong neon-glow-cyan max-h-[92vh] overflow-y-auto scrollbar-thin rounded-2xl">
              {/* Header */}
              <div className="sticky top-0 z-25 bg-base-800/90 backdrop-blur-xl border-b border-white/[0.06] px-5 sm:px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-neon-cyan" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Generate & Allot License</h2>
                    <p className="text-[11px] text-slate-500">Choose standard tier or create a fully customized tailored license</p>
                  </div>
                </div>
                <button onClick={() => setShowGenerate(false)} className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.06]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 sm:px-6 py-5 space-y-5">
                {/* Mode Switcher */}
                <div className="flex p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <button
                    onClick={() => { setIsCustomMode(false); setGeneratedKey(null); }}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      !isCustomMode ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Standard Plan Tiers
                  </button>
                  <button
                    onClick={() => { setIsCustomMode(true); setGeneratedKey(null); }}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isCustomMode ? 'bg-neon-amber/15 text-neon-amber border border-neon-amber/30 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" /> Fully Custom Tailored
                  </button>
                </div>

                {/* --- STANDARD MODE --- */}
                {!isCustomMode && (
                  <div className="space-y-5 animate-fade-in">
                    <div>
                      <label className="text-xs text-slate-400 mb-3 block font-semibold">Select Plan</label>
                      <div className="grid grid-cols-3 gap-3">
                        {licensePlanConfigs.map(tier => {
                          const isSelected = selectedTier === tier.id;
                          const TIcon = tierIconMap[tier.id];
                          const colorMap: Record<string, { text: string; bg: string; border: string; glow: string }> = {
                            cyan: { text: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/40', glow: 'hover:neon-glow-cyan' },
                            green: { text: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/40', glow: 'hover:neon-glow-green' },
                            amber: { text: 'text-neon-amber', bg: 'bg-neon-amber/10', border: 'border-neon-amber/40', glow: 'hover:neon-glow-amber' },
                          };
                          const a = colorMap[tier.color];
                          return (
                            <button
                              key={tier.id}
                              onClick={() => { setSelectedTier(tier.id); setGeneratedKey(null); }}
                              className={`relative p-4 rounded-xl border text-center transition-all overflow-hidden ${
                                isSelected ? `${a.bg} ${a.border}${a.glow}` : 'bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12]'
                              }`}
                            >
                              {isSelected && <div className={`absolute -top-8 -right-8 w-20 h-20 ${a.bg} rounded-full blur-2xl opacity-60`} />}
                              <div className="relative">
                                <div className={`w-10 h-10 rounded-lg ${isSelected ? a.bg : 'bg-white/[0.05]'} flex items-center justify-center mx-auto mb-2`}>
                                  <TIcon className={`w-5 h-5 ${isSelected ? a.text : 'text-slate-400'}`} />
                                </div>
                                <p className={`text-sm font-bold ${isSelected ? a.text : 'text-slate-300'}`}>{tier.label}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{symbol}{currency === 'INR' ? tier.monthlyPrice * 83 : tier.monthlyPrice}/mo</p>
                                <p className="text-[10px] text-slate-600 mt-0.5">{tier.botLimit === 25 ? 'Unlimited' : `${tier.botLimit}`} bots · {tier.maxLeverage}x</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-3 block font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Duration
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {licenseDurationOptions.map(d => (
                          <button
                            key={d.months}
                            onClick={() => { setSelectedDuration(d.months); setGeneratedKey(null); }}
                            className={`px-2 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                              selectedDuration === d.months
                                ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40'
                                : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:border-white/[0.12]'
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- CUSTOM TAILORED MODE --- */}
                {isCustomMode && (
                  <div className="space-y-4 p-4 rounded-xl bg-neon-amber/5 border border-neon-amber/20 animate-fade-in">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
                      <Sliders className="w-4 h-4 text-neon-amber" />
                      <h3 className="text-xs font-bold text-neon-amber uppercase tracking-wider">Tailored License Parameters</h3>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-semibold">Exact Validity (in Days)</label>
                      <div className="flex gap-2 mb-2">
                        {[1, 3, 7, 14, 30, 90].map(d => (
                          <button
                            key={d}
                            onClick={() => { setCustomDays(d); setGeneratedKey(null); }}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                              customDays === d ? 'bg-neon-amber/20 text-neon-amber border border-neon-amber/40' : 'bg-white/[0.03] text-slate-400 border border-white/[0.06]'
                            }`}
                          >
                            {d} {d === 1 ? 'Day' : 'Days'}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="730"
                        value={customDays}
                        onChange={e => { setCustomDays(Number(e.target.value)); setGeneratedKey(null); }}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white font-mono focus:outline-none focus:border-neon-amber/40"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 mb-1.5 block font-semibold">Bot Limit ({customBotLimit} Bots)</label>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={customBotLimit}
                          onChange={e => { setCustomBotLimit(Number(e.target.value)); setGeneratedKey(null); }}
                          className="w-full accent-neon-amber cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1.5 block font-semibold">Max Leverage ({customMaxLeverage}x)</label>
                        <input
                          type="range"
                          min="1"
                          max="125"
                          step="5"
                          value={customMaxLeverage}
                          onChange={e => { setCustomMaxLeverage(Number(e.target.value)); setGeneratedKey(null); }}
                          className="w-full accent-neon-amber cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-semibold">Unlock Specific Strategies ({customStrategies.length})</label>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto scrollbar-thin p-1">
                        {allStrategies.map(s => {
                          const active = customStrategies.includes(s);
                          return (
                            <button
                              key={s}
                              onClick={() => { toggleCustomStrategy(s); setGeneratedKey(null); }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                                active ? 'bg-neon-amber/15 text-neon-amber border border-neon-amber/30' : 'bg-white/[0.03] text-slate-500 border border-white/[0.06]'
                              }`}
                            >
                              {active && <Check className="w-3 h-3 inline mr-1" />} {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block font-semibold">Unlock Specific Indicators ({customIndicators.length})</label>
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto scrollbar-thin p-1">
                        {allIndicators.map(ind => {
                          const active = customIndicators.includes(ind);
                          return (
                            <button
                              key={ind}
                              onClick={() => { toggleCustomIndicator(ind); setGeneratedKey(null); }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                                active ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30' : 'bg-white/[0.03] text-slate-500 border border-white/[0.06]'
                              }`}
                            >
                              {active && <Check className="w-3 h-3 inline mr-1" />} {ind}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Allowed Bots Selection — shown in both modes */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block font-semibold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Allowed Bot Types ({allowedBots.length})
                  </label>
                  <p className="text-[10px] text-slate-500 mb-2">Select which bot types this license unlocks. Leave empty to allow all.</p>
                  <div className="flex flex-wrap gap-2">
                    {allBotTypes.map(bt => {
                      const active = allowedBots.includes(bt);
                      return (
                        <button
                          key={bt}
                          onClick={() => toggleAllowedBot(bt)}
                          className={`px-3.5 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                            active
                              ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40'
                              : 'bg-white/[0.03] text-slate-500 border border-white/[0.06] hover:border-white/[0.12]'
                          }`}
                        >
                          {active && <Check className="w-3 h-3 inline mr-1" />} {bt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Editable Amount */}
                <div>
                  <label className="text-xs text-slate-400 mb-2 block font-semibold">Total Amount (editable)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-cyan font-bold text-sm">{symbol}</span>
                    <input
                      type="number"
                      value={currency === 'INR' ? Math.round(customAmount * 83) : customAmount}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setCustomAmount(currency === 'INR' ? val / 83 : val);
                        setGeneratedKey(null);
                      }}
                      step="1"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-lg text-white font-mono font-bold focus:outline-none focus:border-neon-cyan/40"
                    />
                  </div>
                </div>

                {/* License Key Generation */}
                <div>
                  <label className="text-xs text-slate-400 mb-3 block font-semibold">License Key</label>
                  {generatedKey ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/20">
                        <KeyRound className="w-5 h-5 text-neon-cyan flex-shrink-0" />
                        <span className="flex-1 font-mono text-sm font-bold text-neon-cyan tracking-wider">{generatedKey}</span>
                        <button
                          onClick={handleCopy}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            copied ? 'bg-neon-green/15 text-neon-green border border-neon-green/30' : 'bg-white/[0.05] text-slate-300 border border-white/[0.08]'
                          }`}
                        >
                          {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerateKey}
                      className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] border-dashed text-slate-400 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
                    >
                      <Sparkles className="w-4 h-4" /> Click to generate unique key
                    </button>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-base-800/90 backdrop-blur-xl border-t border-white/[0.06] px-5 sm:px-6 py-4 flex items-center justify-between gap-3">
                <button
                  onClick={() => setShowGenerate(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.07] text-sm text-slate-300 border border-white/[0.06]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLicense}
                  disabled={!generatedKey || saving}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                    generatedKey && !saving
                      ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40 hover:neon-glow-cyan'
                      : 'bg-white/[0.03] text-slate-500 border border-white/[0.06] cursor-not-allowed'
                  }`}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Activate License
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}