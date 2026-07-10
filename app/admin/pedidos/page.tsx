"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Users, ShoppingBag } from "lucide-react";
import FilaPedidos from "./components/FilaPedidos";
import CrmPedidos from "./components/CrmPedidos";

export default function PedidosPage() {
  const [abaAtiva, setAbaAtiva] = useState<"fila" | "crm">("fila");

  return (
    <div className="min-h-screen pb-16 bg-background selection:bg-primary/10 selection:text-primary">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* CABEÇALHO E ABAS DE NAVEGAÇÃO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/60 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">Gestão Comercial</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1 font-medium">Pedidos da Loja e Relacionamento B2B</p>
          </div>

          <div className="flex bg-secondary/30 p-1 rounded-xl border border-border/40 w-fit">
            <button 
              onClick={() => setAbaAtiva("fila")} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${abaAtiva === "fila" ? "bg-card text-primary shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ShoppingBag className="h-4 w-4" /> Fila de Pedidos
            </button>
            <button 
              onClick={() => setAbaAtiva("crm")} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${abaAtiva === "crm" ? "bg-card text-primary shadow-sm border border-border/50" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Users className="h-4 w-4" /> CRM de Recompra
            </button>
          </div>
        </div>

        {/* RENDERIZAÇÃO DINÂMICA COMPONENTIZADA */}
        {abaAtiva === "fila" ? <FilaPedidos /> : <CrmPedidos />}

      </main>
    </div>
  );
}