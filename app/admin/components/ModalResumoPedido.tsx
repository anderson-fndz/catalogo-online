import { X, Image as ImageIcon } from "lucide-react";

// Funções de cores movidas para dentro do componente (isolamento total)
const encontrarHexCor = (nomeCor: string, coresBanco: any[]) => {
  const corAchada = coresBanco.find(c => c.nome?.toLowerCase().trim() === nomeCor.toLowerCase().trim());
  return corAchada?.hex || '#cbd5e1'; 
};

const getCorDoTexto = (hexColor: string) => {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '#ffffff';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#111827' : '#ffffff'; 
};

export default function ModalResumoPedido({ pedidoDetalhe, setPedidoDetalhe, todosItens, todosProdutos, coresBanco }: any) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in font-sans">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* CABEÇALHO MODAL */}
        <div className="px-6 py-4 border-b border-border/50 bg-secondary/20 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-lg font-bold text-foreground font-serif">Resumo do Pedido</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">ID: {pedidoDetalhe.id.substring(0,8)}</p>
          </div>
          <button onClick={() => setPedidoDetalhe(null)} className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground">
            <X size={20}/>
          </button>
        </div>
        
        {/* CORPO MODAL */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Box de Informações Rápidas */}
          <div className="flex justify-between items-center bg-secondary/10 p-5 rounded-xl border border-border/50">
            <div>
              <p className="text-sm font-bold text-foreground">{pedidoDetalhe.cliente?.nome || pedidoDetalhe.cliente_nome || "Venda Balcão"}</p>
              <p className="text-xs text-muted-foreground mt-1">{pedidoDetalhe.cliente?.whatsapp || pedidoDetalhe.cliente_whatsapp || "Sem contato"}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-emerald-600">R$ {Number(pedidoDetalhe.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{new Date(pedidoDetalhe.created_at).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>

          {/* Lista de Produtos Comprados */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Peças na Nota</h4>
            <div className="space-y-4">
              {(() => {
                const itensDoPedido = todosItens.filter((i: any) => i.pedido_id === pedidoDetalhe.id);
                
                const itensAgrupados = itensDoPedido.reduce((acc: any, item: any) => {
                  const prod = todosProdutos.find((p: any) => p.id === item.produto_id);
                  const nomeProd = prod?.nome || "Produto Desconhecido";
                  const imgUrl = (prod?.imagens && Array.isArray(prod.imagens)) ? prod.imagens[0] : null;

                  if (!acc[item.produto_id]) {
                    acc[item.produto_id] = {
                      produto_id: item.produto_id,
                      nome: nomeProd,
                      imagem_url: imgUrl,
                      tamanhos: {},
                      total_produto: 0
                    };
                  }

                  const tam = item.tamanho_selecionado || "N/A";
                  const cor = item.cor_selecionada || "N/A";

                  if (!acc[item.produto_id].tamanhos[tam]) {
                    acc[item.produto_id].tamanhos[tam] = { cores: {} };
                  }
                  if (!acc[item.produto_id].tamanhos[tam].cores[cor]) {
                    acc[item.produto_id].tamanhos[tam].cores[cor] = 0;
                  }

                  acc[item.produto_id].tamanhos[tam].cores[cor] += item.quantidade;
                  acc[item.produto_id].total_produto += item.quantidade;

                  return acc;
                }, {});

                return Object.values(itensAgrupados).map((produto: any) => (
                  <div key={produto.produto_id} className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
                    
                    {/* Mestre do Produto */}
                    <div className="flex items-center gap-4 bg-secondary/20 p-3 border-b border-border/50">
                      {produto.imagem_url ? (
                        <img src={produto.imagem_url} alt={produto.nome} className="w-10 h-10 rounded-lg object-cover border border-border/50" />
                      ) : (
                        <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground border border-border/50">
                          <ImageIcon size={18} />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-foreground line-clamp-1">{produto.nome}</h4>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-extrabold mt-0.5">
                          {produto.total_produto} peças
                        </div>
                      </div>
                    </div>

                    {/* Grade de Tamanhos e Cores */}
                    <div className="divide-y divide-border/30">
                      {Object.entries(produto.tamanhos).map(([tam, dadosTam]: any) => (
                        <div key={tam} className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                          
                          <span className="text-[10px] uppercase tracking-widest border border-border px-2 py-1 rounded-md font-bold bg-secondary/30 w-16 text-center shrink-0">
                            TAM: {tam}
                          </span>
                          
                          <div className="flex-1 flex flex-wrap gap-2 sm:pl-3 sm:border-l sm:border-border/50">
                            {Object.entries(dadosTam.cores).map(([cor, qtd]: any) => {
                              const bgHex = encontrarHexCor(cor, coresBanco);
                              const textHex = getCorDoTexto(bgHex);
                              
                              return (
                                <div key={cor} className="flex items-center rounded-full border shadow-sm overflow-hidden text-[10px] font-bold tracking-wide" style={{ backgroundColor: bgHex, color: textHex, borderColor: '#00000015' }}>
                                  <span className="px-2.5 py-1">{cor}</span>
                                  <div className="px-2 py-1 border-l" style={{ borderColor: `${textHex}30`, backgroundColor: `${textHex}10` }}>
                                    <span className="font-extrabold">{qtd}x</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}