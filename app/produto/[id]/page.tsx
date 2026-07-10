"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ChevronLeft, ChevronRight, ShoppingCart, Download, Plus, Minus, ArrowLeft, MessageCircle, Camera, CheckCircle2, Package } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { useCarrinhoStore } from "@/store/carrinhoStore";

export default function ProdutoPage() {
  const params = useParams();
  const router = useRouter();
  
  const { adicionarAoCarrinho } = useCarrinhoStore();

  const [produto, setProduto] = useState<any | null>(null);
  const [coresBanco, setCoresBanco] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [fotoAtualIndex, setFotoAtualIndex] = useState(0);
  const [corAtiva, setCorAtiva] = useState<string>("");
  const [qtdMinima, setQtdMinima] = useState<number>(1);
  const [abaAtiva, setAbaAtiva] = useState<"detalhes" | "fardo">("detalhes");

  const [selecoes, setSelecoes] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    if (params.id) buscarProdutoDetalhado(params.id as string);
  }, [params.id]);

  async function buscarProdutoDetalhado(id: string) {
    setCarregando(true);
    const [resProd, resCor] = await Promise.all([
      supabase.from("produtos").select("*").eq("id", id).single(),
      supabase.from("cores").select("*")
    ]);

    if (resProd.data) {
      setProduto(resProd.data);
      const min = resProd.data.qtd_minima > 0 ? resProd.data.qtd_minima : 1;
      setQtdMinima(min);
      if (resProd.data.cores && resProd.data.cores.length > 0) {
        setCorAtiva(resProd.data.cores[0]); 
      }
    }
    if (resCor.data) setCoresBanco(resCor.data);
    setCarregando(false);
  }

  const fotoAnterior = () => setFotoAtualIndex(prev => prev === 0 ? produto.imagens.length - 1 : prev - 1);
  const fotoProxima = () => setFotoAtualIndex(prev => prev === produto.imagens.length - 1 ? 0 : prev + 1);

  const alterarQtd = (tamanho: string, delta: number) => {
    setSelecoes(prev => {
      const atual = prev[corAtiva]?.[tamanho] || 0;
      const novaQtd = Math.max(0, atual + delta);
      return { ...prev, [corAtiva]: { ...(prev[corAtiva] || {}), [tamanho]: novaQtd } };
    });
  };

  const getTotalCor = (cor: string) => {
    if (!selecoes[cor]) return 0;
    return Object.values(selecoes[cor]).reduce((a, b) => a + b, 0);
  };

  const getTotalGeral = () => {
    return Object.values(selecoes).reduce((acc, obj) => acc + Object.values(obj).reduce((a, b) => a + b, 0), 0);
  };

  const handleAdicionarAoCarrinho = () => {
    const totalPecas = getTotalGeral();
    
    if (totalPecas < qtdMinima) {
      alert(`⚠️ Você precisa selecionar no mínimo ${qtdMinima} peças no total para este modelo.`);
      return;
    }

    const itensParaAdicionar: any[] = [];

    Object.keys(selecoes).forEach(cor => {
      Object.keys(selecoes[cor]).forEach(tamanho => {
        const qtd = selecoes[cor][tamanho];
        if (qtd > 0) {
          itensParaAdicionar.push({
            id: `${produto.id}-${cor}-${tamanho}`, 
            produtoId: String(produto.id),
            nome: produto.nome,
            preco: produto.preco,
            imagem: produto.imagens?.[0],
            cor: cor,
            tamanho: tamanho,
            quantidade: qtd
          });
        }
      });
    });

    adicionarAoCarrinho(itensParaAdicionar);
    setSelecoes({});
  };

  if (carregando) return <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Carregando detalhes...</p></div>;
  if (!produto) return <div className="min-h-screen flex items-center justify-center"><p>Produto não encontrado.</p></div>;

  const totalGeral = getTotalGeral();

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <PublicHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 flex-1 w-full pb-20">
        
        {/* BREADCRUMBS */}
        <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest font-bold mb-8 flex items-center gap-2 overflow-x-auto hide-scrollbar whitespace-nowrap">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1"><ArrowLeft size={14} className="mb-0.5"/> Início</Link>
          <ChevronRight size={12} />
          <Link href={`/#${produto.categoria || "Novidades"}`} className="hover:text-primary transition-colors">
            {produto.categoria || "Catálogo"}
          </Link>
          <ChevronRight size={12} />
          <span className="text-foreground">{produto.nome}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          
          {/* FOTOS E CARROSSEL */}
          <div className="flex flex-col-reverse md:flex-row gap-4 h-full max-h-[800px]">
            {produto.imagens && produto.imagens.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-auto hide-scrollbar md:w-24 shrink-0 mt-4 md:mt-0 pb-2 md:pb-0">
                {produto.imagens.map((img: string, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => setFotoAtualIndex(idx)}
                    className={`relative w-20 h-24 md:w-full md:h-32 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${fotoAtualIndex === idx ? 'border-primary opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="relative flex-1 bg-secondary/10 rounded-2xl overflow-hidden aspect-[3/4] md:aspect-auto group shadow-sm border border-border/50">
              <img src={produto.imagens?.[fotoAtualIndex]} alt={produto.nome} className="w-full h-full object-cover" />
              {produto.imagens && produto.imagens.length > 1 && (
                <>
                  <button onClick={fotoAnterior} className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground p-2 rounded-full shadow-md transition-all md:opacity-0 group-hover:opacity-100">
                    <ChevronLeft size={24} />
                  </button>
                  <button onClick={fotoProxima} className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground p-2 rounded-full shadow-md transition-all md:opacity-0 group-hover:opacity-100">
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* DADOS DE SELEÇÃO */}
          <div className="flex flex-col pt-2">
            <div className="border-b border-border/50 pb-5 mb-5">
              <div className="flex gap-2 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-secondary text-muted-foreground px-2.5 py-1 rounded">{produto.tecido}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-secondary/50 text-muted-foreground border border-border/50 px-2.5 py-1 rounded">{produto.categoria_tamanho}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold font-serif text-foreground tracking-tight mb-2">
                {produto.nome}
              </h1>
              <p className="text-4xl text-primary font-bold font-serif mb-4">
                R$ {Number(produto.preco).toFixed(2).replace(".", ",")}
              </p>

              {/* 🔴 LINK DO DRIVE: COM A COR DA MARCA (PRIMÁRIA) */}
              {produto.link_drive && (
                <div className="mt-4 bg-primary rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                      <Download size={14} className="opacity-80" /> Material de Apoio
                    </div>
                    <p className="text-[11px] text-primary-foreground/80 font-medium leading-relaxed">
                      Baixe fotos reais do lote para antecipar suas vendas.
                    </p>
                  </div>
                  <a 
                    href={produto.link_drive} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="bg-background text-primary hover:bg-secondary border border-border/10 font-bold uppercase tracking-widest text-[10px] px-4 py-2.5 rounded-lg shadow-sm transition-all shrink-0 flex items-center gap-2 hover:scale-105"
                  >
                    Acessar Drive
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-6 flex-1">
              {/* Cores */}
              {produto.cores && produto.cores.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-foreground">1. Escolha a Cor</p>
                    
                    {/* Botão de Alternância para fotos do fardo */}
                    {produto.foto_fardo && (
                      <button 
                        onClick={() => setAbaAtiva(abaAtiva === "detalhes" ? "fardo" : "detalhes")}
                        className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1 border border-primary/20 bg-primary/5 rounded-md px-2 py-1 hover:bg-primary/10 transition-all"
                      >
                        <Camera size={12} /> {abaAtiva === "detalhes" ? "Ver Foto do Fardo" : "Ver Modelo"}
                      </button>
                    )}
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    {produto.cores.map((nomeCor: string) => {
                      const corRef = coresBanco.find(c => c.nome === nomeCor);
                      const isAtiva = corAtiva === nomeCor;
                      const qtdDestaCor = getTotalCor(nomeCor);
                      return (
                        <div key={nomeCor} className="relative">
                          {qtdDestaCor > 0 && (
                            <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50">{qtdDestaCor}</span>
                          )}
                          <button onClick={() => { setCorAtiva(nomeCor); setAbaAtiva("detalhes"); }} className={`flex items-center gap-2 rounded-full px-4 py-2 shadow-sm transition-all border-2 ${isAtiva ? 'border-primary bg-primary/5 scale-105' : 'border-border/60 bg-card hover:border-primary/40'}`}>
                            <div className="w-5 h-5 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: corRef ? corRef.hex : '#ccc' }} />
                            <span className={`text-xs font-bold ${isAtiva ? 'text-primary' : 'text-foreground/80'}`}>{nomeCor}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SESSÃO: PREVISUALIZAÇÃO DA FOTO DO FARDO REAL (MAIS OBJETIVA) */}
              {abaAtiva === "fardo" && produto.foto_fardo ? (
                <div className="border border-border/80 rounded-xl p-3 bg-card space-y-2 animate-in zoom-in-95 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                      <Package size={14} className="text-primary"/> Cores Reais do Fardo
                    </div>
                    <button onClick={() => setAbaAtiva("detalhes")} className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors">Fechar</button>
                  </div>
                  <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-border/50 bg-secondary/10">
                    <img src={produto.foto_fardo} alt="Foto real das cores no fardo" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center font-medium">
                    Foto de fábrica sem edição. Tons exatos da mercadoria.
                  </p>
                </div>
              ) : (
                /* Card estático para lembrar o cliente que você garante tons reais */
                <div className="border border-border/60 bg-secondary/10 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Camera size={14} className="text-foreground" /> Cor real do fardo
                  </span>

                </div>
              )}

              {/* Matriz de Tamanhos */}
              {produto.grade_tamanhos && produto.grade_tamanhos.length > 0 && corAtiva && (
                <div className="mt-6 border border-border/50 rounded-xl overflow-hidden bg-card shadow-sm animate-in fade-in slide-in-from-bottom-2">
                  <div className="bg-secondary/20 px-4 py-3 border-b border-border/50 flex justify-between items-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-foreground">2. Quantidade em <span className="text-primary">{corAtiva}</span></p>
                    <span className="text-[9px] font-bold uppercase bg-background border border-border px-2 py-1 rounded text-muted-foreground">Subtotal Cor: {getTotalCor(corAtiva)}</span>
                  </div>
                  <div className="divide-y divide-border/50">
                    {produto.grade_tamanhos.map((t: string) => {
                      const qtd = selecoes[corAtiva]?.[t] || 0;
                      return (
                        <div key={t} className="flex justify-between items-center px-4 py-3 hover:bg-secondary/5 transition-colors">
                          <span className="font-bold text-sm text-foreground w-12">{t}</span>
                          <div className="flex items-center border border-border/80 rounded-lg overflow-hidden bg-background h-10 w-32 shadow-sm">
                            <button type="button" onClick={() => alterarQtd(t, -1)} disabled={qtd === 0} className="flex-1 flex justify-center items-center hover:bg-secondary/50 text-foreground transition-colors disabled:opacity-20"><Minus size={14} /></button>
                            <span className="flex-1 text-center font-bold text-sm border-x border-border/50 bg-secondary/10">{qtd}</span>
                            <button type="button" onClick={() => alterarQtd(t, 1)} className="flex-1 flex justify-center items-center hover:bg-secondary/50 text-foreground transition-colors"><Plus size={14} /></button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* BOX DE PREÇO FINAL */}
            <div className="mt-8 bg-secondary/10 p-6 md:p-8 rounded-2xl border border-border/50 shadow-sm">
              <div className="flex justify-between items-end border-b border-border/50 pb-5 mb-5">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex flex-col gap-1">
                  <span>Peças Selecionadas: <strong className="text-foreground text-sm">{totalGeral}</strong></span>
                  {totalGeral > 0 && totalGeral < qtdMinima && <span className="text-[9px] text-destructive">Faltam {qtdMinima - totalGeral} peças para o mínimo</span>}
                </span>
                <span className="text-2xl md:text-3xl font-bold font-serif text-foreground">R$ {(produto.preco * totalGeral).toFixed(2).replace(".", ",")}</span>
              </div>

              <button 
                onClick={handleAdicionarAoCarrinho}
                disabled={totalGeral === 0}
                className={`w-full font-bold uppercase tracking-widest text-sm md:text-base py-4 md:py-5 rounded-xl flex items-center justify-center gap-3 shadow-xl transition-all ${totalGeral >= qtdMinima ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.02]' : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'}`}
              >
                <ShoppingCart size={22} /> ADICIONAR À SACOLA
              </button>
            </div>

            {/* EXPLICATIVO DO WHATSAPP */}
            <div className="mt-4 bg-emerald-50/80 border border-emerald-200/60 rounded-2xl p-5 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-800 mb-3 flex items-center gap-2">
                <MessageCircle size={16} /> Como funciona a compra?
              </h4>
              <ul className="space-y-3 text-xs text-emerald-900/80 font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="bg-emerald-200 text-emerald-800 rounded-full w-4 h-4 flex items-center justify-center shrink-0 text-[9px] font-bold mt-0.5">1</span>
                  <span className="leading-snug">Monte seu lote selecionando as variações e adicione à sacola.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="bg-emerald-200 text-emerald-800 rounded-full w-4 h-4 flex items-center justify-center shrink-0 text-[9px] font-bold mt-0.5">2</span>
                  <span className="leading-snug">Clique no botão verde do carrinho para nos enviar a lista via WhatsApp.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="bg-emerald-200 text-emerald-800 rounded-full w-4 h-4 flex items-center justify-center shrink-0 text-[9px] font-bold mt-0.5">3</span>
                  <span className="leading-snug">Nossa equipe confere as peças no estoque e finaliza o pagamento 100% seguro com você!</span>
                </li>
              </ul>
            </div>

            {/* DESCRIÇÃO DA PEÇA */}
            <div className="mt-6">
              {produto.descricao && (
                <div className="bg-card border border-border/50 p-6 rounded-2xl shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-3 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-primary"/> Descrição da Peça
                  </h3>
                  <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                    {produto.descricao}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}