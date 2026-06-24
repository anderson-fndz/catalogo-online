"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Save, Plus, Minus, Trash2, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EditarPedido() {
  const params = useParams();
  const pedidoId = params.id as string;
  const router = useRouter();

  const [pedido, setPedido] = useState<any>(null);
  const [itens, setItens] = useState<any[]>([]);
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Estados para injetar um Novo Item
  const [prodSelecionado, setProdSelecionado] = useState("");
  const [corSelecionada, setCorSelecionada] = useState("");
  const [tamSelecionado, setTamSelecionado] = useState("");

  useEffect(() => {
    async function carregarTudo() {
      // 1. Puxa o Pedido
      const { data: dadosPedido } = await supabase.from("pedidos").select("*").eq("id", pedidoId).single();
      if (dadosPedido) setPedido(dadosPedido);

      // 2. Puxa os Itens trazendo as opções de Cores e Tamanhos do Produto
      const { data: dadosItens } = await supabase
        .from("itens_pedido")
        .select(`*, produtos (nome, imagens, cores, grade_tamanhos)`)
        .eq("pedido_id", pedidoId);
      if (dadosItens) setItens(dadosItens);

      // 3. Puxa o Catálogo para a injeção lateral
      const { data: dadosCatalogo } = await supabase.from("produtos").select("id, nome, preco, cores, grade_tamanhos, imagens");
      if (dadosCatalogo) setCatalogo(dadosCatalogo);

      setCarregando(false);
    }
    carregarTudo();
  }, [pedidoId]);

  // ==========================================
  // LÓGICA DE EDIÇÃO NA TELA
  // ==========================================
  const alterarQuantidade = (itemId: string, delta: number) => {
    setItens(prev => prev.map(item => {
      if (item.id === itemId) return { ...item, quantidade: Math.max(1, item.quantidade + delta) };
      return item;
    }));
  };

  // Nova função para trocar a Cor ou Tamanho direto na linha do item
  const alterarVariacao = (itemId: string, campo: "cor_selecionada" | "tamanho_selecionado", valor: string) => {
    setItens(prev => prev.map(item =>
      item.id === itemId ? { ...item, [campo]: valor } : item
    ));
  };

  const removerItem = (itemId: string) => {
    setItens(prev => prev.filter(item => item.id !== itemId));
  };

  const adicionarNovoItem = () => {
    if (!prodSelecionado || !corSelecionada || !tamSelecionado) {
      alert("Preencha modelo, cor e tamanho para adicionar.");
      return;
    }

    const produtoRef = catalogo.find(p => p.id.toString() === prodSelecionado);
    
    const novoItem = {
      isNovo: true,
      id: `temp-${Date.now()}`, // ID temporário para a tela
      produto_id: produtoRef.id,
      quantidade: 1,
      preco_unitario: produtoRef.preco,
      cor_selecionada: corSelecionada,
      tamanho_selecionado: tamSelecionado,
      produtos: { 
        nome: produtoRef.nome, 
        imagens: produtoRef.imagens,
        cores: produtoRef.cores,
        grade_tamanhos: produtoRef.grade_tamanhos
      }
    };

    setItens([...itens, novoItem]);
    setProdSelecionado("");
    setCorSelecionada("");
    setTamSelecionado("");
  };

  // ==========================================
  // SALVAR TUDO NO BANCO (UPSERT PROFISSIONAL)
  // ==========================================
  async function salvarNoBanco() {
    setSalvando(true);
    try {
      const totalPecasEditado = itens.reduce((acc, item) => acc + item.quantidade, 0);
      const valorTotalEditado = itens.reduce((acc, item) => acc + (item.quantidade * item.preco_unitario), 0);

      // 1. Atualiza cabeçalho
      await supabase.from("pedidos").update({
        status: pedido.status,
        motivo_cancelamento: pedido.motivo_cancelamento,
        total_pecas: totalPecasEditado,
        valor_total: valorTotalEditado
      }).eq("id", pedidoId);

      // 2. Limpa os removidos
      const idsAntigosMantidos = itens.filter(i => !i.isNovo).map(i => i.id);
      if (idsAntigosMantidos.length > 0) {
        await supabase.from("itens_pedido").delete().eq("pedido_id", pedidoId).not("id", "in", `(${idsAntigosMantidos.join(",")})`);
      } else {
        await supabase.from("itens_pedido").delete().eq("pedido_id", pedidoId);
      }

      // 3. Insere os novos
      const itensParaInserir = itens.filter(i => i.isNovo).map(i => ({
        pedido_id: pedidoId,
        produto_id: Number(i.produto_id),
        quantidade: i.quantidade,
        preco_unitario: i.preco_unitario,
        cor_selecionada: i.cor_selecionada,
        tamanho_selecionado: i.tamanho_selecionado
      }));

      if (itensParaInserir.length > 0) {
        await supabase.from("itens_pedido").insert(itensParaInserir);
      }

      // 4. Atualiza os antigos (Quantidade, Cor e Tamanho editados)
      const itensParaAtualizar = itens.filter(i => !i.isNovo);
      for (const item of itensParaAtualizar) {
        await supabase.from("itens_pedido").update({ 
          quantidade: item.quantidade,
          cor_selecionada: item.cor_selecionada,
          tamanho_selecionado: item.tamanho_selecionado
        }).eq("id", item.id);
      }

      router.push("/admin/pedidos");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar as alterações no banco.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!pedido) return <div className="p-10 text-center font-bold">Pedido não encontrado.</div>;

  const totalPecas = itens.reduce((acc, item) => acc + item.quantidade, 0);
  const valorTotal = itens.reduce((acc, item) => acc + (item.quantidade * item.preco_unitario), 0);
  const produtoAtual = catalogo.find(p => p.id.toString() === prodSelecionado);

  return (
    <div className="min-h-screen bg-background pb-20 selection:bg-primary/10 selection:text-primary">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/60 pb-6 mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/admin/pedidos")} className="p-2 border border-border rounded-lg hover:bg-muted text-muted-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold font-serif text-foreground">Pedido #{pedidoId.substring(0, 6)}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Cliente: <span className="font-bold text-foreground">{pedido.cliente_nome}</span> ({pedido.cliente_whatsapp})
              </p>
            </div>
          </div>
          <div className="text-left md:text-right">
            <span className="text-xs text-muted-foreground block mb-1 uppercase tracking-widest font-bold">Faturamento Recalculado</span>
            <span className="text-3xl font-extrabold text-primary tracking-tight">R$ {valorTotal.toFixed(2).replace(".", ",")}</span>
          </div>
        </div>

        <div className="grid xl:grid-cols-3 gap-8 items-start">
          
          {/* LADO ESQUERDO: GRADE ATUAL DO PEDIDO */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-card border border-border/80 rounded-xl p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 flex justify-between items-center border-b border-border/50 pb-4">
                Grade da Nota <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">{totalPecas} peças</span>
              </h2>

              {itens.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground text-sm font-medium">Nenhum item na grade. Adicione no painel ao lado.</p>
              ) : (
                <div className="space-y-4">
                  {itens.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 border border-border/60 rounded-lg bg-background hover:border-primary/50 transition-colors items-center shadow-sm">
                      
                      <div className="w-16 h-20 rounded bg-muted overflow-hidden shrink-0 border border-border">
                        <img src={item.produtos?.imagens?.[0] || ""} alt="" className="w-full h-full object-cover" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-foreground truncate mb-1.5">{item.produtos?.nome}</h4>
                        
                        {/* EDIÇÃO INLINE: COR E TAMANHO */}
                        <div className="flex gap-2 text-xs font-medium text-muted-foreground">
                          <select 
                            value={item.cor_selecionada}
                            onChange={(e) => alterarVariacao(item.id, "cor_selecionada", e.target.value)}
                            className="bg-muted px-2 py-1 rounded border border-border/50 focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer text-[11px] font-bold text-foreground"
                          >
                            <option value={item.cor_selecionada}>{item.cor_selecionada} (Atual)</option>
                            {item.produtos?.cores?.filter((c: string) => c !== item.cor_selecionada).map((c: string) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>

                          <select 
                            value={item.tamanho_selecionado}
                            onChange={(e) => alterarVariacao(item.id, "tamanho_selecionado", e.target.value)}
                            className="bg-muted px-2 py-1 rounded border border-border/50 focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer text-[11px] font-bold text-foreground"
                          >
                            <option value={item.tamanho_selecionado}>{item.tamanho_selecionado} (Atual)</option>
                            {item.produtos?.grade_tamanhos?.filter((t: string) => t !== item.tamanho_selecionado).map((t: string) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* EDIÇÃO INLINE: QUANTIDADE */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button onClick={() => removerItem(item.id)} className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        
                        <div className="flex items-center border border-border rounded-lg h-8 bg-muted/20 overflow-hidden">
                          <button onClick={() => alterarQuantidade(item.id, -1)} className="w-7 h-full flex items-center justify-center hover:bg-muted border-r border-border text-foreground"><Minus className="h-3 w-3" /></button>
                          <span className="w-9 text-center text-xs font-bold text-foreground">{item.quantidade}</span>
                          <button onClick={() => alterarQuantidade(item.id, 1)} className="w-7 h-full flex items-center justify-center hover:bg-muted border-l border-border text-foreground"><Plus className="h-3 w-3" /></button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CONTROLE DE STATUS GERAL DA NOTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 bg-card border border-border/80 rounded-xl p-4 shadow-sm">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Status do Pedido</label>
                <select 
                  value={pedido.status} 
                  onChange={e => setPedido({...pedido, status: e.target.value})}
                  className="w-full border border-border/80 bg-background rounded-lg px-3 h-12 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="Novo">🔵 Novo (Pendente)</option>
                  <option value="Separando">🟡 Em Separação</option>
                  <option value="Enviado">🟢 Concluído / Enviado</option>
                  <option value="Cancelado">🔴 Cancelado</option>
                </select>
              </div>
              
              <Button onClick={salvarNoBanco} disabled={salvando || itens.length === 0} className="sm:flex-1 h-auto py-4 sm:py-0 mt-4 sm:mt-0 text-sm font-bold uppercase tracking-wider shadow-md bg-foreground text-background hover:bg-foreground/90 transition-all rounded-xl">
                {salvando ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="mr-2 h-5 w-5" /> Salvar Alterações</>}
              </Button>
            </div>
          </div>

          {/* LADO DIREITO: INJETAR NOVO ITEM NA NOTA */}
          <div className="bg-secondary/20 border border-border/80 rounded-xl p-6 shadow-sm xl:sticky xl:top-24">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2 border-b border-border/50 pb-4">
              <PackagePlus className="h-5 w-5 text-primary" /> Adicionar Peça
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">1. Escolha o Modelo</label>
                <select 
                  value={prodSelecionado} 
                  onChange={e => { setProdSelecionado(e.target.value); setCorSelecionada(""); setTamSelecionado(""); }}
                  className="w-full border border-border/80 bg-background rounded-lg px-3 h-11 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecione no catálogo...</option>
                  {catalogo.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>

              {produtoAtual && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="text-xs font-bold text-foreground mb-1.5 block">2. Cor</label>
                    <select value={corSelecionada} onChange={e => setCorSelecionada(e.target.value)} className="w-full border border-border/80 bg-background rounded-lg px-3 h-11 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="">Escolher...</option>
                      {produtoAtual.cores?.map((cor: string) => <option key={cor} value={cor}>{cor}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground mb-1.5 block">3. Tamanho</label>
                    <select value={tamSelecionado} onChange={e => setTamSelecionado(e.target.value)} className="w-full border border-border/80 bg-background rounded-lg px-3 h-11 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="">Escolher...</option>
                      {produtoAtual.grade_tamanhos?.map((tam: string) => <option key={tam} value={tam}>{tam}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <Button 
                onClick={adicionarNovoItem} 
                disabled={!prodSelecionado || !corSelecionada || !tamSelecionado} 
                variant="outline" 
                className="w-full h-12 mt-4 border-primary/40 text-primary hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
              >
                <Plus className="mr-2 h-4 w-4" /> Incluir na Grade
              </Button>
            </div>
            
            <div className="mt-6 pt-5 border-t border-border/50 text-[10px] text-muted-foreground text-center leading-relaxed">
              O novo item será precificado com o valor original do catálogo de atacado.
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}