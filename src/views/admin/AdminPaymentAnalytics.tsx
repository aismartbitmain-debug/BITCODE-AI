import { useEffect, useState } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, DollarSign, Users, CreditCard,
  Loader2, CheckCircle, AlertCircle, Clock, XCircle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAdminCurrency } from '@/context/AdminCurrencyContext';
import { supabase, type Transaction } from '@/lib/supabase';
import { revenueData, mockTransactions } from '@/data/adminMockData';

const statusConfig = {
  completed: { icon: CheckCircle, color: 'text-neon-green', bg: 'bg-neon-green/10', border: 'border-neon-green/20' },
  pending: { icon: Clock, color: 'text-neon-amber', bg: 'bg-neon-amber/10', border: 'border-neon-amber/20' },
  failed: { icon: XCircle, color: 'text-neon-red', bg: 'bg-neon-red/10', border: 'border-neon-red/20' },
  refunded: { icon: AlertCircle, color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/20' },
};

const planConfig: Record<string, { color: string; bg: string }> = {
  Starter: { color: 'text-neon-cyan', bg: 'bg-neon-cyan/10' },
  Pro: { color: 'text-neon-green', bg: 'bg-neon-green/10' },
  Enterprise: { color: 'text-neon-amber', bg: 'bg-neon-amber/10' },
};

function CustomTooltip({ active, payload, label, symbol }: { active?: boolean; payload?: { value: number }[]; label?: string; symbol: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-3 py-2 text-xs border border-white/[0.08]">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-neon-green font-bold font-mono">{symbol}{payload[0].value.toLocaleString()}</p>
    </div>
  );
}

export default function AdminPaymentAnalytics() {
  const { formatCurrency, formatCompact, symbol, currency } = useAdminCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.from('transactions').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (!mounted) return;
      setTransactions((data as Transaction[]) ?? []);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const displayTransactions = transactions.length > 0 ? transactions : mockTransactions.map(t => ({
    id: t.id,
    client_name: t.clientName,
    client_email: t.clientEmail,
    plan_name: t.plan,
    amount: t.amount,
    currency: 'USD',
    status: t.status,
    payment_method: t.paymentMethod,
    created_at: new Date(t.date).toISOString(),
  }));

  const totalRevenue = displayTransactions
    .filter(t => t.status === 'completed')
    .reduce((s, t) => s + Number(t.amount), 0);
  const completedCount = displayTransactions.filter(t => t.status === 'completed').length;
  const pendingCount = displayTransactions.filter(t => t.status === 'pending').length;

  const currentMrr = revenueData[revenueData.length - 1].mrr;
  const prevMrr = revenueData[revenueData.length - 2].mrr;
  const mrrGrowth = ((currentMrr - prevMrr) / prevMrr) * 100;

  const chartData = revenueData.map(d => ({
    month: d.month,
    revenue: currency === 'INR' ? d.revenue * 83 : d.revenue,
    mrr: currency === 'INR' ? d.mrr * 83 : d.mrr,
  }));

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-neon-cyan animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Wallet className="w-5 h-5 text-neon-green" /> Payment Analytics & Revenue
        </h2>
        <p className="text-sm text-slate-400">Track platform revenue, subscriptions, and transaction history</p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card p-4 relative overflow-hidden group hover:border-white/[0.12] transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-neon-green/10 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Total Revenue</span>
              <DollarSign className="w-4 h-4 text-neon-green" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-neon-green font-mono">{formatCurrency(totalRevenue)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">All-time completed</p>
          </div>
        </div>

        <div className="glass-card p-4 relative overflow-hidden group hover:border-white/[0.12] transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-neon-cyan/10 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">MRR</span>
              <TrendingUp className="w-4 h-4 text-neon-cyan" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-neon-cyan font-mono">{formatCurrency(currentMrr)}</p>
            <p className={`text-[10px] mt-0.5 ${mrrGrowth >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
              {mrrGrowth >= 0 ? '+' : ''}{mrrGrowth.toFixed(1)}% MoM
            </p>
          </div>
        </div>

        <div className="glass-card p-4 relative overflow-hidden group hover:border-white/[0.12] transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-neon-amber/10 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Active Subscriptions</span>
              <Users className="w-4 h-4 text-neon-amber" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-white font-mono">{completedCount}</p>
            <p className="text-[10px] text-neon-amber mt-0.5">{pendingCount} pending</p>
          </div>
        </div>

        <div className="glass-card p-4 relative overflow-hidden group hover:border-white/[0.12] transition-all duration-300">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-neon-red/10 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Avg Revenue/User</span>
              <CreditCard className="w-4 h-4 text-neon-red" />
            </div>
            <p className="text-lg sm:text-xl font-bold text-white font-mono">
              {formatCurrency(completedCount > 0 ? totalRevenue / completedCount : 0)}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">Per active sub</p>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="glass-card p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-neon-green" /> Revenue Trend (Last 6 Months)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Monthly revenue vs MRR comparison</p>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-neon-green" style={{ boxShadow: '0 0 8px rgba(0,255,157,0.6)' }} />
              <span className="text-slate-400">Revenue</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-neon-cyan" style={{ boxShadow: '0 0 8px rgba(0,229,255,0.6)' }} />
              <span className="text-slate-400">MRR</span>
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00ff9d" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#00ff9d" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#00e5ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="month"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCompact(v)}
            />
            <Tooltip content={<CustomTooltip symbol={symbol} />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#00ff9d"
              strokeWidth={2.5}
              fill="url(#revGrad)"
              dot={{ fill: '#00ff9d', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#00ff9d', stroke: '#05060a', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="mrr"
              stroke="#00e5ff"
              strokeWidth={2}
              fill="url(#mrrGrad)"
              dot={{ fill: '#00e5ff', r: 2, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: '#00e5ff', stroke: '#05060a', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Transactions Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-neon-cyan" /> Recent Transactions
          </h3>
          <span className="text-xs text-slate-500">{displayTransactions.length} records</span>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-slate-500">
                <th className="text-left py-3 px-4 font-semibold">Client</th>
                <th className="text-left py-3 px-4 font-semibold hidden sm:table-cell">Plan</th>
                <th className="text-right py-3 px-4 font-semibold">Amount</th>
                <th className="text-left py-3 px-4 font-semibold hidden md:table-cell">Date</th>
                <th className="text-left py-3 px-4 font-semibold hidden lg:table-cell">Method</th>
                <th className="text-center py-3 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayTransactions.map((t) => {
                const sc = statusConfig[t.status as keyof typeof statusConfig] ?? statusConfig.completed;
                const SIcon = sc.icon;
                const pc = planConfig[t.plan_name] ?? planConfig.Starter;
                return (
                  <tr key={t.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-sm font-semibold text-white">{t.client_name}</p>
                      <p className="text-[10px] text-slate-500">{t.client_email}</p>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${pc.bg} ${pc.color}`}>
                        {t.plan_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-200">
                      {formatCurrency(Number(t.amount))}
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-xs text-slate-500 font-mono">
                      {new Date(t.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-xs text-slate-400">
                      {t.payment_method ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${sc.bg} ${sc.color} ${sc.border}`}>
                        <SIcon className="w-3 h-3" />
                        <span className="capitalize">{t.status}</span>
                      </span>
                    </td>
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
