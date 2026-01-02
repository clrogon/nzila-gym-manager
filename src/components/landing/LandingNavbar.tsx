import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TRANSLATIONS, Language } from './constants';

interface LandingNavbarProps {
  lang: Language;
  setLang: (l: Language) => void;
}

export default function LandingNavbar({ lang, setLang }: LandingNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const t = TRANSLATIONS[lang].nav;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full z-[100] transition-all duration-700 ${isScrolled ? 'bg-black/90 backdrop-blur-3xl border-b border-white/5 py-4' : 'bg-transparent py-10'}`}>
      <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
        <div 
          className="flex items-center space-x-4 group cursor-pointer" 
          onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-brand-gold blur-xl opacity-20 group-hover:opacity-60 transition-opacity"></div>
            <Dumbbell className="relative w-8 h-8 text-brand-gold" />
          </div>
          <span className="text-2xl font-extralight tracking-[0.5em] hidden sm:block text-white">NZILA</span>
        </div>

        <div className="hidden lg:flex items-center space-x-12">
          <a href="#features" className="text-[11px] tracking-[0.25em] font-medium text-gray-400 hover:text-white transition-all uppercase">{t.features}</a>
          <a href="#hardware" className="text-[11px] tracking-[0.25em] font-medium text-gray-400 hover:text-white transition-all uppercase">{t.hardware}</a>
          <a href="#pricing" className="text-[11px] tracking-[0.25em] font-medium text-gray-400 hover:text-white transition-all uppercase">{t.pricing}</a>
          
          <div className="flex items-center space-x-2 border-l border-white/10 pl-10">
            <Globe className="w-3.5 h-3.5 text-brand-gold" />
            <button 
              onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
              className="text-[11px] tracking-[0.15em] font-medium text-white hover:text-brand-gold transition-colors uppercase"
            >
              {lang === 'pt' ? 'EN' : 'PT'}
            </button>
          </div>

          <Link to="/auth?mode=login">
            <Button className="bg-brand-gold text-black hover:bg-brand-gold/90 rounded-full px-6 py-2.5 text-[11px] tracking-[0.15em] font-bold uppercase shadow-lg shadow-brand-gold/20">
              {t.access}
            </Button>
          </Link>
        </div>
        
        <div className="lg:hidden flex items-center space-x-4">
          <button onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')} className="text-[10px] font-black text-white">{lang === 'pt' ? 'EN' : 'PT'}</button>
          <Link to="/auth?mode=login">
            <Button className="bg-brand-gold text-black hover:bg-brand-gold/90 rounded-full px-4 py-2 text-[10px] font-bold">
              GO
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
