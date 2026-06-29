"use client";

import { Phone, MapPin, Package } from "lucide-react";

const IconeWhatsApp = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

const IconeInstagram = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
  </svg>
);

export function PublicFooter() {
  const wppNumero = "5511961624287";
  const wppFormatado = "(11) 96162-4287";
  const instagramLink = "https://instagram.com/jordan.collectiion";

  return (
    <>
      <footer className="bg-secondary/10 border-t border-border/50 pt-16 pb-8 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-secondary p-2 rounded-xl font-serif font-bold text-xl leading-none shadow-sm flex-shrink-0">JC</div>
                <span className="font-serif font-bold text-xl text-foreground tracking-tight leading-none">Jordan Collection</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">Fabricação própria especialista em conjuntos e alfaiataria. Referência em moda e qualidade no Brás.</p>
              <div className="flex items-center gap-3 pt-2">
                <a href={instagramLink} target="_blank" rel="noreferrer" className="bg-card p-2 rounded-full border border-border/60 hover:text-primary hover:border-primary transition-all shadow-sm"><IconeInstagram size={18} /></a>
                <a href={`https://wa.me/${wppNumero}`} target="_blank" rel="noreferrer" className="bg-card p-2 rounded-full border border-border/60 hover:text-primary hover:border-primary transition-all shadow-sm"><IconeWhatsApp size={18} /></a>
              </div>
            </div>

            <div className="space-y-5">
              <h4 className="font-bold uppercase tracking-widest text-sm text-foreground font-serif">Nossas Lojas no Brás</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li className="flex items-start gap-3"><MapPin size={18} className="text-primary shrink-0 mt-0.5" /><span className="leading-snug"><strong className="text-foreground block mb-0.5">Loja 01</strong>Rua Tiers, 63<br/>São Paulo - SP</span></li>
                <li className="flex items-start gap-3"><MapPin size={18} className="text-primary shrink-0 mt-0.5" /><span className="leading-snug"><strong className="text-foreground block mb-0.5">Loja 02</strong>Rua Rodrigues dos Santos, 696<br/><span className="text-[10px] uppercase font-bold text-primary/70">(Próx. Shopping Vautier Premium)</span><br/>São Paulo - SP</span></li>
              </ul>
            </div>

            <div className="space-y-5">
              <h4 className="font-bold uppercase tracking-widest text-sm text-foreground font-serif">Atendimento</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3"><Phone size={16} className="text-primary shrink-0" /><span className="font-medium">{wppFormatado}</span></li>
                <li className="flex items-center gap-3"><Package size={16} className="text-primary shrink-0" /><span className="font-medium">Atacado Mínimo: 6 Peças</span></li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-border/50 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">© {new Date().getFullYear()} Jordan Collection. Todos os direitos reservados.</div>
        </div>
      </footer>

      {/* BOTÃO WHATSAPP */}
      <a href={`https://wa.me/${wppNumero}`} target="_blank" rel="noreferrer" className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all z-50">
        <IconeWhatsApp size={28} />
      </a>
    </>
  );
}