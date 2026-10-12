import { BookOpen, Play, Clock, ChevronRight } from 'lucide-react';

const tutorials = [
  { title: 'Getting Started with Cortex AI', duration: '5 min', level: 'Beginner', desc: 'Learn the basics of navigating the dashboard and understanding AI signals.' },
  { title: 'Deploying Your First AI Strategy', duration: '8 min', level: 'Beginner', desc: 'Step-by-step guide to deploying automatic strategies on autopilot.' },
  { title: 'Building a Custom Trading Bot', duration: '12 min', level: 'Intermediate', desc: 'Create a custom bot with your own risk/reward parameters and strategy core.' },
  { title: 'Understanding AI Market Sentiment', duration: '7 min', level: 'Intermediate', desc: 'Deep dive into how Cortex Neural Engine analyzes 1,200+ data sources.' },
  { title: 'Advanced Grid Trading Techniques', duration: '15 min', level: 'Advanced', desc: 'Master grid trading in sideways markets with dynamic interval optimization.' },
  { title: 'Risk Management & Position Sizing', duration: '10 min', level: 'Intermediate', desc: 'Learn proper position sizing and risk/reward ratio calculation.' },
  { title: 'Connecting Multiple Brokers', duration: '6 min', level: 'Beginner', desc: 'Link exchange accounts and manage API keys securely.' },
  { title: 'Futures Trading with Leverage', duration: '14 min', level: 'Advanced', desc: 'Understand leverage up to 100x and liquidation risk management.' },
];

const levelColors = {
  Beginner: 'text-neon-green bg-neon-green/10 border-neon-green/20',
  Intermediate: 'text-neon-amber bg-neon-amber/10 border-neon-amber/20',
  Advanced: 'text-neon-red bg-neon-red/10 border-neon-red/20',
};

export default function TutorialsView() {
  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-neon-cyan" />
          Tutorials & Guides
        </h2>
        <p className="text-sm text-slate-400">Learn to master Cortex AI with our video and written guides</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tutorials.map((t, i) => (
          <div key={i} className="glass-card p-5 group hover:border-white/[0.12] transition-all duration-300 cursor-pointer">
            {/* Thumbnail */}
            <div className="relative h-32 rounded-xl bg-gradient-to-br from-neon-cyan/10 to-neon-green/5 border border-white/[0.06] flex items-center justify-center mb-4 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-base-700/50 to-transparent" />
              <div className="relative w-12 h-12 rounded-full bg-white/[0.08] border border-white/[0.1] flex items-center justify-center group-hover:bg-neon-cyan/20 group-hover:border-neon-cyan/40 transition-all duration-300">
                <Play className="w-5 h-5 text-white group-hover:text-neon-cyan ml-0.5" fill="currentColor" />
              </div>
              <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md bg-base-900/60 text-[10px] text-slate-300">
                <Clock className="w-3 h-3" /> {t.duration}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${levelColors[t.level as keyof typeof levelColors]}`}>
                {t.level}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-1 group-hover:text-neon-cyan transition-colors">{t.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">{t.desc}</p>
            <div className="flex items-center gap-1 text-xs text-neon-cyan font-semibold">
              Watch now <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
