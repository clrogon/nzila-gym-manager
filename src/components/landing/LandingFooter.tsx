import { Dumbbell, MapPin, Mail, Phone, FileText } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="py-24 px-8 border-t border-white/5 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-20">
          <div className="space-y-8 max-w-sm">
            <div className="flex items-center space-x-6 grayscale opacity-40 group hover:opacity-100 transition-opacity cursor-pointer">
              <Dumbbell className="w-10 h-10 text-brand-gold" />
              <span className="text-3xl font-thin tracking-[0.6em] text-white">NZILA</span>
            </div>
            
            <div className="space-y-4 text-gray-500 font-light text-sm">
              <div className="flex items-start space-x-3 group">
                <MapPin className="w-4 h-4 text-brand-gold mt-1 flex-shrink-0 group-hover:text-white transition-colors" />
                <span className="leading-relaxed">
                  Edifício Garden Towers, Torre B, 12º Andar<br/>
                  Avenida Comandante Gika, Luanda, Angola
                </span>
              </div>
              <div className="flex items-center space-x-3 group">
                <Mail className="w-4 h-4 text-brand-gold flex-shrink-0 group-hover:text-white transition-colors" />
                <a href="mailto:comercial@nzila.ao" className="hover:text-brand-gold transition-colors">comercial@nzila.ao</a>
              </div>
              <div className="flex items-center space-x-3 group">
                <Phone className="w-4 h-4 text-brand-gold flex-shrink-0 group-hover:text-white transition-colors" />
                <span>+244 923 555 777</span>
              </div>
              <div className="flex items-center space-x-3 group pt-2 border-t border-white/5">
                <FileText className="w-4 h-4 text-brand-gold flex-shrink-0 group-hover:text-white transition-colors" />
                <span className="tracking-widest">NIF: 5410002931</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-12 md:space-x-20">
            {['Instagram', 'LinkedIn', 'WhatsApp'].map(social => (
              <a key={social} href="#" className="text-[10px] font-black tracking-[0.3em] text-gray-600 hover:text-white uppercase transition-colors">
                {social}
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-t border-white/5 pt-12">
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black tracking-[0.4em] text-gray-700 uppercase mb-2">© 2025 Nzila Elite OS</p>
            <p className="text-[10px] font-black tracking-[0.4em] text-gray-800 uppercase">Tecnologia Feita em Angola</p>
          </div>
          
          <div className="flex space-x-10 text-[9px] font-black tracking-[0.3em] text-gray-800 uppercase">
            <a href="#" className="hover:text-gray-400 transition-colors">Privacy Protocol</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Service Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
