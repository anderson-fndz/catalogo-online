import { CalendarDays, ChevronDown } from "lucide-react";

export default function FiltroTempo({ 
  filtroLabel, 
  filtroTempo, 
  menuAberto, 
  setMenuAberto, 
  historicoMeses, 
  aplicarFiltro 
}: any) {
  return (
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
                historicoMeses.map((op: any) => (
                  <button key={op.valor} onClick={() => aplicarFiltro(op.valor, op.label)} className={`text-center px-2 py-2 border rounded-lg text-xs font-bold transition-colors ${filtroTempo === op.valor ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>{op.label}</button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}