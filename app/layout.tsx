import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// 🔴 AQUI ESTÁ O SEGREDO: Importando o carrinho para a raiz do site
import { CarrinhoLateral } from "@/components/CarrinhoLateral";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jordan Collection | Atacado",
  description: "Catálogo online exclusivo para lojistas e revendedores. Especialistas em conjuntos e alfaiataria.",
  
  // 🔴 ESSA PARTE CRIA O BANNER GIGANTE NO WHATSAPP E FACEBOOK
  openGraph: {
    title: "Jordan Collection | Atacado",
    description: "Catálogo online exclusivo para lojistas e revendedores.",
    url: "https://catalogo-online-fndz.vercel.app", // Substitua pelo seu domínio oficial quando tiver um
    siteName: "Jordan Collection",
    images: [
      {
        url: "/og-image.jpg", // Puxa a imagem da pasta public
        width: 1200,
        height: 630,
        alt: "Banner Jordan Collection",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },

  // 🔴 O SEGREDO PARA A IMAGEM FICAR RETANGULAR GRANDE E NÃO UM QUADRADINHO
  twitter: {
    card: "summary_large_image",
    title: "Jordan Collection | Atacado",
    description: "Catálogo online exclusivo para lojistas e revendedores.",
    images: ["/og-image.jpg"],
  },
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