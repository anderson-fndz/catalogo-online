"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { Loader2, Package, Search, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GestaoPedidos() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const router = useRouter();

  useEffect(() => {
    buscarPedidos();
  }, []);

  async function buscarPedidos() {
    setCarregando(true);
    const { data } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setPedidos(data);
    setCarregando(false);
  }

  const formatarData = (dataIso: string) => {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(dataIso));
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Novo": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Separando": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Enviado": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Cancelado": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const pedidosFiltrados = pedidos.filter(p => 
    p.cliente_nome?.toLowerCase().includes(busca.toLowerCase()) || 
    p.status?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 pt-10">
        <div className="flex justify-between items-end mb-8 border-b pb-6">
          <div>
            <h1 className="text-3xl font-bold font-serif">Gestão de Pedidos</h1>
            <p className="text-sm text-muted-foreground mt-1">Acompanhe o fluxo de vendas</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-64 bg-white shadow-sm"
            />
          </div>
        </div>

        {carregando ? (
          <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>
        ) : (
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-muted/30 text-xs font-bold uppercase text-muted-foreground">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Data</th>
                  <th className="p-4 text-center">Peças</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pedidosFiltrados.map(p => (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="p-4 font-mono text-xs text-muted-foreground">{p.id.substring(0,4)}</td>
                    <td className="p-4 font-bold">{p.cliente_nome}</td>
                    <td className="p-4 text-sm">{formatarData(p.created_at)}</td>
                    <td className="p-4 text-center font-bold">{p.total_pecas}</td>
                    <td className="p-4 font-bold text-emerald-700">R$ {Number(p.valor_total).toFixed(2).replace(".",",")}</td>
                    <td className="p-4"><span className={`text-[10px] px-2 py-1 rounded-full border font-bold ${getStatusStyle(p.status)}`}>{p.status}</span></td>
                    <td className="p-4 text-right">
                      <Button onClick={() => router.push(`/admin/pedidos/${p.id}`)} variant="ghost" size="sm">
                        <ArrowRight size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}