import { ShieldCheck, Activity, Server, LogOut, User, Bell, DollarSign, IndianRupee, ArrowLeftRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAdminCurrency } from '@/context/AdminCurrencyContext';

interface Props {
  killSwitchActive: boolean;
  onToggleKill: () => void;
}

export default function AdminTopNav({ killSwitchActive, onToggleKill }: Props) {
  const { user, signOut } = useAuth();
  const { currency, toggleCurrency, symbol } = useAdminCurrency();
  const emailPrefix = user?.email?.split('@')[0] ?? 'admin';

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-base-900/70 backdrop-blur-2xl">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-neon-amber/20 to-neon-red/20 border border-neon-amber/30 flex items-center justify-center" style={{ boxShadow: '0 0 15px rgba(255, 176, 32, 0.15)' }}>
            <ShieldCheck className="w-5 h-5 text-neon-amber" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold tracking-tight">
              <span className="text-neon-amber" style={{ textShadow: '0 0 10px rgba(255, 176, 32, 0.5)' }}>Cortex</span>{' '}
              <span className="text-white">Admin</span>
            </h1>
            <p className="text-[10px] text-slate-500 -mt-0.5">Master Control Panel</p>
          </div>
        </div>

        {/* Status indicators - hidden on small screens */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green" />
            </span>
            <span className="text-xs text-slate-300 font-semibold">System Online</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass">
            <Server className="w-4 h-4 text-neon-cyan" />
            <span className="text-xs text-slate-300 font-semibold">5 APIs</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass">
            <Activity className="w-4 h-4 text-neon-green" />
            <span className="text-xs text-slate-300 font-semibold">654 Users</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Glowing Currency Toggle Switch */}
          <button
            onClick={toggleCurrency}
            className="flex items-center gap-2 px-3 py-2 rounded-xl glass hover:bg-white/[0.06] transition-all duration-300 group"
            title={`Switch to ${currency === 'USD' ? 'INR' : 'USD'}`}
          >
            <div className="relative flex items-center gap-1.5">
              <DollarSign className={`w-4 h-4 transition-all ${currency === 'USD' ? 'text-neon-green scale-110' : 'text-slate-600'}`} style={currency === 'USD' ? { filter: 'drop-shadow(0 0 4px rgba(0,255,157,0.8))' } : {}} />
              <ArrowLeftRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 transition-colors" />
              <IndianRupee className={`w-4 h-4 transition-all ${currency === 'INR' ? 'text-neon-green scale-110' : 'text-slate-600'}`} style={currency === 'INR' ? { filter: 'drop-shadow(0 0 4px rgba(0,255,157,0.8))' } : {}} />
            </div>
            <span className="text-xs font-bold text-neon-amber" style={{ textShadow: '0 0 8px rgba(255,176,32,0.5)' }}>
              {currency === 'USD' ? symbol + 'USD' : symbol + 'INR'}
            </span>
          </button>

          {/* Kill Switch */}
          <button
            onClick={onToggleKill}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 active:scale-95 ${
              killSwitchActive
                ? 'bg-neon-red/25 border border-neon-red/50 text-neon-red neon-glow-red'
                : 'bg-neon-red/10 border border-neon-red/30 text-neon-red/70 hover:bg-neon-red/20'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">KILL SWITCH</span>
          </button>

          {/* Notifications */}
          <button className="relative flex items-center px-3 py-2 rounded-xl glass hover:bg-white/[0.06] transition-all">
            <Bell className="w-4 h-4 text-slate-300" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-neon-red" />
          </button>

          {/* User + Sign Out */}
          <div className="flex items-center gap-2">
            <div className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl glass">
              <User className="w-4 h-4 text-neon-amber" />
              <span className="text-xs text-slate-300 max-w-[100px] truncate">{emailPrefix}</span>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl glass hover:bg-neon-red/15 hover:border-neon-red/30 transition-all duration-200"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
