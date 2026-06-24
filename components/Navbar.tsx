"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation"; // <-- Importamos o usePathname
import { LogOut, User, Store, Package, ShoppingBag } from "lucide-react";
import Link from "next/link"; // <-- Importamos o Link para navegação ultra rápida

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname(); // Sabe exatamente qual página está aberta para acender o botão certo
  
  const [usuario, setUsuario] = useState<{ nome: string; loja: string; email: string } | null>(null);

  useEffect(() => {
    async function carregarUsuario() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUsuario({
          nome: user.user_metadata?.nome_completo || "Administrador",
          loja: user.user_metadata?.nome_loja || "Ateliê",
          email: user.email || ""
        });
      }
    }
    carregarUsuario();
  }, []);

  const handleSair = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="bg-card border-b border-border/60 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* LADO ESQUERDO: Marca e Logo */}
          <div className="flex-shrink-0 flex items-center gap-3">
             <div className="bg-primary text-primary-foreground p-2 rounded-lg font-sans font-bold text-xl leading-none shadow-sm">
               JC
             </div>
             <span className="font-sans font-bold text-2xl text-foreground tracking-tight hidden lg:block">
               Jordan Collection
             </span>
          </div>

          {/* ==========================================
              CENTRO: O COCKPIT DE NAVEGAÇÃO INTERNA
             ========================================== */}
          <div className="flex items-center bg-secondary/30 p-1 rounded-xl border border-border/40">
            <Link 
              href="/admin" 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                pathname === "/admin" 
                  ? "bg-card text-primary shadow-sm border border-border/50" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Catálogo</span>
            </Link>

            <Link 
              href="/admin/pedidos" 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                pathname === "/admin/pedidos" 
                  ? "bg-card text-primary shadow-sm border border-border/50" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pedidos</span>
            </Link>
          </div>

          {/* LADO DIREITO: Info do Usuário e Botão de Sair */}
          {usuario && (
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="hidden md:flex flex-col items-end justify-center">
                <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 text-primary" /> {usuario.loja}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                  <User className="h-3 w-3" /> {usuario.nome}
                </span>
              </div>
              
              <div className="h-8 w-px bg-border/80 hidden md:block"></div>
              
              <button 
                onClick={handleSair}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors px-3 py-2 rounded-lg hover:bg-destructive/10"
              >
                <span className="hidden lg:inline">Sair</span> 
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
          
        </div>
      </div>
    </nav>
  );
}