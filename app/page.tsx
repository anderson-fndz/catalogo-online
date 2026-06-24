import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  // Buscando os produtos ativos direto do banco de dados
  const { data: produtos } = await supabase
    .from('produtos')
    .select('*')
    .eq('ativo', true);

  return (
    <main className="min-h-screen pb-20">
      
      {/* Banner / Boas-vindas */}
      <section className="bg-primary/5 px-6 py-8 mb-8 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-primary mb-2">Coleção Atual</h1>
          <p className="text-muted-foreground text-sm">
            Fabricação própria com envios para todo o Brasil. Mínimo de 6 peças variadas.
          </p>
        </div>
      </section>

      {/* Grid de Produtos (A Vitrine) */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto">
        
        {/* Filtros */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <span className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-primary/90">Todos</span>
          <span className="bg-secondary text-secondary-foreground px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer hover:bg-secondary/80">Plus Size</span>
        </div>

        {/* A grade em si */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {produtos?.map((produto) => (
            <Link 
              href={`/produto/${produto.id}`} 
              key={produto.id} 
              className="flex flex-col group cursor-pointer"
            >
              
              {/* Foto do Produto */}
              <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-muted mb-3 border border-border">
                <img 
                  src={produto.imagens?.[0] || 'https://placehold.co/400x600?text=Sem+Foto'} 
                  alt={produto.nome}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                />
                
                {/* Selo de Promoção */}
                {produto.em_promocao && (
                  <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider shadow-md">
                    Promoção
                  </div>
                )}
              </div>

              {/* Informações reais do Banco */}
              <div className="flex flex-col flex-1">
                <div className="flex gap-1.5 mb-1.5">
                  <span className="text-[10px] font-semibold text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded-sm">
                    {produto.tecido}
                  </span>
                  <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm border border-border">
                    {produto.categoria_tamanho}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-foreground leading-tight mb-1 line-clamp-2">
                  {produto.nome}
                </h3>
                
                <div className="mt-auto pt-2 flex items-center justify-between">
                  <span className="text-base font-bold text-primary">
                    R$ {Number(produto.preco).toFixed(2).replace('.', ',')}
                  </span>
                  
                  {/* Botão de Carrinho Corrigido (sem o onClick) */}
                  <Button size="icon" className="h-8 w-8 rounded-full shadow-sm">
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
              </div>

            </Link>
          ))}
        </div>
      </section>

    </main>
  );
}