import { Fingerprint, Cpu, Wifi } from 'lucide-react';
import { TRANSLATIONS, Language } from './constants';

interface LandingHardwareProps {
  lang: Language;
}

export default function LandingHardware({ lang }: LandingHardwareProps) {
  const t = TRANSLATIONS[lang].hardware;
  const icons = [Fingerprint, Cpu, Wifi];

  return (
    <section id="hardware" className="py-32 bg-black border-t border-white/5">
      <div className="max-w-7xl mx-auto px-8 flex flex-col lg:flex-row gap-20 items-center">
        <div className="lg:w-1/2">
          <span className="text-brand-gold text-[10px] font-black tracking-[0.5em] uppercase block mb-4">{t.tag}</span>
          <h2 className="text-5xl font-thin mb-8 leading-tight text-white">{t.title}</h2>
          <p className="text-gray-500 mb-12 font-light leading-relaxed">{t.desc}</p>
          <div className="space-y-10">
            {icons.map((Icon, i) => (
              <div key={i} className="flex items-center space-x-6 group">
                <div className="w-14 h-14 glass flex items-center justify-center text-brand-gold rounded-2xl group-hover:bg-brand-gold group-hover:text-black transition-all duration-500">
                  <Icon className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-xl font-medium text-white">{t.items[i].title}</h4>
                  <p className="text-gray-500 text-sm font-light">{t.items[i].desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:w-1/2 relative">
          <div className="absolute -inset-10 bg-brand-gold/5 blur-[120px] rounded-full"></div>
          <div className="relative glass p-2 rounded-[3rem] overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800" 
              className="rounded-[2.8rem] w-full h-[600px] object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-1000"
              alt="Scan Biométrico de Rosto"
            />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-brand-gold/30 rounded-3xl animate-pulse">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brand-gold"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-brand-gold"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-brand-gold"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brand-gold"></div>
              <div className="absolute top-1/2 w-full h-px bg-brand-gold/50 shadow-[0_0_15px_rgba(251,191,36,0.8)]"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
