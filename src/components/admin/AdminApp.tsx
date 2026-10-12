import { useEffect, useState } from 'react';
import { Menu, X, Loader2, ShieldX } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase, type RiskSettings } from '@/lib/supabase';
import { AdminCurrencyProvider } from '@/context/AdminCurrencyContext';
import AuthScreen from '@/components/AuthScreen';
import AdminSidebar, { type AdminViewId } from '@/components/admin/AdminSidebar';
import AdminTopNav from '@/components/admin/AdminTopNav';
import AdminDashboard from '@/views/admin/AdminDashboard';
import AdminBots from '@/views/admin/AdminBots';
import AdminClients from '@/views/admin/AdminClients';
import AdminLicenses from '@/views/admin/AdminLicenses';
import AdminAdmins from '@/views/admin/AdminAdmins';
import AdminRiskControl from '@/views/admin/AdminRiskControl';
import AdminSystemSettings from '@/views/admin/AdminSystemSettings';
import AdminPaymentAnalytics from '@/views/admin/AdminPaymentAnalytics';
import AdminApiControl from '@/views/admin/AdminApiControl';

const viewTitles: Record<AdminViewId, string> = {
  'dashboard': 'Dashboard',
  'bots': 'AI Smart Bots',
  'clients': 'Clients',
  'licenses': 'Licenses',
  'admins': 'Admins',
  'risk-control': 'Risk Control',
  'system-settings': 'System Settings',
  'payment-analytics': 'Payment & Revenue',
  'api-control': 'Master API Control',
};

export default function AdminApp() {
  const { session, loading } = useAuth();
  const [activeView, setActiveView] = useState<AdminViewId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [riskSettings, setRiskSettings] = useState<RiskSettings | null>(null);
  const [riskLoading, setRiskLoading] = useState(true);
  const [adminChecked, setAdminChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      supabase.from('risk_settings').select('*').limit(1).maybeSingle(),
      supabase.rpc('is_platform_admin').maybeSingle(),
    ]).then(([riskRes, adminRes]) => {
      setRiskSettings(riskRes.data as RiskSettings | null);
      setRiskLoading(false);
      setIsAdmin(!!(adminRes.data as boolean | null));
      setAdminChecked(true);
    });
  }, [session]);

  const toggleKillSwitch = async () => {
    if (!riskSettings) return;
    const newVal = !riskSettings.global_kill_switch;
    setRiskSettings({ ...riskSettings, global_kill_switch: newVal });
    await supabase
      .from('risk_settings')
      .update({ global_kill_switch: newVal, updated_at: new Date().toISOString() })
      .eq('id', riskSettings.id);
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <AdminDashboard />;
      case 'bots': return <AdminBots />;
      case 'clients': return <AdminClients />;
      case 'licenses': return <AdminLicenses />;
      case 'admins': return <AdminAdmins />;
      case 'risk-control': return <AdminRiskControl />;
      case 'system-settings': return <AdminSystemSettings />;
      case 'payment-analytics': return <AdminPaymentAnalytics />;
      case 'api-control': return <AdminApiControl />;
      default: return <AdminDashboard />;
    }
  };

  if (loading || riskLoading || !adminChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-neon-amber animate-spin" />
          <p className="text-sm text-slate-400">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (adminChecked && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-neon-red/10 border border-neon-red/30 flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-neon-red" />
          </div>
          <h1 className="text-xl font-bold text-white">Access Denied</h1>
          <p className="text-sm text-slate-400">
            You do not have permission to access the Master Admin Panel.
            This area is restricted to authorized administrators only.
          </p>
          <button
            onClick={() => { window.location.hash = ''; window.location.reload(); }}
            className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-sm text-slate-200 border border-white/[0.08] transition-all"
          >
            Back to Cortex AI
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminCurrencyProvider>
    <div className="min-h-screen flex flex-col">
      <AdminTopNav
        killSwitchActive={riskSettings?.global_kill_switch ?? false}
        onToggleKill={toggleKillSwitch}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-white/[0.06] bg-base-850/50 backdrop-blur-sm">
          <AdminSidebar active={activeView} onSelect={setActiveView} />
        </aside>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-[90] flex">
            <div className="absolute inset-0 bg-base-900/70 backdrop-blur-md" onClick={() => setSidebarOpen(false)} />
            <div className="relative w-64 h-full bg-base-850 border-r border-white/[0.06] animate-slide-up">
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-3 right-3 z-10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <AdminSidebar active={activeView} onSelect={setActiveView} onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-base-850/50 backdrop-blur-sm sticky top-0 z-30">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
              Menu
            </button>
            <span className="text-sm font-semibold text-white">{viewTitles[activeView]}</span>
          </div>

          <div className="p-4 sm:p-6 max-w-7xl mx-auto">
            {/* Desktop breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 mb-5 text-xs">
              <span className="text-neon-amber/70">Cortex Admin</span>
              <span className="text-slate-700">/</span>
              <span className="text-neon-amber font-semibold">{viewTitles[activeView]}</span>
            </div>
            {renderView()}
          </div>
        </main>
      </div>
    </div>
    </AdminCurrencyProvider>
  );
}
