import { LayoutGrid } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const CORES_PIZZA = ['#591122', '#E11D48', '#9F1239', '#FB7185', '#701A2E'];

export default function VisaoProdutos({ kpis, rankingProdutos, rankingCores, rankingTamanhos }: any) {
  return (
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
              {rankingProdutos.slice(0, 8).map((prod: any, idx: number) => (
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
                        {rankingCores.slice(0, 5).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={CORES_PIZZA[index % CORES_PIZZA.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', fontWeight: 'bold', fontFamily: 'sans-serif' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 px-2">
                  {rankingCores.slice(0, 5).map((cor: any, idx: number) => (
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
                {rankingTamanhos.map((tam: any, idx: number) => {
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
  );
}