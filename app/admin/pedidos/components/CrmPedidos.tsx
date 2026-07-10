"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Users, Filter, Plus, Calendar, Scissors, Edit, Trash2, BusFront, DollarSign } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import ModalCrm from "./ModalCrm";

// Ícone oficial do WhatsApp em vetor (SVG)
const WhatsappIcon = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16" className={className}>
    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
  </svg>
);

export default function CrmPedidos() {
  const [carregando, setCarregando] = useState(true);
  const [clientes, setClientes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);

  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroTecido, setFiltroTecido] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroAno, setFiltroAno] = useState("");

  const [isModalAberto, setIsModalAberto] = useState(false);
  const [grupoEdicao, setGrupoEdicao] = useState<any | null>(null);

  const carregarDados = async () => {
    setCarregando(true);
    const [resClientes, resProdutos, resHistorico] = await Promise.all([
      supabase.from("clientes").select("*").order("nome", { ascending: true }),
      supabase.from("produtos").select("id, nome, tecido, preco, cores, grade_tamanhos").order("nome", { ascending: true }),
      supabase.from("historico_compras").select(`id, cor, tamanho, quantidade, data_compra, preco_unitario, grupo_id, cliente:clientes(id, nome, whatsapp, estado, nome_pacote), produto:produtos(id, nome, tecido)`).order("data_compra", { ascending: false })
    ]);
    if (resClientes.data) setClientes(resClientes.data);
    if (resProdutos.data) setProdutos(resProdutos.data);
    if (resHistorico.data) setHistorico(resHistorico.data);
    setCarregando(false);
  };

  useEffect(() => { carregarDados(); }, []);

  const deletarVenda = async (grupo: any) => {
    if(!confirm("Excluir esta venda inteira do histórico?")) return;
    if (grupo.grupo_id) {
      await supabase.from("historico_compras").delete().eq("grupo_id", grupo.grupo_id);
    } else {
      await supabase.from("historico_compras").delete().eq("cliente_id", grupo.cliente.id).eq("data_compra", grupo.data_compra).is("grupo_id", null);
    }
    carregarDados();
  };

  // --- NOVA INTELIGÊNCIA GRAMATICAL PARA MULTIPLOS TECIDOS ---
  const abrirWhatsApp = (nome: string, zap: string, tecidos: string[]) => {
    let tecidoStr = "que você adora";
    
    if (tecidos.length === 1) {
      tecidoStr = tecidos[0];
    } else if (tecidos.length === 2) {
      tecidoStr = `${tecidos[0]} e ${tecidos[1]}`;
    } else if (tecidos.length > 2) {
      tecidoStr = `${tecidos[0]}, ${tecidos[1]} e outros modelos`;
    }

    const mensagem = `Oi ${nome}, tudo bem? Aqui é da Jordan Collection! ✨\n\nChegou reposição nas peças de ${tecidoStr}.\n\nPosso te mandar as fotos?`;
    const numeroLimpo = zap.replace(/\D/g, '');
    window.open(`https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const historicoFiltrado = historico.filter(item => {
    let passa = true;
    if (filtroEstado) passa = passa && item.cliente?.estado === filtroEstado;
    if (filtroTecido) passa = passa && item.produto?.tecido === filtroTecido;
    if (filtroMes || filtroAno) {
      const data = new Date(item.data_compra);
      if (filtroMes) passa = passa && (data.getMonth() + 1).toString() === filtroMes;
      if (filtroAno) passa = passa && data.getFullYear().toString() === filtroAno;
    }
    return passa;
  });

  const pedidosAgrupados = Object.values(historicoFiltrado.reduce((acc: any, item: any) => {
    const key = item.grupo_id || `${item.cliente?.id}-${item.data_compra}`;
    if (!acc[key]) acc[key] = { id: key, grupo_id: item.grupo_id, cliente: item.cliente, data_compra: item.data_compra, itens: [], total_pecas: 0, valor_total: 0, tecidos: new Set(), modelos: new Set() };
    acc[key].itens.push(item); acc[key].total_pecas += item.quantidade; acc[key].valor_total += (item.quantidade * (item.preco_unitario || 0));
    if (item.produto?.tecido) acc[key].tecidos.add(item.produto.tecido); if (item.produto?.nome) acc[key].modelos.add(item.produto.nome);
    return acc;
  }, {})).sort((a: any, b: any) => new Date(b.data_compra).getTime() - new Date(a.data_compra).getTime());

  if (carregando) return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const tecidosUnicos = Array.from(new Set(produtos.map(p => p.tecido).filter(Boolean)));
  const estadosUnicos = Array.from(new Set(clientes.map(c => c.estado).filter(Boolean)));
  const meses = ["1","2","3","4","5","6","7","8","9","10","11","12"];
  const anosUnicos = Array.from(new Set(historico.map(h => new Date(h.data_compra).getFullYear().toString())));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border/50 bg-secondary/10 flex flex-col md:flex-row gap-4 justify-between md:items-center">
          <div className="flex items-center gap-2"><Filter size={18} className="text-primary" /><h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Garimpar Oportunidades</h3></div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => { setGrupoEdicao(null); setIsModalAberto(true); }} className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2 mr-2">
              <Plus size={14} /> Registrar Venda Antiga
            </button>
            <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="border border-border/80 rounded-lg px-3 h-9 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background focus:outline-none focus:border-primary"><option value="">🌎 Estado</option>{estadosUnicos.map((est: any) => <option key={est} value={est}>{est}</option>)}</select>
            <select value={filtroTecido} onChange={e => setFiltroTecido(e.target.value)} className="border border-border/80 rounded-lg px-3 h-9 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background focus:outline-none focus:border-primary"><option value="">🧵 Tecido</option>{tecidosUnicos.map((tec: any) => <option key={tec} value={tec}>{tec}</option>)}</select>
            <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)} className="border border-border/80 rounded-lg px-3 h-9 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background focus:outline-none focus:border-primary"><option value="">📅 Mês</option>{meses.map(m => <option key={m} value={m}>{m}</option>)}</select>
            <select value={filtroAno} onChange={e => setFiltroAno(e.target.value)} className="border border-border/80 rounded-lg px-3 h-9 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background focus:outline-none focus:border-primary"><option value="">⏳ Ano</option>{anosUnicos.map((a: any) => <option key={a} value={a}>{a}</option>)}</select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <th className="p-4 pl-6"><div className="flex items-center gap-1.5"><Users size={14}/> Cliente</div></th>
                <th className="p-4"><div className="flex items-center gap-1.5"><Scissors size={14}/> Resumo do Pedido</div></th>
                <th className="p-4"><div className="flex items-center gap-1.5"><Calendar size={14}/> Data Pgto</div></th>
                <th className="p-4 text-right"><div className="flex items-center justify-end gap-1.5"><DollarSign size={14}/> Total</div></th>
                <th className="p-4 text-center pr-6">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-sm">
              {pedidosAgrupados.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">Nenhum histórico encontrado.</td></tr>
              ) : (
                pedidosAgrupados.map((grupo: any) => (
                  <tr key={grupo.id} className="hover:bg-secondary/5 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-foreground">{grupo.cliente?.nome}</div>
                      <div className="text-[10px] text-muted-foreground font-medium mt-0.5">{grupo.cliente?.whatsapp}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="bg-secondary/50 text-foreground border border-border/50 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">{grupo.cliente?.estado || 'N/I'}</span>
                        {grupo.cliente?.nome_pacote && <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest font-bold flex items-center gap-1"><BusFront size={10} /> {grupo.cliente.nome_pacote}</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-sm mb-1">{grupo.total_pecas} Peças</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest line-clamp-2">{Array.from(grupo.modelos).join(', ')}</div>
                      <div className="flex gap-1 mt-1 flex-wrap">{Array.from(grupo.tecidos).map((t: any) => <span key={t} className="text-[9px] text-primary bg-primary/5 border border-primary/20 px-1.5 py-0.5 rounded uppercase tracking-widest font-bold">{t}</span>)}</div>
                    </td>
                    <td className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {format(new Date(grupo.data_compra), "dd MMM yy", { locale: ptBR })}
                      <div className="text-[9px] mt-0.5 text-amber-600">{differenceInDays(new Date(), new Date(grupo.data_compra))} dias atrás</div>
                    </td>
                    <td className="p-4 text-right font-extrabold text-primary">R$ {grupo.valor_total.toFixed(2).replace('.', ',')}</td>
                    <td className="p-4 text-center pr-6">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => abrirWhatsApp(grupo.cliente?.nome, grupo.cliente?.whatsapp, Array.from(grupo.tecidos))} className="bg-[#25D366] hover:bg-[#1ebd5a] text-white p-2.5 rounded-lg shadow-sm transition-all">
                          {/* Substituímos o MessageCircle pelo ícone SVG do WhatsApp */}
                          <WhatsappIcon size={16} />
                        </button>
                        <button onClick={() => { setGrupoEdicao(grupo); setIsModalAberto(true); }} className="bg-secondary/80 hover:bg-secondary text-foreground p-2.5 rounded-lg border border-border/50"><Edit size={16} /></button>
                        <button onClick={() => deletarVenda(grupo)} className="bg-destructive/10 hover:bg-destructive/20 text-destructive p-2.5 rounded-lg border border-destructive/20 opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <ModalCrm 
        isOpen={isModalAberto} 
        onClose={() => setIsModalAberto(false)} 
        onSuccess={() => { setIsModalAberto(false); carregarDados(); }} 
        clientesBase={clientes} 
        produtosBase={produtos} 
        grupoEdicao={grupoEdicao} 
      />
    </div>
  );
}