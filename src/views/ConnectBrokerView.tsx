import { useEffect, useState } from 'react';
import { Plug, Check, Zap, Loader2, Trash2, KeyRound } from 'lucide-react';
import { supabase, type BrokerKey } from '@/lib/supabase';

const brokerCatalog = [
  { name: 'Binance', logo: 'BIN', desc: 'World\'s largest crypto exchange with deep INR pairs', features: ['Spot & Futures', 'Low fees', 'High liquidity', 'P2P INR support'] },
  { name: 'CoinDCX', logo: 'CDX', desc: 'India\'s most popular crypto investment app', features: ['INR deposits via UPI', '200+ coins', 'Simple & Pro mode', 'FIU-IND registered'] },
  { name: 'Delta Exchange', logo: 'DLT', desc: 'Leading crypto derivatives exchange for India', features: ['Up to 100x leverage', 'Options trading', 'Low fees', 'INR deposits'] },
  { name: 'WazirX', logo: 'WRX', desc: 'India\'s fast-growing crypto exchange', features: ['Fast INR deposits', 'WRX token', 'Spot trading', 'Binance-backed'] },
  { name: 'Pi42', logo: 'P42', desc: 'India-first crypto futures exchange', features: ['INR-settled futures', 'No conversion needed', 'Low trading fees', 'Seamless UPI'] },
];

export default function ConnectBrokerView() {
  const [connected, setConnected] = useState<BrokerKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalBroker, setModalBroker] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase
      .from('broker_keys')
      .select('id, user_id, exchange_name, api_key, is_connected, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!mounted) return;
        setConnected((data as BrokerKey[]) ?? []);
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const handleConnect = async () => {
    if (!modalBroker || !apiKey.trim() || !apiSecret.trim()) return;
    setSaving(true);
    setError(null);

    const { data: existing } = await supabase
      .from('broker_keys')
      .select('id')
      .eq('exchange_name', modalBroker)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('broker_keys')
        .update({ api_key: apiKey, api_secret: apiSecret, is_connected: true })
        .eq('id', existing.id);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase
        .from('broker_keys')
        .insert({ exchange_name: modalBroker, api_key: apiKey, api_secret: apiSecret, is_connected: true });
      if (error) { setError(error.message); setSaving(false); return; }
    }

    const { data } = await supabase.from('broker_keys').select('id, user_id, exchange_name, api_key, is_connected, created_at').order('created_at', { ascending: false });
    setConnected((data as BrokerKey[]) ?? []);
    setSaving(false);
    setModalBroker(null);
    setApiKey('');
    setApiSecret('');
  };

  const handleDisconnect = async (id: string) => {
    await supabase.from('broker_keys').delete().eq('id', id);
    setConnected(prev => prev.filter(b => b.id !== id));
  };

  const isConnected = (name: string) => connected.find(b => b.exchange_name === name && b.is_connected);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-neon-cyan animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Plug className="w-5 h-5 text-neon-cyan" />
          Connect Your Broker
        </h2>
        <p className="text-sm text-slate-400">Link your exchange accounts to enable automated trading</p>
      </div>

      {/* API Security Notice */}
      <div className="glass-card p-4 border-neon-amber/20 flex items-start gap-3">
        <Zap className="w-5 h-5 text-neon-amber flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-white">API Security Notice</p>
          <p className="text-xs text-slate-400 mt-1">
            Cortex AI stores your API keys securely. We never request withdrawal permissions. Only enable "Read" and "Trade" permissions when creating your API key.
          </p>
        </div>
      </div>

      {/* Broker grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {brokerCatalog.map((b) => {
          const conn = isConnected(b.name);
          return (
            <div key={b.name} className="glass-card p-5 hover:border-white/[0.12] transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-[10px] font-bold text-slate-300">
                    {b.logo}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{b.name}</h3>
                    <p className="text-[10px] text-slate-500">{b.desc}</p>
                  </div>
                </div>
                {conn && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-neon-green/10 text-neon-green text-[10px] font-bold border border-neon-green/20">
                    <Check className="w-3 h-3" /> Connected
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {b.features.map((f) => (
                  <span key={f} className="px-2 py-1 rounded-md bg-white/[0.04] text-[10px] text-slate-400">{f}</span>
                ))}
              </div>

              {conn ? (
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-neon-green/10 text-neon-green border border-neon-green/30">
                    <Check className="w-4 h-4" /> Active
                  </div>
                  <button
                    onClick={() => handleDisconnect(conn.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold bg-neon-red/10 text-neon-red border border-neon-red/30 hover:bg-neon-red/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setModalBroker(b.name); setError(null); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold btn-neon-cyan hover:scale-[1.02]"
                >
                  <Plug className="w-4 h-4" /> Connect via API
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* API Key Modal */}
      {modalBroker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-base-900/80 backdrop-blur-md" onClick={() => setModalBroker(null)} />
          <div className="relative w-full max-w-md animate-scale-in">
            <div className="glass-strong neon-glow-cyan p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-neon-cyan" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Connect to {modalBroker}</h2>
                  <p className="text-xs text-slate-400">Enter your API credentials</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-semibold">API Key</label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Your exchange API key"
                    className="w-full px-4 py-2.5 rounded-xl glass text-sm text-white font-mono focus:outline-none focus:border-neon-cyan/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-semibold">API Secret</label>
                  <input
                    type="password"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="Your exchange API secret"
                    className="w-full px-4 py-2.5 rounded-xl glass text-sm text-white font-mono focus:outline-none focus:border-neon-cyan/40 transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-xs text-neon-red">{error}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setModalBroker(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl glass hover:bg-white/[0.07] text-sm text-slate-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConnect}
                    disabled={!apiKey.trim() || !apiSecret.trim() || saving}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      apiKey.trim() && apiSecret.trim() && !saving
                        ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40 hover:neon-glow-cyan'
                        : 'bg-white/[0.03] text-slate-500 border border-white/[0.06] cursor-not-allowed'
                    }`}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Connect'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
