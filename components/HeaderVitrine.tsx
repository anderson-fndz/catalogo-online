"use client";

import { ShoppingBag } from "lucide-react";
import { useCarrinhoStore } from "@/store/carrinhoStore";

export function HeaderVitrine() {
  const { itens, setAberto } = useCarrinhoStore();
  
  // Calcula o total de peças no carrinho para mostrar a bolinha vermelha
  const totalPecas = itens.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <header className="bg-background border-b border-border/60 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Lado Esquerdo: Marca Pública */}
        <div className="flex items-center gap-3">
           <div className="bg-primary text-primary-foreground p-1.5 rounded-lg font-sans font-bold text-lg leading-none shadow-sm">
             JC
           </div>
           <span className="font-sans font-bold text-xl text-foreground tracking-tight">
             Jordan Collection
           </span>
        </div>

        {/* Lado Direito: Botão do Carrinho */}
        <button 
          onClick={() => setAberto(true)}
          className="relative p-2 text-foreground hover:bg-muted rounded-full transition-colors"
        >
          <ShoppingBag className="h-6 w-6" />
          {totalPecas > 0 && (
            <span className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-primary text-primary-foreground text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm border-2 border-background">
              {totalPecas}
            </span>
          )}
        </button>

      </div>
    </header>
  );
}