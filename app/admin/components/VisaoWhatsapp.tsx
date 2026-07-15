import { Target, MousePointerClick, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// Ícone Oficial do WhatsApp
const WhatsappIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

export default function VisaoWhatsapp({ metricasWhatsapp }: any) {
  const { totalCliques = 0, rankingCliques = [], distribuicaoAcoes = {} } = metricasWhatsapp || {};

  // Prepara dados amigáveis para o gráfico de ações
  const acoesFormato = [
    { nome: "Montou a Grade", valor: distribuicaoAcoes["checkout_whatsapp_direto"] || 0, cor: "bg-emerald-500" },
    { nome: "Foi Direto do Catálogo", valor: distribuicaoAcoes["clique_whatsapp_catalogo"] || 0, cor: "bg-blue-500" },
    { nome: "Apenas Dúvidas", valor: distribuicaoAcoes["clique_whatsapp_duvida"] || 0, cor: "bg-amber-500" }
  ].sort((a, b) => b.valor - a.valor);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* KPIS WHATSAPP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-4 bg-[#25D366]/10 text-[#25D366] rounded-xl"><WhatsappIcon size={24} /></div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-sans mb-1">Total de Chamadas no Zap</p>
            <div className="text-2xl font-black text-foreground font-sans">{totalCliques} leads</div>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-500/10 text-purple-600 rounded-xl"><Target size={24} /></div>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-sans mb-1">Produto Mais Desejado</p>
            <div className="text-lg font-black text-foreground font-sans line-clamp-1">
              {rankingCliques.length > 0 ? rankingCliques[0].nome : "Nenhum dado"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* RANKING DE INTENÇÃO DE COMPRA */}
        <div className="lg:col-span-2 bg-card p-6 rounded-2xl border border-border shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 font-sans flex items-center gap-2">
            <TrendingUp size={16} className="text-primary"/> Ranking de Intenção (Top Produtos)
          </h2>
          <p className="text-[11px] text-muted-foreground mb-6 font-medium">Produtos que mais geraram cliques para o WhatsApp.</p>
          
          <div className="h-72 w-full">
            {rankingCliques.length === 0 ? (
               <div className="w-full h-full flex items-center justify-center border border-dashed border-border rounded-xl bg-secondary/20">
                  <p className="text-sm text-muted-foreground font-medium">Sem cliques no período</p>
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingCliques.slice(0, 7)} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--color-border)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="nome" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-foreground)', fontWeight: 600, fontFamily: 'sans-serif' }} width={120} />
                  <Tooltip cursor={{ fill: 'var(--color-secondary)' }} formatter={(value: any) => [`${value} cliques`, 'Interesse']} contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)' }} />
                  <Bar dataKey="qtd" fill="#25D366" radius={[0, 6, 6, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* PERFIL DO COMPORTAMENTO */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 font-sans flex items-center gap-2">
            <MousePointerClick size={16} className="text-primary"/> Perfil do Clique
          </h2>
          <p className="text-[11px] text-muted-foreground mb-6 font-medium">Como as clientes estão interagindo antes de chamar.</p>

          {totalCliques === 0 ? (
             <p className="text-xs text-muted-foreground text-center py-4 font-sans">Sem dados</p>
          ) : (
            <div className="space-y-5 mt-4">
              {acoesFormato.map((acao, idx) => {
                if (acao.valor === 0) return null;
                const percent = ((acao.valor / totalCliques) * 100).toFixed(1);
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-xs font-bold font-sans mb-1.5 text-foreground">
                      <span>{acao.nome}</span>
                      <span className="text-muted-foreground">{acao.valor} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2.5">
                      <div className={`${acao.cor} h-2.5 rounded-full transition-all`} style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}