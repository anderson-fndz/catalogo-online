import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 font-sans w-full">
      <div className="relative">
        {/* Efeito de brilho Bordeaux esfumaçado atrás da logo */}
        <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full scale-150 animate-pulse"></div>
        
        {/* A Logo JC */}
        <div className="w-16 h-16 bg-primary text-secondary flex items-center justify-center rounded-2xl font-serif text-3xl font-bold shadow-xl relative z-10">
          JC
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Sincronizando dados...
        </span>
      </div>
    </div>
  );
}