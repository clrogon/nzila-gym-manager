import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TRANSLATIONS, Language } from './constants';

interface LandingPricingProps {
  lang: Language;
}

export default function LandingPricing({ lang }: LandingPricingProps) {
  const t = TRANSLATIONS[lang].pricing;
  
  const commonFeatures = [
    lang === 'pt' ? 'Membros Activos' : 'Active Members',
    lang === 'pt' ? 'Pagamentos Digitais' : 'Digital Payments',
    lang === 'pt' ? 'Controlo de Hardware' : 'Hardware Control',
    lang === 'pt' ? 'Dashboard BI' : 'BI Dashboard',
    lang === 'pt' ? 'Suporte Prioritário' : 'Priority Support'
  ];

  return (
    <section id="pricing" className="py-32 bg-black relative">
      <div className="absolute inset-0 bg-brand-gold/[0.01] pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-24">
          <h2 className="text-5xl md:text-7xl font-thin tracking-tighter text-white">{t.title}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {t.plans.map((plan, index) => {
            const isPopular = index === 1;
            return (
              <div key={index} className={`relative group h-full ${isPopular ? 'z-10' : 'z-0'}`}>
                {isPopular && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-brand-gold to-orange-600 rounded-[3rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                )}
                <div className={`relative h-full glass rounded-[3rem] p-12 flex flex-col transition-all duration-500 ${isPopular ? 'border-brand-gold/40' : 'hover:border-white/20'}`}>
                  {isPopular && (
                    <div className="text-[9px] tracking-[0.4em] font-black text-brand-gold uppercase mb-8">{t.popular}</div>
                  )}
                  
                  <h4 className="text-2xl font-light mb-6 tracking-tight text-white">{plan.name}</h4>
                  <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-5xl font-black text-white">{plan.price}</span>
                    <span className="text-gray-500 text-sm font-light uppercase tracking-widest">{plan.period}</span>
                  </div>
                  <p className="text-gray-500 text-sm font-light mb-10 leading-relaxed min-h-[60px]">
                    {plan.desc}
                  </p>

                  <div className="flex-grow mb-12">
                    <ul className="space-y-6">
                      {commonFeatures.map((feat, i) => (
                        <li key={i} className="flex items-start gap-4">
                          <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isPopular ? 'text-brand-gold' : 'text-gray-600'}`} />
                          <span className="text-sm text-gray-400 font-light">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    className={`w-full rounded-full py-6 text-[11px] tracking-[0.15em] font-bold uppercase ${
                      isPopular 
                        ? 'bg-brand-gold text-black hover:bg-brand-gold/90 shadow-2xl shadow-brand-gold/20' 
                        : 'bg-transparent border border-white/20 text-white hover:bg-white/5'
                    }`}
                    onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
