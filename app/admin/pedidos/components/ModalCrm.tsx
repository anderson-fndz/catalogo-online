"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, X, Trash2, Minus, Edit, DollarSign, Image as ImageIcon } from "lucide-react";

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
  const [coresBanco, setCoresBanco] = useState<any[]>([]); 
  const [tamanhoSendoEditado, setTamanhoSendoEditado] = useState<string | null>(null); // Controla qual tamanho exibe os botões +/-
  
  const [tipoCliente, setTipoCliente] = useState<"existente" | "novo">("existente");
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoZap, setNovoZap] = useState("");
  const [novoEstado, setNovoEstado] = useState("");
  const [novoNomePacote, setNovoNomePacote] = useState(""); 
  const [dataVendaManual, setDataVendaManual] = useState(new Date().toISOString().split('T')[0]);

  const [filtroTecidoModal, setFiltroTecidoModal] = useState("");
  const [itensLancamento, setItensLancamento] = useState<any[]>([]);
  const [prodSelecionado, setProdSelecionado] = useState("");
  const [corAtiva, setCorAtiva] = useState("");
  const [precoAplicado, setPrecoAplicado] = useState<number | "">("");
  const [selecoesGrade, setSelecoesGrade] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    async function carregarCoresDoBanco() {
      const { data } = await supabase.from("cores").select("*");
      if (data) setCoresBanco(data);
    }

    if (isOpen) {
      carregarCoresDoBanco();
      setFiltroTecidoModal("");
      setTamanhoSendoEditado(null);

      if (grupoEdicao) {
        setTipoCliente("existente");
        setClienteSelecionado(grupoEdicao.cliente.id);
        setDataVendaManual(grupoEdicao.data_compra.split('T')[0]);
        setItensLancamento(grupoEdicao.itens.map((i: any) => ({
          idTemp: Date.now() + Math.random(),
          produto_id: i.produto.id,
          nome: i.produto.nome,
          tecido: i.produto.tecido,
          imagens: i.produto.imagens, 
          cor: i.cor,
          tamanho: i.tamanho,
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario
        })));
      } else {
        setTipoCliente("existente"); setClienteSelecionado(""); setNovoNome(""); setNovoZap(""); setNovoEstado(""); setNovoNomePacote("");
        setItensLancamento([]); setProdSelecionado(""); setCorAtiva(""); setPrecoAplicado(""); setSelecoesGrade({});
        setDataVendaManual(new Date().toISOString().split('T')[0]);
      }
    }
  }, [grupoEdicao, isOpen]);

  if (!isOpen) return null;

  const encontrarHexCor = (nomeCor: string) => {
    const corAchada = coresBanco.find(c => c.nome?.toLowerCase().trim() === nomeCor.toLowerCase().trim());
    return corAchada?.hex || '#cbd5e1'; 
  };

  const getCorDoTexto = (hexColor: string) => {
    const hex = hexColor.replace('#', '');
    if (hex.length !== 6) return '#ffffff';
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#111827' : '#ffffff'; 
  };

  const tecidosUnicos = Array.from(new Set(produtosBase.map(p => p.tecido).filter(Boolean)));
  const produtosFiltrados = produtosBase.filter(p => !filtroTecidoModal || p.tecido === filtroTecidoModal);

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

  const pecasSendoSelecionadas = Object.values(selecoesGrade).reduce((acc, tamanhos) => acc + Object.values(tamanhos).reduce((sum, qtd) => sum + qtd, 0), 0);

  const adicionarGradeAoLancamento = () => {
    if (pecasSendoSelecionadas === 0) return alert("Selecione pelo menos uma peça na grade.");
    
    const prodRef = produtosBase.find(p => p.id.toString() === prodSelecionado);
    const novosItens: any[] = [];
    
    Object.keys(selecoesGrade).forEach(cor => {
      Object.keys(selecoesGrade[cor]).forEach(tam => {
        const qtd = selecoesGrade[cor][tam];
        if (qtd > 0) novosItens.push({ 
          idTemp: Date.now() + Math.random(), 
          produto_id: prodRef.id, 
          nome: prodRef.nome, 
          tecido: prodRef.tecido,
          imagens: prodRef.imagens, 
          cor: cor, 
          tamanho: tam, 
          quantidade: qtd, 
          preco_unitario: Number(precoAplicado) || 0 
        });
      });
    });

    setItensLancamento(prev => {
      let copia = [...prev];
      novosItens.forEach(novo => {
        const index = copia.findIndex(i => i.produto_id === novo.produto_id && i.tamanho === novo.tamanho && i.cor === novo.cor);
        if (index >= 0) copia[index].quantidade += novo.quantidade;
        else copia.push(novo);
      });
      return copia;
    });

    setProdSelecionado(""); setCorAtiva(""); setSelecoesGrade({}); setPrecoAplicado(""); setFiltroTecidoModal("");
  };

  const alterarPrecoAgrupado = (produto_id: string, tamanho: string, novoPreco: number) => {
    setItensLancamento(prev => prev.map(item => {
      if (item.produto_id === produto_id && item.tamanho === tamanho) return { ...item, preco_unitario: novoPreco };
      return item;
    }));
  };

  // Altera a quantidade direto pelas ações de clique no painel expandido do resumo
  const alterarQtdLancamento = (produto_id: string, tamanho: string, cor: string, delta: number) => {
    setItensLancamento(prev => prev.map(item => {
      if (item.produto_id === produto_id && item.tamanho === tamanho && item.cor === cor) {
        return { ...item, quantity_fixed: true, quantidade: Math.max(0, item.quantidade + delta) };
      }
      return item;
    }).filter(item => item.quantidade > 0));
  };

  const removerProdutoInteiro = (produto_id: string) => {
    setItensLancamento(prev => prev.filter(item => item.produto_id !== produto_id));
  };

  const handleSalvarVenda = async () => {
    if (itensLancamento.length === 0) return alert("Adicione peças à nota.");
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
      
      if (grupoEdicao) {
        if (grupoEdicao.grupo_id) {
          await supabase.from("historico_compras").delete().eq("grupo_id", grupoEdicao.grupo_id);
        } else {
          await supabase.from("historico_compras").delete().eq("cliente_id", grupoEdicao.cliente.id).eq("data_compra", grupoEdicao.data_compra).is("grupo_id", null);
        }
      }

      const grupoIdParaSalvar = grupoEdicao?.grupo_id || crypto.randomUUID();

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

  const agrupamentoMestre = itensLancamento.reduce((acc, item) => {
    if (!acc[item.produto_id]) {
      acc[item.produto_id] = {
        produto_id: item.produto_id,
        nome: item.nome,
        imagens: item.imagens,
        tamanhos: {} as Record<string, { preco_unitario: number, cores: Record<string, number>, total_tamanho: number }>,
        total_pecas_produto: 0,
        valor_total_produto: 0
      };
    }
    if (!acc[item.produto_id].tamanhos[item.tamanho]) {
      acc[item.produto_id].tamanhos[item.tamanho] = { preco_unitario: item.preco_unitario, cores: {}, total_tamanho: 0 };
    }
    if (!acc[item.produto_id].tamanhos[item.tamanho].cores[item.cor]) {
      acc[item.produto_id].tamanhos[item.tamanho].cores[item.cor] = 0;
    }
    acc[item.produto_id].tamanhos[item.tamanho].cores[item.cor] += item.quantidade;
    acc[item.produto_id].tamanhos[item.tamanho].total_tamanho += item.quantidade;
    acc[item.produto_id].total_pecas_produto += item.quantidade;
    acc[item.produto_id].valor_total_produto += (item.quantidade * item.preco_unitario);
    return acc;
  }, {} as Record<string, any>);

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
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">Adicionar Peças à Nota</h4>
            
            <div className="flex flex-col md:flex-row gap-4 mb-5">
              <select value={filtroTecidoModal} onChange={e => {setFiltroTecidoModal(e.target.value); setProdSelecionado("")}} className="w-full md:w-48 border border-border/80 rounded-lg px-3 h-11 text-sm bg-card focus:outline-none focus:border-primary font-bold text-primary">
                <option value="">Filtro: Todos</option>
                {tecidosUnicos.map((tec: any) => <option key={tec} value={tec}>{tec}</option>)}
              </select>

              <select value={prodSelecionado} onChange={e => handleChangeProduto(e.target.value)} className="flex-1 border border-border/80 rounded-lg px-3 h-11 text-sm bg-card focus:outline-none focus:border-primary font-bold">
                <option value="">Escolher Modelo...</option>
                {produtosFiltrados.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              
              <div className="w-full md:w-40 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><DollarSign size={14} className="text-muted-foreground"/></div>
                <input type="number" step="0.01" value={precoAplicado} onChange={e => setPrecoAplicado(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-border/80 rounded-lg pl-8 pr-3 h-11 text-sm bg-card font-bold focus:outline-none" placeholder="Preço"/>
              </div>
            </div>

            {produtoSendoAdicionado && (
              <div className="space-y-5 animate-in fade-in zoom-in-95 bg-background p-4 rounded-xl border border-border/50">
                <div className="flex gap-2 flex-wrap">
                  {produtoSendoAdicionado.cores?.map((cor: string) => {
                    const bgHex = encontrarHexCor(cor);
                    const isAtiva = corAtiva === cor;
                    return (
                      <button 
                        key={cor} 
                        onClick={() => setCorAtiva(cor)} 
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all border shadow-sm flex items-center gap-2 ${isAtiva ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:scale-105'}`}
                        style={{ backgroundColor: bgHex, color: getCorDoTexto(bgHex), borderColor: isAtiva ? bgHex : '#00000020' }}
                      >
                        {cor}
                      </button>
                    )
                  })}
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
                <div className="flex items-center gap-4">
                  <button onClick={adicionarGradeAoLancamento} className="bg-foreground text-background font-bold uppercase tracking-widest text-[10px] px-6 h-10 rounded-lg shadow transition-all flex items-center gap-2"><Plus size={14} /> Adicionar à Nota</button>
                  {pecasSendoSelecionadas > 0 && <span className="text-xs font-bold text-primary animate-pulse">+{pecasSendoSelecionadas} peças selecionadas</span>}
                </div>
              </div>
            )}

            {/* RESUMO MESTRE REESTRUTURADO E SEGURO */}
            {Object.keys(agrupamentoMestre).length > 0 && (
              <div className="mt-8 space-y-4 border-t border-border/50 pt-6">
                {Object.values(agrupamentoMestre).map((produto: any) => {
                  // Lê de forma segura a coluna de array text[]
                  const capaUrl = (produto.imagens && Array.isArray(produto.imagens)) ? produto.imagens[0] : null;
                  
                  return (
                    <div key={produto.produto_id} className="bg-background border border-border/60 rounded-xl overflow-hidden shadow-sm">
                      <div className="flex items-center gap-4 bg-secondary/20 p-3 border-b border-border/50">
                        {capaUrl ? (
                          <img src={capaUrl} alt={produto.nome} className="w-12 h-12 rounded object-cover border border-border/50" />
                        ) : (
                          <div className="w-12 h-12 bg-secondary/50 rounded flex items-center justify-center text-muted-foreground"><ImageIcon size={20}/></div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-bold text-base text-foreground line-clamp-1">{produto.nome}</h4>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mt-0.5">
                            {produto.total_pecas_produto} peças | R$ {produto.valor_total_produto.toFixed(2).replace('.', ',')}
                          </div>
                        </div>
                        <button onClick={() => removerProdutoInteiro(produto.produto_id)} className="p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors mr-1"><Trash2 size={18}/></button>
                      </div>

                      <div className="divide-y divide-border/30">
                        {Object.entries(produto.tamanhos).map(([tam, dadosTam]: any) => {
                          const isEditandoEsseTamanho = tamanhoSendoEditado === `${produto.produto_id}-${tam}`;
                          
                          return (
                            <div key={tam} className="p-4 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-[10px] uppercase tracking-widest border border-border px-2 py-1 rounded font-bold bg-secondary/30 w-16 text-center">TAM: {tam}</span>
                                <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                                  <span className="text-primary font-bold text-xs">R$</span>
                                  <input 
                                    type="number" 
                                    step="0.01" 
                                    value={dadosTam.preco_unitario === 0 ? "0" : dadosTam.preco_unitario || ""} 
                                    onChange={(e) => alterarPrecoAgrupado(produto.produto_id, tam, Number(e.target.value))}
                                    className="w-12 bg-transparent text-primary font-bold text-xs text-center focus:outline-none"
                                  />
                                </div>
                                
                                {/* Botão discreto para revelar os botões de +/- */}
                                <button 
                                  onClick={() => setTamanhoSendoEditado(isEditandoEsseTamanho ? null : `${produto.produto_id}-${tam}`)}
                                  className={`text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded border transition-all ${isEditandoEsseTamanho ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
                                >
                                  {isEditandoEsseTamanho ? "Fechar" : "Ajustar Grade"}
                                </button>
                              </div>

                              <div className="flex-1 flex flex-wrap gap-2 md:pl-4 md:border-l md:border-border/50 justify-end">
                                {Object.entries(dadosTam.cores).map(([cor, qtd]: any) => {
                                  const bgHex = encontrarHexCor(cor);
                                  const textHex = getCorDoTexto(bgHex);
                                  
                                  return (
                                    <div key={cor} className="flex items-center rounded-full border shadow-sm h-7 overflow-hidden transition-all text-[10px] font-bold tracking-wide" style={{ backgroundColor: bgHex, color: textHex, borderColor: '#00000015' }}>
                                      <span className="px-3">{cor}</span>
                                      
                                      {/* Se o painel não estiver ativado, exibe a etiqueta de quantidade limpa */}
                                      {!isEditandoEsseTamanho ? (
                                        <span className="pr-3 font-extrabold opacity-80">({qtd}x)</span>
                                      ) : (
                                        <div className="flex items-center h-full border-l" style={{ borderColor: `${textHex}30`, backgroundColor: `${textHex}10` }}>
                                          <button onClick={() => alterarQtdLancamento(produto.produto_id, tam, cor, -1)} className="px-2 h-full hover:bg-black/10">-</button>
                                          <span className="font-extrabold w-4 text-center">{qtd}</span>
                                          <button onClick={() => alterarQtdLancamento(produto.produto_id, tam, cor, 1)} className="px-2 h-full hover:bg-black/10">+</button>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
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