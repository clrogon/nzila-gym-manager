import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { TRANSLATIONS, Language } from './constants';

interface LandingFAQProps {
  lang: Language;
}

export default function LandingFAQ({ lang }: LandingFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const t = TRANSLATIONS[lang].faq;

  return (
    <section id="faq" className="py-32 bg-black border-t border-white/5">
      <div className="max-w-3xl mx-auto px-8">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-thin tracking-tight mb-4 text-white">{t.title}</h2>
          <p className="text-gray-500 font-light">{t.desc}</p>
        </div>

        <div className="space-y-4">
          {t.items.map((faq, index) => (
            <div 
              key={index} 
              className="glass rounded-[2rem] overflow-hidden border border-white/5 transition-all duration-500"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-8 py-7 flex items-center justify-between text-left focus:outline-none hover:bg-white/5 transition-colors"
              >
                <span className="font-light tracking-wide text-white">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-brand-gold transition-transform duration-500 ${openIndex === index ? 'rotate-180' : ''}`} />
              </button>
              
              <div 
                className={`transition-all duration-500 ease-in-out overflow-hidden ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-8 pb-8 text-gray-500 text-sm font-light leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
