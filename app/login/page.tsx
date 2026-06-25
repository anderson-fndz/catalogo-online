"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, User, Store, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  const [nome, setNome] = useState("");
  const [nomeLoja, setNomeLoja] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState(""); 
  
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "erro" | "sucesso", texto: string } | null>(null);
  
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setMensagem(null);

    if (isLogin) {
      // ---------------- LOGIN ----------------
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

      if (error) {
        setMensagem({ tipo: "erro", texto: "E-mail ou senha incorretos." });
        setCarregando(false);
      } else {
        // Redirecionamento forçado para limpar o cache do Next.js 16 e validar o proxy.ts
        window.location.href = "/admin"; 
      }

    } else {
      // ---------------- CADASTRO ----------------
      if (!nome || !nomeLoja || !email || !senha || !confirmarSenha) {
        setMensagem({ tipo: "erro", texto: "Preencha todos os campos obrigatórios." });
        setCarregando(false);
        return;
      }

      if (senha.length < 6) {
        setMensagem({ tipo: "erro", texto: "A senha precisa ter no mínimo 6 caracteres." });
        setCarregando(false);
        return;
      }

      if (senha !== confirmarSenha) {
        setMensagem({ tipo: "erro", texto: "As senhas não coincidem. Digite novamente." });
        setCarregando(false);
        return;
      }
      
      const { error } = await supabase.auth.signUp({ 
        email, 
        password: senha,
        options: {
          data: {
            nome_completo: nome,
            nome_loja: nomeLoja,
          }
        }
      });

      if (error) {
        setMensagem({ tipo: "erro", texto: error.message });
      } else {
        setMensagem({ tipo: "sucesso", texto: "Conta criada com sucesso! Faça seu login." });
        setSenha("");
        setConfirmarSenha("");
        setIsLogin(true); 
      }
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background selection:bg-primary/10 selection:text-primary relative overflow-hidden font-sans">
      
      {/* Efeitos de luz no fundo usando as cores da marca (Vinho e Rosa) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary opacity-[0.08] blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent opacity-[0.08] blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-8 space-y-8 relative z-10 transition-all duration-500">
        
        <div className="text-center space-y-2">
          {/* Logo JC com as cores oficiais */}
          <div className="mx-auto w-16 h-16 bg-primary text-secondary flex items-center justify-center rounded-2xl font-serif text-3xl font-bold mb-6 shadow-lg">
            JC
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">Jordan Collection</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            {isLogin ? "Acesso Restrito ao Painel" : "Registro de Nova Loja"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-4">
            
            {!isLogin && (
              <>
                <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="text" placeholder="Seu Nome Completo" value={nome} onChange={e => setNome(e.target.value)}
                    className="w-full border border-border bg-secondary/30 text-foreground rounded-xl pl-10 pr-4 h-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
                <div className="relative animate-in fade-in slide-in-from-top-2 duration-300 delay-75">
                  <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input 
                    type="text" placeholder="Nome da Loja / Ateliê" value={nomeLoja} onChange={e => setNomeLoja(e.target.value)}
                    className="w-full border border-border bg-secondary/30 text-foreground rounded-xl pl-10 pr-4 h-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-border bg-secondary/30 text-foreground rounded-xl pl-10 pr-4 h-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                required
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="password" placeholder={isLogin ? "Sua Senha" : "Senha (Mínimo 6 caracteres)"} value={senha} onChange={e => setSenha(e.target.value)}
                className="w-full border border-border bg-secondary/30 text-foreground rounded-xl pl-10 pr-4 h-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                required
              />
            </div>

            {!isLogin && (
              <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="password" placeholder="Confirme sua Senha" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)}
                  className="w-full border border-border bg-secondary/30 text-foreground rounded-xl pl-10 pr-4 h-12 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  required={!isLogin}
                />
              </div>
            )}
          </div>

          {mensagem && (
            <div className={`p-3 rounded-xl text-xs font-semibold text-center animate-in fade-in ${mensagem.tipo === "sucesso" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-destructive/10 text-destructive border border-destructive/20"}`}>
              {mensagem.texto}
            </div>
          )}

          <div className="space-y-4 pt-2">
            <Button type="submit" disabled={carregando} className="w-full h-12 font-bold bg-primary text-primary-foreground hover:bg-primary/95 shadow-md rounded-xl text-sm tracking-widest uppercase transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100">
              {carregando ? <Loader2 className="h-5 w-5 animate-spin" /> : (isLogin ? "Acessar Sistema" : "Registrar Loja")}
            </Button>
            
            {isLogin && (
               <div className="flex justify-center px-1 pt-1 mb-2">
                 <button type="button" onClick={() => alert("Recuperação será ativada na próxima fase do projeto.")} className="text-xs text-muted-foreground hover:text-primary transition-colors font-bold underline-offset-4 hover:underline">
                   Esqueceu sua senha?
                 </button>
               </div>
            )}
            
            <div className="text-center pt-4 border-t border-border/50">
              <button 
                type="button" 
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMensagem(null);
                  setSenha("");
                  setConfirmarSenha("");
                }}
                disabled={carregando}
                className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium underline-offset-4 hover:underline"
              >
                {isLogin ? "Não possui acesso? Registre sua loja aqui." : "Já possui uma conta? Voltar ao Login."}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}