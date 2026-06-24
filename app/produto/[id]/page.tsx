import { supabase } from "@/lib/supabase";
import { ProdutoAtacado } from "@/components/ProdutoAtacado";
import { HeaderVitrine } from "@/components/HeaderVitrine";
import { CarrinhoLateral } from "@/components/CarrinhoLateral";

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Busca o produto no banco
  const { data: produto } = await supabase
    .from("produtos")
    .select("*")
    .eq("id", id)
    .single();

  if (!produto) {
    return (
      <div className="min-h-screen bg-[#faf8f5]">
        <HeaderVitrine />
        <div className="p-10 text-center mt-20 font-bold">Produto não encontrado.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* 1. O CABEÇALHO (Com a bolinha vermelha de notificação) */}
      <HeaderVitrine />

      <main className="pt-8 pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
        {/* 2. O MEIO (O produto, as fotos, os botões) */}
        <ProdutoAtacado produto={produto} />
      </main>

      {/* 3. A GAVETA (Invisível até você clicar no carrinho) */}
      <CarrinhoLateral />
    </div>
  );
}