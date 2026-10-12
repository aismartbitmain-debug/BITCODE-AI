import { useState, useEffect } from 'react';
import { Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight, Calculator, PieChart, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { supabase, type UserFund } from '@/lib/supabase';

export default function WalletView() {
  const { formatCurrency, currency } = useApp();
  const { user } = useAuth();
  const [funds, setFunds] = useState<UserFund[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('user_funds')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setFunds((data as UserFund[]) ?? []);
        setLoading(false);
      });
  }, [user?.id]);

  const totalBalance = funds.reduce((s, f) => s + f.balance, 0);
  const totalUnrealizedPnl = funds.reduce((s, f) => s + f.unrealized_pnl, 0);
  const totalRealizedPnl = funds.reduce((s, f) => s + f.realized_pnl, 0);
  const totalPnl = totalUnrealizedPnl + totalRealizedPnl;

  // Position size calculator
  const entryPrice = 67000;
  const stopPrice = 65000;
  const riskAmount = 1000;
  const riskPerUnit = entryPrice - stopPrice;
  const positionSize = riskAmount / riskPerUnit;
  const positionValue = positionSize * entryPrice;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-neon-green animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Wallet className="w-5 h-5 text-neon-green" />
          Wallet & Calculation
        </h2>
        <p className="text-sm text-slate-400">Portfolio overview and trading calculators</p>
      </div>

      {/* Portfolio overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Total Portfolio Value</h3>
            <PieChart className="w-4 h-4 text-neon-cyan" />
          </div>
          <p className="text-3xl font-bold text-white font-mono">{formatCurrency(totalBalance)}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-sm font-semibold ${totalPnl >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
              {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
            </span>
            <span className="text-xs text-slate-500">all-time</span>
          </div>

          {/* Allocation bars */}
          {funds.length > 0 ? (
            <div className="mt-5 space-y-3">
              {funds.map((f) => {
                const pct = totalBalance > 0 ? (f.balance / totalBalance) * 100 : 0;
                return (
                  <div key={f.id}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300 font-semibold">{f.exchange_name}</span>
                      <span className="text-slate-400 font-mono">{formatCurrency(f.balance)} · {pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-base-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-neon-cyan/60 to-neon-green/60 transition-all duration-1000"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 text-center py-8">
              <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm text-slate-500">No connected exchange funds yet.</p>
              <p className="text-xs text-slate-600 mt-1">Connect a broker to see your portfolio here.</p>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Available Balance</span>
              <Wallet className="w-4 h-4 text-neon-green" />
            </div>
            <p className="text-xl font-bold text-white font-mono">{formatCurrency(totalBalance)}</p>
            <p className="text-[10px] text-neon-green mt-0.5">{funds.length} exchange{funds.length !== 1 ? 's' : ''} connected</p>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Total P&L</span>
              <TrendingUp className={`w-4 h-4 ${totalPnl >= 0 ? 'text-neon-green' : 'text-neon-red'}`} />
            </div>
            <p className={`text-xl font-bold font-mono ${totalPnl >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
              {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Unrealized: {formatCurrency(totalUnrealizedPnl)} · Realized: {formatCurrency(totalRealizedPnl)}
            </p>
          </div>
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <ArrowDownLeft className="w-4 h-4 text-neon-green" />
              <span className="text-xs text-slate-400">Deposit</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <ArrowUpRight className="w-4 h-4 text-neon-red" />
              <span className="text-xs text-slate-400">Withdraw</span>
            </div>
          </div>
        </div>
      </div>

      {/* Position Size Calculator */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-neon-amber" />
          Position Size Calculator
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <CalcInput label="Entry Price" value={`$${entryPrice.toLocaleString()}`} />
          <CalcInput label="Stop Loss Price" value={`$${stopPrice.toLocaleString()}`} />
          <CalcInput label={`Risk Amount (${currency})`} value={formatCurrency(riskAmount)} />
          <CalcInput label="Risk Per Unit" value={`$${riskPerUnit.toLocaleString()}`} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/15">
            <p className="text-[10px] text-slate-500 uppercase mb-1">Position Size</p>
            <p className="text-lg font-bold text-neon-cyan font-mono">{positionSize.toFixed(6)} units</p>
          </div>
          <div className="p-4 rounded-xl bg-neon-green/5 border border-neon-green/15">
            <p className="text-[10px] text-slate-500 uppercase mb-1">Position Value</p>
            <p className="text-lg font-bold text-neon-green font-mono">{formatCurrency(positionValue)}</p>
          </div>
        </div>
      </div>

      {/* Funds table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-white">Exchange Funds</h3>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04] text-[10px] uppercase tracking-wider text-slate-500">
                <th className="text-left py-2.5 px-5 font-semibold">Exchange</th>
                <th className="text-right py-2.5 px-5 font-semibold">Balance</th>
                <th className="text-right py-2.5 px-5 font-semibold">Unrealized P&L</th>
                <th className="text-right py-2.5 px-5 font-semibold hidden sm:table-cell">Realized P&L</th>
                <th className="text-center py-2.5 px-5 font-semibold hidden sm:table-cell">Manual Trading</th>
              </tr>
            </thead>
            <tbody>
              {funds.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm">No exchange funds connected.</p>
                  </td>
                </tr>
              ) : funds.map((f) => (
                <tr key={f.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-5 font-semibold text-white">{f.exchange_name}</td>
                  <td className="py-3 px-5 text-right font-mono text-slate-200">{formatCurrency(f.balance)}</td>
                  <td className={`py-3 px-5 text-right font-mono ${f.unrealized_pnl >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                    {f.unrealized_pnl >= 0 ? '+' : ''}{formatCurrency(f.unrealized_pnl)}
                  </td>
                  <td className={`py-3 px-5 text-right font-mono hidden sm:table-cell ${f.realized_pnl >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                    {f.realized_pnl >= 0 ? '+' : ''}{formatCurrency(f.realized_pnl)}
                  </td>
                  <td className="py-3 px-5 text-center hidden sm:table-cell">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${f.manual_trading_enabled ? 'bg-neon-green/10 text-neon-green border border-neon-green/25' : 'bg-white/[0.03] text-slate-500 border border-white/[0.06]'}`}>
                      {f.manual_trading_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CalcInput({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl glass">
      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-bold text-white font-mono">{value}</p>
    </div>
  );
}
