"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { Plus, Image as ImageIcon, Loader2, CheckCircle, AlertCircle, RefreshCw, FolderPlus, ChevronLeft, ChevronRight, X, Edit3, Palette, Search, Trash2, Layers, Scissors, Eye, EyeOff, Ruler, Edit2, Check, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

const ORDEM_TAMANHOS = ["PP", "P", "M", "G", "GG", "XG", "EXG", "G1", "G2", "G3", "G4", "G5", "U", "ÚNICO"];
const ordenarTamanhos = (a: string, b: string) => {
  const indexA = ORDEM_TAMANHOS.indexOf(a.toUpperCase());
  const indexB = ORDEM_TAMANHOS.indexOf(b.toUpperCase());
  if (indexA !== -1 && indexB !== -1) return indexA - indexB;
  if (indexA !== -1) return -1;
  if (indexB !== -1) return 1;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
};

export default function AdminPage() {
  const router = useRouter();
  const [verificandoAuth, setVerificandoAuth] = useState(true);

  const [produtos, setProdutos] = useState<any[]>([]);
  const [listaCoresBanco, setListaCoresBanco] = useState<any[]>([]);
  const [listaTecidosBanco, setListaTecidosBanco] = useState<any[]>([]);
  const [listaModelagensBanco, setListaModelagensBanco] = useState<any[]>([]);
  const [listaTamanhosBanco, setListaTamanhosBanco] = useState<any[]>([]);
  const [listaCategoriasBanco, setListaCategoriasBanco] = useState<any[]>([]); // 🔴 NOVO
  const [carregando, setCarregando] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [descricao, setDescricao] = useState("");
  const [coresSelecionadas, setCoresSelecionadas] = useState<string[]>([]);
  const [tamanhosSelecionados, setTamanhosSelecionados] = useState<string[]>([]);
  const [tecido, setTecido] = useState("");
  const [categoriaTamanho, setCategoriaTamanho] = useState("");
  const [categoria, setCategoria] = useState(""); // 🔴 NOVO: Categoria do produto sendo cadastrado
  const [linkDrive, setLinkDrive] = useState("");
  const [qtdMinima, setQtdMinima] = useState("0");
  const [statusEstoque, setStatusEstoque] = useState("Em Estoque");
  const [emPromocao, setEmPromocao] = useState(false);
  const [fotosPreview, setFotosPreview] = useState<{file?: File, url: string}[]>([]);
  
  const [buscaCor, setBuscaCor] = useState("");
  const [formCorAberto, setFormCorAberto] = useState(false);
  const [novaCorNome, setNovaCorNome] = useState("");
  const [novaCorHex, setNovaCorHex] = useState("#5C1226");
  
  const [corEmEdicao, setCorEmEdicao] = useState<{id: string, nome: string, hex: string} | null>(null);

  const [formTamanhoAberto, setFormTamanhoAberto] = useState(false);
  const [novoTamanhoNome, setNovoTamanhoNome] = useState("");
  const [formTecidoAberto, setFormTecidoAberto] = useState(false);
  const [novoTecidoNome, setNovoTecidoNome] = useState("");
  const [formModelagemAberto, setFormModelagemAberto] = useState(false);
  const [novaModelagemNome, setNovaModelagemNome] = useState("");
  const [formCategoriaAberto, setFormCategoriaAberto] = useState(false); // 🔴 NOVO
  const [novaCategoriaNome, setNovaCategoriaNome] = useState(""); // 🔴 NOVO

  const [enviando, setEnviando] = useState(false);
  const [statusMensagem, setStatusMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  useEffect(() => {
    checarAutenticacao();
  }, []);

  async function checarAutenticacao() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setVerificandoAuth(false);
      router.push("/admin"); 
    } else {
      await carregarDadosIniciais();
      setVerificandoAuth(false);
    }
  }

  async function carregarDadosIniciais() {
    setCarregando(true);
    await Promise.all([
      buscarProdutos(), 
      buscarCores(), 
      buscarTecidos(), 
      buscarModelagens(), 
      buscarTamanhos(),
      buscarCategorias() // 🔴 NOVO
    ]);
    setCarregando(false);
  }

  async function buscarProdutos() {
    const { data } = await supabase.from("produtos").select("*").order("created_at", { ascending: false });
    if (data) setProdutos(data);
  }

  async function buscarCores() {
    const { data } = await supabase.from("cores").select("*").order("nome", { ascending: true });
    if (data) setListaCoresBanco(data);
  }

  async function buscarTecidos() {
    const { data } = await supabase.from("tecidos").select("*").order("nome", { ascending: true });
    if (data) {
      setListaTecidosBanco(data);
      if (data.length > 0 && !tecido) setTecido(data[0].nome);
    }
  }

  async function buscarModelagens() {
    const { data } = await supabase.from("modelagens").select("*").order("nome", { ascending: true });
    if (data) {
      setListaModelagensBanco(data);
      if (data.length > 0 && !categoriaTamanho) setCategoriaTamanho(data[0].nome);
    }
  }

  async function buscarTamanhos() {
    const { data } = await supabase.from("tamanhos").select("*");
    if (data) setListaTamanhosBanco(data);
  }

  // 🔴 FUNÇÃO NOVA
  async function buscarCategorias() {
    const { data } = await supabase.from("categorias").select("*").order("nome", { ascending: true });
    if (data) {
      setListaCategoriasBanco(data);
      if (data.length > 0 && !categoria) setCategoria(data[0].nome);
    }
  }

  const alternarVisibilidade = async (id: string, ativoAtual: boolean) => {
    const novoStatus = ativoAtual === undefined ? false : !ativoAtual;
    setProdutos(produtos.map(p => p.id === id ? { ...p, ativo: novoStatus } : p));
    const { error } = await supabase.from("produtos").update({ ativo: novoStatus }).eq("id", id);
    if (error) { alert("Erro ao alterar visibilidade."); buscarProdutos(); }
  };

  const handleExcluirProduto = async (id: string) => {
    if (window.confirm("Atenção: Excluir este produto da base de forma permanente?")) {
      const { error } = await supabase.from("produtos").delete().eq("id", id);
      if (error) alert("Erro ao excluir."); else buscarProdutos();
    }
  };

  const handleCadastrarNovaCor = async () => {
    if (!novaCorNome) return;
    const { error } = await supabase.from("cores").insert([{ nome: novaCorNome.trim(), hex: novaCorHex }]);
    if (!error) { setNovaCorNome(""); setFormCorAberto(false); buscarCores(); }
  };

  const handleSalvarEdicaoCor = async () => {
    if (!corEmEdicao || !corEmEdicao.nome) return;
    const { error } = await supabase.from("cores").update({ nome: corEmEdicao.nome.trim(), hex: corEmEdicao.hex }).eq("id", corEmEdicao.id);
    if (!error) {
      setCorEmEdicao(null);
      buscarCores();
    } else {
      alert("Erro ao atualizar cor.");
    }
  };

  const handleCadastrarNovoTamanho = async () => {
    if (!novoTamanhoNome) return;
    const { error } = await supabase.from("tamanhos").insert([{ nome: novoTamanhoNome.trim().toUpperCase() }]);
    if (!error) { setNovoTamanhoNome(""); setFormTamanhoAberto(false); buscarTamanhos(); }
  };

  const handleCadastrarNovoTecido = async () => {
    if (!novoTecidoNome) return;
    const { error } = await supabase.from("tecidos").insert([{ nome: novoTecidoNome.trim() }]);
    if (!error) { setNovoTecidoNome(""); setTecido(novoTecidoNome.trim()); setFormTecidoAberto(false); buscarTecidos(); }
  };

  const handleCadastrarNovaModelagem = async () => {
    if (!novaModelagemNome) return;
    const { error } = await supabase.from("modelagens").insert([{ nome: novaModelagemNome.trim() }]);
    if (!error) { setNovaModelagemNome(""); setCategoriaTamanho(novaModelagemNome.trim()); setFormModelagemAberto(false); buscarModelagens(); }
  };

  // 🔴 FUNÇÃO NOVA
  const handleCadastrarNovaCategoria = async () => {
    if (!novaCategoriaNome) return;
    const { error } = await supabase.from("categorias").insert([{ nome: novaCategoriaNome.trim() }]);
    if (!error) { setNovaCategoriaNome(""); setCategoria(novaCategoriaNome.trim()); setFormCategoriaAberto(false); buscarCategorias(); }
  };

  const handleExcluirCor = async (id: string) => {
    if (window.confirm("Excluir esta cor da sua base?")) { await supabase.from("cores").delete().eq("id", id); buscarCores(); }
  };
  const handleExcluirTamanho = async (id: string) => {
    if (window.confirm("Excluir este tamanho da sua base?")) { await supabase.from("tamanhos").delete().eq("id", id); buscarTamanhos(); }
  };
  const handleExcluirTecido = async () => {
    const id = listaTecidosBanco.find(t => t.nome === tecido)?.id;
    if (id && window.confirm(`Excluir o tecido '${tecido}' da base?`)) { 
      await supabase.from("tecidos").delete().eq("id", id); 
      setTecido(listaTecidosBanco[0]?.nome || "");
      buscarTecidos(); 
    }
  };
  const handleExcluirModelagem = async () => {
    const id = listaModelagensBanco.find(m => m.nome === categoriaTamanho)?.id;
    if (id && window.confirm(`Excluir a modelagem '${categoriaTamanho}' da base?`)) { 
      await supabase.from("modelagens").delete().eq("id", id); 
      setCategoriaTamanho(listaModelagensBanco[0]?.nome || "");
      buscarModelagens(); 
    }
  };

  // 🔴 FUNÇÃO NOVA
  const handleExcluirCategoria = async () => {
    const id = listaCategoriasBanco.find(c => c.nome === categoria)?.id;
    if (id && window.confirm(`Excluir a categoria '${categoria}' da base?`)) { 
      await supabase.from("categorias").delete().eq("id", id); 
      setCategoria(listaCategoriasBanco[0]?.nome || "");
      buscarCategorias(); 
    }
  };

  const toggleCorSelecao = (nomeCor: string) => {
    setCoresSelecionadas(prev => prev.includes(nomeCor) ? prev.filter(c => c !== nomeCor) : [...prev, nomeCor]);
  };

  const toggleTamanhoSelecao = (nomeTamanho: string) => {
    setTamanhosSelecionados(prev => prev.includes(nomeTamanho) ? prev.filter(t => t !== nomeTamanho) : [...prev, nomeTamanho]);
  };

  const handleSelecionarFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const novosArquivos = Array.from(e.target.files).map(file => ({ file, url: URL.createObjectURL(file) }));
      setFotosPreview(prev => [...prev, ...novosArquivos]);
    }
  };

  const moverFotoEsquerda = (index: number) => {
    if (index === 0) return;
    const novas = [...fotosPreview];
    const temp = novas[index - 1]; novas[index - 1] = novas[index]; novas[index] = temp;
    setFotosPreview(novas);
  };

  const moverFotoDireita = (index: number) => {
    if (index === fotosPreview.length - 1) return;
    const novas = [...fotosPreview];
    const temp = novas[index + 1]; novas[index + 1] = novas[index]; novas[index] = temp;
    setFotosPreview(novas);
  };

  const removerFoto = (index: number) => {
    setFotosPreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleSalvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !preco || fotosPreview.length === 0) {
      setStatusMensagem({ tipo: "erro", texto: "Campos obrigatórios ausentes!" });
      return;
    }
    setEnviando(true);
    setStatusMensagem(null);
    try {
      const urlsImagens: string[] = [];
      for (let i = 0; i < fotosPreview.length; i++) {
        const foto = fotosPreview[i];
        if (foto.file) {
          const nomeArquivo = `${Date.now()}-${Math.random().toString(36).substring(7)}-${foto.file.name}`;
          const caminhoArquivo = `fotos/${nomeArquivo}`;
          const { error: uploadError } = await supabase.storage.from("produtos").upload(caminhoArquivo, foto.file);
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage.from("produtos").getPublicUrl(caminhoArquivo);
          if (urlData?.publicUrl) urlsImagens.push(urlData.publicUrl);
        } else {
          urlsImagens.push(foto.url);
        }
      }

      const dadosProduto = {
        nome, preco: parseFloat(preco), descricao, imagens: urlsImagens,
        cores: coresSelecionadas, grade_tamanhos: tamanhosSelecionados, link_drive: linkDrive || null,
        qtd_minima: parseInt(qtdMinima) || 0, status_estoque: statusEstoque,
        tecido, categoria_tamanho: categoriaTamanho, categoria, em_promocao: emPromocao, // 🔴 ATUALIZADO
        ativo: true
      };

      if (editandoId) {
        const { error } = await supabase.from("produtos").update(dadosProduto).eq("id", editandoId);
        if (error) throw error;
        setStatusMensagem({ tipo: "sucesso", texto: "Produto atualizado com maestria!" });
      } else {
        const { error } = await supabase.from("produtos").insert([dadosProduto]);
        if (error) throw error;
        setStatusMensagem({ tipo: "sucesso", texto: "Novo produto inserido no acervo!" });
      }
      handleCancelarEdicao();
      buscarProdutos();
    } catch (err: any) {
      console.error(err);
      setStatusMensagem({ tipo: "erro", texto: "Ocorreu um erro operacional." });
    } finally {
      setEnviando(false);
    }
  };

  const handleEntrarModoEdicao = (prod: any) => {
    setEditandoId(prod.id); setNome(prod.nome); setPreco(prod.preco.toString());
    setDescricao(prod.descricao || ""); setCoresSelecionadas(prod.cores || []);
    setTamanhosSelecionados(prod.grade_tamanhos || []); setLinkDrive(prod.link_drive || "");
    setQtdMinima(prod.qtd_minima?.toString() || "0"); setStatusEstoque(prod.status_estoque || "Em Estoque");
    setTecido(prod.tecido || (listaTecidosBanco[0]?.nome || ""));
    setCategoriaTamanho(prod.categoria_tamanho || (listaModelagensBanco[0]?.nome || ""));
    setCategoria(prod.categoria || (listaCategoriasBanco[0]?.nome || "")); // 🔴 NOVO
    setEmPromocao(prod.em_promocao || false);

    const imagensAntigas = (prod.imagens || []).map((url: string) => ({ url }));
    setFotosPreview(imagensAntigas);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelarEdicao = () => {
    setEditandoId(null); setNome(""); setPreco(""); setDescricao(""); setCoresSelecionadas([]);
    setTamanhosSelecionados([]); setLinkDrive(""); setQtdMinima("0"); setStatusEstoque("Em Estoque"); setFotosPreview([]);
    setTecido(listaTecidosBanco[0]?.nome || ""); setCategoriaTamanho(listaModelagensBanco[0]?.nome || ""); setEmPromocao(false);
    setCategoria(listaCategoriasBanco[0]?.nome || ""); // 🔴 NOVO
    setFormCorAberto(false); setFormTamanhoAberto(false); setFormTecidoAberto(false); setFormModelagemAberto(false); setFormCategoriaAberto(false);
  };

  if (verificandoAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-serif text-muted-foreground animate-pulse">Verificando credenciais...</p>
      </div>
    );
  }

  const coresFiltradas = listaCoresBanco.filter(c => c.nome.toLowerCase().includes(buscaCor.toLowerCase()));
  const tamanhosOrdenados = [...listaTamanhosBanco].sort((a, b) => ordenarTamanhos(a.nome, b.nome));

  return (
    <div className="min-h-screen pb-16 selection:bg-primary/10 selection:text-primary overflow-x-hidden">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-10">
        
        {/* HEADER CENTRAL */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">Ateliê Operacional</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1 font-medium">Jordan Collection &bull; Gestão de Acervo</p>
          </div>
          {editandoId && (
            <Button variant="outline" onClick={handleCancelarEdicao} className="border-destructive/30 text-destructive hover:bg-destructive/5 font-bold rounded-lg text-xs tracking-wider uppercase px-4 h-9">
              Cancelar Edição
            </Button>
          )}
        </div>

        {/* INDICADORES MACRO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[{ title: "Modelos Ativos", val: produtos.length, color: "text-foreground" },
            { title: "Pendência de Mídia", val: produtos.filter(p => !p.link_drive).length, color: produtos.filter(p => !p.link_drive).length > 0 ? "text-amber-600" : "text-emerald-600" },
            { title: "Ruptura de Estoque", val: produtos.filter(p => p.status_estoque === "Poucas Unidades").length, color: "text-primary" }
          ].map((card, i) => (
            <div key={i} className="bg-card border border-border/50 p-6 rounded-xl shadow-sm flex flex-col justify-between backdrop-blur-sm">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{card.title}</span>
              <span className={`text-4xl font-light font-serif mt-4 ${card.color}`}>{card.val}</span>
            </div>
          ))}
        </div>

        {/* FORMULÁRIO DE PRODUTO */}
        <div className="bg-card border border-border/60 rounded-xl shadow-sm p-6 sm:p-8 space-y-8 min-w-0 overflow-hidden max-w-5xl mx-auto">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 font-serif border-b border-border/50 pb-3">
            <FolderPlus className="h-4 w-4 text-primary shrink-0" />
            {editandoId ? "Ajustar Especificações do Modelo" : "Inserir Nova Criação no Catálogo"}
          </h2>

          <form onSubmit={handleSalvarProduto} className="space-y-8 min-w-0">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1.5 md:col-span-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nome da Peça *</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Conjunto Suede Premium" className="border border-border/80 bg-[#faf8f5]/40 rounded-lg px-3 h-10 text-sm focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Preço de Venda (R$) *</label>
                <input type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} placeholder="0,00" className="border border-border/80 bg-[#faf8f5]/40 rounded-lg px-3 h-10 text-sm focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Acervo Fotográfico *</label>
                <div className="relative border border-border/80 bg-[#faf8f5]/60 rounded-lg h-10 flex items-center px-3 cursor-pointer hover:bg-secondary/40 transition-colors">
                  <ImageIcon className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
                  <span className="text-xs text-muted-foreground truncate font-medium">Puxar arquivos...</span>
                  <input type="file" multiple accept="image/*" onChange={handleSelecionarFotos} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>

            {fotosPreview.length > 0 && (
              <div className="w-full min-w-0 overflow-hidden">
                <div className="flex gap-3 overflow-x-auto py-3 px-3 bg-[#faf8f5]/80 border border-dashed border-border rounded-xl">
                  {fotosPreview.map((foto, index) => (
                    <div key={index} className="relative w-24 h-32 bg-muted rounded-lg border border-border/60 shrink-0 group shadow-sm overflow-hidden">
                      {index === 0 && <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider z-10 shadow-sm">Capa</div>}
                      <img src={foto.url} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-1.5">
                        <button type="button" onClick={() => moverFotoEsquerda(index)} className="p-1 hover:bg-white/20 rounded-full disabled:opacity-25" disabled={index === 0}><ChevronLeft className="text-white h-4 w-4" /></button>
                        <button type="button" onClick={() => removerFoto(index)} className="p-1 bg-destructive hover:bg-destructive/90 rounded-full"><X className="text-white h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => moverFotoDireita(index)} className="p-1 hover:bg-white/20 rounded-full disabled:opacity-25" disabled={index === fotosPreview.length - 1}><ChevronRight className="text-white h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WIDGET DE CORES */}
            <div className="bg-secondary/5 border border-border/50 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Paleta de Cores do Produto *</label>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input type="text" placeholder="Filtrar..." value={buscaCor} onChange={e => setBuscaCor(e.target.value)} className="border border-border/80 rounded-lg pl-8 pr-3 h-8 text-xs bg-card focus:outline-none w-full sm:w-40 shadow-sm" />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setFormCorAberto(!formCorAberto)} className="h-8 text-xs font-bold border-primary/20 text-primary hover:bg-primary/5">
                    {formCorAberto ? "Cancelar" : "+ Nova Cor"}
                  </Button>
                </div>
              </div>

              {formCorAberto && (
                <div className="flex items-center gap-2 p-3 bg-card border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                  <input type="text" value={novaCorNome} onChange={e => setNovaCorNome(e.target.value)} placeholder="Ex: Rosa Nude" className="border border-border/80 rounded-lg px-3 h-8 text-xs flex-1 focus:outline-none" />
                  <input type="color" value={novaCorHex} onChange={e => setNovaCorHex(e.target.value)} className="w-8 h-8 rounded-md border border-border cursor-pointer bg-transparent p-0" />
                  <Button type="button" onClick={handleCadastrarNovaCor} size="sm" className="h-8 text-xs font-bold">Salvar Cor</Button>
                </div>
              )}

              <div className="flex gap-2 flex-wrap p-3 border border-border/60 rounded-lg bg-card/50 max-h-48 overflow-y-auto">
                {coresFiltradas.map((c) => {
                  const ativo = coresSelecionadas.includes(c.nome);
                  
                  if (corEmEdicao?.id === c.id) {
                    return (
                      <div key={c.id} className="flex items-center gap-2 bg-background p-1.5 pr-2 border border-primary/50 rounded-full shadow-sm animate-in zoom-in-95">
                        <input type="color" value={corEmEdicao?.hex || ""} onChange={e => corEmEdicao && setCorEmEdicao({...corEmEdicao, hex: e.target.value})} className="w-6 h-6 rounded-full border border-border cursor-pointer p-0 bg-transparent" />
                        <input type="text" value={corEmEdicao?.nome || ""} onChange={e => corEmEdicao && setCorEmEdicao({...corEmEdicao, nome: e.target.value})} className="w-24 text-xs font-bold bg-transparent focus:outline-none border-b border-border/50 px-1" autoFocus />
                        <button type="button" onClick={handleSalvarEdicaoCor} className="p-1 hover:bg-emerald-50 rounded-full text-emerald-600 transition-colors">
                          <Check size={14} strokeWidth={3} />
                        </button>
                        <button type="button" onClick={() => setCorEmEdicao(null)} className="p-1 hover:bg-destructive/10 rounded-full text-destructive transition-colors">
                          <X size={14} strokeWidth={3} />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={c.id} className="relative group flex items-center">
                      <button type="button" onClick={() => toggleCorSelecao(c.nome)} className={`flex items-center gap-2 px-3 py-1.5 border rounded-full text-xs font-semibold transition-all ${ativo ? "border-primary bg-primary/5 text-primary ring-1 ring-primary" : "border-border/80 bg-card text-muted-foreground hover:border-muted-foreground"}`}>
                        <div className="w-3 h-3 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: c.hex }} />
                        {c.nome}
                      </button>
                      <div className="absolute -top-2.5 -right-2 hidden group-hover:flex items-center gap-0.5 z-10">
                        <button type="button" onClick={() => setCorEmEdicao({id: c.id, nome: c.nome, hex: c.hex})} className="flex items-center justify-center bg-blue-500 text-white rounded-full w-5 h-5 shadow-md hover:scale-110 transition-transform">
                          <Edit2 size={10} strokeWidth={3} />
                        </button>
                        <button type="button" onClick={() => handleExcluirCor(c.id)} className="flex items-center justify-center bg-destructive text-white rounded-full w-5 h-5 shadow-md hover:scale-110 transition-transform">
                          <X size={12} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* WIDGET DE TAMANHOS */}
            <div className="bg-secondary/5 border border-border/50 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-primary" />
                  <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">Grade de Tamanhos da Peça *</label>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setFormTamanhoAberto(!formTamanhoAberto)} className="h-8 text-xs font-bold border-primary/20 text-primary hover:bg-primary/5">
                  {formTamanhoAberto ? "Cancelar" : "+ Novo Tamanho"}
                </Button>
              </div>

              {formTamanhoAberto && (
                <div className="flex items-center gap-2 p-3 bg-card border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                  <input type="text" value={novoTamanhoNome} onChange={e => setNovoTamanhoNome(e.target.value)} placeholder="Ex: G5, 48..." className="border border-border/80 rounded-lg px-3 h-8 text-xs flex-1 focus:outline-none uppercase" />
                  <Button type="button" onClick={handleCadastrarNovoTamanho} size="sm" className="h-8 text-xs font-bold">Salvar Tamanho</Button>
                </div>
              )}

              <div className="flex gap-2 flex-wrap p-3 border border-border/60 rounded-lg bg-card/50 max-h-40 overflow-y-auto">
                {tamanhosOrdenados.map((t) => {
                  const ativo = tamanhosSelecionados.includes(t.nome);
                  return (
                    <div key={t.id} className="relative group">
                      <button type="button" onClick={() => toggleTamanhoSelecao(t.nome)} className={`px-4 py-1.5 border rounded-lg text-xs font-bold transition-all min-w-[3rem] ${ativo ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border/80 bg-card text-muted-foreground hover:border-muted-foreground"}`}>
                        {t.nome}
                      </button>
                      <button type="button" onClick={() => handleExcluirTamanho(t.id)} className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center bg-destructive text-white rounded-full w-4 h-4 shadow-md hover:scale-110 transition-transform z-10">
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MATÉRIA / CORTE / CATEGORIA (TRINCA DE COMBOS) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Tecido */}
              <div className="flex flex-col gap-2 p-4 border border-border/60 rounded-xl bg-secondary/5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5"/> Tecido *</label>
                  <button type="button" onClick={() => setFormTecidoAberto(!formTecidoAberto)} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider">
                    {formTecidoAberto ? "Cancelar" : "+ Novo"}
                  </button>
                </div>
                {formTecidoAberto ? (
                  <div className="flex gap-2 animate-in fade-in">
                    <input type="text" value={novoTecidoNome} onChange={e => setNovoTecidoNome(e.target.value)} placeholder="Ex: Lã Batida" className="border border-border/80 rounded-lg px-3 h-10 text-sm flex-1 focus:outline-none" />
                    <Button type="button" onClick={handleCadastrarNovoTecido} className="h-10 px-3 text-xs">Salvar</Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select value={tecido} onChange={e => setTecido(e.target.value)} className="border border-border/80 bg-card rounded-lg px-3 h-10 text-sm focus:outline-none cursor-pointer font-medium flex-1">
                      {listaTecidosBanco.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                    </select>
                    <Button type="button" variant="outline" onClick={handleExcluirTecido} className="h-10 w-10 p-0 border-destructive/20 hover:bg-destructive/10 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Modelagem */}
              <div className="flex flex-col gap-2 p-4 border border-border/60 rounded-xl bg-secondary/5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Layers className="w-3.5 h-3.5"/> Modelagem *</label>
                  <button type="button" onClick={() => setFormModelagemAberto(!formModelagemAberto)} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider">
                    {formModelagemAberto ? "Cancelar" : "+ Nova"}
                  </button>
                </div>
                {formModelagemAberto ? (
                  <div className="flex gap-2 animate-in fade-in">
                    <input type="text" value={novaModelagemNome} onChange={e => setNovaModelagemNome(e.target.value)} placeholder="Ex: Oversized" className="border border-border/80 rounded-lg px-3 h-10 text-sm flex-1 focus:outline-none" />
                    <Button type="button" onClick={handleCadastrarNovaModelagem} className="h-10 px-3 text-xs">Salvar</Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select value={categoriaTamanho} onChange={e => setCategoriaTamanho(e.target.value)} className="border border-border/80 bg-card rounded-lg px-3 h-10 text-sm focus:outline-none cursor-pointer font-medium flex-1">
                      {listaModelagensBanco.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                    </select>
                    <Button type="button" variant="outline" onClick={handleExcluirModelagem} className="h-10 w-10 p-0 border-destructive/20 hover:bg-destructive/10 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* 🔴 NOVA SEÇÃO: Categoria Estrutural (Inverno, Plus Size, etc) */}
              <div className="flex flex-col gap-2 p-4 border border-border/60 rounded-xl bg-secondary/5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Tag className="w-3.5 h-3.5"/> Categoria da Vitrine *</label>
                  <button type="button" onClick={() => setFormCategoriaAberto(!formCategoriaAberto)} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider">
                    {formCategoriaAberto ? "Cancelar" : "+ Nova"}
                  </button>
                </div>
                {formCategoriaAberto ? (
                  <div className="flex gap-2 animate-in fade-in">
                    <input type="text" value={novaCategoriaNome} onChange={e => setNovaCategoriaNome(e.target.value)} placeholder="Ex: Plus Size" className="border border-border/80 rounded-lg px-3 h-10 text-sm flex-1 focus:outline-none" />
                    <Button type="button" onClick={handleCadastrarNovaCategoria} className="h-10 px-3 text-xs">Salvar</Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select value={categoria} onChange={e => setCategoria(e.target.value)} className="border border-border/80 bg-card rounded-lg px-3 h-10 text-sm focus:outline-none cursor-pointer font-bold text-primary flex-1">
                      {listaCategoriasBanco.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                    </select>
                    <Button type="button" variant="outline" onClick={handleExcluirCategoria} title="Excluir categoria selecionada" className="h-10 w-10 p-0 border-destructive/20 hover:bg-destructive/10 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Mínimo / Lote</label>
                <input type="number" value={qtdMinima} onChange={e => setQtdMinima(e.target.value)} className="border border-border/80 bg-[#faf8f5]/40 rounded-lg px-3 h-10 text-sm focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Disponibilidade</label>
                <select value={statusEstoque} onChange={e => setStatusEstoque(e.target.value)} className="border border-border/80 bg-[#faf8f5]/40 rounded-lg px-3 h-10 text-sm focus:outline-none cursor-pointer font-bold text-foreground">
                  <option value="Em Estoque">🟢 Disponível</option>
                  <option value="Poucas Unidades">🟡 Lote Crítico (Poucas Unidades)</option>
                  <option value="Esgotado">🔴 Esgotado</option>
                </select>
              </div>
              {editandoId && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Ação Comercial</label>
                  <select value={emPromocao ? "sim" : "nao"} onChange={e => setEmPromocao(e.target.value === "sim")} className={`border rounded-lg px-3 h-10 text-sm focus:outline-none cursor-pointer font-bold ${emPromocao ? "border-emerald-200 bg-emerald-50/50 text-emerald-700" : "border-border/80 bg-card text-muted-foreground"}`}>
                    <option value="nao">Preço Padrão</option>
                    <option value="sim">🔥 Em Promoção / Liquidação</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Link da Pasta de Fotos (Drive)</label>
                <input type="url" value={linkDrive} onChange={e => setLinkDrive(e.target.value)} placeholder="https://drive.google.com/..." className="border border-border/80 bg-[#faf8f5]/40 rounded-lg px-3 h-10 text-sm focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Memorial Descritivo</label>
                <textarea rows={1} value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Especificações sobre aviamento, caimento..." className="border border-border/80 bg-[#faf8f5]/40 rounded-lg px-3 py-2 h-10 text-sm focus:outline-none resize-none" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-border/50">
              <div className="flex-1 mr-4">
                {statusMensagem && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg text-xs font-semibold ${statusMensagem.tipo === "sucesso" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-destructive/5 text-destructive border border-destructive/10"}`}>
                    {statusMensagem.tipo === "sucesso" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <span>{statusMensagem.texto}</span>
                  </div>
                )}
              </div>
              <Button type="submit" disabled={enviando} className="min-w-[200px] h-12 font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-md rounded-xl text-xs tracking-wider uppercase transition-transform hover:scale-[1.02]">
                {enviando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</> : editandoId ? <><RefreshCw className="mr-2 h-4 w-4" /> Atualizar Modelo</> : <><Plus className="mr-2 h-4 w-4" /> Registrar Modelo</>}
              </Button>
            </div>
          </form>
        </div>

        {/* LISTA DE PRODUTOS */}
        <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden min-w-0">
          <div className="p-5 sm:p-6 border-b border-border/50 flex justify-between items-center bg-secondary/20">
            <div>
              <h2 className="text-lg font-semibold text-foreground font-serif">Linhas Ativas no Catálogo</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Use os ícones de olho para ocultar/mostrar o produto na vitrine pública.</p>
            </div>
            <button onClick={buscarProdutos} className="p-2 border border-border/80 rounded-lg bg-card hover:bg-secondary text-muted-foreground transition-all"><RefreshCw className="h-4 w-4" /></button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-secondary/10 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  <th className="p-4 w-20">Modelo</th>
                  <th className="p-4">Especificação Técnica</th>
                  <th className="p-4 w-48">Matéria / Vitrine</th>
                  <th className="p-4 w-48">Grades / Tamanhos</th>
                  <th className="p-4 text-center w-36">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-sm">
                {produtos.map((prod) => {
                  const isAtivo = prod.ativo === undefined ? true : prod.ativo;
                  return (
                    <tr key={prod.id} className={`transition-colors ${isAtivo ? "hover:bg-secondary/5" : "bg-muted/30 opacity-70"}`}>
                      <td className="p-4">
                        <div className="relative w-12 h-16 bg-muted rounded-lg border border-border/60 overflow-hidden shadow-sm">
                          <img src={prod.imagens?.[0]} alt="" className={`w-full h-full object-cover ${!isAtivo && "grayscale"}`} />
                          {!isAtivo && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <EyeOff className="text-white h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`font-bold tracking-tight ${isAtivo ? "text-foreground" : "text-muted-foreground"}`}>{prod.nome}</div>
                          {!isAtivo && <span className="text-[9px] font-bold uppercase tracking-wider bg-muted-foreground/20 text-muted-foreground px-1.5 py-0.5 rounded">Oculto</span>}
                        </div>
                        <div className={`text-xs font-bold mt-1 ${isAtivo ? "text-primary" : "text-muted-foreground"}`}>R$ {Number(prod.preco).toFixed(2).replace(".", ",")}</div>
                      </td>
                      <td className={`p-4 ${isAtivo ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                        <div className="font-semibold">{prod.tecido || "Não especificado"}</div>
                        <div className="text-xs mt-0.5 flex flex-col gap-0.5 mb-1.5">
                          <span className="text-primary font-bold">📂 {prod.categoria || "Sem Categoria"}</span>
                          {prod.em_promocao && <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider w-fit mt-1">Liquidação</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        {prod.grade_tamanhos && prod.grade_tamanhos.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {[...prod.grade_tamanhos].sort(ordenarTamanhos).map(t => (
                              <span key={t} className="text-[9px] bg-secondary/50 text-muted-foreground border border-border/80 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">{t}</span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[9px] italic text-muted-foreground/50">Sem tamanhos</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => alternarVisibilidade(prod.id, prod.ativo)} className={`p-2 rounded-lg transition-colors border ${isAtivo ? "border-border/80 text-muted-foreground hover:bg-secondary/40 hover:text-foreground" : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"}`}>
                            {isAtivo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          <button onClick={() => handleEntrarModoEdicao(prod)} className="p-2 border border-border/80 text-muted-foreground hover:bg-secondary/40 hover:text-foreground rounded-lg transition-colors">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleExcluirProduto(prod.id)} className="p-2 border border-destructive/20 text-destructive/70 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}