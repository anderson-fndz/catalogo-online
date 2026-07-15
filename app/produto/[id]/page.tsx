"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ChevronLeft, ChevronRight, Download, Plus, Minus, ArrowLeft, Camera, CheckCircle2, Package, Sparkles } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";

// =====================================================================
// 🚩 FEATURE FLAG: MODO CATÁLOGO CEGO vs MODO CARRINHO COMPLETO
// Mude para 'false' para deixar o carrinho ADORMECIDO (Modo Catálogo)
// Mude para 'true' para ACORDAR o carrinho, cores, tamanhos e soma.
// =====================================================================
const MODO_CARRINHO_ATIVO = false;

// Ícone Oficial do WhatsApp
const WhatsappIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

export default function ProdutoPage() {
  const params = useParams();
  
  const [produto, setProduto] = useState<any | null>(null);
  const [coresBanco, setCoresBanco] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [fotoAtualIndex, setFotoAtualIndex] = useState(0);
  const [abaAtiva, setAbaAtiva] = useState<"detalhes" | "fardo">("detalhes");

  // ESTADOS ADORMECIDOS
  const [corAtiva, setCorAtiva] = useState<string>("");
  const [qtdMinima, setQtdMinima] = useState<number>(1);
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

  // FUNÇÕES ADORMECIDAS DO CARRINHO
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

  // =====================================================================
  // SISTEMA ANTI-SPAM DE MÉTRICAS (Garante Leads Únicos por 24h)
  // =====================================================================
  const registrarMetricaUnica = async (acaoMetrica: string) => {
    try {
      // 1. Cria uma "chave" única para esse produto na memória do celular dela
      const chaveMemoria = `jc_clique_${produto.id}`;
      const ultimoClique = localStorage.getItem(chaveMemoria);

      if (ultimoClique) {
        // 2. Se ela já clicou, vamos ver quantas horas faz
        const horasPassadas = (Date.now() - Number(ultimoClique)) / (1000 * 60 * 60);
        
        // Se faz menos de 24 horas, bloqueia o envio pro Supabase (Evita dados falsos no BI)
        if (horasPassadas < 24) {
          console.log("Clique repetido ignorado pelo BI.");
          return; 
        }
      }

      // 3. Se é a primeira vez (ou faz mais de 24h), anota no Supabase!
      await supabase.from("metricas_produtos").insert([{ 
        produto_id: produto.id, 
        nome_produto: produto.nome, 
        tipo_acao: acaoMetrica 
      }]);

      // 4. Carimba a hora do clique na memória do celular dela
      localStorage.setItem(chaveMemoria, Date.now().toString());

    } catch (error) {
      console.error("Erro na métrica:", error);
    }
  };

  // WHATSAPP 1: MODO CARRINHO ATIVO
  const handleAcaoWhatsappCarrinho = async () => {
    const totalPecas = getTotalGeral();
    let mensagemStr = "";
    let acaoMetrica = "";

    if (totalPecas > 0 && totalPecas < qtdMinima) {
      alert(`⚠️ Você precisa selecionar no mínimo ${qtdMinima} peças no total para este modelo.`);
      return;
    }

    if (totalPecas === 0) {
      acaoMetrica = "clique_whatsapp_duvida";
      mensagemStr = `Oi! Estou vendo o modelo *${produto.nome}* no site e gostaria de tirar algumas dúvidas sobre o atacado. ✨`;
    } else {
      acaoMetrica = "checkout_whatsapp_direto";
      mensagemStr = `Olá! Gostaria de fechar um pedido de atacado do modelo *${produto.nome}*.\n\n*Minha Grade Selecionada:*\n`;
      Object.keys(selecoes).forEach(cor => {
        Object.keys(selecoes[cor]).forEach(tamanho => {
          const qtd = selecoes[cor][tamanho];
          if (qtd > 0) mensagemStr += `👉 ${qtd}x Tamanho ${tamanho} na cor ${cor}\n`;
        });
      });
      mensagemStr += `\n*Total de peças:* ${totalPecas} un.\n`;
      mensagemStr += `*Valor do pedido:* R$ ${(produto.preco * totalPecas).toFixed(2).replace(".", ",")}\n\n`;
      mensagemStr += `Podemos prosseguir com o pagamento e envio? 📦`;
    }

    await registrarMetricaUnica(acaoMetrica);

    const numeroWhatsAppDaLoja = "5511961624287"; 
    window.open(`https://wa.me/${numeroWhatsAppDaLoja}?text=${encodeURIComponent(mensagemStr)}`, '_blank');
  };

  // WHATSAPP 2: MODO CATÁLOGO CEGO
  const handleAcaoWhatsappCatalogo = async () => {
    await registrarMetricaUnica("clique_whatsapp_catalogo");

    const mensagemStr = `Oi! Estou vendo o modelo *${produto.nome}* no catálogo e gostaria de saber mais detalhes sobre a disponibilidade e fechar um pedido de atacado. ✨`;
    const numeroWhatsAppDaLoja = "5511961624287"; 
    window.open(`https://wa.me/${numeroWhatsAppDaLoja}?text=${encodeURIComponent(mensagemStr)}`, '_blank');
  };

  if (carregando) return <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Carregando detalhes...</p></div>;
  if (!produto) return <div className="min-h-screen flex items-center justify-center"><p>Produto não encontrado.</p></div>;

  const totalGeral = getTotalGeral();

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col">
      <PublicHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 flex-1 w-full pb-20">
        
        {/* BREADCRUMBS */}
        <div className="text-[10px] sm:text-[11px] text-muted-foreground uppercase tracking-widest font-bold mb-6 flex items-center gap-2 overflow-x-auto hide-scrollbar whitespace-nowrap">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1"><ArrowLeft size={14} className="mb-0.5"/> Início</Link>
          <ChevronRight size={12} />
          <Link href={`/#${produto.categoria || "Novidades"}`} className="hover:text-primary transition-colors">
            {produto.categoria || "Catálogo"}
          </Link>
          <ChevronRight size={12} />
          <span className="text-foreground">{produto.nome}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
          
          {/* FOTOS E CARROSSEL */}
          <div className="flex flex-col-reverse md:flex-row gap-3 h-full max-h-[700px]">
            {produto.imagens && produto.imagens.length > 1 && (
              <div className="flex md:flex-col gap-2.5 overflow-auto hide-scrollbar md:w-20 shrink-0 mt-3 md:mt-0 pb-2 md:pb-0">
                {produto.imagens.map((img: string, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => setFotoAtualIndex(idx)}
                    className={`relative w-16 h-20 md:w-full md:h-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${fotoAtualIndex === idx ? 'border-primary opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
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
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={fotoProxima} className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground p-2 rounded-full shadow-md transition-all md:opacity-0 group-hover:opacity-100">
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* DADOS DO PRODUTO E LÓGICA DE COMPRA */}
          <div className="flex flex-col pt-1">
            
            {/* CABEÇALHO DO PRODUTO - DIMINUÍDO */}
            <div className="border-b border-border/50 pb-4 mb-4">
              <div className="flex gap-2 mb-3">
                <span className="text-[9px] font-bold uppercase tracking-widest bg-secondary text-muted-foreground px-2 py-1 rounded">{produto.tecido}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest bg-secondary/50 text-muted-foreground border border-border/50 px-2 py-1 rounded">{produto.categoria_tamanho}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-foreground tracking-tight mb-1">
                {produto.nome}
              </h1>
              <p className="text-3xl text-primary font-bold font-serif mb-3">
                R$ {Number(produto.preco).toFixed(2).replace(".", ",")}
              </p>

              {produto.link_drive && (
                <div className="mt-3 bg-primary rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
                      <Download size={14} className="opacity-80" /> Material de Apoio
                    </div>
                    <p className="text-[10px] text-primary-foreground/80 font-medium">
                      Baixe fotos reais do lote para antecipar suas vendas.
                    </p>
                  </div>
                  <a 
                    href={produto.link_drive} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="bg-background text-primary hover:bg-secondary border border-border/10 font-bold uppercase tracking-widest text-[9px] px-3 py-2 rounded-lg shadow-sm transition-all shrink-0 flex items-center gap-1.5 hover:scale-105"
                  >
                    Acessar Drive
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-4 flex-1">
              
              {/* ===================================================================== */}
              {/* RENDERIZAÇÃO CONDICIONAL: CARRINHO VS CATÁLOGO CEGO */}
              {/* ===================================================================== */}
              
              {MODO_CARRINHO_ATIVO ? (
                /* INÍCIO DO MODO CARRINHO (COMPLETO) */
                <>
                  {/* Cores Interativas */}
                  {produto.cores && produto.cores.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-foreground">1. Escolha a Cor</p>
                        {produto.foto_fardo && (
                          <button 
                            onClick={() => setAbaAtiva(abaAtiva === "detalhes" ? "fardo" : "detalhes")}
                            className="text-[9px] font-bold uppercase tracking-wider text-primary flex items-center gap-1 border border-primary/20 bg-primary/5 rounded-md px-2 py-1 hover:bg-primary/10 transition-all"
                          >
                            <Camera size={12} /> {abaAtiva === "detalhes" ? "Ver Foto do Fardo" : "Ver Modelo"}
                          </button>
                        )}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {produto.cores.map((nomeCor: string) => {
                          const corRef = coresBanco.find(c => c.nome === nomeCor);
                          const isAtiva = corAtiva === nomeCor;
                          const qtdDestaCor = getTotalCor(nomeCor);
                          return (
                            <div key={nomeCor} className="relative">
                              {qtdDestaCor > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-md animate-in zoom-in-50">{qtdDestaCor}</span>
                              )}
                              <button onClick={() => { setCorAtiva(nomeCor); setAbaAtiva("detalhes"); }} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 shadow-sm transition-all border ${isAtiva ? 'border-primary bg-primary/5 scale-105' : 'border-border/60 bg-card hover:border-primary/40'}`}>
                                <div className="w-4 h-4 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: corRef ? corRef.hex : '#ccc' }} />
                                <span className={`text-[11px] font-bold ${isAtiva ? 'text-primary' : 'text-foreground/80'}`}>{nomeCor}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {abaAtiva === "fardo" && produto.foto_fardo ? (
                    <div className="border border-border/80 rounded-xl p-2.5 bg-card space-y-2 animate-in zoom-in-95 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground">
                          <Package size={14} className="text-primary"/> Cores Reais do Fardo
                        </div>
                        <button onClick={() => setAbaAtiva("detalhes")} className="text-[9px] font-bold text-muted-foreground hover:text-primary transition-colors">Fechar</button>
                      </div>
                      <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-border/50 bg-secondary/10">
                        <img src={produto.foto_fardo} alt="Foto real das cores no fardo" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  ) : (
                    <div className="border border-border/60 bg-secondary/10 rounded-xl p-2.5 flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Camera size={14} className="text-foreground" /> Cor real do fardo
                      </span>
                    </div>
                  )}

                  {/* Matriz de Tamanhos (+ e -) */}
                  {produto.grade_tamanhos && produto.grade_tamanhos.length > 0 && corAtiva && (
                    <div className="mt-4 border border-border/50 rounded-xl overflow-hidden bg-card shadow-sm animate-in fade-in slide-in-from-bottom-2">
                      <div className="bg-secondary/20 px-3 py-2.5 border-b border-border/50 flex justify-between items-center">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-foreground">2. Quantidade em <span className="text-primary">{corAtiva}</span></p>
                        <span className="text-[9px] font-bold uppercase bg-background border border-border px-2 py-0.5 rounded text-muted-foreground">Subtotal: {getTotalCor(corAtiva)}</span>
                      </div>
                      <div className="divide-y divide-border/50">
                        {produto.grade_tamanhos.map((t: string) => {
                          const qtd = selecoes[corAtiva]?.[t] || 0;
                          return (
                            <div key={t} className="flex justify-between items-center px-4 py-2.5 hover:bg-secondary/5 transition-colors">
                              <span className="font-bold text-xs text-foreground w-12">{t}</span>
                              <div className="flex items-center border border-border/80 rounded-lg overflow-hidden bg-background h-8 w-28 shadow-sm">
                                <button type="button" onClick={() => alterarQtd(t, -1)} disabled={qtd === 0} className="flex-1 flex justify-center items-center hover:bg-secondary/50 text-foreground transition-colors disabled:opacity-20"><Minus size={14} /></button>
                                <span className="flex-1 text-center font-bold text-xs border-x border-border/50 bg-secondary/10">{qtd}</span>
                                <button type="button" onClick={() => alterarQtd(t, 1)} className="flex-1 flex justify-center items-center hover:bg-secondary/50 text-foreground transition-colors"><Plus size={14} /></button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Box WhatsApp Inteligente (Carrinho) */}
                  <div className="mt-5 bg-secondary/10 p-5 rounded-2xl border border-border/50 shadow-sm transition-all duration-500">
                    {totalGeral > 0 && (
                      <div className="flex justify-between items-end border-b border-border/50 pb-4 mb-4 animate-in fade-in slide-in-from-top-2">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex flex-col gap-1">
                          <span>Peças: <strong className="text-foreground">{totalGeral}</strong></span>
                          {totalGeral < qtdMinima && <span className="text-[9px] text-destructive">Faltam {qtdMinima - totalGeral} peças para o mínimo</span>}
                        </span>
                        <span className="text-xl md:text-2xl font-bold font-serif text-foreground">R$ {(produto.preco * totalGeral).toFixed(2).replace(".", ",")}</span>
                      </div>
                    )}
                    <button 
                      onClick={handleAcaoWhatsappCarrinho}
                      className={`w-full font-bold uppercase tracking-widest text-xs md:text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-xl transition-all 
                      ${totalGeral > 0 && totalGeral < qtdMinima ? 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed' : 'bg-[#25D366] hover:bg-[#1ebd5a] text-white hover:scale-[1.02]'}`}
                    >
                      <WhatsappIcon size={20} /> 
                      {totalGeral >= qtdMinima ? "FECHAR PEDIDO NO WHATSAPP" : "TIRAR DÚVIDAS NO WHATSAPP"}
                    </button>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-3 font-bold text-center">
                      Pedido mínimo da loja: {qtdMinima} peças
                    </p>
                  </div>
                </>

              ) : (
                /* ========================================================= */
                /* INÍCIO DO MODO CATÁLOGO CEGO (ADORMECIDO)                 */
                /* ========================================================= */
                <>
                  {/* Visualização de Cores (Estático) - COMPACTADO */}
                  {produto.cores && produto.cores.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">Opções de Cores</p>
                        {produto.foto_fardo && (
                          <button 
                            onClick={() => setAbaAtiva(abaAtiva === "detalhes" ? "fardo" : "detalhes")}
                            className="text-[9px] font-bold uppercase tracking-wider text-primary flex items-center gap-1 border border-primary/20 bg-primary/5 rounded-md px-2 py-1 hover:bg-primary/10 transition-all"
                          >
                            <Camera size={12} /> {abaAtiva === "detalhes" ? "Ver Foto do Fardo" : "Ver Modelo"}
                          </button>
                        )}
                      </div>

                      {abaAtiva === "detalhes" ? (
                        <div className="flex gap-1.5 flex-wrap">
                          {produto.cores.map((nomeCor: string) => {
                            const corRef = coresBanco.find(c => c.nome === nomeCor);
                            return (
                              <div key={nomeCor} className="flex items-center gap-1.5 rounded-full px-2.5 py-1 border border-border/60 bg-secondary/10">
                                <div className="w-3 h-3 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: corRef ? corRef.hex : '#ccc' }} />
                                <span className="text-[11px] font-semibold text-foreground/80">{nomeCor}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="border border-border/80 rounded-xl p-2.5 bg-card space-y-2 animate-in zoom-in-95 shadow-sm mt-2">
                          <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-border/50 bg-secondary/10">
                            <img src={produto.foto_fardo} alt="Foto real das cores no fardo" className="w-full h-full object-cover" />
                          </div>
                          <p className="text-[9px] text-center text-muted-foreground font-medium uppercase tracking-widest mt-1">Cores reais da mercadoria</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Visualização de Tamanhos (Estático) - COMPACTADO */}
                  {produto.grade_tamanhos && produto.grade_tamanhos.length > 0 && (
                    <div className="pt-1">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-2">Tamanhos Disponíveis</p>
                      <div className="flex gap-2 flex-wrap">
                        {produto.grade_tamanhos.map((t: string) => (
                          <div key={t} className="px-3 py-1.5 rounded-lg border border-border/60 bg-secondary/20 text-xs font-bold text-foreground min-w-[2.5rem] text-center">
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Box WhatsApp Direto (Catálogo) - COMPACTADO */}
                  <div className="mt-5 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2 shadow-inner">
                      <Sparkles size={20} />
                    </div>
                    <h3 className="text-base font-bold font-serif text-emerald-950 mb-1">Gostou desse modelo?</h3>
                    <p className="text-xs font-medium text-emerald-800/80 mb-4 max-w-xs">
                      Fale com a nossa equipe no WhatsApp para escolher cores e fechar seu pedido de atacado!
                    </p>
                    
                    <button 
                      onClick={handleAcaoWhatsappCatalogo}
                      className="w-full font-bold uppercase tracking-widest text-sm py-3.5 rounded-xl flex items-center justify-center gap-2.5 shadow-md transition-all bg-[#25D366] hover:bg-[#1ebd5a] text-white hover:scale-[1.02]"
                    >
                      <WhatsappIcon size={20} /> 
                      COMPRAR PELO WHATSAPP
                    </button>
                    
                    <p className="text-[9px] uppercase tracking-widest text-emerald-700/60 mt-3 font-bold">
                      Pedido mínimo da loja: {qtdMinima} peças
                    </p>
                  </div>
                </>
              )}

            </div>

            {/* DESCRIÇÃO DA PEÇA */}
            <div className="mt-5">
              {produto.descricao && (
                <div className="bg-card border border-border/50 p-5 rounded-2xl shadow-sm">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-foreground mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-primary"/> Descrição
                  </h3>
                  <div className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">
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