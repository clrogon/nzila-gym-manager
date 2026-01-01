import { useState, FormEvent } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TRANSLATIONS, Language } from './constants';

interface LandingDemoFormProps {
  lang: Language;
}

export default function LandingDemoForm({ lang }: LandingDemoFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const t = TRANSLATIONS[lang].form;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="demo" className="py-32 px-8 bg-brand-dark">
      <div className="max-w-4xl mx-auto">
        <div className="glass p-16 md:p-24 rounded-[4rem] relative overflow-hidden border-brand-gold/10">
          {submitted ? (
            <div className="py-12 text-center" role="alert">
              <CheckCircle className="w-20 h-20 text-brand-gold mx-auto mb-10" strokeWidth={1} />
              <h3 className="text-5xl font-thin mb-4 text-white">{t.success}</h3>
              <p className="text-gray-500 text-lg">{t.successDesc}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-10">
              <h2 className="text-5xl md:text-6xl font-thin mb-12 text-center text-white">{t.title}</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black tracking-[0.4em] uppercase text-gray-500">{t.gymLabel}</label>
                  <input 
                    required 
                    className="w-full glass bg-white/5 border-white/5 px-8 py-6 rounded-2xl focus:border-brand-gold/50 outline-none font-light text-white placeholder:text-gray-600" 
                    placeholder="e.g. Luanda Elite Fit" 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black tracking-[0.4em] uppercase text-gray-500">{t.nameLabel}</label>
                  <input 
                    required 
                    className="w-full glass bg-white/5 border-white/5 px-8 py-6 rounded-2xl focus:border-brand-gold/50 outline-none font-light text-white placeholder:text-gray-600" 
                    placeholder="Responsável" 
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black tracking-[0.4em] uppercase text-gray-500">{t.emailLabel}</label>
                  <input 
                    required 
                    type="email" 
                    className="w-full glass bg-white/5 border-white/5 px-8 py-6 rounded-2xl focus:border-brand-gold/50 outline-none font-light text-white placeholder:text-gray-600" 
                    placeholder="email@gym.ao" 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black tracking-[0.4em] uppercase text-gray-500">{t.phoneLabel}</label>
                  <input 
                    required 
                    type="tel" 
                    className="w-full glass bg-white/5 border-white/5 px-8 py-6 rounded-2xl focus:border-brand-gold/50 outline-none font-light text-white placeholder:text-gray-600" 
                    placeholder="+244..." 
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full py-7 bg-brand-gold text-black font-black tracking-[0.4em] rounded-2xl shadow-3xl shadow-brand-gold/10 hover:scale-[1.01] transition-all uppercase"
              >
                {t.cta}
              </Button>
              <p className="text-[9px] tracking-[0.4em] text-gray-700 uppercase font-bold text-center">{t.confidential}</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
