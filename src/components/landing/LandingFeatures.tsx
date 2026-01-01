import { TRANSLATIONS, ICONS, FEATURE_IMAGES, Language } from './constants';

interface LandingFeaturesProps {
  lang: Language;
}

export default function LandingFeatures({ lang }: LandingFeaturesProps) {
  const t = TRANSLATIONS[lang].features;

  return (
    <section id="features" className="py-32 bg-brand-dark">
      <div className="max-w-7xl mx-auto px-8">
        <div className="text-center mb-24">
          <span className="text-brand-gold text-[10px] font-black tracking-[0.5em] uppercase block mb-4">{t.tag}</span>
          <h2 className="text-5xl md:text-7xl font-thin tracking-tighter text-white">{t.title}</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {t.items.map((feature, index) => {
            const Icon = ICONS[index];
            return (
              <div key={index} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-gold/10 to-transparent rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                <div className="relative glass rounded-[2.5rem] p-10 h-full hover:border-brand-gold/30 transition-all duration-500 overflow-hidden flex flex-col">
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-brand-gold group-hover:scale-110 group-hover:bg-brand-gold group-hover:text-black transition-all duration-500">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-[10px] font-black text-white/20 tracking-widest uppercase">0{index + 1}</div>
                  </div>
                  
                  <h4 className="text-2xl font-light mb-4 tracking-tight text-white">{feature.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed font-light mb-8 flex-grow">
                    {feature.desc}
                  </p>

                  <div className="relative h-48 rounded-2xl overflow-hidden mt-auto grayscale group-hover:grayscale-0 transition-all duration-700 border border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                    <img 
                      src={FEATURE_IMAGES[index]} 
                      alt={feature.title}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
