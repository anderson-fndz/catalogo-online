"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Truck, CreditCard, Package, ShieldCheck, ChevronRight, AlertTriangle, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";

export default function VitrinePublica() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [coresBanco, setCoresBanco] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

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
        <p className="text-xs text-muted-foreground uppercase tracking-widest animate-pulse">A carregar catálogo...</p>
      </div>
    );
  }

  const novidades = produtos.slice(0, 8);
  const ultimasPecas = produtos.filter(p => p.status_estoque === "Poucas Unidades");

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/10 selection:text-primary flex flex-col">
      <PublicHeader />

      <div className="w-full bg-foreground h-[350px] sm:h-[450px] relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-foreground/90 z-0"></div>
        <div className="relative z-10 text-center space-y-4 px-4">
          <span className="text-secondary/80 font-bold uppercase tracking-[0.3em] text-xs sm:text-sm drop-shadow-md">Especialistas em Conjuntos</span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-secondary font-serif tracking-tight drop-shadow-xl uppercase">Inverno 2026</h1>
          <button className="mt-6 bg-secondary text-primary font-bold uppercase tracking-widest text-xs px-8 py-4 rounded-full shadow-2xl hover:bg-white transition-all hover:scale-105">
            Ver Lançamentos
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto pt-16 space-y-20 flex-1 w-full pb-20">
        
        {/* NOVIDADES */}
        <section className="px-4 sm:px-6 lg:px-8" id="Novidades">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-widest font-serif">Reposições & Novidades</h2>
            <div className="w-24 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {novidades.map(prod => (
              <Link href={`/produto/${prod.id}`} key={prod.id} className="group flex flex-col bg-card hover:shadow-xl transition-all duration-300 border border-transparent hover:border-border/60 rounded-xl overflow-hidden relative cursor-pointer">
                <div className="absolute top-2 left-2 z-10 bg-[#111] text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm">Novo</div>
                <div className="relative aspect-[3/4] bg-secondary/20 overflow-hidden">
                  <img src={prod.imagens?.[0]} alt={prod.nome} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="p-4 flex flex-col flex-1 items-center text-center">
                  {renderizarCores(prod.cores)}
                  <h3 className="text-sm font-bold text-foreground font-serif leading-tight mt-3 mb-1 line-clamp-2">{prod.nome}</h3>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2 flex gap-1 justify-center">{prod.tecido} <span className="opacity-50">•</span> {prod.categoria_tamanho || "Comum"}</div>
                  <span className="text-lg font-bold text-primary mb-4 mt-auto">R$ {Number(prod.preco).toFixed(2).replace(".", ",")}</span>
                  
                  {/* Corrigido: era <button>, agora é <div> */}
                  <div className="w-full bg-emerald-600 group-hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-[10px] py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    <ShoppingCart size={14} /> Ver Detalhes
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <div className="py-8 bg-secondary/20 border-y border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x-0 md:divide-x divide-border/50">
            <div className="flex flex-col items-center gap-2"><Package className="text-primary h-6 w-6"/> <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">Mínimo 6 Peças<br/>Sortidas</span></div>
            <div className="flex flex-col items-center gap-2"><Truck className="text-primary h-6 w-6"/> <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">Envio para<br/>Todo o País</span></div>
            <div className="flex flex-col items-center gap-2"><CreditCard className="text-primary h-6 w-6"/> <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">Pagamento via<br/>Pix ou Cartão</span></div>
            <div className="flex flex-col items-center gap-2"><ShieldCheck className="text-primary h-6 w-6"/> <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">Compra 100%<br/>Segura</span></div>
          </div>
        </div>

        {/* ÚLTIMAS PEÇAS */}
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
                <Link href={`/produto/${prod.id}`} key={prod.id} className="group flex flex-col bg-card hover:shadow-xl transition-all duration-300 border border-amber-600/20 rounded-xl overflow-hidden relative cursor-pointer">
                  <div className="absolute top-2 left-2 z-10 bg-amber-600 text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm">Últimas Peças</div>
                  <div className="relative aspect-[3/4] bg-secondary/20 overflow-hidden">
                    <img src={prod.imagens?.[0]} alt={prod.nome} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="p-4 flex flex-col flex-1 items-center text-center">
                    {renderizarCores(prod.cores)}
                    <h3 className="text-sm font-bold text-foreground font-serif leading-tight mt-3 mb-1 line-clamp-2">{prod.nome}</h3>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2 flex gap-1 justify-center">{prod.tecido}</div>
                    <span className="text-lg font-bold text-primary mb-4 mt-auto">R$ {Number(prod.preco).toFixed(2).replace(".", ",")}</span>
                    
                    {/* Corrigido: era <button>, agora é <div> */}
                    <div className="w-full bg-emerald-600 group-hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-[10px] py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                      <ShoppingCart size={14} /> Ver Detalhes
                    </div>
                  </div>
                </Link>
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
                  <Link href={`/produto/${prod.id}`} key={prod.id} className="group flex flex-col bg-card hover:shadow-xl transition-all duration-300 border border-transparent hover:border-border/60 rounded-xl overflow-hidden relative cursor-pointer">
                    <div className="relative aspect-[3/4] bg-secondary/20 overflow-hidden">
                      <img src={prod.imagens?.[0]} alt={prod.nome} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="p-4 flex flex-col flex-1 items-center text-center">
                      {renderizarCores(prod.cores)}
                      <h3 className="text-sm font-bold text-foreground font-serif leading-tight mt-3 mb-1 line-clamp-2">{prod.nome}</h3>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">{prod.tecido}</div>
                      <span className="text-lg font-bold text-primary mb-4 mt-auto">R$ {Number(prod.preco).toFixed(2).replace(".", ",")}</span>
                      
                      {/* Corrigido: era <button>, agora é <div> */}
                      <div className="w-full bg-emerald-600 group-hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-[10px] py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                        <ShoppingCart size={14} /> Ver Detalhes
                      </div>
                    </div>
                  </Link>
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
      <PublicFooter />
    </div>
  );
}