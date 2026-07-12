"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { DollarSign, ShoppingBag, TrendingUp, Activity, Loader2, CalendarDays, ChevronDown, LayoutGrid, PackageOpen, X, Image as ImageIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

export default function DashboardBI() {
  const [carregando, setCarregando] = useState(true);
  const [todosPedidos, setTodosPedidos] = useState<any[]>([]);
  const [todosItens, setTodosItens] = useState<any[]>([]);
  const [todosProdutos, setTodosProdutos] = useState<any[]>([]);
  const [coresBanco, setCoresBanco] = useState<any[]>([]); 
  
  const [abaAtiva, setAbaAtiva] = useState<"financeiro" | "produtos">("financeiro");

  const [menuAberto, setMenuAberto] = useState(false);
  const [filtroTempo, setFiltroTempo] = useState("mes_atual"); 
  const [filtroLabel, setFiltroLabel] = useState("Este Mês");

  const [pedidoDetalhe, setPedidoDetalhe] = useState<any | null>(null);

  useEffect(() => {
    async function carregarDadosBrutos() {
      const [resPedidos, resItens, resProdutos, resCores] = await Promise.all([
        supabase.from("pedidos").select("*").order("created_at", { ascending: false }),
        supabase.from("historico_compras").select("*"),
        supabase.from("produtos").select("id, nome, imagens"),
        supabase.from("cores").select("*") // Puxando as cores para o modal de resumo
      ]);
      
      let pedidosUnificados: any[] = [];
      let itensUnificados: any[] = [];

      if (resCores.data) setCoresBanco(resCores.data);

      if (resPedidos.data) {
        pedidosUnificados = [...resPedidos.data];
        const { data: itensLoja } = await supabase.from("itens_pedido").select("*");
        if (itensLoja) itensUnificados = [...itensLoja];
      }

      if (resItens.data) { 
        const historicoAgrupado = resItens.data.reduce((acc: any, item: any) => {
          const key = item.grupo_id || `${item.cliente_id}-${item.data_compra}`;
          if (!acc[key]) {
            acc[key] = {
              id: key,
              created_at: item.data_compra || item.created_at,
              valor_total: 0,
              status: "Finalizado", 
              cliente_id: item.cliente_id 
            };
          }
          acc[key].valor_total += (item.quantidade * (item.preco_unitario || 0));
          
          itensUnificados.push({
            pedido_id: key,
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            cor_selecionada: item.cor,
            tamanho_selecionado: item.tamanho
          });

          return acc;
        }, {});

        const pedidosHistoricoArray = Object.values(historicoAgrupado);
        if (pedidosHistoricoArray.length > 0) {
          const { data: clientesData } = await supabase.from("clientes").select("id, nome, estado, whatsapp");
          if (clientesData) {
            pedidosHistoricoArray.forEach((ped: any) => {
              const cli = clientesData.find(c => c.id === ped.cliente_id);
              if (cli) ped.cliente = cli;
            });
          }
        }

        pedidosUnificados = [...pedidosUnificados, ...pedidosHistoricoArray];
      }

      pedidosUnificados.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setTodosPedidos(pedidosUnificados);
      setTodosItens(itensUnificados);
      if (resProdutos.data) setTodosProdutos(resProdutos.data);
      
      setCarregando(false);
    }
    carregarDadosBrutos();
  }, []);

  const historicoMeses = useMemo(() => {
    const mesesExistentes = new Set<string>();
    todosPedidos.forEach(p => {
      if(p.created_at) {
        const d = new Date(p.created_at);
        mesesExistentes.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }
    });

    const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    return Array.from(mesesExistentes).sort().reverse().map(m => {
      const [ano, mes] = m.split("-");
      return { valor: `mes_${m}`, label: `${mesesNomes[parseInt(mes) - 1]} ${ano}` };
    });
  }, [todosPedidos]);

  const aplicarFiltro = (valor: string, label: string) => {
    setFiltroTempo(valor);
    setFiltroLabel(label);
    setMenuAberto(false);
  };

  // Funções de cores reaproveitadas do CRM
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

  const { kpis, dadosGrafico, ultimosPedidos, rankingProdutos, rankingCores, rankingTamanhos } = useMemo(() => {
    if (todosPedidos.length === 0) return { kpis: { receita: 0, qtd: 0, ticket: 0, pendentes: 0, pecasVendidas: 0 }, dadosGrafico: [], ultimosPedidos: [], rankingProdutos: [], rankingCores: [], rankingTamanhos: [] };

    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    let pedidosFiltrados = todosPedidos;

    if (filtroTempo === "7d") {
      const limite = new Date();
      limite.setDate(hoje.getDate() - 7);
      pedidosFiltrados = todosPedidos.filter(p => new Date(p.created_at) >= limite);
    } else if (filtroTempo === "30d") {
      const limite = new Date();
      limite.setDate(hoje.getDate() - 30);
      pedidosFiltrados = todosPedidos.filter(p => new Date(p.created_at) >= limite);
    } else if (filtroTempo === "mes_atual") {
      pedidosFiltrados = todosPedidos.filter(p => {
        const d = new Date(p.created_at);
        return d.getMonth() === hoje.getMonth() && d.getFullYear() === anoAtual;
      });
    } else if (filtroTempo === "este_ano") {
      pedidosFiltrados = todosPedidos.filter(p => new Date(p.created_at).getFullYear() === anoAtual);
    } else if (filtroTempo === "semestre_1") {
      pedidosFiltrados = todosPedidos.filter(p => {
        const d = new Date(p.created_at);
        return d.getFullYear() === anoAtual && d.getMonth() <= 5; 
      });
    } else if (filtroTempo === "semestre_2") {
      pedidosFiltrados = todosPedidos.filter(p => {
        const d = new Date(p.created_at);
        return d.getFullYear() === anoAtual && d.getMonth() >= 6; 
      });
    } else if (filtroTempo === "todo_periodo") {
      pedidosFiltrados = todosPedidos;
    } else if (filtroTempo.startsWith("mes_")) {
      const [ano, mes] = filtroTempo.replace("mes_", "").split("-");
      pedidosFiltrados = todosPedidos.filter(p => {
        const d = new Date(p.created_at);
        return d.getFullYear() === parseInt(ano) && (d.getMonth() + 1) === parseInt(mes);
      });
    }

    const validos = pedidosFiltrados.filter(p => p.status !== "Cancelado");
    const receitaTotal = validos.reduce((acc, p) => acc + Number(p.valor_total), 0);
    const pendentes = pedidosFiltrados.filter(p => p.status === "Novo" || p.status === "Separando").length;
    
    const idsValidos = new Set(validos.map(p => p.id));
    const itensFiltrados = todosItens.filter(item => idsValidos.has(item.pedido_id));
    const totalPecas = itensFiltrados.reduce((acc, item) => acc + (Number(item.quantidade) || 1), 0);

    const kpisCalculados = {
      receita: receitaTotal,
      qtd: validos.length,
      ticket: validos.length > 0 ? receitaTotal / validos.length : 0,
      pendentes: pendentes,
      pecasVendidas: totalPecas
    };

    const agruparPorMes = ["este_ano", "semestre_1", "semestre_2", "todo_periodo"].includes(filtroTempo);

    const agrupamentoGrafico = validos.reduce((acc: any, p) => {
      const d = new Date(p.created_at);
      let chave = "";
      if (agruparPorMes) {
        chave = d.toLocaleDateString("pt-BR", { month: 'short', year: 'numeric' }).replace(". de ", " ").replace(".", "");
        chave = chave.charAt(0).toUpperCase() + chave.slice(1);
      } else {
        chave = d.toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' }).replace(". de ", " ").replace(".", "");
      }
      
      if (!acc[chave]) acc[chave] = { valor: 0, timestamp: d.getTime() };
      acc[chave].valor += Number(p.valor_total);
      return acc;
    }, {});

    let chartData = Object.keys(agrupamentoGrafico).map(chave => ({
      data: chave,
      valor: agrupamentoGrafico[chave].valor,
      timestamp: agrupamentoGrafico[chave].timestamp
    }));

    chartData.sort((a, b) => a.timestamp - b.timestamp);

    if (filtroTempo === "7d" && chartData.length < 7) {
      chartData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dStr = d.toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' }).replace(". de ", " ").replace(".", "");
        const existente = agrupamentoGrafico[dStr];
        return { data: dStr, valor: existente ? existente.valor : 0, timestamp: d.getTime() };
      });
    }

    const mapaProdutos = todosProdutos.reduce((acc, prod) => {
      acc[prod.id] = prod.nome;
      return acc;
    }, {});

    const mapRankingProdutos: Record<string, number> = {};
    const mapRankingCores: Record<string, number> = {};
    const mapRankingTamanhos: Record<string, number> = {};

    itensFiltrados.forEach(item => {
      const qtd = Number(item.quantidade) || 1;
      const nomeProd = mapaProdutos[item.produto_id] || `Produto #${item.produto_id.substring(0,4)}`;
      const cor = item.cor_selecionada || "N/A";
      const tamanho = item.tamanho_selecionado || "N/A";

      mapRankingProdutos[nomeProd] = (mapRankingProdutos[nomeProd] || 0) + qtd;
      if (cor !== "N/A") mapRankingCores[cor] = (mapRankingCores[cor] || 0) + qtd;
      if (tamanho !== "N/A") mapRankingTamanhos[tamanho] = (mapRankingTamanhos[tamanho] || 0) + qtd;
    });

    const rankProd = Object.entries(mapRankingProdutos).map(([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd);
    const rankCor = Object.entries(mapRankingCores).map(([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd);
    const rankTam = Object.entries(mapRankingTamanhos).map(([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd);

    return { 
      kpis: kpisCalculados, 
      dadosGrafico: chartData, 
      ultimosPedidos: validos.slice(0, 7), 
      rankingProdutos: rankProd,
      rankingCores: rankCor,
      rankingTamanhos: rankTam
    };
  }, [todosPedidos, todosItens, todosProdutos, filtroTempo]);

  if (carregando) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const CORES_PIZZA = ['#591122', '#E11D48', '#9F1239', '#FB7185', '#701A2E'];

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      
      {menuAberto && <div className="fixed inset-0 z-40" onClick={() => setMenuAberto(false)}></div>}

      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 border-b border-border/60 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-serif">Visão Geral</h1>
            <p className="text-sm text-muted-foreground mt-1 font-sans">Inteligência de Vendas e Fluxo de Caixa</p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
            <div className="flex bg-secondary/50 p-1 rounded-xl border border-border shadow-sm">
              <button onClick={() => setAbaAtiva("financeiro")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all font-sans ${abaAtiva === "financeiro" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                <DollarSign className="h-3.5 w-3.5" /> Financeiro
              </button>
              <button onClick={() => setAbaAtiva("produtos")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all font-sans ${abaAtiva === "produtos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                <PackageOpen className="h-3.5 w-3.5" /> Produtos
              </button>
            </div>

            <div className="relative z-50">
              <button onClick={() => setMenuAberto(!menuAberto)} className="flex items-center gap-2 bg-card border border-border hover:border-primary/50 px-4 py-2.5 rounded-xl text-sm font-bold text-foreground shadow-sm transition-all font-sans">
                <CalendarDays className="h-4 w-4 text-primary" />
                {filtroLabel}
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${menuAberto ? "rotate-180" : ""}`} />
              </button>

              {menuAberto && (
                <div className="absolute right-0 top-full mt-2 w-[420px] bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex font-sans">
                  
                  <div className="w-1/2 bg-secondary/30 p-3 border-r border-border flex flex-col gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Curto Prazo</p>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => aplicarFiltro("7d", "Últimos 7 Dias")} className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${filtroTempo === "7d" ? "bg-background text-primary shadow-sm border border-border/50" : "text-muted-foreground hover:bg-secondary"}`}>Últimos 7 Dias</button>
                        <button onClick={() => aplicarFiltro("30d", "Últimos 30 Dias")} className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${filtroTempo === "30d" ? "bg-background text-primary shadow-sm border border-border/50" : "text-muted-foreground hover:bg-secondary"}`}>Últimos 30 Dias</button>
                        <button onClick={() => aplicarFiltro("mes_atual", "Este Mês")} className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${filtroTempo === "mes_atual" ? "bg-background text-primary shadow-sm border border-border/50" : "text-muted-foreground hover:bg-secondary"}`}>Este Mês</button>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Visão Macro</p>
                      <div className="flex flex-col gap-1">
                        <button onClick={() => aplicarFiltro("este_ano", "Este Ano")} className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${filtroTempo === "este_ano" ? "bg-background text-primary shadow-sm border border-border/50" : "text-muted-foreground hover:bg-secondary"}`}>Este Ano</button>
                        <div className="flex gap-1">
                          <button onClick={() => aplicarFiltro("semestre_1", "1º Semestre")} className={`flex-1 text-center px-2 py-2 rounded-lg text-[10px] font-bold transition-colors ${filtroTempo === "semestre_1" ? "bg-background text-primary shadow-sm border border-border/50" : "text-muted-foreground hover:bg-secondary"}`}>1º Sem.</button>
                          <button onClick={() => aplicarFiltro("semestre_2", "2º Semestre")} className={`flex-1 text-center px-2 py-2 rounded-lg text-[10px] font-bold transition-colors ${filtroTempo === "semestre_2" ? "bg-background text-primary shadow-sm border border-border/50" : "text-muted-foreground hover:bg-secondary"}`}>2º Sem.</button>
                        </div>
                        <button onClick={() => aplicarFiltro("todo_periodo", "Todo o Período")} className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${filtroTempo === "todo_periodo" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-secondary"}`}>Todo o Período</button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-1/2 p-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Meses Fechados</p>
                    <div className="grid grid-cols-2 gap-2 h-full content-start">
                      {historicoMeses.length === 0 ? (
                        <p className="text-xs text-muted-foreground col-span-2 px-1">Sem histórico</p>
                      ) : (
                        historicoMeses.map(op => (
                          <button key={op.valor} onClick={() => aplicarFiltro(op.valor, op.label)} className={`text-center px-2 py-2 border rounded-lg text-xs font-bold transition-colors ${filtroTempo === op.valor ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>{op.label}</button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ABA 1: VISÃO FINANCEIRA */}
        {abaAtiva === "financeiro" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { titulo: "FATURAMENTO", valor: `R$ ${kpis.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: DollarSign, cor: "text-emerald-600", bg: "bg-emerald-50" },
                { titulo: "VENDAS CONCLUÍDAS", valor: kpis.qtd.toLocaleString('pt-BR'), icon: ShoppingBag, cor: "text-primary", bg: "bg-primary/10" },
                { titulo: "TICKET MÉDIO", valor: `R$ ${kpis.ticket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, cor: "text-purple-600", bg: "bg-purple-50" },
                { titulo: "PEÇAS VENDIDAS", valor: kpis.pecasVendidas.toLocaleString('pt-BR'), icon: Activity, cor: "text-amber-600", bg: "bg-amber-50" }
              ].map((card, i) => (
                <div key={i} className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-sans">{card.titulo}</p>
                    <div className={`p-2.5 rounded-xl ${card.bg} ${card.cor}`}><card.icon size={18} /></div>
                  </div>
                  <div className="text-3xl font-black text-foreground tracking-tighter font-sans">{card.valor}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-card p-6 rounded-2xl border border-border shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6 font-sans">Fluxo de Faturamento</h2>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosGrafico} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                      <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)', fontWeight: 600, fontFamily: 'sans-serif' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)', fontWeight: 600, fontFamily: 'sans-serif' }} tickFormatter={(val) => `R$ ${val.toLocaleString('pt-BR')}`} />
                      <Tooltip cursor={{ fill: 'var(--color-secondary)' }} formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Faturamento']} contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontFamily: 'sans-serif' }} />
                      <Bar dataKey="valor" fill="var(--color-primary)" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6 font-sans">Últimos Registros de Venda</h2>
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {ultimosPedidos.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 font-medium bg-secondary/30 rounded-xl border border-dashed border-border font-sans">Nenhuma venda registrada.</p>
                  ) : (
                    ultimosPedidos.map(pedido => {
                      const nomeCliente = pedido.cliente?.nome || pedido.cliente_nome || "Venda Loja";
                      const estadoCliente = pedido.cliente?.estado || pedido.estado;

                      return (
                        <div 
                          key={pedido.id} 
                          onClick={() => setPedidoDetalhe(pedido)}
                          className="flex justify-between items-center border border-transparent hover:border-border/60 bg-background hover:bg-secondary/20 p-3 rounded-xl transition-all cursor-pointer shadow-sm hover:shadow group"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-foreground font-sans line-clamp-1 group-hover:text-primary transition-colors">{nomeCliente}</p>
                              {estadoCliente && (
                                <span className="bg-secondary/80 text-muted-foreground px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-widest border border-border/50">
                                  {estadoCliente}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-wider font-sans">ID: {pedido.id.substring(0,4)} • {pedido.status}</p>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <p className="text-sm font-black text-emerald-600 font-sans group-hover:scale-105 transition-transform">R$ {Number(pedido.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <p className="text-[10px] font-bold text-muted-foreground mt-1 font-sans">{new Date(pedido.created_at).toLocaleDateString("pt-BR")}</p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: DESEMPENHO DE PRODUTOS */}
        {abaAtiva === "produtos" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
                <div className="p-4 bg-primary/10 text-primary rounded-xl"><LayoutGrid size={24} /></div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-sans mb-1">Peças Vendidas no Período</p>
                  <div className="text-2xl font-black text-foreground font-sans">{kpis.pecasVendidas.toLocaleString('pt-BR')} un.</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-card p-6 rounded-2xl border border-border shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6 font-sans">Top Modelos Mais Vendidos</h2>
                {rankingProdutos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8 font-medium font-sans bg-secondary/30 rounded-xl border border-dashed border-border">Nenhum produto vendido neste período.</p>
                ) : (
                  <div className="space-y-4">
                    {rankingProdutos.slice(0, 8).map((prod, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/40 transition-colors border border-transparent hover:border-border/50">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-sans ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-200 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-secondary text-muted-foreground'}`}>
                            {idx + 1}º
                          </div>
                          <span className="font-bold text-foreground font-sans text-sm line-clamp-1">{prod.nome}</span>
                        </div>
                        <div className="font-black text-primary font-sans bg-primary/10 px-3 py-1 rounded-lg text-sm shrink-0">
                          {prod.qtd.toLocaleString('pt-BR')} un.
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-8">
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 font-sans">Demanda por Cor</h2>
                  {rankingCores.length === 0 ? (
                     <p className="text-xs text-muted-foreground text-center py-4 font-sans">Sem dados</p>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <div className="h-40 w-full mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie 
                              data={rankingCores.slice(0, 5)} 
                              dataKey="qtd" 
                              nameKey="nome" 
                              cx="50%" 
                              cy="50%" 
                              innerRadius={35} 
                              outerRadius={60} 
                              stroke="var(--color-card)" 
                              strokeWidth={3} 
                              labelLine={false}
                            >
                              {rankingCores.slice(0, 5).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CORES_PIZZA[index % CORES_PIZZA.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontWeight: 'bold', fontFamily: 'sans-serif' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 px-2">
                        {rankingCores.slice(0, 5).map((cor, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase font-sans">
                            <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: CORES_PIZZA[idx % CORES_PIZZA.length] }}></span>
                            <span className="truncate max-w-[80px] text-foreground">{cor.nome}</span> 
                            <span className="text-muted-foreground">({cor.qtd.toLocaleString('pt-BR')})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 font-sans">Saída por Tamanho</h2>
                  {rankingTamanhos.length === 0 ? (
                     <p className="text-xs text-muted-foreground text-center py-4 font-sans">Sem dados</p>
                  ) : (
                    <div className="space-y-3 mt-4">
                      {rankingTamanhos.map((tam, idx) => {
                        const maxQtd = rankingTamanhos[0].qtd;
                        const percent = (tam.qtd / maxQtd) * 100;
                        return (
                          <div key={idx}>
                            <div className="flex justify-between text-xs font-bold font-sans mb-1 text-foreground">
                              <span>{tam.nome}</span>
                              <span className="text-muted-foreground">{tam.qtd.toLocaleString('pt-BR')} un.</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                              <div className="bg-primary h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ==================================================== */}
      {/* MODAL DE RESUMO DA VENDA - AGRUPADO POR PRODUTO/TAMANHO/COR */}
      {/* ==================================================== */}
      {pedidoDetalhe && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in font-sans">
          <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            
            {/* CABEÇALHO MODAL */}
            <div className="px-6 py-4 border-b border-border/50 bg-secondary/20 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-foreground font-serif">Resumo do Pedido</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">ID: {pedidoDetalhe.id.substring(0,8)}</p>
              </div>
              <button onClick={() => setPedidoDetalhe(null)} className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                <X size={20}/>
              </button>
            </div>
            
            {/* CORPO MODAL */}
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Box de Informações Rápidas */}
              <div className="flex justify-between items-center bg-secondary/10 p-5 rounded-xl border border-border/50">
                <div>
                  <p className="text-sm font-bold text-foreground">{pedidoDetalhe.cliente?.nome || pedidoDetalhe.cliente_nome || "Venda Balcão"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{pedidoDetalhe.cliente?.whatsapp || pedidoDetalhe.cliente_whatsapp || "Sem contato"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-emerald-600">R$ {Number(pedidoDetalhe.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{new Date(pedidoDetalhe.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>

              {/* Lista de Produtos Comprados (Lógica de Agrupamento Perfeita) */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Peças na Nota</h4>
                <div className="space-y-4">
                  {(() => {
                    const itensDoPedido = todosItens.filter(i => i.pedido_id === pedidoDetalhe.id);
                    
                    // Agrupa exatamente igual ao CRM: Produto -> Tamanho -> Cor
                    const itensAgrupados = itensDoPedido.reduce((acc: any, item: any) => {
                      const prod = todosProdutos.find(p => p.id === item.produto_id);
                      const nomeProd = prod?.nome || "Produto Desconhecido";
                      const imgUrl = (prod?.imagens && Array.isArray(prod.imagens)) ? prod.imagens[0] : null;

                      if (!acc[item.produto_id]) {
                        acc[item.produto_id] = {
                          produto_id: item.produto_id,
                          nome: nomeProd,
                          imagem_url: imgUrl,
                          tamanhos: {},
                          total_produto: 0
                        };
                      }

                      const tam = item.tamanho_selecionado || "N/A";
                      const cor = item.cor_selecionada || "N/A";

                      if (!acc[item.produto_id].tamanhos[tam]) {
                        acc[item.produto_id].tamanhos[tam] = { cores: {} };
                      }
                      if (!acc[item.produto_id].tamanhos[tam].cores[cor]) {
                        acc[item.produto_id].tamanhos[tam].cores[cor] = 0;
                      }

                      acc[item.produto_id].tamanhos[tam].cores[cor] += item.quantidade;
                      acc[item.produto_id].total_produto += item.quantidade;

                      return acc;
                    }, {});

                    return Object.values(itensAgrupados).map((produto: any) => (
                      <div key={produto.produto_id} className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
                        
                        {/* Mestre do Produto */}
                        <div className="flex items-center gap-4 bg-secondary/20 p-3 border-b border-border/50">
                          {produto.imagem_url ? (
                            <img src={produto.imagem_url} alt={produto.nome} className="w-10 h-10 rounded-lg object-cover border border-border/50" />
                          ) : (
                            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground border border-border/50">
                              <ImageIcon size={18} />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-bold text-sm text-foreground line-clamp-1">{produto.nome}</h4>
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold mt-0.5">
                              {produto.total_produto} peças
                            </div>
                          </div>
                        </div>

                        {/* Grade de Tamanhos e Cores */}
                        <div className="divide-y divide-border/30">
                          {Object.entries(produto.tamanhos).map(([tam, dadosTam]: any) => (
                            <div key={tam} className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                              
                              {/* Tamanho */}
                              <span className="text-[10px] uppercase tracking-widest border border-border px-2 py-1 rounded-md font-bold bg-secondary/30 w-16 text-center shrink-0">
                                TAM: {tam}
                              </span>
                              
                              {/* Cores desse Tamanho */}
                              <div className="flex-1 flex flex-wrap gap-2 sm:pl-3 sm:border-l sm:border-border/50">
                                {Object.entries(dadosTam.cores).map(([cor, qtd]: any) => {
                                  // Reutilizamos a lógica visual de cores do CRM!
                                  const bgHex = encontrarHexCor(cor);
                                  const textHex = getCorDoTexto(bgHex);
                                  
                                  return (
                                    <div key={cor} className="flex items-center rounded-full border shadow-sm overflow-hidden text-[10px] font-bold tracking-wide" style={{ backgroundColor: bgHex, color: textHex, borderColor: '#00000015' }}>
                                      <span className="px-2.5 py-1">{cor}</span>
                                      <div className="px-2 py-1 border-l" style={{ borderColor: `${textHex}30`, backgroundColor: `${textHex}10` }}>
                                        <span className="font-extrabold">{qtd}x</span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>

                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}