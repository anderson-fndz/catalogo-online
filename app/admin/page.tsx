"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Loader2, DollarSign, PackageOpen, MessageCircle } from "lucide-react";

import FiltroTempo from "./components/FiltroTempo";
import VisaoFinanceiro from "./components/VisaoFinanceiro";
import VisaoProdutos from "./components/VisaoProdutos";
import VisaoWhatsapp from "./components/VisaoWhatsapp";
import ModalResumoPedido from "./components/ModalResumoPedido";

export default function DashboardBI() {
  const [carregando, setCarregando] = useState(true);
  const [todosPedidos, setTodosPedidos] = useState<any[]>([]);
  const [todosItens, setTodosItens] = useState<any[]>([]);
  const [todosProdutos, setTodosProdutos] = useState<any[]>([]);
  const [todasMetricas, setTodasMetricas] = useState<any[]>([]); 
  const [coresBanco, setCoresBanco] = useState<any[]>([]); 
  
  // ADICIONAMOS A TERCEIRA ABA AQUI
  const [abaAtiva, setAbaAtiva] = useState<"financeiro" | "produtos" | "whatsapp">("financeiro");

  const [menuAberto, setMenuAberto] = useState(false);
  const [filtroTempo, setFiltroTempo] = useState("mes_atual"); 
  const [filtroLabel, setFiltroLabel] = useState("Este Mês");

  const [pedidoDetalhe, setPedidoDetalhe] = useState<any | null>(null);

  useEffect(() => {
    async function carregarDadosBrutos() {
      const [resPedidos, resItens, resProdutos, resCores, resMetricas] = await Promise.all([
        supabase.from("pedidos").select("*").order("created_at", { ascending: false }),
        supabase.from("historico_compras").select("*"),
        supabase.from("produtos").select("id, nome, imagens"),
        supabase.from("cores").select("*"),
        supabase.from("metricas_produtos").select("*") // PUXANDO AS MÉTRICAS DO ZAP!
      ]);
      
      let pedidosUnificados: any[] = [];
      let itensUnificados: any[] = [];

      if (resCores.data) setCoresBanco(resCores.data);
      if (resMetricas.data) setTodasMetricas(resMetricas.data);

      if (resPedidos.data) {
        pedidosUnificados = [...resPedidos.data];
        const { data: itensLoja } = await supabase.from("itens_pedido").select("*");
        if (itensLoja) itensUnificados = [...itensLoja];
      }

      if (resItens.data) { 
        const historicoAgrupado = resItens.data.reduce((acc: any, item: any) => {
          const key = item.grupo_id || `${item.cliente_id}-${item.data_compra}`;
          if (!acc[key]) {
            acc[key] = { id: key, created_at: item.data_compra || item.created_at, valor_total: 0, status: "Finalizado", cliente_id: item.cliente_id };
          }
          acc[key].valor_total += (item.quantidade * (item.preco_unitario || 0));
          
          itensUnificados.push({
            pedido_id: key, produto_id: item.produto_id, quantidade: item.quantidade, cor_selecionada: item.cor, tamanho_selecionado: item.tamanho
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

  const { kpis, dadosGrafico, ultimosPedidos, rankingProdutos, rankingCores, rankingTamanhos, metricasWhatsapp } = useMemo(() => {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    
    // Função auxiliar para aplicar o filtro de tempo em qualquer array (pedidos ou métricas)
    const filtrarPorTempo = (lista: any[]) => {
      if (filtroTempo === "todo_periodo") return lista;
      return lista.filter(item => {
        const d = new Date(item.created_at);
        if (filtroTempo === "7d") return d >= new Date(hoje.setDate(hoje.getDate() - 7));
        if (filtroTempo === "30d") return d >= new Date(hoje.setDate(hoje.getDate() - 30));
        if (filtroTempo === "mes_atual") return d.getMonth() === hoje.getMonth() && d.getFullYear() === anoAtual;
        if (filtroTempo === "este_ano") return d.getFullYear() === anoAtual;
        if (filtroTempo === "semestre_1") return d.getFullYear() === anoAtual && d.getMonth() <= 5;
        if (filtroTempo === "semestre_2") return d.getFullYear() === anoAtual && d.getMonth() >= 6;
        if (filtroTempo.startsWith("mes_")) {
          const [ano, mes] = filtroTempo.replace("mes_", "").split("-");
          return d.getFullYear() === parseInt(ano) && (d.getMonth() + 1) === parseInt(mes);
        }
        return true;
      });
    };

    const pedidosFiltrados = filtrarPorTempo(todosPedidos);
    const metricasFiltradas = filtrarPorTempo(todasMetricas);

    // ==========================================
    // CÁLCULOS DO WHATSAPP
    // ==========================================
    const distribuicaoAcoes: Record<string, number> = {};
    const mapaCliquesProdutos: Record<string, number> = {};
    
    metricasFiltradas.forEach(m => {
      distribuicaoAcoes[m.tipo_acao] = (distribuicaoAcoes[m.tipo_acao] || 0) + 1;
      mapaCliquesProdutos[m.nome_produto] = (mapaCliquesProdutos[m.nome_produto] || 0) + 1;
    });

    const rankCliques = Object.entries(mapaCliquesProdutos)
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a, b) => b.qtd - a.qtd);

    const dadosWhatsapp = {
      totalCliques: metricasFiltradas.length,
      rankingCliques: rankCliques,
      distribuicaoAcoes
    };

    // ==========================================
    // CÁLCULOS FINANCEIROS E PRODUTOS
    // ==========================================
    const validos = pedidosFiltrados.filter(p => p.status !== "Cancelado");
    const receitaTotal = validos.reduce((acc, p) => acc + Number(p.valor_total), 0);
    const pendentes = pedidosFiltrados.filter(p => p.status === "Novo" || p.status === "Separando").length;
    
    const idsValidos = new Set(validos.map(p => p.id));
    const itensFiltrados = todosItens.filter(item => idsValidos.has(item.pedido_id));
    const totalPecas = itensFiltrados.reduce((acc, item) => acc + (Number(item.quantidade) || 1), 0);

    const kpisCalculados = { receita: receitaTotal, qtd: validos.length, ticket: validos.length > 0 ? receitaTotal / validos.length : 0, pendentes: pendentes, pecasVendidas: totalPecas };

    const agrupamentoGrafico = validos.reduce((acc: any, p) => {
      const d = new Date(p.created_at);
      let chave = (["este_ano", "semestre_1", "semestre_2", "todo_periodo"].includes(filtroTempo)) 
        ? d.toLocaleDateString("pt-BR", { month: 'short', year: 'numeric' }).replace(". de ", " ").replace(".", "")
        : d.toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' }).replace(". de ", " ").replace(".", "");
      chave = chave.charAt(0).toUpperCase() + chave.slice(1);
      
      if (!acc[chave]) acc[chave] = { valor: 0, timestamp: d.getTime() };
      acc[chave].valor += Number(p.valor_total);
      return acc;
    }, {});

    let chartData = Object.keys(agrupamentoGrafico).map(c => ({ data: c, valor: agrupamentoGrafico[c].valor, timestamp: agrupamentoGrafico[c].timestamp })).sort((a, b) => a.timestamp - b.timestamp);

    const mapaProdutos = todosProdutos.reduce((acc, prod) => { acc[prod.id] = prod.nome; return acc; }, {});
    const mapRankingProdutos: Record<string, number> = {};
    const mapRankingCores: Record<string, number> = {};
    const mapRankingTamanhos: Record<string, number> = {};

    itensFiltrados.forEach(item => {
      const qtd = Number(item.quantidade) || 1;
      const nomeProd = mapaProdutos[item.produto_id] || `Produto #${item.produto_id.substring(0,4)}`;
      mapRankingProdutos[nomeProd] = (mapRankingProdutos[nomeProd] || 0) + qtd;
      if (item.cor_selecionada) mapRankingCores[item.cor_selecionada] = (mapRankingCores[item.cor_selecionada] || 0) + qtd;
      if (item.tamanho_selecionado) mapRankingTamanhos[item.tamanho_selecionado] = (mapRankingTamanhos[item.tamanho_selecionado] || 0) + qtd;
    });

    const rankProd = Object.entries(mapRankingProdutos).map(([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd);
    const rankCor = Object.entries(mapRankingCores).map(([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd);
    const rankTam = Object.entries(mapRankingTamanhos).map(([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd);

    return { 
      kpis: kpisCalculados, 
      dadosGrafico: chartData, 
      ultimosPedidos: validos.slice(0, 7), 
      rankingProdutos: rankProd, rankingCores: rankCor, rankingTamanhos: rankTam,
      metricasWhatsapp: dadosWhatsapp // Passando as métricas pra frente!
    };
  }, [todosPedidos, todosItens, todosProdutos, todasMetricas, filtroTempo]);


  if (carregando) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

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
            
            {/* O BOTÃO DA TERCEIRA ABA ESTÁ AQUI */}
            <div className="flex bg-secondary/50 p-1 rounded-xl border border-border shadow-sm overflow-x-auto hide-scrollbar max-w-full">
              <button onClick={() => setAbaAtiva("financeiro")} className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all font-sans whitespace-nowrap ${abaAtiva === "financeiro" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                <DollarSign className="h-3.5 w-3.5" /> Financeiro
              </button>
              <button onClick={() => setAbaAtiva("produtos")} className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all font-sans whitespace-nowrap ${abaAtiva === "produtos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                <PackageOpen className="h-3.5 w-3.5" /> Produtos
              </button>
              <button onClick={() => setAbaAtiva("whatsapp")} className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all font-sans whitespace-nowrap ${abaAtiva === "whatsapp" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </button>
            </div>

            <FiltroTempo 
              filtroLabel={filtroLabel} filtroTempo={filtroTempo} menuAberto={menuAberto}
              setMenuAberto={setMenuAberto} historicoMeses={historicoMeses} aplicarFiltro={aplicarFiltro}
            />
          </div>
        </div>

        {abaAtiva === "financeiro" && <VisaoFinanceiro kpis={kpis} dadosGrafico={dadosGrafico} ultimosPedidos={ultimosPedidos} setPedidoDetalhe={setPedidoDetalhe} />}
        {abaAtiva === "produtos" && <VisaoProdutos kpis={kpis} rankingProdutos={rankingProdutos} rankingCores={rankingCores} rankingTamanhos={rankingTamanhos} />}
        
        {/* RENDERIZANDO A NOVA ABA AQUI */}
        {abaAtiva === "whatsapp" && <VisaoWhatsapp metricasWhatsapp={metricasWhatsapp} />}

      </main>

      {pedidoDetalhe && <ModalResumoPedido pedidoDetalhe={pedidoDetalhe} setPedidoDetalhe={setPedidoDetalhe} todosItens={todosItens} todosProdutos={todosProdutos} coresBanco={coresBanco} />}
    </div>
  );
}