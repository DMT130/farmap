import { Link } from "react-router";
import { MapPin, ArrowLeft, Search } from "lucide-react";
import { Button } from "../components/ui/button";

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="relative mb-8">
          <span className="text-[8rem] leading-none text-primary/10" style={{ fontWeight: 800 }}>404</span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-10 h-10 text-primary" />
            </div>
          </div>
        </div>
        <h1 className="text-2xl mb-3" style={{ fontWeight: 700 }}>Página não encontrada</h1>
        <p className="text-muted-foreground mb-8">
          A página que procura não existe ou foi movida. Verifique o endereço ou utilize a pesquisa para encontrar o que precisa.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/">
            <Button variant="outline" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Início
            </Button>
          </Link>
          <Link to="/pesquisa">
            <Button className="rounded-full">
              <Search className="w-4 h-4 mr-2" /> Pesquisar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
