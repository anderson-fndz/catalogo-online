"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, X, Trash2, Minus, Edit, DollarSign } from "lucide-react";

interface ModalCrmProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientesBase: any[];
  produtosBase: any[];
  grupoEdicao: any | null;
}

export default function ModalCrm({ isOpen, onClose, onSuccess, clientesBase, produtosBase, grupoEdicao }: ModalCrmProps) {
  const [salvando, setSalvando] = useState(false);
  
  const [tipoCliente, setTipoCliente] = useState<"existente" | "novo">("existente");
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoZap, setNovoZap] = useState("");
  const [novoEstado, setNovoEstado] = useState("");
  const [novoNomePacote, setNovoNomePacote] = useState(""); 
  const [dataVendaManual, setDataVendaManual] = useState(new Date().toISOString().split('T')[0]);

  const [itensLancamento, setItensLancamento] = useState<any[]>([]);
  const [prodSelecionado, setProdSelecionado] = useState("");
  const [corAtiva, setCorAtiva] = useState("");
  const [precoAplicado, setPrecoAplicado] = useState<number>(0);
  const [selecoesGrade, setSelecoesGrade] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    if (grupoEdicao) {
      setTipoCliente("existente");
      setClienteSelecionado(grupoEdicao.cliente.id);
      setDataVendaManual(grupoEdicao.data_compra.split('T')[0]);
      setItensLancamento(grupoEdicao.itens.map((i: any) => ({
        idTemp: Date.now() + Math.random(),
        produto_id: i.produto.id,
        nome: i.produto.nome,
        tecido: i.produto.tecido,
        cor: i.cor,
        tamanho: i.tamanho,
        quantidade: i.quantidade,
        preco_unitario: i.preco_unitario
      })));
    } else {
      setTipoCliente("existente"); setClienteSelecionado(""); setNovoNome(""); setNovoZap(""); setNovoEstado(""); setNovoNomePacote("");
      setItensLancamento([]); setProdSelecionado(""); setCorAtiva(""); setPrecoAplicado(0); setSelecoesGrade({});
      setDataVendaManual(new Date().toISOString().split('T')[0]);
    }
  }, [grupoEdicao, isOpen]);

  if (!isOpen) return null;

  const handleChangeProduto = (id: string) => {
    setProdSelecionado(id); setCorAtiva(""); setSelecoesGrade({});
    const prod = produtosBase.find(p => p.id.toString() === id);
    if (prod) setPrecoAplicado(prod.preco || 0);
  };

  const alterarQtdGrade = (tamanho: string, delta: number) => {
    setSelecoesGrade(prev => {
      const atual = prev[corAtiva]?.[tamanho] || 0;
      return { ...prev, [corAtiva]: { ...(prev[corAtiva] || {}), [tamanho]: Math.max(0, atual + delta) } };
    });
  };

  const adicionarGradeAoLancamento = () => {
    const prodRef = produtosBase.find(p => p.id.toString() === prodSelecionado);
    const novosItens: any[] = [];
    Object.keys(selecoesGrade).forEach(cor => {
      Object.keys(selecoesGrade[cor]).forEach(tam => {
        const qtd = selecoesGrade[cor][tam];
        if (qtd > 0) novosItens.push({ idTemp: Date.now() + Math.random(), produto_id: prodRef.id, nome: prodRef.nome, tecido: prodRef.tecido, cor: cor, tamanho: tam, quantidade: qtd, preco_unitario: precoAplicado });
      });
    });
    if (novosItens.length === 0) return alert("Selecione peças.");
    setItensLancamento([...itensLancamento, ...novosItens]);
    setProdSelecionado(""); setCorAtiva(""); setSelecoesGrade({}); setPrecoAplicado(0);
  };

  const handleSalvarVenda = async () => {
    if (itensLancamento.length === 0) return alert("Adicione peças.");
    setSalvando(true);
    try {
      let idDoCliente = clienteSelecionado;
      if (tipoCliente === "novo") {
        if (!novoNome || !novoZap) throw new Error("Nome e WhatsApp são obrigatórios.");
        const { data: clienteCriado, error: errCli } = await supabase.from("clientes").insert([{ nome: novoNome, whatsapp: novoZap, estado: novoEstado, nome_pacote: novoNomePacote || null }]).select().single();
        if (errCli) throw errCli;
        idDoCliente = clienteCriado.id;
      } else if (!idDoCliente) throw new Error("Selecione um cliente.");

      const dataFormatada = dataVendaManual ? `${dataVendaManual}T12:00:00Z` : undefined;
      const grupoIdParaSalvar = grupoEdicao?.id || crypto.randomUUID();

      if (grupoEdicao) await supabase.from("historico_compras").delete().eq("grupo_id", grupoEdicao.id);

      const insercoes = itensLancamento.map(item => ({
        cliente_id: idDoCliente, produto_id: item.produto_id, cor: item.cor, tamanho: item.tamanho, quantidade: item.quantidade, preco_unitario: item.preco_unitario, grupo_id: grupoIdParaSalvar, data_compra: dataFormatada
      }));

      const { error } = await supabase.from("historico_compras").insert(insercoes);
      if (error) throw error;
      
      onSuccess();
    } catch (error: any) {
      alert(error.message || "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const itensAgrupadosModal = itensLancamento.reduce((acc, item) => {
    const key = `${item.produto_id}-${item.cor}`;
    if (!acc[key]) acc[key] = { ...item, tamanhos: [], total_pecas: 0 };
    acc[key].tamanhos.push({ tam: item.tamanho, qtd: item.quantidade });
    acc[key].total_pecas += item.quantidade;
    return acc;
  }, {});

  const produtoSendoAdicionado = produtosBase.find(p => p.id.toString() === prodSelecionado);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 bg-secondary/20 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-lg font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
              {grupoEdicao ? <Edit size={18} className="text-primary"/> : <Plus size={18} className="text-primary"/>} {grupoEdicao ? "Editar Venda" : "Registrar Histórico (Atacado)"}
            </h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:bg-secondary p-2 rounded-lg transition-colors"><X size={20}/></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          <div className="space-y-4">
            {!grupoEdicao && (
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer"><input type="radio" checked={tipoCliente === "existente"} onChange={() => setTipoCliente("existente")} className="accent-primary" /> Cliente da Base</label>
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer"><input type="radio" checked={tipoCliente === "novo"} onChange={() => setTipoCliente("novo")} className="accent-primary" /> Novo Cliente</label>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tipoCliente === "existente" ? (
                <select value={clienteSelecionado} onChange={e => setClienteSelecionado(e.target.value)} className="w-full border border-border/80 rounded-lg px-3 h-10 text-sm bg-card focus:outline-none focus:border-primary font-bold">
                  <option value="">Selecione a cliente...</option>
                  {clientesBase.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.estado || 'S/E'})</option>)}
                </select>
              ) : (
                <>
                  <input type="text" placeholder="Nome *" value={novoNome} onChange={e => setNovoNome(e.target.value)} className="w-full border border-border/80 rounded-lg px-3 h-10 text-sm bg-card" />
                  <input type="text" placeholder="WhatsApp *" value={novoZap} onChange={e => setNovoZap(e.target.value)} className="w-full border border-border/80 rounded-lg px-3 h-10 text-sm bg-card" />
                  <div className="grid grid-cols-3 gap-2 col-span-1 md:col-span-2">
                    <input type="text" placeholder="UF *" value={novoEstado} onChange={e => setNovoEstado(e.target.value)} className="col-span-1 border border-border/80 rounded-lg px-3 h-10 text-sm bg-card uppercase" maxLength={2} />
                    <input type="text" placeholder="Nome no Pacote (Opcional)" value={novoNomePacote} onChange={e => setNovoNomePacote(e.target.value)} className="col-span-2 border border-border/80 rounded-lg px-3 h-10 text-sm bg-card" />
                  </div>
                </>
              )}
              <div className={tipoCliente === "existente" ? "col-span-1" : "col-span-1 md:col-span-2"}>
                <input type="date" value={dataVendaManual} onChange={e => setDataVendaManual(e.target.value)} className="w-full md:w-1/2 border border-border/80 rounded-lg px-3 h-10 text-sm bg-card focus:outline-none focus:border-primary font-bold" />
              </div>
            </div>
          </div>

          <div className="bg-secondary/10 border border-border/60 rounded-xl p-5 shadow-inner">
            <div className="flex flex-col md:flex-row gap-4 mb-5">
              <select value={prodSelecionado} onChange={e => handleChangeProduto(e.target.value)} className="flex-1 border border-border/80 rounded-lg px-3 h-11 text-sm bg-card focus:outline-none focus:border-primary font-bold shadow-sm">
                <option value="">Escolher Modelo...</option>
                {produtosBase.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <div className="w-full md:w-48 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><DollarSign size={14} className="text-muted-foreground"/></div>
                <input type="number" step="0.01" value={precoAplicado} onChange={e => setPrecoAplicado(Number(e.target.value))} className="w-full border border-border/80 rounded-lg pl-8 pr-3 h-11 text-sm bg-card font-bold focus:outline-none focus:border-primary shadow-sm" placeholder="Preço Cobrado"/>
              </div>
            </div>

            {produtoSendoAdicionado && (
              <div className="space-y-5 animate-in fade-in zoom-in-95 bg-background p-4 rounded-xl border border-border/50">
                <div className="flex gap-2 flex-wrap">
                  {produtoSendoAdicionado.cores?.map((cor: string) => (
                    <button key={cor} onClick={() => setCorAtiva(cor)} className={`px-4 py-2 rounded-full text-xs font-bold transition-all border shadow-sm ${corAtiva === cor ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/50 text-foreground border-border/80'}`}>{cor}</button>
                  ))}
                </div>
                {corAtiva && (
                  <div className="bg-card border border-border/50 rounded-xl overflow-hidden max-w-sm">
                    <div className="divide-y divide-border/50">
                      {produtoSendoAdicionado.grade_tamanhos?.map((tam: string) => {
                        const qtd = selecoesGrade[corAtiva]?.[tam] || 0;
                        return (
                          <div key={tam} className="flex justify-between items-center px-4 py-3 hover:bg-secondary/5">
                            <span className="font-bold text-sm text-foreground w-12">{tam}</span>
                            <div className="flex items-center border border-border/80 rounded-lg h-9 w-28 overflow-hidden bg-background">
                              <button onClick={() => alterarQtdGrade(tam, -1)} disabled={qtd === 0} className="flex-1 flex justify-center items-center hover:bg-secondary/50 disabled:opacity-30"><Minus size={14}/></button>
                              <span className="flex-1 text-center font-bold text-sm border-x border-border/50 bg-secondary/10">{qtd}</span>
                              <button onClick={() => alterarQtdGrade(tam, 1)} className="flex-1 flex justify-center items-center hover:bg-secondary/50"><Plus size={14}/></button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                <button onClick={adicionarGradeAoLancamento} className="bg-foreground text-background font-bold uppercase tracking-widest text-[10px] px-6 h-10 rounded-lg shadow transition-all flex items-center gap-2"><Plus size={14} /> Adicionar à Nota</button>
              </div>
            )}

            {Object.keys(itensAgrupadosModal).length > 0 && (
              <div className="mt-8 space-y-3 border-t border-border/50 pt-5">
                {Object.values(itensAgrupadosModal).map((agrupado: any, idx: number) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-background border border-border/50 p-4 rounded-xl text-sm shadow-sm gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5"><span className="font-bold text-base">{agrupado.nome}</span><span className="text-[10px] uppercase tracking-widest border border-border px-1.5 py-0.5 rounded">{agrupado.cor}</span></div>
                      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground"><span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">R$ {Number(agrupado.preco_unitario || 0).toFixed(2).replace('.',',')} un.</span><span className="border-l border-border pl-2">Tamanhos: {agrupado.tamanhos.map((t:any) => `${t.tam} (${t.qtd}x)`).join(', ')}</span></div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Subtotal</div>
                        <div className="font-extrabold text-foreground">R$ {(agrupado.total_pecas * (agrupado.preco_unitario || 0)).toFixed(2).replace('.',',')}</div>
                      </div>
                      <button onClick={() => setItensLancamento(itensLancamento.filter(i => !(i.produto_id === agrupado.produto_id && i.cor === agrupado.cor)))} className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive p-2 rounded-lg border border-border/50"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-5 border-t border-border/50 bg-card flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Total Peças</span><span className="text-lg font-extrabold text-foreground">{itensLancamento.reduce((acc, item) => acc + item.quantidade, 0)}</span></div>
            <div className="w-px h-8 bg-border/50"></div>
            <div><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Valor Total</span><span className="text-xl font-extrabold text-primary">R$ {itensLancamento.reduce((acc, item) => acc + (item.quantidade * (item.preco_unitario || 0)), 0).toFixed(2).replace('.', ',')}</span></div>
          </div>
          <button onClick={handleSalvarVenda} disabled={salvando} className="w-full sm:w-auto bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs px-8 py-3.5 rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2"><Loader2 className={`h-4 w-4 ${salvando ? "animate-spin" : "hidden"}`} /> Salvar Pedido Completo</button>
        </div>
      </div>
    </div>
  );
}