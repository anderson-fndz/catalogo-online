"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Loader2, Truck, CreditCard, Package, ShieldCheck, ChevronRight, AlertTriangle, Phone, MapPin, User, ShoppingCart } from "lucide-react";
import Link from "next/link";

// Ícone Nativo do Instagram
const IconeInstagram = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
  </svg>
);

// Ícone Nativo Oficial do WhatsApp
const IconeWhatsApp = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

export default function VitrinePublica() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [coresBanco, setCoresBanco] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Informações da Loja
  const wppNumero = "5511961624287";
  const wppFormatado = "(11) 96162-4287";
  const instagramLink = "https://instagram.com/jordan.collectiion";

  useEffect(() => {
    buscarDadosPublicos();
  }, []);

  async function buscarDadosPublicos() {
    setCarregando(true);
    
    const [resProd, resCat, resCor] = await Promise.all([
      supabase.from("produtos").select("*").eq("ativo", true).order("created_at", { ascending: false }),
      supabase.from("categorias").select("*").order("nome", { ascending: true }),
      supabase.from("cores").select("*")
    ]);

    if (resProd.data) setProdutos(resProd.data);
    if (resCat.data) setCategorias(resCat.data);
    if (resCor.data) setCoresBanco(resCor.data);
    
    setCarregando(false);
  }

  const renderizarCores = (nomesCores: string[]) => {
    if (!nomesCores || nomesCores.length === 0) return null;
    return (
      <div className="flex gap-1.5 justify-center mt-3 h-4">
        {nomesCores.slice(0, 5).map(nome => {
          const corRef = coresBanco.find(c => c.nome === nome);
          return (
            <div 
              key={nome} 
              title={nome}
              className="w-3.5 h-3.5 rounded-full border border-border shadow-sm" 
              style={{ backgroundColor: corRef ? corRef.hex : '#ccc' }} 
            />
          );
        })}
        {nomesCores.length > 5 && <span className="text-[9px] text-muted-foreground flex items-center">+{nomesCores.length - 5}</span>}
      </div>
    );
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="font-serif text-xl font-bold text-foreground tracking-widest">Jordan Collection</div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest animate-pulse">Montando vitrine...</p>
      </div>
    );
  }

  const novidades = produtos.slice(0, 8);
  const ultimasPecas = produtos.filter(p => p.status_estoque === "Poucas Unidades");

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/10 selection:text-primary flex flex-col">
      
      {/* 1. TOPO: AVISO (Agora na cor da marca) */}
      <div className="bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold uppercase tracking-widest py-2.5 text-center px-4 w-full shadow-sm">
        Atacado somente para lojistas e revendedores
      </div>

      {/* 2. BARRA DE CONTATOS */}
      <div className="hidden md:flex justify-between items-center py-2.5 px-4 sm:px-6 lg:px-8 border-b border-border/40 max-w-7xl mx-auto w-full text-sm text-muted-foreground">
        <div className="flex items-center gap-6">
          <a href={`https://wa.me/${wppNumero}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
            <IconeWhatsApp size={16} /> WhatsApp
          </a>
          <a href={`https://wa.me/${wppNumero}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
            <Phone size={16} /> {wppFormatado}
          </a>
        </div>
        <div>
          <a href={instagramLink} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors flex items-center">
            <IconeInstagram size={18} />
          </a>
        </div>
      </div>

      {/* 3. NAVEGAÇÃO PRINCIPAL */}
      <nav className="bg-card sticky top-0 z-50 shadow-sm border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between py-4 sm:py-5 gap-4">
            
            {/* LADO ESQUERDO: Busca (Desktop) */}
            <div className="w-full md:w-1/3 hidden md:flex justify-start">
              <div className="relative w-full max-w-[280px]">
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  className="w-full border border-border/80 bg-transparent rounded-md pl-3 pr-10 h-10 text-sm focus:outline-none focus:border-primary transition-colors" 
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
              </div>
            </div>

            {/* CENTRO: Logo */}
            <div className="w-full md:w-1/3 flex justify-between md:justify-center items-center">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="bg-primary text-secondary p-2 rounded-lg font-serif font-bold text-xl leading-none shadow-sm group-hover:bg-primary/90 transition-colors">
                  JC
                </div>
                <div className="flex flex-col">
                  <span className="font-serif font-bold text-2xl text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">
                    Jordan
                  </span>
                </div>
              </Link>

              {/* Ícones Mobile */}
              <div className="flex md:hidden items-center gap-4">
                <Link href="/admin" className="text-foreground hover:text-primary">
                  <User size={22} />
                </Link>
                <button className="relative text-foreground hover:text-primary">
                  <ShoppingCart size={22} />
                  <span className="absolute -top-1.5 -right-1.5 bg-[#111] text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">0</span>
                </button>
              </div>
            </div>

            {/* LADO DIREITO: Ações (Desktop) */}
            <div className="w-full md:w-1/3 hidden md:flex justify-end items-center gap-6 text-sm font-medium">
              <Link href="/admin" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors border-r border-border/60 pr-6">
                <User size={20} /> Fazer login
              </Link>
              <button className="flex items-center text-foreground hover:text-primary transition-colors relative">
                <ShoppingCart size={26} />
                <span className="absolute -top-1.5 -right-2 bg-[#111] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                  0
                </span>
              </button>
            </div>

            {/* Busca (Mobile) */}
            <div className="w-full md:hidden flex justify-center mt-2">
              <div className="relative w-full">
                <input 
                  type="text" 
                  placeholder="Buscar peças..." 
                  className="w-full border border-border/80 bg-secondary/20 rounded-md pl-3 pr-10 h-10 text-sm focus:outline-none" 
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

          </div>
        </div>

        {/* 4. MENU DE CATEGORIAS */}
        <div className="bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto hide-scrollbar md:justify-center gap-6 sm:gap-10 py-4 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-foreground/80 border-t border-border/40">
              <a href="#Novidades" className="whitespace-nowrap hover:text-primary transition-colors">Novidades</a>
              {ultimasPecas.length > 0 && (
                <a href="#ÚltimasPeças" className="whitespace-nowrap text-amber-600 hover:text-amber-700 transition-colors">
                  Últimas Peças
                </a>
              )}
              {categorias.map(cat => (
                <a key={cat.id} href={`#${cat.nome}`} className="whitespace-nowrap hover:text-primary transition-colors">{cat.nome}</a>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* BANNER HERO */}
      <div className="w-full bg-foreground h-[350px] sm:h-[450px] relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-foreground/90 z-0"></div>
        <div className="relative z-10 text-center space-y-4 px-4">
          <span className="text-secondary/80 font-bold uppercase tracking-[0.3em] text-xs sm:text-sm drop-shadow-md">Especialistas em Conjuntos</span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-secondary font-serif tracking-tight drop-shadow-xl uppercase">
            Inverno 2026
          </h1>
          <button className="mt-6 bg-secondary text-primary font-bold uppercase tracking-widest text-xs px-8 py-4 rounded-full shadow-2xl hover:bg-white transition-all hover:scale-105">
            Ver Lançamentos
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto pt-16 space-y-20 flex-1 w-full">
        
        {/* SEÇÃO: NOVIDADES */}
        <section className="px-4 sm:px-6 lg:px-8" id="Novidades">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-widest font-serif">Reposições & Novidades</h2>
            <div className="w-24 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {novidades.map(prod => (
              <div key={prod.id} className="group flex flex-col bg-card hover:shadow-xl transition-all duration-300 border border-transparent hover:border-border/60 rounded-xl overflow-hidden relative">
                <div className="absolute top-2 left-2 z-10 bg-[#111] text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm">Novo</div>
                <div className="relative aspect-[3/4] bg-secondary/20 overflow-hidden">
                  <img src={prod.imagens?.[0]} alt={prod.nome} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="p-4 flex flex-col flex-1 items-center text-center">
                  {renderizarCores(prod.cores)}
                  <h3 className="text-sm font-bold text-foreground font-serif leading-tight mt-3 mb-1 line-clamp-2">{prod.nome}</h3>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2 flex gap-1 justify-center">
                    {prod.tecido} <span className="opacity-50">•</span> {prod.categoria_tamanho || "Comum"}
                  </div>
                  <span className="text-lg font-bold text-primary mb-4 mt-auto">R$ {Number(prod.preco).toFixed(2).replace(".", ",")}</span>
                  
                  <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-[10px] py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    <ShoppingCart size={14} /> Comprar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BARRA DE BENEFÍCIOS */}
        <div className="py-8 bg-secondary/20 border-y border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x-0 md:divide-x divide-border/50">
            <div className="flex flex-col items-center gap-2"><Package className="text-primary h-6 w-6"/> <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">Mínimo 6 Peças<br/>Sortidas</span></div>
            <div className="flex flex-col items-center gap-2"><Truck className="text-primary h-6 w-6"/> <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">Envio para<br/>Todo Brasil</span></div>
            <div className="flex flex-col items-center gap-2"><CreditCard className="text-primary h-6 w-6"/> <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">Pagamento via<br/>Pix ou Cartão</span></div>
            <div className="flex flex-col items-center gap-2"><ShieldCheck className="text-primary h-6 w-6"/> <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">Compra 100%<br/>Segura</span></div>
          </div>
        </div>

        {/* SEÇÃO: ÚLTIMAS PEÇAS */}
        {ultimasPecas.length > 0 && (
          <section className="px-4 sm:px-6 lg:px-8" id="ÚltimasPeças">
            <div className="text-center mb-10 flex items-center justify-center gap-4">
              <div className="h-px bg-amber-600/30 flex-1 max-w-[100px]"></div>
              <h2 className="text-xl sm:text-2xl font-bold text-amber-600 uppercase tracking-widest font-serif flex items-center gap-2">
                <AlertTriangle className="h-6 w-6" /> Poucas Unidades
              </h2>
              <div className="h-px bg-amber-600/30 flex-1 max-w-[100px]"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {ultimasPecas.slice(0, 4).map(prod => (
                <div key={prod.id} className="group flex flex-col bg-card hover:shadow-xl transition-all duration-300 border border-amber-600/20 rounded-xl overflow-hidden relative">
                  <div className="absolute top-2 left-2 z-10 bg-amber-600 text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm">Últimas Peças</div>
                  <div className="relative aspect-[3/4] bg-secondary/20 overflow-hidden">
                    <img src={prod.imagens?.[0]} alt={prod.nome} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="p-4 flex flex-col flex-1 items-center text-center">
                    {renderizarCores(prod.cores)}
                    <h3 className="text-sm font-bold text-foreground font-serif leading-tight mt-3 mb-1 line-clamp-2">{prod.nome}</h3>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2 flex gap-1 justify-center">{prod.tecido}</div>
                    <span className="text-lg font-bold text-primary mb-4 mt-auto">R$ {Number(prod.preco).toFixed(2).replace(".", ",")}</span>
                    
                    <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-[10px] py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                      <ShoppingCart size={14} /> Comprar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CATEGORIAS DINÂMICAS */}
        {categorias.map(cat => {
          const prods = produtos.filter(p => p.categoria === cat.nome);
          if (prods.length === 0) return null;
          
          return (
            <section key={cat.id} className="px-4 sm:px-6 lg:px-8" id={cat.nome}>
              <div className="text-center mb-10 flex items-center justify-center gap-4">
                <div className="h-px bg-border/80 flex-1 max-w-[100px]"></div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-widest font-serif">{cat.nome}</h2>
                <div className="h-px bg-border/80 flex-1 max-w-[100px]"></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {prods.slice(0, 4).map(prod => (
                  <div key={prod.id} className="group flex flex-col bg-card hover:shadow-xl transition-all duration-300 border border-transparent hover:border-border/60 rounded-xl overflow-hidden relative">
                    <div className="relative aspect-[3/4] bg-secondary/20 overflow-hidden">
                      <img src={prod.imagens?.[0]} alt={prod.nome} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="p-4 flex flex-col flex-1 items-center text-center">
                      {renderizarCores(prod.cores)}
                      <h3 className="text-sm font-bold text-foreground font-serif leading-tight mt-3 mb-1 line-clamp-2">{prod.nome}</h3>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">{prod.tecido}</div>
                      <span className="text-lg font-bold text-primary mb-4 mt-auto">R$ {Number(prod.preco).toFixed(2).replace(".", ",")}</span>
                      
                      <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-[10px] py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                        <ShoppingCart size={14} /> Comprar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {prods.length > 4 && (
                <div className="text-center mt-8">
                  <button className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1 mx-auto hover:text-foreground transition-colors">
                    Ver mais em {cat.nome} <ChevronRight size={14}/>
                  </button>
                </div>
              )}
            </section>
          );
        })}

      </main>

      {/* ========================================== */}
      {/* FOOTER */}
      {/* ========================================== */}
      <footer className="bg-secondary/10 border-t border-border/50 pt-16 pb-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-secondary p-2 rounded-xl font-serif font-bold text-xl leading-none shadow-sm flex-shrink-0">JC</div>
                <span className="font-serif font-bold text-xl text-foreground tracking-tight leading-none">Jordan Collection</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Fabricação própria especialista em conjuntos e alfaiataria. Referência em moda e qualidade no Brás.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a href={instagramLink} target="_blank" rel="noreferrer" className="bg-card p-2 rounded-full border border-border/60 hover:text-primary hover:border-primary transition-all shadow-sm">
                  <IconeInstagram size={18} />
                </a>
                <a href={`https://wa.me/${wppNumero}`} target="_blank" rel="noreferrer" className="bg-card p-2 rounded-full border border-border/60 hover:text-primary hover:border-primary transition-all shadow-sm">
                  <IconeWhatsApp size={18} />
                </a>
              </div>
            </div>

            <div className="space-y-5">
              <h4 className="font-bold uppercase tracking-widest text-sm text-foreground font-serif">Nossas Lojas no Brás</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                  <span className="leading-snug">
                    <strong className="text-foreground block mb-0.5">Loja 01</strong>
                    Rua Tiers, 63<br/>São Paulo - SP
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                  <span className="leading-snug">
                    <strong className="text-foreground block mb-0.5">Loja 02</strong>
                    Rua Rodrigues dos Santos, 696<br/>
                    <span className="text-[10px] uppercase font-bold text-primary/70">(Próx. Shopping Vautier Premium)</span><br/>
                    São Paulo - SP
                  </span>
                </li>
              </ul>
            </div>

            <div className="space-y-5">
              <h4 className="font-bold uppercase tracking-widest text-sm text-foreground font-serif">Atendimento</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <Phone size={16} className="text-primary shrink-0" />
                  <span className="font-medium">{wppFormatado}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Package size={16} className="text-primary shrink-0" />
                  <span className="font-medium">Atacado Mínimo: 6 Peças</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center pt-8 border-t border-border/50 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            © {new Date().getFullYear()} Jordan Collection. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* BOTÃO FLUTUANTE DO WHATSAPP */}
      <a 
        href={`https://wa.me/${wppNumero}`} 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 hover:bg-[#20bd5a] transition-all z-50 flex items-center justify-center group"
        title="Fale conosco no WhatsApp"
      >
        <IconeWhatsApp size={28} />
      </a>

    </div>
  );
}