import { DollarSign, ShoppingBag, TrendingUp, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function VisaoFinanceiro({ kpis, dadosGrafico, ultimosPedidos, setPedidoDetalhe }: any) {
  return (
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
              ultimosPedidos.map((pedido: any) => {
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
  );
}