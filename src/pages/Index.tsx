import { useState } from 'react';
import {
  LandingNavbar,
  LandingHero,
  LandingStats,
  LandingFeatures,
  LandingHardware,
  LandingPricing,
  LandingTestimonials,
  LandingFAQ,
  LandingDemoForm,
  LandingFooter,
  Language
} from '@/components/landing';

export default function Index() {
  const [lang, setLang] = useState<Language>('pt');

  return (
    <div className="min-h-screen bg-brand-dark text-white overflow-x-hidden">
      {/* Grain texture overlay */}
      <svg className="fixed inset-0 w-full h-full z-[1] pointer-events-none opacity-[0.04]" aria-hidden="true">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>

      <header className="content-layer">
        <LandingNavbar lang={lang} setLang={setLang} />
      </header>

      <main className="content-layer">
        <LandingHero lang={lang} />
        <LandingStats lang={lang} />
        <LandingFeatures lang={lang} />
        <LandingHardware lang={lang} />
        <LandingPricing lang={lang} />
        <LandingTestimonials lang={lang} />
        <LandingFAQ lang={lang} />
        <LandingDemoForm lang={lang} />
      </main>

      <footer className="content-layer">
        <LandingFooter />
      </footer>
    </div>
  );
}
