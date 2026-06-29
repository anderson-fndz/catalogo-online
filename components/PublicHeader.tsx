"use client";

import { useEffect, useState } from "react";
import { Search, ShoppingCart, User, Phone } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useCarrinhoStore } from "@/store/carrinhoStore"; // 🔴 Importamos a Store!

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
  const [categorias, setCategorias] = useState<any[]>([]);
  // 🔴 Puxamos a função de abrir o carrinho e a lista de itens direto da Store Global
  const { setAberto, itens } = useCarrinhoStore(); 

  const wppNumero = "5511961624287";
  const wppFormatado = "(11) 96162-4287";
  const instagramLink = "https://instagram.com/jordan.collectiion";

  useEffect(() => {
    supabase.from("categorias").select("*").order("nome", { ascending: true }).then(({ data }) => {
      if (data) setCategorias(data);
    });
  }, []);

  // Calcula a quantidade total sempre que a variável `itens` mudar
  const qtdCarrinho = itens.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <>
      <div className="bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold uppercase tracking-widest py-2.5 text-center px-4 w-full shadow-sm">
        Atacado somente para lojistas e revendedores
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
            
            <div className="w-full md:w-1/3 hidden md:flex justify-start">
              <div className="relative w-full max-w-[280px]">
                <input type="text" placeholder="Pesquisar peças..." className="w-full border border-border/80 bg-transparent rounded-md pl-3 pr-10 h-10 text-sm focus:outline-none focus:border-primary transition-colors" />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer" />
              </div>
            </div>

            <div className="w-full md:w-1/3 flex justify-between md:justify-center items-center">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="bg-primary text-secondary p-2 rounded-lg font-serif font-bold text-xl leading-none shadow-sm group-hover:bg-primary/90 transition-colors">JC</div>
                <div className="flex flex-col"><span className="font-serif font-bold text-2xl text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">Jordan</span></div>
              </Link>
              <div className="flex md:hidden items-center gap-4">
                <Link href="/admin" className="text-foreground hover:text-primary"><User size={22} /></Link>
                {/* 🔴 Botão do Mobile agora abre o Carrinho */}
                <button onClick={() => setAberto(true)} className="relative text-foreground hover:text-primary">
                  <ShoppingCart size={22} />
                  <span className="absolute -top-1.5 -right-1.5 bg-[#111] text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">{qtdCarrinho}</span>
                </button>
              </div>
            </div>

            <div className="w-full md:w-1/3 hidden md:flex justify-end items-center gap-6 text-sm font-medium">
              <Link href="/admin" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors border-r border-border/60 pr-6"><User size={20} /> Área Restrita</Link>
              {/* 🔴 Botão do Desktop agora abre o Carrinho */}
              <button onClick={() => setAberto(true)} className="flex items-center text-foreground hover:text-primary transition-colors relative">
                <ShoppingCart size={26} />
                <span className="absolute -top-1.5 -right-2 bg-[#111] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">{qtdCarrinho}</span>
              </button>
            </div>

            <div className="w-full md:hidden flex justify-center mt-2">
              <div className="relative w-full">
                <input type="text" placeholder="Pesquisar peças..." className="w-full border border-border/80 bg-secondary/20 rounded-md pl-3 pr-10 h-10 text-sm focus:outline-none" />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card hidden sm:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto hide-scrollbar md:justify-center gap-6 sm:gap-10 py-4 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-foreground/80 border-t border-border/40">
              <Link href="/#Novidades" className="whitespace-nowrap hover:text-primary transition-colors">Novidades</Link>
              {categorias.map(cat => <Link key={cat.id} href={`/#${cat.nome}`} className="whitespace-nowrap hover:text-primary transition-colors">{cat.nome}</Link>)}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}