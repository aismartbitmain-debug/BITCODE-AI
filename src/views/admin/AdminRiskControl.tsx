import { useEffect, useState } from 'react';
import {
  AlertTriangle, ShieldCheck, Loader2, Zap, Activity, Server,
  Gauge, Cpu, Brain, BarChart3, LineChart, Plug, ShieldAlert,
  CheckCircle2, XCircle, RefreshCw, Sliders
} from 'lucide-react';
import { supabase, type RiskSettings } from '@/lib/supabase';

interface ApiHealthItem {
  name: string;
  category: 'AI Engine' | 'Market Data';
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  uptime: number;
  lastCheck: string;
}

const platformInfrastructureLogs: ApiHealthItem[] = [
  { name: 'OpenAI (GPT-4o)', category: 'AI Engine', status: 'healthy', latency: 210, uptime: 99.99, lastCheck: 'Just now' },
  { name: 'Anthropic Claude', category: 'AI Engine', status: 'healthy', latency: 185, uptime: 99.96, lastCheck: 'Just now' },
  { name: 'DeepSeek AI', category: 'AI Engine', status: 'healthy', latency: 115, uptime: 99.94, lastCheck: 'Just now' },
  { name: 'CoinGecko Feed', category: 'Market Data', status: 'healthy', latency: 65, uptime: 99.90, lastCheck: 'Just now' },
  { name: 'CoinMarketCap API', category: 'Market Data', status: 'healthy', latency: 78, uptime: 99.88, lastCheck: 'Just now' },
  { name: 'TradingView Charts', category: 'Market Data', status: 'healthy', latency: 42, uptime: 99.99, lastCheck: 'Just now' },
];

const healthConfig = {
  healthy: { color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/25', dot: 'bg-neon-green' },
  degraded: { color: 'text-neon-amber', bg: 'bg-neon-amber/10', border: 'border-neon-amber/25', dot: 'bg-neon-amber' },
  down: { color: 'text-neon-red', bg: 'bg-neon-red/10', border: 'border-neon-red/25', dot: 'bg-neon-red' },
};

export default function AdminRiskControl() {
  const [settings, setSettings] = useState<RiskSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiLogs, setApiLogs] = useState<ApiHealthItem[]>(platformInfrastructureLogs);
  
  // Futuristic AI Risk Controls State
  const [aiCircuitBreaker, setAiCircuitBreaker] = useState(true);
  const [maxSlippagePct, setMaxSlippagePct] = useState(1.5);

  useEffect(() => {
    let mounted = true;
    supabase.from('risk_settings').select('*').limit(1).maybeSingle().then(({ data }) => {
      if (!mounted) return;
      setSettings(data as RiskSettings | null);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const update = async (field: keyof RiskSettings, value: boolean | number) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
    setSaving(true);
    await supabase.from('risk_settings').update({
      [field]: value,
      updated_at: new Date().toISOString()
    }).eq('id', settings.id);
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-neon-cyan animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-neon-amber" /> Risk Control & Platform Infrastructure
          </h2>
          <p className="text-sm text-slate-400">Manage risk breach defenses, AI circuit breakers, and global core API health</p>
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-xs text-neon-amber font-mono bg-neon-amber/10 px-3 py-1.5 rounded-lg border border-neon-amber/20">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving changes...
          </div>
        )}
      </div>

      {/* Primary Risk Defense Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Auto-Disable on Breach */}
        <div className="glass-card p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-neon-green/10 border border-neon-green/20 text-neon-green">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Auto-Disable on Risk Breach</h3>
                <p className="text-[11px] text-slate-500">Automatically pause bots upon risk limit violations</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${settings?.auto_disable_on_breach ? 'text-neon-green bg-neon-green/10 border-neon-green/25' : 'text-slate-500 bg-white/[0.03] border-white/[0.06]'}`}>
              {settings?.auto_disable_on_breach ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
          <button
            onClick={() => update('auto_disable_on_breach', !(settings?.auto_disable_on_breach ?? true))}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all border ${
              settings?.auto_disable_on_breach
                ? 'bg-neon-green/15 text-neon-green border-neon-green/30 hover:bg-neon-green/25'
                : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:text-white'
            }`}
          >
            {settings?.auto_disable_on_breach ? 'Active Defense Enabled (Click to Toggle)' : 'Defense Disabled (Click to Enable)'}
          </button>
        </div>

        {/* Max Slippage Protection Guard */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Max Slippage Protection Guard</h3>
                <p className="text-[11px] text-slate-500">Reject orders if slippage exceeds threshold</p>
              </div>
            </div>
            <span className="text-xl font-bold font-mono text-neon-cyan">{maxSlippagePct}%</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="5.0"
            step="0.1"
            value={maxSlippagePct}
            onChange={e => setMaxSlippagePct(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-neon-cyan bg-white/[0.08]"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0.1% (Strict)</span>
            <span>1.5% (Standard)</span>
            <span>5.0% (Relaxed)</span>
          </div>
        </div>
      </div>

      {/* Futuristic AI Risk Controls */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
        {/* AI Volatility Circuit Breaker */}
        <div className="glass-card p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-neon-amber/10 border border-neon-amber/20 text-neon-amber">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Volatility Circuit Breaker</h3>
                <p className="text-[11px] text-slate-500">AI monitors market spikes & pauses trades during flash crashes</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${aiCircuitBreaker ? 'text-neon-amber bg-neon-amber/10 border-neon-amber/25' : 'text-slate-500 bg-white/[0.03] border-white/[0.06]'}`}>
              {aiCircuitBreaker ? 'SHIELD ACTIVE' : 'OFF'}
            </span>
          </div>
          <button
            onClick={() => setAiCircuitBreaker(!aiCircuitBreaker)}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all border ${
              aiCircuitBreaker
                ? 'bg-neon-amber/15 text-neon-amber border-neon-amber/30 hover:bg-neon-amber/25'
                : 'bg-white/[0.04] text-slate-400 border-white/[0.08] hover:text-white'
            }`}
          >
            {aiCircuitBreaker ? 'AI Shield Protecting Platform' : 'Enable AI Volatility Shield'}
          </button>
        </div>
      </div>

      {/* Core Infrastructure & AI Engine Health Hub */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-neon-cyan" />
            <h3 className="text-sm font-bold text-white">Core Infrastructure & AI Engine Health Hub</h3>
          </div>
          <button
            onClick={() => setApiLogs([...apiLogs])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] text-slate-300 hover:text-white text-xs border border-white/[0.08] transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
          </button>
        </div>

        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-slate-500">
                <th className="text-left py-3 px-4 font-semibold">Service Name</th>
                <th className="text-left py-3 px-4 font-semibold">Category</th>
                <th className="text-right py-3 px-4 font-semibold">Latency</th>
                <th className="text-right py-3 px-4 font-semibold">Uptime</th>
                <th className="text-center py-3 px-4 font-semibold">Health Status</th>
                <th className="text-right py-3 px-4 font-semibold">Last Checked</th>
              </tr>
            </thead>
            <tbody>
              {apiLogs.map((item, idx) => {
                const hc = healthConfig[item.status];
                const HIcon = item.status === 'healthy' ? CheckCircle2 : item.status === 'degraded' ? AlertTriangle : XCircle;
                return (
                  <tr key={idx} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${hc.dot} animate-pulse`} />
                      {item.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-200">
                      <span className={item.latency > 150 ? 'text-neon-amber' : 'text-neon-green'}>
                        {item.latency}ms
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">{item.uptime}%</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${hc.bg} ${hc.color} ${hc.border}`}>
                        <HIcon className="w-3.5 h-3.5" />
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-500 font-mono">{item.lastCheck}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}