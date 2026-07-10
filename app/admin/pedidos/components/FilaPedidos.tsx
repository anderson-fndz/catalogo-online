"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingBag, Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FilaPedidos() {
  const router = useRouter();
  const [pedidosAtuais, setPedidosAtuais] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarFila() {
      const { data } = await supabase.from("pedidos").select("*").order("created_at", { ascending: false });
      if (data) setPedidosAtuais(data);
      setCarregando(false);
    }
    carregarFila();
  }, []);

  if (carregando) return <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden animate-in fade-in">
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
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border ${pedido.status === 'Novo' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : pedido.status === 'Enviado' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-secondary text-foreground border-border'}`}>
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
  );
}