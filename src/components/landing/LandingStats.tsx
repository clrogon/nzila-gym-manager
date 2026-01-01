import { TRANSLATIONS, STATS_ICONS, Language } from './constants';

interface LandingStatsProps {
  lang: Language;
}

export default function LandingStats({ lang }: LandingStatsProps) {
  const stats = TRANSLATIONS[lang].stats;

  return (
    <section className="relative py-32 border-y border-white/5 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1518534249708-e8cb57eb6a22?auto=format&fit=crop&q=80&w=2000" 
          alt="Luanda Skyline Night" 
          className="w-full h-full object-cover grayscale opacity-20 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40"></div>
      </div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {stats.map((stat, index) => {
            const Icon = STATS_ICONS[index];
            return (
              <div key={index} className="group cursor-default">
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-2xl glass text-brand-gold group-hover:bg-brand-gold group-hover:text-black group-hover:scale-110 transition-all duration-500">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter group-hover:text-brand-gold transition-colors duration-500">
                  {stat.value}
                </div>
                <div className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.3em]">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
