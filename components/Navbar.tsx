"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, User, Store, Package, ShoppingBag, LayoutDashboard, LayoutTemplate } from "lucide-react"; // 🔴 Importei o LayoutTemplate
import Link from "next/link";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [usuario, setUsuario] = useState<{ nome: string; loja: string; email: string } | null>(null);

  useEffect(() => {
    async function carregarUsuario() {
      const cacheUser = sessionStorage.getItem("jc_user_meta");
      if (cacheUser) {
        setUsuario(JSON.parse(cacheUser));
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const dadosUsuario = {
          nome: user.user_metadata?.nome_completo || "Administrador",
          loja: user.user_metadata?.nome_loja || "Ateliê",
          email: user.email || ""
        };
        
        sessionStorage.setItem("jc_user_meta", JSON.stringify(dadosUsuario));
        setUsuario(dadosUsuario);
      }
    }
    carregarUsuario();
  }, []);

  const handleSair = async () => {
    sessionStorage.removeItem("jc_user_meta");
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <nav className="bg-card border-b border-border/60 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-2">
          
          {/* LADO ESQUERDO: Marca e Logo */}
          <div className="flex-shrink-0 flex items-center gap-3">
             <div className="bg-primary text-primary-foreground p-2 rounded-lg font-sans font-bold text-xl leading-none shadow-sm flex-shrink-0">
               JC
             </div>
             <span className="font-sans font-bold text-xl lg:text-2xl text-foreground tracking-tight hidden md:block truncate">
               Jordan Collection
             </span>
          </div>

          {/* CENTRO: O COCKPIT DE NAVEGAÇÃO INTERNA */}
          <div className="flex items-center bg-secondary/30 p-1 rounded-xl border border-border/40 overflow-x-auto hide-scrollbar">
            
            {/* 1. VISÃO GERAL */}
            <Link 
              href="/admin" 
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                pathname === "/admin" 
                  ? "bg-card text-primary shadow-sm border border-border/50" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Visão Geral</span>
            </Link>

            {/* 2. CATÁLOGO */}
            <Link 
              href="/admin/produtos" 
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                pathname === "/admin/produtos" 
                  ? "bg-card text-primary shadow-sm border border-border/50" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Catálogo</span>
            </Link>

            {/* 🔴 3. VITRINE (NOVA) */}
            <Link 
              href="/admin/vitrine" 
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                pathname === "/admin/vitrine" 
                  ? "bg-card text-primary shadow-sm border border-border/50" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Vitrine</span>
            </Link>

            {/* 4. PEDIDOS */}
            <Link 
              href="/admin/pedidos" 
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                pathname === "/admin/pedidos" 
                  ? "bg-card text-primary shadow-sm border border-border/50" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pedidos</span>
            </Link>
          </div>

          {/* LADO DIREITO */}
          {usuario ? (
            <div className="flex items-center gap-2 sm:gap-6 flex-shrink-0">
              <div className="hidden lg:flex flex-col items-end justify-center">
                <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 text-primary" /> {usuario.loja}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                  <User className="h-3 w-3" /> {usuario.nome}
                </span>
              </div>
              
              <div className="h-8 w-px bg-border/80 hidden lg:block"></div>
              
              <button 
                onClick={handleSair}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors px-2 sm:px-3 py-2 rounded-lg hover:bg-destructive/10"
              >
                <span className="hidden sm:inline">Sair</span> 
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="w-10"></div>
          )}
          
        </div>
      </div>
    </nav>
  );
}