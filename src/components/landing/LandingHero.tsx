import { Link } from 'react-router-dom';
import { ArrowRight, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TRANSLATIONS, Language } from './constants';

interface LandingHeroProps {
  lang: Language;
}

export default function LandingHero({ lang }: LandingHeroProps) {
  const t = TRANSLATIONS[lang].hero;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/10 via-brand-dark/90 to-brand-dark z-10"></div>
      <video 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale scale-105"
        poster="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80"
      >
        <source src="https://assets.mixkit.co/videos/preview/mixkit-athlete-working-out-in-a-gym-741-large.mp4" type="video/mp4" />
      </video>

      <div className="relative z-20 max-w-7xl mx-auto px-8 text-center pt-24">
        <div className="inline-flex items-center space-x-4 mb-10 px-8 py-3 rounded-full border border-brand-gold/30 bg-brand-gold/5 backdrop-blur-2xl">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center bg-white h-6 px-2 rounded-sm shadow-sm space-x-1">
              <CreditCard className="w-3 h-3 text-black" />
              <span className="text-[10px] font-black text-black tracking-tighter">PAY</span>
            </div>
            <div className="h-4 w-px bg-white/20"></div>
            <span className="text-brand-gold text-[10px] font-black tracking-[0.3em] uppercase italic">
              {t.badge}
            </span>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
          </div>
        </div>
        
        <h1 className="text-6xl md:text-9xl font-thin mb-10 tracking-tighter leading-[0.8] text-white">
          {t.title} <br />
          <span className="text-gradient font-light italic">{t.titleAccent}</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-500 mb-16 max-w-3xl mx-auto font-light leading-relaxed">
          {t.desc}
        </p>

        <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
          <Link to="/auth?mode=signup">
            <Button 
              size="lg" 
              className="group bg-brand-gold text-black hover:bg-brand-gold/90 rounded-full px-12 py-5 text-[12px] tracking-[0.15em] font-bold uppercase shadow-2xl shadow-brand-gold/20"
            >
              <span>{t.cta}</span>
              <ArrowRight className="ml-4 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Button 
            size="lg" 
            variant="outline"
            className="rounded-full px-12 py-5 text-[12px] tracking-[0.15em] font-bold uppercase bg-transparent border border-white/20 text-white hover:bg-white/5"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            {t.secondary}
          </Button>
        </div>
      </div>
    </section>
  );
}
