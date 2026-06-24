import { create } from 'zustand';

export interface ItemCarrinho {
  id: string; // Ex: "id-Preto-M"
  produtoId: string;
  nome: string;
  preco: number;
  imagem: string;
  cor: string;
  tamanho: string;
  quantidade: number;
}

interface CarrinhoState {
  itens: ItemCarrinho[];
  aberto: boolean;
  setAberto: (aberto: boolean) => void;
  adicionarAoCarrinho: (novosItens: ItemCarrinho[]) => void;
  alterarQuantidade: (id: string, quantidade: number) => void;
  removerItem: (id: string) => void;
  limparCarrinho: () => void;
}

export const useCarrinhoStore = create<CarrinhoState>((set) => ({
  itens: [],
  aberto: false,
  
  setAberto: (aberto) => set({ aberto }),

  adicionarAoCarrinho: (novosItens) => {
    set((state) => {
      const carrinhoAtualizado = [...state.itens];

      novosItens.forEach((novoItem) => {
        const index = carrinhoAtualizado.findIndex(item => item.id === novoItem.id);
        
        if (index >= 0) {
          carrinhoAtualizado[index].quantidade += novoItem.quantidade;
        } else {
          carrinhoAtualizado.push(novoItem);
        }
      });

      // MÁGICA DE UX: Abre o carrinho automaticamente ao adicionar itens
      return { itens: carrinhoAtualizado, aberto: true };
    });
  },

  alterarQuantidade: (id, quantidade) => {
    set((state) => ({
      itens: state.itens
        .map((item) => (item.id === id ? { ...item, quantidade } : item))
        .filter((item) => item.quantidade > 0), // Se a quantidade chegar a 0, remove da lista
    }));
  },

  removerItem: (id) => {
    set((state) => ({
      itens: state.itens.filter((item) => item.id !== id),
    }));
  },

  limparCarrinho: () => set({ itens: [] }),
}));