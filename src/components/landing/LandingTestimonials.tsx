import { Award } from 'lucide-react';
import { TRANSLATIONS, Language } from './constants';

interface LandingTestimonialsProps {
  lang: Language;
}

export default function LandingTestimonials({ lang }: LandingTestimonialsProps) {
  const t = TRANSLATIONS[lang].testimonials;

  return (
    <section id="testimonials" className="py-32 bg-brand-dark">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-24">
          <h2 className="text-5xl md:text-7xl font-thin tracking-tighter text-white">{t.title}</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {t.items.map((testimonial, index) => (
            <div key={index} className="glass p-12 rounded-[2.5rem] border-white/5 relative group hover:border-brand-gold/20 transition-all duration-500">
              <div className="absolute top-10 right-10 text-brand-gold/10 group-hover:text-brand-gold/20 transition-colors">
                <Award className="w-12 h-12" />
              </div>
              
              <p className="text-gray-400 font-light italic mb-10 text-lg leading-relaxed relative z-10">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center gap-6">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="w-14 h-14 rounded-full object-cover grayscale border border-brand-gold/20"
                />
                <div>
                  <p className="font-bold tracking-widest text-white uppercase text-sm">{testimonial.name}</p>
                  <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mt-1">
                    {testimonial.role}, {testimonial.gymName}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
