"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { Loader2, Users, ShoppingBag, Filter, MessageCircle, Plus, MapPin, Calendar, Scissors, X, Edit, Trash2, BusFront } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PedidosECrmPage() {
  const router = useRouter();
  const [abaAtiva, setAbaAtiva] = useState<"fila" | "crm">("fila");
  const [carregando, setCarregando] = useState(true);

  // Estados de Dados
  const [pedidosAtuais, setPedidosAtuais] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);

  // Estados do Modal de Lançamento (CRM)
  const [isModalAberto, setIsModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [tipoCliente, setTipoCliente] = useState<"existente" | "novo">("existente");
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoZap, setNovoZap] = useState("");
  const [novoEstado, setNovoEstado] = useState("");
  const [novoNomePacote, setNovoNomePacote] = useState(""); // NOVO CAMPO
  const [dataVendaManual, setDataVendaManual] = useState(new Date().toISOString().split('T')[0]);

  // Mini-carrinho interno do Modal
  const [itensLancamento, setItensLancamento] = useState<any[]>([]);
  const [prodSelecionado, setProdSelecionado] = useState("");
  const [corComprada, setCorComprada] = useState("");
  const [qtdComprada, setQtdComprada] = useState(1);

  // Estados dos Filtros do CRM
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroTecido, setFiltroTecido] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroAno, setFiltroAno] = useState("");

  useEffect(() => {
    carregarDadosBase();
  }, []);

  async function carregarDadosBase() {
    setCarregando(true);
    
    const [resPedidos, resClientes, resProdutos, resHistorico] = await Promise.all([
      // 1. Puxa a fila de pedidos reais da loja
      supabase.from("pedidos").select("*").order("created_at", { ascending: false }),
      // 2. Puxa Clientes e Produtos
      supabase.from("clientes").select("*").order("nome", { ascending: true }),
      supabase.from("produtos").select("id, nome, tecido, cores").order("nome", { ascending: true }),
      // 3. Puxa o CRM
      supabase.from("historico_compras").select(`
        id, cor, quantidade, data_compra,
        cliente:clientes(id, nome, whatsapp, estado, nome_pacote),
        produto:produtos(id, nome, tecido)
      `).order("data_compra", { ascending: false })
    ]);

    if (resPedidos.data) setPedidosAtuais(resPedidos.data);
    if (resClientes.data) setClientes(resClientes.data);
    if (resProdutos.data) setProdutos(resProdutos.data);
    if (resHistorico.data) setHistorico(resHistorico.data);

    setCarregando(false);
  }

  // --- LÓGICA DO MINI CARRINHO DO MODAL ---
  const adicionarItemAoLancamento = () => {
    if (!prodSelecionado || !corComprada || qtdComprada < 1) return alert("Preencha o produto, cor e quantidade.");
    
    const prodRef = produtos.find(p => p.id.toString() === prodSelecionado);
    setItensLancamento([...itensLancamento, { 
      idTemp: Date.now(), 
      produto_id: prodRef.id, 
      nome: prodRef.nome, 
      tecido: prodRef.tecido, 
      cor: corComprada, 
      quantidade: qtdComprada 
    }]);
    
    // Reseta pra próxima peça
    setProdSelecionado(""); setCorComprada(""); setQtdComprada(1);
  };

  const removerItemDoLancamento = (idTemp: number) => {
    setItensLancamento(itensLancamento.filter(i => i.idTemp !== idTemp));
  };

  // --- SALVAR A VENDA MANUAL (CRM) ---
  const handleSalvarVenda = async () => {
    if (itensLancamento.length === 0) return alert("Adicione pelo menos uma peça ao histórico.");
    
    setSalvando(true);
    try {
      let idDoCliente = clienteSelecionado;

      if (tipoCliente === "novo") {
        if (!novoNome || !novoZap) throw new Error("Nome e WhatsApp são obrigatórios.");
        const { data: clienteCriado, error: errCli } = await supabase
          .from("clientes")
          .insert([{ 
            nome: novoNome, 
            whatsapp: novoZap, 
            estado: novoEstado,
            nome_pacote: novoNomePacote || null 
          }])
          .select().single();
        if (errCli) throw errCli;
        idDoCliente = clienteCriado.id;
      } else {
        if (!idDoCliente) throw new Error("Selecione um cliente.");
      }

      // Monta o array com todas as peças para inserir de uma vez
      const dataFormatada = dataVendaManual ? `${dataVendaManual}T12:00:00Z` : undefined;
      const insercoes = itensLancamento.map(item => ({
        cliente_id: idDoCliente,
        produto_id: item.produto_id,
        cor: item.cor,
        quantidade: item.quantidade,
        data_compra: dataFormatada
      }));

      const { error: errHist } = await supabase.from("historico_compras").insert(insercoes);
      if (errHist) throw errHist;

      // Limpa e fecha o modal
      setNovoNome(""); setNovoZap(""); setNovoEstado(""); setNovoNomePacote(""); setItensLancamento([]);
      setIsModalAberto(false);
      alert("Histórico registrado com sucesso!");
      carregarDadosBase();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao salvar histórico.");
    } finally {
      setSalvando(false);
    }
  };

  const abrirWhatsAppRemarketing = (clienteNome: string, zap: string, tecido: string) => {
    const mensagem = `Oi ${clienteNome}, tudo bem? Aqui é da Jordan Collection! ✨\n\nLembrei de você porque chegou reposição e modelos novos incríveis no tecido ${tecido || 'que você adora'}.\n\nPosso te mandar as fotos pra você dar uma olhadinha?`;
    const numeroLimpo = zap.replace(/\D/g, '');
    window.open(`https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  // --- FILTROS DO CRM ---
  const historicoFiltrado = historico.filter(item => {
    let passaEstado = true, passaTecido = true, passaMes = true, passaAno = true;
    
    if (filtroEstado) passaEstado = item.cliente?.estado === filtroEstado;
    if (filtroTecido) passaTecido = item.produto?.tecido === filtroTecido;
    
    if (filtroMes || filtroAno) {
      const data = new Date(item.data_compra);
      if (filtroMes) passaMes = (data.getMonth() + 1).toString() === filtroMes;
      if (filtroAno) passaAno = data.getFullYear().toString() === filtroAno;
    }

    return passaEstado && passaTecido && passaMes && passaAno;
  });

  if (carregando) return <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="text-sm font-serif text-muted-foreground animate-pulse">Carregando painel...</p></div>;

  const coresDisponiveisForm = produtos.find(p => p.id.toString() === prodSelecionado)?.cores || [];
  const tecidosUnicos = Array.from(new Set(produtos.map(p => p.tecido).filter(Boolean)));
  const estadosUnicos = Array.from(new Set(clientes.map(c => c.estado).filter(Boolean)));
  const meses = ["1","2","3","4","5","6","7","8","9","10","11","12"];
  const anosUnicos = Array.from(new Set(historico.map(h => new Date(h.data_compra).getFullYear().toString())));

  return (
    <div className="min-h-screen pb-16 bg-background selection:bg-primary/10 selection:text-primary">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* CABEÇALHO E ABAS */}
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

        {/* ========================================= */}
        {/* ABA: FILA DE PEDIDOS REAIS DA LOJA        */}
        {/* ========================================= */}
        {abaAtiva === "fila" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border/50 bg-secondary/10 flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                  <ShoppingBag size={18} className="text-primary"/> Acompanhamento Diário
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/50 bg-secondary/5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <th className="p-4 pl-6">Pedido</th>
                      <th className="p-4">Cliente</th>
                      <th className="p-4">Data</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Valor</th>
                      <th className="p-4 text-center pr-6">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 text-sm">
                    {pedidosAtuais.length === 0 ? (
                      <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">Nenhum pedido na fila.</td></tr>
                    ) : (
                      pedidosAtuais.map(pedido => (
                        <tr key={pedido.id} className="hover:bg-secondary/5 transition-colors">
                          <td className="p-4 pl-6 font-bold font-serif">#{pedido.id.substring(0,6)}</td>
                          <td className="p-4">
                            <div className="font-bold text-foreground">{pedido.cliente_nome}</div>
                            <div className="text-[10px] text-muted-foreground">{pedido.cliente_whatsapp}</div>
                          </td>
                          <td className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            {format(new Date(pedido.created_at), "dd MMM yy", { locale: ptBR })}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${
                              pedido.status === 'Novo' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 
                              pedido.status === 'Enviado' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                              'bg-secondary text-foreground border-border'
                            }`}>
                              {pedido.status}
                            </span>
                          </td>
                          <td className="p-4 text-right font-bold text-primary">R$ {Number(pedido.valor_total || 0).toFixed(2).replace('.', ',')}</td>
                          <td className="p-4 text-center pr-6">
                            <button onClick={() => router.push(`/admin/pedidos/${pedido.id}`)} className="text-muted-foreground hover:text-primary transition-colors p-2 bg-secondary/50 hover:bg-secondary rounded-lg border border-border/50">
                              <Edit size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* ABA: CRM DE RECOMPRA E PROSPECÇÃO         */}
        {/* ========================================= */}
        {abaAtiva === "crm" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border/50 bg-secondary/10 flex flex-col md:flex-row gap-4 justify-between md:items-center">
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Garimpar Oportunidades</h3>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={() => setIsModalAberto(true)} className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2 mr-2">
                    <Plus size={14} /> Registrar Venda Antiga
                  </button>

                  <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="border border-border/80 rounded-lg px-3 h-9 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background focus:outline-none focus:border-primary">
                    <option value="">🌎 Estado</option>
                    {estadosUnicos.map((est: any) => <option key={est} value={est}>{est}</option>)}
                  </select>
                  
                  <select value={filtroTecido} onChange={e => setFiltroTecido(e.target.value)} className="border border-border/80 rounded-lg px-3 h-9 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background focus:outline-none focus:border-primary">
                    <option value="">🧵 Tecido</option>
                    {tecidosUnicos.map((tec: any) => <option key={tec} value={tec}>{tec}</option>)}
                  </select>

                  <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} className="border border-border/80 rounded-lg px-3 h-9 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background focus:outline-none focus:border-primary">
                    <option value="">📅 Mês</option>
                    {meses.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>

                  <select value={filtroAno} onChange={e => setFiltroAno(e.target.value)} className="border border-border/80 rounded-lg px-3 h-9 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background focus:outline-none focus:border-primary">
                    <option value="">⏳ Ano</option>
                    {anosUnicos.map((a: any) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              {/* TABELA DE RESULTADOS CRM */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/50 bg-secondary/5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <th className="p-4 pl-6"><div className="flex items-center gap-1.5"><Users size={14}/> Cliente</div></th>
                      <th className="p-4"><div className="flex items-center gap-1.5"><MapPin size={14}/> UF</div></th>
                      <th className="p-4"><div className="flex items-center gap-1.5"><Scissors size={14}/> Peça Comprada</div></th>
                      <th className="p-4"><div className="flex items-center gap-1.5"><Calendar size={14}/> Data Pagamento</div></th>
                      <th className="p-4 text-center pr-6">Ação de Venda</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 text-sm">
                    {historicoFiltrado.length === 0 ? (
                      <tr><td colSpan={5} className="p-10 text-center text-muted-foreground text-sm">Nenhum histórico encontrado para estes filtros.</td></tr>
                    ) : (
                      historicoFiltrado.map((item) => (
                        <tr key={item.id} className="hover:bg-secondary/5 transition-colors">
                          <td className="p-4 pl-6">
                            <div className="font-bold text-foreground">{item.cliente?.nome}</div>
                            <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{item.cliente?.whatsapp}</div>
                            {item.cliente?.nome_pacote && (
                              <div className="text-[9px] mt-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded-sm inline-flex items-center gap-1 uppercase tracking-widest font-bold">
                                <BusFront size={10} /> Pacote: {item.cliente.nome_pacote}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="bg-secondary/50 text-foreground border border-border/50 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
                              {item.cliente?.estado || 'N/I'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-sm line-clamp-1">{item.produto?.nome || 'Produto Excluído'}</div>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[9px] text-primary uppercase tracking-widest font-bold">{item.produto?.tecido}</span>
                              <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold border-l border-border pl-2">Cor: {item.cor}</span>
                              <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold border-l border-border pl-2">Qtd: {item.quantidade}</span>
                            </div>
                          </td>
                          <td className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            {format(new Date(item.data_compra), "dd MMM yy", { locale: ptBR })}
                            <div className="text-[9px] mt-0.5 text-amber-600">
                              {differenceInDays(new Date(), new Date(item.data_compra))} dias atrás
                            </div>
                          </td>
                          <td className="p-4 text-center pr-6">
                            <button 
                              onClick={() => abrirWhatsAppRemarketing(item.cliente?.nome, item.cliente?.whatsapp, item.produto?.tecido)}
                              title="Enviar oferta no WhatsApp"
                              className="bg-[#25D366] hover:bg-[#1ebd5a] text-white p-2 rounded-xl shadow-sm transition-all hover:scale-110 inline-flex"
                            >
                              <MessageCircle size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        )}
      </main>

      {/* ========================================= */}
      {/* MODAL DE LANÇAMENTO MANUAL (Para Atacado) */}
      {/* ========================================= */}
      {isModalAberto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="px-6 py-4 border-b border-border/50 bg-secondary/20 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                  <Plus size={18} className="text-primary"/> Registrar Histórico (Atacado)
                </h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Alimente o CRM para prospecção futura.</p>
              </div>
              <button onClick={() => setIsModalAberto(false)} className="text-muted-foreground hover:bg-secondary p-2 rounded-lg transition-colors"><X size={20}/></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8">
              
              {/* BLOCO 1: CLIENTE E DATA */}
              <div className="space-y-4">
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                    <input type="radio" checked={tipoCliente === "existente"} onChange={() => setTipoCliente("existente")} className="accent-primary" /> Cliente da Base
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                    <input type="radio" checked={tipoCliente === "novo"} onChange={() => setTipoCliente("novo")} className="accent-primary" /> Novo Cliente
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tipoCliente === "existente" ? (
                    <select value={clienteSelecionado} onChange={e => setClienteSelecionado(e.target.value)} className="w-full border border-border/80 rounded-lg px-3 h-10 text-sm bg-card focus:outline-none focus:border-primary">
                      <option value="">Selecione a cliente...</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.estado || 'Sem Estado'})</option>)}
                    </select>
                  ) : (
                    <>
                      <input type="text" placeholder="Nome da Loja/Cliente *" value={novoNome} onChange={e => setNovoNome(e.target.value)} className="w-full border border-border/80 rounded-lg px-3 h-10 text-sm bg-card focus:outline-none focus:border-primary" />
                      <input type="text" placeholder="WhatsApp *" value={novoZap} onChange={e => setNovoZap(e.target.value)} className="w-full border border-border/80 rounded-lg px-3 h-10 text-sm bg-card focus:outline-none focus:border-primary" />
                      
                      {/* Grid interno para os campos complementares */}
                      <div className="grid grid-cols-3 gap-2 col-span-1 md:col-span-2">
                        <input type="text" placeholder="UF (Ex: SP) *" value={novoEstado} onChange={e => setNovoEstado(e.target.value)} className="col-span-1 border border-border/80 rounded-lg px-3 h-10 text-sm bg-card focus:outline-none focus:border-primary uppercase" maxLength={2} />
                        <input type="text" placeholder="Nome no Pacote (Opcional - Excursão)" value={novoNomePacote} onChange={e => setNovoNomePacote(e.target.value)} className="col-span-2 border border-border/80 rounded-lg px-3 h-10 text-sm bg-card focus:outline-none focus:border-primary" />
                      </div>
                    </>
                  )}
                  
                  <div className={tipoCliente === "existente" ? "col-span-1" : "col-span-1 md:col-span-2"}>
                    <input type="date" title="Data do Pagamento" value={dataVendaManual} onChange={e => setDataVendaManual(e.target.value)} className="w-full md:w-1/2 border border-border/80 rounded-lg px-3 h-10 text-sm bg-card focus:outline-none focus:border-primary text-muted-foreground" />
                    <p className="text-[9px] text-muted-foreground mt-1 px-1">Selecione a data em que o pagamento foi recebido.</p>
                  </div>
                </div>
              </div>

              {/* BLOCO 2: MINI CARRINHO */}
              <div className="bg-secondary/10 border border-border/60 rounded-xl p-5">
                <h4 className="text-xs font-bold uppercase tracking-widest text-foreground mb-4">Adicionar Peças à Nota</h4>
                
                <div className="flex flex-col md:flex-row gap-3 items-end">
                  <select value={prodSelecionado} onChange={e => {setProdSelecionado(e.target.value); setCorComprada("")}} className="flex-1 border border-border/80 rounded-lg px-3 h-10 text-sm bg-card focus:outline-none focus:border-primary">
                    <option value="">Escolher Modelo...</option>
                    {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                  
                  <select value={corComprada} onChange={e => setCorComprada(e.target.value)} disabled={!prodSelecionado} className="w-full md:w-32 border border-border/80 rounded-lg px-3 h-10 text-sm bg-card focus:outline-none focus:border-primary disabled:opacity-50">
                    <option value="">Cor...</option>
                    {coresDisponiveisForm.map((cor: string) => <option key={cor} value={cor}>{cor}</option>)}
                  </select>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Qtd:</span>
                    <input type="number" min="1" value={qtdComprada} onChange={e => setQtdComprada(Number(e.target.value))} className="w-16 border border-border/80 rounded-lg px-2 h-10 text-center text-sm bg-card focus:outline-none focus:border-primary" />
                  </div>

                  <button onClick={adicionarItemAoLancamento} className="w-full md:w-auto bg-foreground text-background font-bold uppercase tracking-widest text-[10px] px-4 h-10 rounded-lg shadow hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                    <Plus size={14} /> Add Peça
                  </button>
                </div>

                {/* LISTA DO MINI CARRINHO */}
                {itensLancamento.length > 0 && (
                  <div className="mt-5 space-y-2 border-t border-border/50 pt-4">
                    {itensLancamento.map(item => (
                      <div key={item.idTemp} className="flex justify-between items-center bg-background border border-border/50 p-2.5 rounded-lg text-sm">
                        <div>
                          <span className="font-bold text-foreground mr-2">{item.quantidade}x</span>
                          <span className="text-foreground">{item.nome}</span>
                          <span className="text-[10px] text-muted-foreground ml-2 font-bold uppercase tracking-widest border border-border px-1.5 py-0.5 rounded">{item.cor}</span>
                        </div>
                        <button onClick={() => removerItemDoLancamento(item.idTemp)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={16}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="px-6 py-4 border-t border-border/50 bg-card flex justify-between items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Total Peças: {itensLancamento.reduce((acc, item) => acc + item.quantidade, 0)}
              </span>
              <button onClick={handleSalvarVenda} disabled={salvando} className="bg-primary text-primary-foreground font-bold uppercase tracking-widest text-xs px-6 py-3 rounded-lg shadow-md hover:bg-primary/90 transition-all flex items-center gap-2">
                {salvando ? <Loader2 size={16} className="animate-spin" /> : "Salvar Nota Completa"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}