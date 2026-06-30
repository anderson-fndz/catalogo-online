"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, LayoutTemplate, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VitrineAdminPage() {
  const router = useRouter();
  const [verificandoAuth, setVerificandoAuth] = useState(true);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: "sucesso" | "erro" } | null>(null);

  useEffect(() => {
    checarAutenticacao();
  }, []);

  async function checarAutenticacao() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin");
    } else {
      buscarCategorias();
      setVerificandoAuth(false);
    }
  }

  async function buscarCategorias() {
    setCarregando(true);
    // Busca ordenando pela coluna que acabamos de criar
    const { data } = await supabase.from("categorias").select("*").order("ordem", { ascending: true });
    if (data) setCategorias(data);
    setCarregando(false);
  }

  // Atualiza o estado local quando você digita um número novo na ordem
  const handleMudarOrdem = (id: string, novaOrdem: number) => {
    setCategorias(prev => prev.map(cat => cat.id === id ? { ...cat, ordem: novaOrdem } : cat));
  };

  // Alterna entre mostrar ou esconder da página inicial
  const toggleVisibilidade = (id: string, statusAtual: boolean) => {
    setCategorias(prev => prev.map(cat => cat.id === id ? { ...cat, mostrar_na_home: !statusAtual } : cat));
  };

  // Salva todas as alterações de uma vez no banco de dados
  const handleSalvarAlteracoes = async () => {
    setSalvando(true);
    setMensagem(null);
    try {
      for (const cat of categorias) {
        await supabase
          .from("categorias")
          .update({ ordem: cat.ordem, mostrar_na_home: cat.mostrar_na_home })
          .eq("id", cat.id);
      }
      setMensagem({ texto: "Vitrine atualizada com sucesso!", tipo: "sucesso" });
      setTimeout(() => setMensagem(null), 3000);
    } catch (error) {
      setMensagem({ texto: "Erro ao salvar alterações.", tipo: "erro" });
    } finally {
      setSalvando(false);
    }
  };

  if (verificandoAuth || carregando) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-serif text-muted-foreground animate-pulse">Carregando vitrine...</p>
      </div>
    );
  }

  // Ordena visualmente pelo número para você ver como vai ficar
  const categoriasOrdenadas = [...categorias].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

  return (
    <div className="min-h-screen pb-16 bg-background selection:bg-primary/10 selection:text-primary">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif flex items-center gap-3">
              <LayoutTemplate className="h-8 w-8 text-primary" /> Personalizar Vitrine
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2 font-medium">
              Defina quais categorias aparecem na Home e em qual ordem.
            </p>
          </div>
          <Button onClick={handleSalvarAlteracoes} disabled={salvando} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-wider uppercase h-11 px-6 shadow-md transition-all hover:scale-105">
            {salvando ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            Salvar Layout
          </Button>
        </div>

        {mensagem && (
          <div className={`flex items-center gap-2 p-4 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2 ${mensagem.tipo === "sucesso" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
            <CheckCircle className="h-5 w-5" /> {mensagem.texto}
          </div>
        )}

        <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/10 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                <th className="p-5 w-24 text-center">Ordem</th>
                <th className="p-5">Nome da Categoria</th>
                <th className="p-5 text-center w-40">Aparecer na Home?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-sm">
              {categoriasOrdenadas.map((cat) => (
                <tr key={cat.id} className={`transition-colors hover:bg-secondary/5 ${!cat.mostrar_na_home && "opacity-60 bg-muted/20"}`}>
                  <td className="p-5">
                    <input 
                      type="number" 
                      value={cat.ordem || 0}
                      onChange={(e) => handleMudarOrdem(cat.id, parseInt(e.target.value) || 0)}
                      className="w-16 h-10 border border-border/80 bg-background rounded-lg text-center font-bold text-foreground focus:outline-none focus:border-primary shadow-sm"
                    />
                  </td>
                  <td className="p-5 font-bold font-serif text-base text-foreground">
                    {cat.nome}
                    {!cat.mostrar_na_home && <span className="ml-3 text-[9px] font-bold uppercase tracking-widest bg-muted text-muted-foreground px-2 py-1 rounded">Oculto</span>}
                  </td>
                  <td className="p-5 text-center">
                    <button 
                      onClick={() => toggleVisibilidade(cat.id, cat.mostrar_na_home)}
                      className={`p-2.5 rounded-xl transition-all border shadow-sm ${cat.mostrar_na_home ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10" : "border-border/80 bg-background text-muted-foreground hover:bg-secondary"}`}
                    >
                      {cat.mostrar_na_home ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}