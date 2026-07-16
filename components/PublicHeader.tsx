"use client";

import { useEffect, useState, useRef } from "react";
import { Search, ShoppingCart, User, Phone, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCarrinhoStore } from "@/store/carrinhoStore";

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

export function PublicHeader() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [termoBusca, setTermoBusca] = useState("");
  const [buscaAtiva, setBuscaAtiva] = useState(false);
  
  const { setAberto, itens } = useCarrinhoStore(); 
  const buscaRef = useRef<HTMLDivElement>(null);

  const wppNumero = "5511961624287";
  const wppFormatado = "(11) 96162-4287";
  const instagramLink = "https://instagram.com/jordan.collectiion";

  useEffect(() => {
    // Puxa as categorias visíveis
    supabase.from("categorias")
      .select("*")
      .eq("mostrar_na_home", true) 
      .order("ordem", { ascending: true })
      .then(({ data }) => {
        if (data) setCategorias(data);
      });

    // Puxa os produtos em background para a busca instantânea
    supabase.from("produtos")
      .select("id, nome, preco, imagens, tecido, categoria")
      .eq("ativo", true)
      .then(({ data }) => {
        if (data) setProdutos(data);
      });

    // Fecha o menu de busca se clicar fora dele
    const handleClickFora = (event: MouseEvent) => {
      if (buscaRef.current && !buscaRef.current.contains(event.target as Node)) {
        setBuscaAtiva(false);
      }
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  const qtdCarrinho = itens.reduce((acc, item) => acc + item.quantidade, 0);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    if (termoBusca.trim()) {
      setBuscaAtiva(false);
      router.push(`/?busca=${encodeURIComponent(termoBusca.trim())}`);
    } else {
      router.push(`/`);
    }
  };

  // Lógica da Busca Instantânea (Kalie Style)
  const produtosFiltrados = termoBusca.trim() === "" ? [] : produtos.filter(p => 
    p.nome?.toLowerCase().includes(termoBusca.toLowerCase()) || 
    p.categoria?.toLowerCase().includes(termoBusca.toLowerCase()) || 
    p.tecido?.toLowerCase().includes(termoBusca.toLowerCase())
  ).slice(0, 5); // Mostra no máximo 5 resultados na janelinha

  return (
    <>
      <div className="bg-[#82042e] text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest text-center py-2.5 px-4">Atacado somente para lojistas e revendedores
      </div>

      <div className="hidden md:flex justify-between items-center py-2.5 px-4 sm:px-6 lg:px-8 border-b border-border/40 max-w-7xl mx-auto w-full text-sm text-muted-foreground">
        <div className="flex items-center gap-6">
          <a href={`https://wa.me/${wppNumero}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors"><IconeWhatsApp size={16} /> WhatsApp</a>
          <a href={`https://wa.me/${wppNumero}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors"><Phone size={16} /> {wppFormatado}</a>
        </div>
        <div>
          <a href={instagramLink} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors flex items-center"><IconeInstagram size={18} /></a>
        </div>
      </div>

      <nav className="bg-card sticky top-0 z-50 shadow-sm border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between py-4 sm:py-5 gap-4">
            
            {/* BUSCA DESKTOP (Com Live Search) */}
            <div className="w-full md:w-1/3 hidden md:flex justify-start relative" ref={buscaRef}>
              <form onSubmit={handleBuscar} className="relative w-full max-w-[280px]">
                <input 
                  type="text" 
                  value={termoBusca}
                  onChange={(e) => {
                    setTermoBusca(e.target.value);
                    setBuscaAtiva(true);
                  }}
                  onFocus={() => setBuscaAtiva(true)}
                  placeholder="Pesquisar peças, tecidos..." 
                  className="w-full border border-border/80 bg-transparent rounded-md pl-3 pr-10 h-10 text-sm focus:outline-none focus:border-primary transition-colors" 
                />
                {termoBusca && (
                  <button type="button" onClick={() => { setTermoBusca(""); setBuscaAtiva(false); }} className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                  <Search className="h-4 w-4 cursor-pointer" />
                </button>
              </form>

              {/* DROPDOWN RESULTADOS (Estilo Kalie) */}
              {buscaAtiva && termoBusca.length > 1 && (
                <div className="absolute top-12 left-0 w-full max-w-[350px] bg-card border border-border shadow-2xl rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 flex flex-col">
                  {produtosFiltrados.length > 0 ? (
                    <>
                      <div className="px-4 py-2 bg-secondary/20 border-b border-border/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Resultados encontrados
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
                        {produtosFiltrados.map(p => (
                          <Link 
                            href={`/produto/${p.id}`} 
                            key={p.id}
                            onClick={() => { setBuscaAtiva(false); setTermoBusca(""); }} 
                            className="flex items-center gap-4 p-3 hover:bg-secondary/10 transition-colors group"
                          >
                            <div className="w-12 h-16 bg-muted rounded overflow-hidden shrink-0 border border-border/50">
                              <img src={p.imagens?.[0]} alt={p.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-foreground font-serif leading-tight group-hover:text-primary transition-colors">{p.nome}</span>
                              <span className="text-[10px] text-muted-foreground uppercase mt-0.5 tracking-wider">{p.tecido}</span>
                              <span className="text-sm font-bold text-primary mt-1">R$ {Number(p.preco).toFixed(2).replace(".", ",")}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <button onClick={handleBuscar} className="w-full py-3 bg-secondary/10 text-xs font-bold text-primary uppercase tracking-widest hover:bg-secondary/20 transition-colors border-t border-border/50">
                        Ver todos os resultados
                      </button>
                    </>
                  ) : (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      Nenhuma peça encontrada para "{termoBusca}".
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* LOGO */}
            <div className="w-full md:w-1/3 flex justify-between md:justify-center items-center">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="bg-primary text-secondary p-2 rounded-lg font-serif font-bold text-xl leading-none shadow-sm group-hover:bg-primary/90 transition-colors">JC</div>
                <div className="flex flex-col"><span className="font-serif font-bold text-2xl text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">Jordan Collection</span></div>
              </Link>
              <div className="flex md:hidden items-center gap-4">
                <Link href="/admin" className="text-foreground hover:text-primary"><User size={22} /></Link>
                <button onClick={() => setAberto(true)} className="relative text-foreground hover:text-primary">
                  <ShoppingCart size={22} />
                  <span className="absolute -top-1.5 -right-1.5 bg-[#111] text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">{qtdCarrinho}</span>
                </button>
              </div>
            </div>

            {/* ÍCONES DIREITA */}
            <div className="w-full md:w-1/3 hidden md:flex justify-end items-center gap-6 text-sm font-medium">
              <Link href="/admin" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors border-r border-border/60 pr-6"><User size={20} /> Administrador</Link>
              <button onClick={() => setAberto(true)} className="flex items-center text-foreground hover:text-primary transition-colors relative">
                <ShoppingCart size={26} />
                <span className="absolute -top-1.5 -right-2 bg-[#111] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">{qtdCarrinho}</span>
              </button>
            </div>

            {/* BUSCA MOBILE */}
            <div className="w-full md:hidden flex justify-center mt-2 relative">
              <form onSubmit={handleBuscar} className="relative w-full">
                <input 
                  type="text" 
                  value={termoBusca}
                  onChange={(e) => {
                    setTermoBusca(e.target.value);
                    setBuscaAtiva(true);
                  }}
                  onFocus={() => setBuscaAtiva(true)}
                  placeholder="Pesquisar peças..." 
                  className="w-full border border-border/80 bg-secondary/20 rounded-md pl-3 pr-10 h-10 text-sm focus:outline-none focus:border-primary" 
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                  <Search className="h-4 w-4" />
                </button>
              </form>

              {/* DROPDOWN MOBILE */}
              {buscaAtiva && termoBusca.length > 1 && (
                <div className="absolute top-12 left-0 w-full bg-card border border-border shadow-xl rounded-lg overflow-hidden z-50 flex flex-col">
                  {produtosFiltrados.length > 0 ? (
                    <>
                      <div className="max-h-60 overflow-y-auto divide-y divide-border/50">
                        {produtosFiltrados.map(p => (
                          <Link 
                            href={`/produto/${p.id}`} 
                            key={p.id}
                            onClick={() => { setBuscaAtiva(false); setTermoBusca(""); }} 
                            className="flex items-center gap-3 p-3 hover:bg-secondary/10"
                          >
                            <img src={p.imagens?.[0]} alt={p.nome} className="w-10 h-12 object-cover rounded border border-border/50" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-foreground font-serif">{p.nome}</span>
                              <span className="text-[10px] font-bold text-primary mt-0.5">R$ {Number(p.preco).toFixed(2).replace(".", ",")}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <button onClick={handleBuscar} className="w-full py-3 bg-secondary/10 text-[10px] font-bold text-primary uppercase tracking-widest border-t border-border/50">
                        Ver todos os resultados
                      </button>
                    </>
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground">Nenhuma peça encontrada.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-card hidden sm:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto hide-scrollbar md:justify-center gap-6 sm:gap-10 py-4 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-foreground/80 border-t border-border/40">
              {categorias.map(cat => <Link key={cat.id} href={`/#${cat.nome}`} className="whitespace-nowrap hover:text-primary transition-colors">{cat.nome}</Link>)}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}