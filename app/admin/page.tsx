"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { DollarSign, ShoppingBag, TrendingUp, Activity, Loader2, CalendarDays, ChevronDown, LayoutGrid, PackageOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

export default function DashboardBI() {
  const [carregando, setCarregando] = useState(true);
  const [todosPedidos, setTodosPedidos] = useState<any[]>([]);
  const [todosItens, setTodosItens] = useState<any[]>([]);
  const [todosProdutos, setTodosProdutos] = useState<any[]>([]);
  
  // Controle de Abas
  const [abaAtiva, setAbaAtiva] = useState<"financeiro" | "produtos">("financeiro");

  // Controle do Filtro Customizado
  const [menuAberto, setMenuAberto] = useState(false);
  const [filtroTempo, setFiltroTempo] = useState("mes_atual"); 
  const [filtroLabel, setFiltroLabel] = useState("Este Mês");

  useEffect(() => {
    async function carregarDadosBrutos() {
      // Baixa os Pedidos, os Itens e a lista de Produtos para cruzar os IDs com os Nomes
      const [resPedidos, resItens, resProdutos] = await Promise.all([
        supabase.from("pedidos").select("*").order("created_at", { ascending: false }),
        supabase.from("itens_pedido").select("*"),
        supabase.from("produtos").select("id, nome")
      ]);
      
      if (resPedidos.data) setTodosPedidos(resPedidos.data);
      if (resItens.data) setTodosItens(resItens.data);
      if (resProdutos.data) setTodosProdutos(resProdutos.data);
      
      setCarregando(false);
    }
    carregarDadosBrutos();
  }, []);

  const historicoMeses = useMemo(() => {
    const mesesExistentes = new Set<string>();
    todosPedidos.forEach(p => {
      const d = new Date(p.created_at);
      mesesExistentes.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
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

  // ==========================================
  // MOTOR DE CÁLCULO GERAL (FINANCEIRO E PRODUTOS)
  // ==========================================
  const { kpis, dadosGrafico, ultimosPedidos, rankingProdutos, rankingCores, rankingTamanhos } = useMemo(() => {
    if (todosPedidos.length === 0) return { kpis: { receita: 0, qtd: 0, ticket: 0, pendentes: 0, pecasVendidas: 0 }, dadosGrafico: [], ultimosPedidos: [], rankingProdutos: [], rankingCores: [], rankingTamanhos: [] };

    const hoje = new Date();
    let pedidosFiltrados = todosPedidos;

    if (filtroTempo === "7d") {
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(hoje.getDate() - 7);
      pedidosFiltrados = todosPedidos.filter(p => new Date(p.created_at) >= seteDiasAtras);
    } else if (filtroTempo === "30d") {
      const trintaDiasAtras = new Date();
      trintaDiasAtras.setDate(hoje.getDate() - 30);
      pedidosFiltrados = todosPedidos.filter(p => new Date(p.created_at) >= trintaDiasAtras);
    } else if (filtroTempo === "mes_atual") {
      pedidosFiltrados = todosPedidos.filter(p => {
        const d = new Date(p.created_at);
        return d.getMonth() === hoje.getMonth() && d.getFullYear() === hoje.getFullYear();
      });
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

    // --- MODELAGEM ABA FINANCEIRO ---
    const faturamentoDia = validos.reduce((acc: any, p) => {
      const dataStr = new Date(p.created_at).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' });
      if (!acc[dataStr]) acc[dataStr] = 0;
      acc[dataStr] += Number(p.valor_total);
      return acc;
    }, {});

    let chartData: any[] = [];
    if (filtroTempo === "7d") {
      chartData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' });
        return { data: dStr, valor: faturamentoDia[dStr] || 0 };
      }).reverse();
    } else {
      chartData = Object.keys(faturamentoDia).map(data => ({ data, valor: faturamentoDia[data] }));
      chartData.sort((a, b) => parseInt(a.data.split(" ")[0]) - parseInt(b.data.split(" ")[0]));
    }

    // --- MODELAGEM ABA PRODUTOS (Cruza ID com Nome) ---
    const mapaProdutos = todosProdutos.reduce((acc, prod) => {
      acc[prod.id] = prod.nome;
      return acc;
    }, {});

    const mapRankingProdutos: Record<string, number> = {};
    const mapRankingCores: Record<string, number> = {};
    const mapRankingTamanhos: Record<string, number> = {};

    itensFiltrados.forEach(item => {
      const qtd = Number(item.quantidade) || 1;
      
      const nomeProd = mapaProdutos[item.produto_id] || `Produto #${item.produto_id}`;
      // Usando os nomes das colunas da sua tabela do print
      const cor = item.cor_selecionada || "N/A";
      const tamanho = item.tamanho_selecionado || "N/A";

      mapRankingProdutos[nomeProd] = (mapRankingProdutos[nomeProd] || 0) + qtd;
      mapRankingCores[cor] = (mapRankingCores[cor] || 0) + qtd;
      mapRankingTamanhos[tamanho] = (mapRankingTamanhos[tamanho] || 0) + qtd;
    });

    const rankProd = Object.entries(mapRankingProdutos).map(([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd);
    const rankCor = Object.entries(mapRankingCores).map(([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd);
    const rankTam = Object.entries(mapRankingTamanhos).map(([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd);

    return { 
      kpis: kpisCalculados, 
      dadosGrafico: chartData, 
      ultimosPedidos: pedidosFiltrados.slice(0, 5),
      rankingProdutos: rankProd,
      rankingCores: rankCor,
      rankingTamanhos: rankTam
    };
  }, [todosPedidos, todosItens, todosProdutos, filtroTempo]);

  if (carregando) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

// Paleta de degradê oficial: Do Vinho Escuro ao Rosa Vibrante do Cartão
  const CORES_PIZZA = [
    '#591122', // Vinho Escuro (Fundo da logo)
    '#E11D48', // Rosa Vibrante (Detalhes do cartão)
    '#9F1239', // Rubi Escuro
    '#FB7185', // Rosa Salmão
    '#701A2E'  // Vinho Médio
  ];
  return (
    <div className="min-h-screen bg-background pb-20 relative">
      
      {menuAberto && <div className="fixed inset-0 z-40" onClick={() => setMenuAberto(false)}></div>}

      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* CABEÇALHO & TABS */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 border-b border-border/60 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-serif">Visão Geral</h1>
            <p className="text-sm text-muted-foreground mt-1 font-sans">Inteligência de Vendas e Fluxo de Caixa</p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
            <div className="flex bg-secondary/50 p-1 rounded-xl border border-border shadow-sm">
              <button 
                onClick={() => setAbaAtiva("financeiro")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all font-sans ${abaAtiva === "financeiro" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <DollarSign className="h-3.5 w-3.5" /> Financeiro
              </button>
              <button 
                onClick={() => setAbaAtiva("produtos")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all font-sans ${abaAtiva === "produtos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <PackageOpen className="h-3.5 w-3.5" /> Produtos
              </button>
            </div>

            {/* FILTRO DINÂMICO */}
            <div className="relative z-50">
              <button 
                onClick={() => setMenuAberto(!menuAberto)}
                className="flex items-center gap-2 bg-card border border-border hover:border-primary/50 px-4 py-2.5 rounded-xl text-sm font-bold text-foreground shadow-sm transition-all font-sans"
              >
                <CalendarDays className="h-4 w-4 text-primary" />
                {filtroLabel}
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${menuAberto ? "rotate-180" : ""}`} />
              </button>

              {menuAberto && (
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex font-sans">
                  <div className="w-1/3 bg-secondary/40 p-2 border-r border-border flex flex-col gap-1">
                    <button onClick={() => aplicarFiltro("7d", "7 Dias")} className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${filtroTempo === "7d" ? "bg-card text-primary shadow-sm border border-border/50" : "text-muted-foreground hover:bg-secondary"}`}>7 Dias</button>
                    <button onClick={() => aplicarFiltro("30d", "30 Dias")} className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${filtroTempo === "30d" ? "bg-card text-primary shadow-sm border border-border/50" : "text-muted-foreground hover:bg-secondary"}`}>30 Dias</button>
                    <button onClick={() => aplicarFiltro("mes_atual", "Este Mês")} className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${filtroTempo === "mes_atual" ? "bg-card text-primary shadow-sm border border-border/50" : "text-muted-foreground hover:bg-secondary"}`}>Este Mês</button>
                  </div>
                  
                  <div className="w-2/3 p-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Meses Fechados</p>
                    <div className="grid grid-cols-2 gap-2">
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
                { titulo: "FATURAMENTO", valor: `R$ ${kpis.receita.toFixed(2).replace(".", ",")}`, icon: DollarSign, cor: "text-emerald-600", bg: "bg-emerald-50" },
                { titulo: "VENDAS CONCLUÍDAS", valor: kpis.qtd.toString(), icon: ShoppingBag, cor: "text-primary", bg: "bg-primary/10" },
                { titulo: "TICKET MÉDIO", valor: `R$ ${kpis.ticket.toFixed(2).replace(".", ",")}`, icon: TrendingUp, cor: "text-purple-600", bg: "bg-purple-50" },
                { titulo: "PEDIDOS EM FILA", valor: kpis.pendentes.toString(), icon: Activity, cor: "text-amber-600", bg: "bg-amber-50" }
              ].map((card, i) => (
                <div key={i} className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-sans">{card.titulo}</p>
                    <div className={`p-2.5 rounded-xl ${card.bg} ${card.cor}`}><card.icon size={18} /></div>
                  </div>
                  {/* tag div com font-sans para blindar o css */}
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
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)', fontWeight: 600, fontFamily: 'sans-serif' }} tickFormatter={(val) => `R$ ${val}`} />
                      <Tooltip cursor={{ fill: 'var(--color-secondary)' }} formatter={(value: number) => [`R$ ${value.toFixed(2).replace(".", ",")}`, 'Faturamento']} contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold', fontFamily: 'sans-serif' }} />
                      <Bar dataKey="valor" fill="var(--color-primary)" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6 font-sans">Movimentação no Período</h2>
                <div className="space-y-4">
                  {ultimosPedidos.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 font-medium bg-secondary/30 rounded-xl border border-dashed border-border font-sans">Nenhuma venda registrada.</p>
                  ) : (
                    ultimosPedidos.map(pedido => (
                      <div key={pedido.id} className="flex justify-between items-center border-b border-border/60 pb-4 last:border-0 last:pb-0">
                        <div>
                          <p className="text-sm font-bold text-foreground font-sans">{pedido.cliente_nome}</p>
                          <p className="text-[10px] font-bold text-muted-foreground mt-0.5 uppercase tracking-wider font-sans">ID: {pedido.id.substring(0,4)} • {pedido.status}</p>
                        </div>
                        <div className="text-right">
                          {/* Cor verde mantida para destacar ganhos no fluxo */}
                          <p className="text-sm font-black text-emerald-600 font-sans">R$ {Number(pedido.valor_total).toFixed(2).replace(".",",")}</p>
                          <p className="text-[10px] font-bold text-muted-foreground mt-0.5 font-sans">{new Date(pedido.created_at).toLocaleDateString("pt-BR")}</p>
                        </div>
                      </div>
                    ))
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
                  <div className="text-2xl font-black text-foreground font-sans">{kpis.pecasVendidas} un.</div>
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
                          <span className="font-bold text-foreground font-sans text-sm">{prod.nome}</span>
                        </div>
                        <div className="font-black text-primary font-sans bg-primary/10 px-3 py-1 rounded-lg text-sm">
                          {prod.qtd} un.
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-8">
                {/* Gráfico Redesenhado e Centralizado */}
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
                            <span className="text-muted-foreground">({cor.qtd})</span>
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
                              <span className="text-muted-foreground">{tam.qtd} un.</span>
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
    </div>
  );
}