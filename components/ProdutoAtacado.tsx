"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart, ChevronLeft, ChevronRight, MessageCircle, DownloadCloud } from "lucide-react";
import { useCarrinhoStore } from "@/store/carrinhoStore";
import { supabase } from "@/lib/supabase";

export function ProdutoAtacado({ produto }: { produto: any }) {
  // Dicionário Dinâmico que puxa do Banco de Dados
  const [mapaDeCores, setMapaDeCores] = useState<Record<string, string>>({});

  useEffect(() => {
    async function carregarCores() {
      const { data } = await supabase.from("cores").select("nome, hex");
      if (data) {
        const dicionario: Record<string, string> = {};
        data.forEach((cor) => {
          dicionario[cor.nome] = cor.hex;
        });
        setMapaDeCores(dicionario);
      }
    }
    carregarCores();
  }, []);

  const [fotoPrincipal, setFotoPrincipal] = useState(
    produto.imagens?.[0] || "https://placehold.co/400x600?text=Sem+Foto"
  );

  const cores = produto.cores && produto.cores.length > 0 ? produto.cores : ["Única"];
  const [corAtiva, setCorAtiva] = useState(cores[0]);

  const grade = produto.grade_tamanhos || ["P", "M", "G", "GG"];
  
  const [quantidades, setQuantidades] = useState<Record<string, Record<string, number>>>(() => {
    const estadoInicial: Record<string, Record<string, number>> = {};
    cores.forEach((cor: string) => {
      estadoInicial[cor] = {};
      grade.forEach((tamanho: string) => {
        estadoInicial[cor][tamanho] = 0;
      });
    });
    return estadoInicial;
  });

  const alterarQuantidade = (tamanho: string, delta: number) => {
    setQuantidades((prev) => {
      const qtdAtual = prev[corAtiva][tamanho] || 0;
      const novaQtd = qtdAtual + delta;
      if (novaQtd < 0) return prev; 
      return {
        ...prev,
        [corAtiva]: {
          ...prev[corAtiva],
          [tamanho]: novaQtd
        }
      };
    });
  };

  const indexAtual = produto.imagens?.indexOf(fotoPrincipal) || 0;
  
  const fotoAnterior = () => {
    if (!produto.imagens) return;
    const novoIndex = indexAtual === 0 ? produto.imagens.length - 1 : indexAtual - 1;
    setFotoPrincipal(produto.imagens[novoIndex]);
  };

  const proximaFoto = () => {
    if (!produto.imagens) return;
    const novoIndex = indexAtual === produto.imagens.length - 1 ? 0 : indexAtual + 1;
    setFotoPrincipal(produto.imagens[novoIndex]);
  };

  let totalPecas = 0;
  Object.values(quantidades).forEach((tamanhosDaCor) => {
    Object.values(tamanhosDaCor).forEach((qtd) => {
      totalPecas += qtd;
    });
  });
  const precoSoma = totalPecas * Number(produto.preco);

  const qtdMinima = produto.qtd_minima ?? 0;
  const isAbaixoDoMinimo = totalPecas > 0 && qtdMinima > 0 && totalPecas < qtdMinima;
  const podeAdicionar = totalPecas > 0 && !isAbaixoDoMinimo;

  const adicionarAoCarrinho = useCarrinhoStore((state) => state.adicionarAoCarrinho);

  const handleAdicionarAoCarrinho = () => {
    const itensParaSalvar: any[] = [];

    Object.entries(quantidades).forEach(([cor, tamanhos]) => {
      Object.entries(tamanhos).forEach(([tamanho, qtd]) => {
        if (qtd > 0) {
          itensParaSalvar.push({
            id: `${produto.id}-${cor}-${tamanho}`,
            produtoId: produto.id,
            nome: produto.nome,
            preco: produto.preco,
            imagem: fotoPrincipal,
            cor: cor,
            tamanho: tamanho,
            quantidade: qtd,
          });
        }
      });
    });

    if (itensParaSalvar.length > 0) {
      adicionarAoCarrinho(itensParaSalvar);
      
      // MÁGICA 1: Abre a gaveta do carrinho automaticamente!
      useCarrinhoStore.getState().setAberto(true);
      
      // MÁGICA 2: O código que "zerava" as quantidades foi removido daqui.
      // Agora os números continuam na tela para o lojista não se perder na grade!
    }
  };

  return (
    <div className="grid lg:grid-cols-[400px_1fr] xl:grid-cols-[450px_1fr] gap-8 lg:gap-12 items-start">
      
      {/* LADO ESQUERDO: Galeria */}
      <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4 lg:sticky lg:top-24">
        <div className="flex md:flex-col gap-2 md:gap-3 overflow-x-auto md:w-16 shrink-0 scrollbar-hide pb-2 md:pb-0">
          {produto.imagens?.map((img: string, idx: number) => (
            <button
              key={idx}
              onClick={() => setFotoPrincipal(img)}
              className={`relative aspect-[3/4] w-16 md:w-full rounded-md overflow-hidden transition-all ${
                fotoPrincipal === img ? "ring-2 ring-primary border-transparent" : "border border-border hover:border-muted-foreground"
              }`}
            >
              <img src={img} alt={`Miniatura ${idx}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        <div className="relative aspect-[3/4] flex-1 rounded-md overflow-hidden bg-muted border border-border group">
          <img src={fotoPrincipal} alt={produto.nome} className="w-full h-full object-cover" />
          
          {produto.imagens && produto.imagens.length > 1 && (
            <>
              <button onClick={fotoAnterior} className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground p-1.5 rounded-full shadow-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button onClick={proximaFoto} className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground p-1.5 rounded-full shadow-md opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* LADO DIREITO: Painel de Compra */}
      <div className="flex flex-col pt-2 md:pt-4">
        
        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight mb-2">
          {produto.nome}
        </h1>
        <div className="flex items-end gap-2 mb-8">
          <span className="text-3xl font-extrabold text-primary tracking-tight">
            R$ {Number(produto.preco).toFixed(2).replace(".", ",")}
          </span>
        </div>

        {/* CORES */}
        {cores[0] !== "Única" && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Cor</h3>
              <span className="text-sm text-muted-foreground">{corAtiva}</span>
            </div>
            
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              {cores.map((cor: string) => {
                const pecasNessaCor = Object.values(quantidades[cor]).reduce((a, b) => a + b, 0);
                
                // O app cruza o nome da cor com o banco de dados dinâmico
                const corHex = mapaDeCores[cor] || "#e5e7eb"; 
                
                return (
                  <button
                    key={cor}
                    onClick={() => setCorAtiva(cor)}
                    className={`relative flex flex-col items-center justify-start p-2 rounded-lg transition-all w-[76px] min-h-[88px] ${
                      corAtiva === cor ? "bg-muted shadow-inner" : "bg-transparent hover:bg-muted/50"
                    }`}
                  >
                    <div 
                      className={`w-10 h-10 shrink-0 rounded-full border mb-2 shadow-sm transition-transform hover:scale-105 ${
                        corAtiva === cor ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "border-border"
                      }`}
                      style={{ backgroundColor: corHex }}
                    />
                    <span className={`text-[11px] leading-tight text-center font-medium ${corAtiva === cor ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {cor}
                    </span>

                    {pecasNessaCor > 0 && (
                      <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
                        {pecasNessaCor}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* GRADE DE TAMANHOS */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-foreground mb-3">Tamanhos</h3>
          <div className="grid grid-cols-3 gap-3">
            {grade.map((tamanho: string) => {
              const qtd = quantidades[corAtiva][tamanho] || 0;
              return (
                <div key={tamanho} className={`flex flex-col items-center p-3 border rounded-lg transition-colors bg-background ${qtd > 0 ? 'border-primary ring-1 ring-primary shadow-sm' : 'border-border'}`}>
                  <span className={`font-semibold text-base mb-3 ${qtd > 0 ? 'text-primary' : 'text-foreground'}`}>
                    {tamanho}
                  </span>
                  <div className="flex items-center border border-border rounded-md overflow-hidden h-9 w-full bg-muted/30">
                    <button onClick={() => alterarQuantidade(tamanho, -1)} className="flex-1 h-full flex items-center justify-center hover:bg-muted text-foreground transition-colors"><Minus className="h-4 w-4" /></button>
                    <div className="flex-1 text-center text-sm font-bold text-foreground border-x border-border h-full flex items-center justify-center bg-background">{qtd}</div>
                    <button onClick={() => alterarQuantidade(tamanho, 1)} className="flex-1 h-full flex items-center justify-center hover:bg-muted text-foreground transition-colors"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RESUMO FIXO E BOTÕES */}
        <div className="bg-muted/30 border border-border rounded-lg p-4 sm:p-6 mb-8 flex flex-col gap-4">
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground mb-1">Total peças</span>
              <span className="text-lg font-bold text-foreground">{totalPecas}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm text-muted-foreground mb-1">Valor Final</span>
              <span className="text-2xl font-bold text-primary">R$ {precoSoma.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>
          
          <Button onClick={handleAdicionarAoCarrinho} disabled={!podeAdicionar} className={`w-full py-6 text-base font-bold transition-all duration-300 rounded-md ${!podeAdicionar ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.01] shadow-md"}`}>
            <ShoppingCart className="mr-3 h-5 w-5" />
            Adicionar à Cesta
          </Button>

          <div className="flex items-center justify-center gap-2 mt-1 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="text-emerald-500" viewBox="0 0 16 16">
              <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
            </svg>
            <span className="text-[11px] font-medium uppercase tracking-wider">Fechamento seguro via WhatsApp</span>
          </div>
          
          {isAbaixoDoMinimo && (
            <p className="text-[12px] text-destructive font-medium text-center mt-2">
              Mínimo de {qtdMinima} {qtdMinima === 1 ? 'peça' : 'peças'} para fechar pedido deste modelo.
            </p>
          )}
        </div>

        {/* DETALHES E MATERIAL DE REVENDA */}
        <div className="pt-6 border-t border-border mt-2">
          <h3 className="text-sm font-semibold text-foreground mb-3">Detalhes da Peça</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            {produto.descricao || "Peça desenvolvida com modelagem exclusiva Jordan Collection, garantindo caimento perfeito e durabilidade. Ideal para lojistas que buscam giro rápido e qualidade."}
          </p>

          {produto.link_drive && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-background p-2 rounded-md shadow-sm border border-border shrink-0">
                  <DownloadCloud className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Material para Revenda</h4>
                  <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">
                    Acesse nossa pasta segura e baixe fotos em alta qualidade com modelo para divulgar na sua loja.
                  </p>
                </div>
              </div>
              <a href={produto.link_drive} target="_blank" rel="noopener noreferrer" className="w-full text-xs font-bold uppercase tracking-wider bg-background border border-border hover:bg-muted text-foreground py-3 rounded-md flex items-center justify-center transition-colors shadow-sm">
                Acessar Fotos no Drive
              </a>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}