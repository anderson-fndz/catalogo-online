"use client";

import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Truck, CreditCard, Package, ShieldCheck, ChevronRight, AlertTriangle, ShoppingCart, SearchX } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";

// Componente Interno que faz a mágica acontecer
function VitrineConteudo() {
  const searchParams = useSearchParams();
  const termoBusca = searchParams.get("busca");

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
      supabase.from("categorias").select("*").eq("mostrar_na_home", true).order("ordem", { ascending: true }),
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

  // 🔴 TELA DE RESULTADOS DA BUSCA
  if (termoBusca) {
    const produtosFiltrados = produtos.filter(p => 
      p.nome?.toLowerCase().includes(termoBusca.toLowerCase()) || 
      p.categoria?.toLowerCase().includes(termoBusca.toLowerCase()) || 
      p.tecido?.toLowerCase().includes(termoBusca.toLowerCase())
    );

    return (
      <div className="min-h-screen bg-background font-sans selection:bg-primary/10 selection:text-primary flex flex-col">
        <PublicHeader />
        <main className="max-w-7xl mx-auto pt-10 space-y-12 flex-1 w-full pb-20 px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-10 border-b border-border/60 pb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground uppercase tracking-widest font-serif">
              Resultados da Busca
            </h2>
            <p className="text-muted-foreground mt-2">
              Buscando por: <strong className="text-primary">"{termoBusca}"</strong>
            </p>
          </div>

          {produtosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <SearchX className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-bold text-foreground font-serif">Nenhuma peça encontrada</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Não encontramos resultados para "{termoBusca}". Tente pesquisar por uma categoria, nome ou tecido diferente.
              </p>
              <Link href="/" className="mt-8 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold uppercase tracking-wider text-xs shadow-md hover:bg-primary/90 transition-colors">
                Voltar ao Catálogo Completo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {produtosFiltrados.map(prod => (
                <Link href={`/produto/${prod.id}`} key={prod.id} className="group flex flex-col bg-card hover:shadow-xl transition-all duration-300 border border-transparent hover:border-border/60 rounded-xl overflow-hidden relative cursor-pointer">
                  <div className="relative aspect-[3/4] bg-secondary/20 overflow-hidden">
                    {/* ETIQUETAS DINÂMICAS */}
                    {prod.status_estoque === "Chegando" && (
                      <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm">Prestes a Chegar</div>
                    )}
                    {prod.status_estoque === "Poucas Unidades" && (
                      <div className="absolute top-2 left-2 z-10 bg-amber-600 text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm">Últimas Peças</div>
                    )}
                    <img src={prod.imagens?.[0]} alt={prod.nome} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="p-4 flex flex-col flex-1 items-center text-center">
                    {renderizarCores(prod.cores)}
                    <h3 className="text-sm font-bold text-foreground font-serif leading-tight mt-3 mb-1 line-clamp-2">{prod.nome}</h3>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">{prod.tecido}</div>
                    <span className="text-lg font-bold text-primary mb-4 mt-auto">R$ {Number(prod.preco).toFixed(2).replace(".", ",")}</span>
                    <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-[10px] py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                      <ShoppingCart size={14} /> Ver Detalhes
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
        <PublicFooter />
      </div>
    );
  }

  // 🔴 VITRINE NORMAL (SEM BUSCA)
  const ultimasPecas = produtos.filter(p => p.status_estoque === "Poucas Unidades");

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/10 selection:text-primary flex flex-col">
      <PublicHeader />

      <div className="w-full bg-foreground h-[350px] sm:h-[450px] relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-foreground/90 z-0"></div>
        <div className="relative z-10 text-center space-y-4 px-4">
          <span className="text-secondary/80 font-bold uppercase tracking-[0.3em] text-xs sm:text-sm drop-shadow-md">Especialistas em Conjuntos</span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-secondary font-serif tracking-tight drop-shadow-xl uppercase">Inverno 2026</h1>
          
          {/* 🔴 AQUI ESTÁ O BOTÃO ATUALIZADO LINKANDO PARA A CATEGORIA */}
          <Link href="#Coleção Inverno" className="mt-6 inline-block bg-secondary text-primary font-bold uppercase tracking-widest text-xs px-8 py-4 rounded-full shadow-2xl hover:bg-white transition-all hover:scale-105">
            Ver Lançamentos
          </Link>

        </div>
      </div>

      <main className="max-w-7xl mx-auto pt-16 space-y-20 flex-1 w-full pb-20">
        
        {/* BENEFÍCIOS */}
        <div className="bg-secondary/20 border-y border-border/50 py-8">
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
                    <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-[10px] py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                      <ShoppingCart size={14} /> Ver Detalhes
                    </button>
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
                {prods.map(prod => (
                  <Link href={`/produto/${prod.id}`} key={prod.id} className="group flex flex-col bg-card hover:shadow-xl transition-all duration-300 border border-transparent hover:border-border/60 rounded-xl overflow-hidden relative cursor-pointer">
                    <div className="relative aspect-[3/4] bg-secondary/20 overflow-hidden">
                      {/* ETIQUETAS DINÂMICAS NA CATEGORIA */}
                      {prod.status_estoque === "Chegando" && (
                        <div className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm">Prestes a Chegar</div>
                      )}
                      {prod.status_estoque === "Poucas Unidades" && (
                        <div className="absolute top-2 left-2 z-10 bg-amber-600 text-white text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm">Últimas Peças</div>
                      )}
                      <img src={prod.imagens?.[0]} alt={prod.nome} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <div className="p-4 flex flex-col flex-1 items-center text-center">
                      {renderizarCores(prod.cores)}
                      <h3 className="text-sm font-bold text-foreground font-serif leading-tight mt-3 mb-1 line-clamp-2">{prod.nome}</h3>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">{prod.tecido}</div>
                      <span className="text-lg font-bold text-primary mb-4 mt-auto">R$ {Number(prod.preco).toFixed(2).replace(".", ",")}</span>
                      <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-[10px] py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
                        <ShoppingCart size={14} /> Ver Detalhes
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

      </main>
      <PublicFooter />
    </div>
  );
}

// 🔴 O EXPORT DEFAULT FICA AQUI PARA GARANTIR COMPATIBILIDADE COM A VERCEL
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>}>
      <VitrineConteudo />
    </Suspense>
  );
}