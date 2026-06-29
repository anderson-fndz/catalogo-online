"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCarrinhoStore } from "@/store/carrinhoStore";
import { X, Trash2, Minus, Plus, ShoppingBag, Info, Loader2 } from "lucide-react";

const WHATSAPP_DESTINO = "5511961624287";

export function CarrinhoLateral() {
  const { itens, aberto, setAberto, alterarQuantidade, removerItem, limparCarrinho } = useCarrinhoStore();
  
  const [clienteNome, setClienteNome] = useState("");
  const [clienteWhatsapp, setClienteWhatsapp] = useState("");
  const [enviando, setEnviando] = useState(false);

  const totalPecas = itens.reduce((acc, item) => acc + item.quantidade, 0);
  const valorTotal = itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

  const handleFinalizarPedido = async () => {
    if (itens.length === 0) return;
    
    if (!clienteNome.trim()) {
      alert("Por favor, preencha o seu nome para registrarmos o pedido.");
      return;
    }

    setEnviando(true);

    try {
      // 1. SALVA O PEDIDO NO BANCO
      const { data: pedidoSalvo, error: erroPedido } = await supabase
        .from('pedidos')
        .insert([{
          cliente_nome: clienteNome,
          cliente_whatsapp: clienteWhatsapp || "Não informado",
          total_pecas: totalPecas,
          valor_total: valorTotal,
          status: 'Novo'
        }])
        .select()
        .single();

      if (erroPedido) throw erroPedido;

      // 2. SALVA OS ITENS
      const itensParaSalvar = itens.map((item: any) => ({
        pedido_id: pedidoSalvo.id,
        produto_id: Number(item.produtoId), 
        quantidade: item.quantidade,
        preco_unitario: item.preco,
        cor_selecionada: item.cor,
        tamanho_selecionado: item.tamanho
      }));

      const { error: erroItens } = await supabase.from('itens_pedido').insert(itensParaSalvar);
      if (erroItens) throw erroItens;

      // 3. MONTA A MENSAGEM DO WHATSAPP
      const pedidoAgrupado: Record<string, any> = {};

      itens.forEach((item) => {
        if (!pedidoAgrupado[item.nome]) {
          pedidoAgrupado[item.nome] = { nome: item.nome, preco: item.preco, tamanhos: {} };
        }
        if (!pedidoAgrupado[item.nome].tamanhos[item.tamanho]) {
          pedidoAgrupado[item.nome].tamanhos[item.tamanho] = [];
        }
        pedidoAgrupado[item.nome].tamanhos[item.tamanho].push({
          cor: item.cor,
          quantidade: item.quantidade
        });
      });

      let mensagem = `🛒 *NOVO PEDIDO - JORDAN COLLECTION*\n`;
      mensagem += `👤 *Cliente:* ${clienteNome}\n`;
      mensagem += `───────────────────────\n\n`;

      Object.values(pedidoAgrupado).forEach((produto: any, index) => {
        mensagem += `|👚| *${index + 1}. ${produto.nome}*\n`;
        mensagem += `(R$ ${Number(produto.preco).toFixed(2).replace(".", ",")} / un)\n\n`;

        Object.entries(produto.tamanhos).forEach(([tamanho, variacoes]: [string, any]) => {
          mensagem += `  🔵 *Tamanho ${tamanho}:*\n`;
          variacoes.forEach((v: any) => {
            mensagem += `    ▸ ${v.quantidade}x Cor: ${v.cor}\n`;
          });
          mensagem += `\n`;
        });
      });

      mensagem += `───────────────────────\n`;
      mensagem += `🔴 *RESUMO DO PEDIDO*\n`;
      mensagem += `• Total de peças: *${totalPecas}*\n`;
      mensagem += `• Valor final: *R$ ${valorTotal.toFixed(2).replace(".", ",")}*\n\n\n`;
      mensagem += ` _Aguardando confirmação de estoque para prosseguir com o pagamento._`;

      const textoCodificado = encodeURIComponent(mensagem);
      const linkWhatsApp = `https://api.whatsapp.com/send?phone=${WHATSAPP_DESTINO}&text=${textoCodificado}`;

      // 4. ABRE WHATSAPP E LIMPA O CARRINHO
      window.open(linkWhatsApp, "_blank");
      
      setClienteNome("");
      setClienteWhatsapp("");
      limparCarrinho();
      setAberto(false);

    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      alert("Ocorreu um erro ao processar seu pedido. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  // Se o carrinho não estiver aberto na store, não renderiza nada
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end font-sans">
      {/* Fundo escuro que fecha o carrinho se clicar fora */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={() => setAberto(false)}
      />

      {/* Gaveta do Carrinho */}
      <div className="relative w-full max-w-md h-full bg-background border-l border-border shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        
        {/* Cabeçalho */}
        <div className="p-6 border-b border-border/60 flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold font-serif text-foreground">Sua Sacola</h2>
            <span className="text-[10px] uppercase tracking-widest bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">
              {totalPecas} {totalPecas === 1 ? 'peça' : 'peças'}
            </span>
          </div>
          <button onClick={() => setAberto(false)} className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {itens.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-4">
              <ShoppingBag className="h-16 w-16 stroke-[1.5] opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest">Sua sacola está vazia</p>
              <p className="text-xs max-w-[200px] opacity-70">Adicione peças do catálogo para montar o seu lote.</p>
            </div>
          ) : (
            itens.map((item) => (
              <div key={item.id} className="flex gap-4 p-3 border border-border/60 rounded-xl bg-card shadow-sm items-center">
                <div className="w-16 h-20 rounded-lg bg-secondary/20 overflow-hidden shrink-0 border border-border/40">
                  <img src={item.imagem} alt={item.nome} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold font-serif text-foreground truncate">{item.nome}</h4>
                  <div className="flex gap-2 text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-1 mb-2">
                    <span className="bg-secondary/50 px-2 py-0.5 rounded border border-border/50">{item.cor}</span>
                    <span className="bg-secondary/50 px-2 py-0.5 rounded border border-border/50">Tam: {item.tamanho}</span>
                  </div>

                  <div className="flex items-center border border-border/80 rounded-lg h-8 w-24 bg-background overflow-hidden">
                    <button onClick={() => alterarQuantidade(item.id, item.quantidade - 1)} className="w-8 h-full flex items-center justify-center hover:bg-secondary/50 text-foreground transition-colors"><Minus className="h-3 w-3" /></button>
                    <span className="flex-1 text-center text-xs font-bold text-foreground border-x border-border/50 bg-secondary/10">{item.quantidade}</span>
                    <button onClick={() => alterarQuantidade(item.id, item.quantidade + 1)} className="w-8 h-full flex items-center justify-center hover:bg-secondary/50 text-foreground transition-colors"><Plus className="h-3 w-3" /></button>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                  <span className="text-sm font-bold text-foreground">
                    R$ {(item.preco * item.quantidade).toFixed(2).replace(".", ",")}
                  </span>
                  <button onClick={() => removerItem(item.id)} className="text-muted-foreground hover:text-destructive p-1.5 transition-colors hover:bg-destructive/10 rounded-full">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé Fixo (Checkout) */}
        {itens.length > 0 && (
          <div className="p-6 border-t border-border/60 bg-secondary/5 flex flex-col gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-3 shadow-sm">
              <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-800 leading-relaxed font-bold uppercase tracking-wider">
                Preencha os dados para enviar o pedido via WhatsApp.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <input 
                type="text" 
                placeholder="Seu Nome Completo *" 
                value={clienteNome} 
                onChange={e => setClienteNome(e.target.value)}
                className="w-full border border-border/80 bg-background rounded-lg px-4 h-11 text-sm focus:outline-none focus:border-primary transition-all font-medium"
                disabled={enviando}
              />
              <input 
                type="text" 
                placeholder="Seu WhatsApp (Opcional)" 
                value={clienteWhatsapp} 
                onChange={e => setClienteWhatsapp(e.target.value)}
                className="w-full border border-border/80 bg-background rounded-lg px-4 h-11 text-sm focus:outline-none focus:border-primary transition-all font-medium"
                disabled={enviando}
              />
            </div>

            <div className="flex justify-between items-end mt-2 mb-2">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Total do Lote:</span>
              <span className="text-2xl font-bold font-serif text-foreground tracking-tight">
                R$ {valorTotal.toFixed(2).replace(".", ",")}
              </span>
            </div>

            <button 
              onClick={handleFinalizarPedido}
              disabled={enviando}
              className="w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-[1.02] transition-all flex items-center justify-center disabled:opacity-50 disabled:hover:scale-100"
            >
              {enviando ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Enviar Pedido via WhatsApp"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}