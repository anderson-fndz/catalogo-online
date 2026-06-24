"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase"; // Conexão com o banco de dados
import { useCarrinhoStore } from "@/store/carrinhoStore";
import { X, Trash2, Minus, Plus, ShoppingBag, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// 🔴 SEU NÚMERO DE WHATSAPP AQUI
const WHATSAPP_DESTINO = "5511961624287";

export function CarrinhoLateral() {
  const { itens, aberto, setAberto, alterarQuantidade, removerItem, limparCarrinho } = useCarrinhoStore();
  
  // Novos estados para capturar os dados do cliente
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
      // ==========================================
      // 1. SALVAR O PEDIDO NO SUPABASE (Visão Macro)
      // ==========================================
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

      // ==========================================
      // 2. SALVAR OS ITENS DO PEDIDO (Visão de Análise)
      // ==========================================
      // CORREÇÃO AQUI: Mudamos de item.id para item.produtoId (convertendo para Número)
      const itensParaSalvar = itens.map((item: any) => ({
        pedido_id: pedidoSalvo.id,
        produto_id: Number(item.produtoId), 
        quantidade: item.quantidade,
        preco_unitario: item.preco,
        cor_selecionada: item.cor,
        tamanho_selecionado: item.tamanho
      }));

      const { error: erroItens } = await supabase
        .from('itens_pedido')
        .insert(itensParaSalvar);

      if (erroItens) throw erroItens;

      // ==========================================
      // 3. MONTAR A MENSAGEM DO WHATSAPP
      // ==========================================
      const pedidoAgrupado: Record<string, {
        nome: string;
        preco: number;
        tamanhos: Record<string, { cor: string; quantidade: number }[]>
      }> = {};

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

      Object.values(pedidoAgrupado).forEach((produto, index) => {
        mensagem += `|👚| *${index + 1}. ${produto.nome}*\n`;
        mensagem += `(R$ ${Number(produto.preco).toFixed(2).replace(".", ",")} / un)\n\n`;

        Object.entries(produto.tamanhos).forEach(([tamanho, variacoes]) => {
          mensagem += `  🔵 *Tamanho ${tamanho}:*\n`;
          variacoes.forEach((v) => {
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

      // ==========================================
      // 4. ABRIR WHATSAPP E LIMPAR CARRINHO
      // ==========================================
      window.open(linkWhatsApp, "_blank");
      
      setClienteNome("");
      setClienteWhatsapp("");
      limparCarrinho(); // Limpa a memória local após salvar com sucesso no banco
      setAberto(false);

    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      alert("Ocorreu um erro ao processar seu pedido. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={() => setAberto(false)}
      />

      <div className="relative w-full max-w-md h-full bg-background border-l border-border shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
        
        {/* Cabeçalho */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Sua Cesta</h2>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
              {totalPecas} {totalPecas === 1 ? 'peça' : 'peças'}
            </span>
          </div>
          <button 
            onClick={() => setAberto(false)}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
          {itens.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-2">
              <ShoppingBag className="h-12 w-12 stroke-[1.5] opacity-40" />
              <p className="text-sm font-medium">Sua cesta está vazia no momento.</p>
              <p className="text-xs max-w-[200px]">Adicione peças do catálogo para montar seu pedido.</p>
            </div>
          ) : (
            itens.map((item) => (
              <div key={item.id} className="flex gap-4 p-3 border border-border rounded-lg bg-card shadow-sm items-center">
                <div className="w-16 h-20 rounded bg-muted overflow-hidden shrink-0 border border-border">
                  <img src={item.imagem} alt={item.nome} className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-foreground truncate">{item.nome}</h4>
                  <div className="flex gap-2 text-[11px] font-medium text-muted-foreground mt-0.5 mb-2">
                    <span className="bg-muted px-1.5 py-0.5 rounded">Cor: {item.cor}</span>
                    <span className="bg-muted px-1.5 py-0.5 rounded">Tam: {item.tamanho}</span>
                  </div>

                  <div className="flex items-center border border-border rounded h-7 w-24 bg-background">
                    <button 
                      onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}
                      className="w-7 h-full flex items-center justify-center hover:bg-muted text-foreground"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="flex-1 text-center text-xs font-bold text-foreground">{item.quantidade}</span>
                    <button 
                      onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
                      className="w-7 h-full flex items-center justify-center hover:bg-muted text-foreground"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                  <span className="text-sm font-bold text-foreground">
                    R$ {(item.preco * item.quantidade).toFixed(2).replace(".", ",")}
                  </span>
                  <button 
                    onClick={() => removerItem(item.id)}
                    className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé Fixo */}
        {itens.length > 0 && (
          <div className="p-6 border-t border-border bg-muted/20 flex flex-col gap-4">
            <div className="bg-emerald-50 border border-emerald-200/60 rounded-lg p-3.5 flex items-start gap-3 shadow-sm">
              <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                O pedido será enviado para o WhatsApp para confirmar o estoque. Preencha seus dados abaixo para registro.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <input 
                type="text" 
                placeholder="Seu Nome Completo *" 
                value={clienteNome} 
                onChange={e => setClienteNome(e.target.value)}
                className="w-full border border-border/80 bg-background rounded-lg px-3 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                disabled={enviando}
              />
              <input 
                type="text" 
                placeholder="Seu WhatsApp (Opcional)" 
                value={clienteWhatsapp} 
                onChange={e => setClienteWhatsapp(e.target.value)}
                className="w-full border border-border/80 bg-background rounded-lg px-3 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                disabled={enviando}
              />
            </div>

            <div className="flex justify-between items-end mt-2">
              <span className="text-sm text-muted-foreground font-medium">Subtotal final:</span>
              <span className="text-2xl font-extrabold text-foreground tracking-tight">
                R$ {valorTotal.toFixed(2).replace(".", ",")}
              </span>
            </div>

            <Button 
              onClick={handleFinalizarPedido}
              disabled={enviando}
              className="w-full py-6 text-base font-bold uppercase tracking-wider shadow-md bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-[1.02] transition-all"
            >
              {enviando ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Enviar Pedido via WhatsApp"}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}