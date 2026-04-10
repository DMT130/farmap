import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
  Search,
  ShoppingCart,
  User,
  MapPin,
  Menu,
  X,
  Home,
  Pill,
  Clock,
  CalendarCheck,
  ChevronDown,
  LogIn,
  LogOut,
  Shield,
  ArrowUp,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useCart } from "../context/cart-context";
import { useAuth } from "../context/use-auth";
import { Footer } from "./footer";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    // index.html already applies the 'dark' class before paint
    return document.documentElement.classList.contains("dark");
  });
  const { items } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleDark = () => {
    const newDark = !isDark;
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("farmamap_theme", newDark ? "dark" : "light");
    setIsDark(newDark);
  };

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
    ...(user && user.role === "customer"
      ? [
          { to: "/carrinho", label: "Carrinho", icon: ShoppingCart },
          { to: "/consultas", label: "Consultas", icon: CalendarCheck },
        ]
      : []),
    ...(
      isAdmin
        ? [{ to: "/admin", label: "Administração", icon: Shield }]
        : []
    ),
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
              {!isPharmacyOwner && !isAdmin && (
                <Link to="/carrinho" className="relative p-2 hover:bg-accent rounded-full transition-colors">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground">
                      {cartCount}
                    </Badge>
                  )}
                </Link>
              )}
              <Link to="/perfil" className="p-2 hover:bg-accent rounded-full transition-colors hidden sm:flex">
                <User className="w-5 h-5" />
              </Link>
              <button
                onClick={toggleDark}
                className="p-2 hover:bg-accent rounded-full transition-colors hidden sm:flex"
                title={isDark ? "Modo claro" : "Modo escuro"}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
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
              <li className="border-t border-border pt-2 mt-2">
                <button
                  onClick={() => { toggleDark(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                >
                  {isDark ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-primary" />}
                  {isDark ? "Modo Claro" : "Modo Escuro"}
                </button>
              </li>
            </ul>
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        <div key={location.pathname} className="page-enter">
          <Outlet />
        </div>
      </main>

      <Footer />

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-110"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
