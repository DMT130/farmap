import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useState } from "react";
import {
  Search,
  ShoppingCart,
  User,
  MapPin,
  Menu,
  X,
  Home,
  LayoutDashboard,
  Pill,
  Clock,
  CalendarCheck,
  ChevronDown,
  LogIn,
  LogOut,
  Building2,
  Shield,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useCart } from "../context/cart-context";
import { useAuth } from "../context/use-auth";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { items } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/pesquisa?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const isPharmacyOwner = user?.role === "pharmacy_owner";
  const isAdmin = user?.role === "admin";

  const navLinks = [
    { to: "/", label: "Início", icon: Home },
    { to: "/pesquisa", label: "Medicamentos", icon: Pill },
    { to: "/consultas", label: "Consultas", icon: CalendarCheck },
    ...(isAdmin
      ? [{ to: "/admin", label: "Administração", icon: Shield }]
      : isPharmacyOwner
        ? [{ to: "/painel", label: "Painel Farmácia", icon: LayoutDashboard }]
        : [{ to: "/registar-farmacia", label: "Registar Farmácia", icon: Building2 }]),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              Maputo, Moçambique
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Entregas: 07:00 - 22:00
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>Suporte: +258 84 000 0000</span>
            {isAuthenticated ? (
              <Link to="/perfil" className="hover:underline">{user?.full_name || "Minha Conta"}</Link>
            ) : (
              <Link to="/entrar" className="hover:underline">Iniciar Sessão</Link>
            )}
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Pill className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-xl text-primary tracking-tight" style={{ fontWeight: 700 }}>
                  FarmaMap
                </span>
                <p className="text-xs text-muted-foreground -mt-1 hidden sm:block">
                  Marketplace Farmacêutico
                </p>
              </div>
            </Link>

            {/* Search bar - desktop */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-xl relative"
            >
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar medicamentos, farmácias..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <Button type="submit" className="ml-2 rounded-full px-6">
                Pesquisar
              </Button>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <Link to="/carrinho" className="relative p-2 hover:bg-accent rounded-full transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground">
                    {cartCount}
                  </Badge>
                )}
              </Link>
              <Link to="/perfil" className="p-2 hover:bg-accent rounded-full transition-colors hidden sm:flex">
                <User className="w-5 h-5" />
              </Link>
              {isAuthenticated ? (
                <button
                  onClick={() => { logout(); navigate("/"); }}
                  className="p-2 hover:bg-accent rounded-full transition-colors hidden sm:flex"
                  title="Terminar Sessão"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              ) : (
                <Link to="/entrar" className="p-2 hover:bg-accent rounded-full transition-colors hidden sm:flex" title="Iniciar Sessão">
                  <LogIn className="w-5 h-5" />
                </Link>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 hover:bg-accent rounded-full transition-colors md:hidden"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          <form onSubmit={handleSearch} className="mt-3 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar medicamentos..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </form>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:block border-t border-border">
          <div className="max-w-7xl mx-auto px-4">
            <ul className="flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to || (link.to !== "/" && location.pathname.startsWith(link.to));
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm transition-colors ${
                        isActive
                          ? "text-primary border-b-2 border-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-border bg-card">
            <ul className="p-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Icon className="w-5 h-5 text-primary" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  to="/perfil"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                >
                  <User className="w-5 h-5 text-primary" />
                  Minha Conta
                </Link>
              </li>
              {isAuthenticated ? (
                <li>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); navigate("/"); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors text-destructive"
                  >
                    <LogOut className="w-5 h-5" />
                    Terminar Sessão
                  </button>
                </li>
              ) : (
                <li>
                  <Link
                    to="/entrar"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <LogIn className="w-5 h-5 text-primary" />
                    Iniciar Sessão
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#1a2e2a] text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Pill className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg" style={{ fontWeight: 700 }}>FarmaMap</span>
              </div>
              <p className="text-sm text-white/70">
                Conectando consumidores a farmácias locais em Maputo. Melhorando o acesso a medicamentos através da tecnologia.
              </p>
            </div>
            <div>
              <h4 className="mb-3 text-white/90">Plataforma</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link to="/pesquisa" className="hover:text-white transition-colors">Medicamentos</Link></li>
                <li><Link to="/pesquisa" className="hover:text-white transition-colors">Farmácias</Link></li>
                <li><Link to="/consultas" className="hover:text-white transition-colors">Consultas</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Como Funciona</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-white/90">Suporte</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-white/90">Contacto</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>+258 84 000 0000</li>
                <li>suporte@farmamap.co.mz</li>
                <li>Av. 25 de Setembro, Maputo</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-6 text-center text-sm text-white/50">
            &copy; 2026 FarmaMap. Todos os direitos reservados. Maputo, Moçambique.
          </div>
        </div>
      </footer>
    </div>
  );
}
