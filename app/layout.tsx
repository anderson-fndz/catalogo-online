import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 🔴 AQUI ESTÁ O SEGREDO: Importando o carrinho para a raiz do site
import { CarrinhoLateral } from "@/components/CarrinhoLateral";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jordan Collection | Atacado",
  description: "Catálogo exclusivo para lojistas e revendedores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        
        {/* O site todo renderiza aqui dentro */}
        {children}
        
        {/* A gaveta do carrinho fica escondida aqui, esperando ser chamada */}
        <CarrinhoLateral />
        
      </body>
    </html>
  );
}