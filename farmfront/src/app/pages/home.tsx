import { Link, useNavigate } from "react-router";
import { useState } from "react";
import {
  Search, MapPin, Star, Clock, Truck, Shield, Pill, Heart, Flame, Droplets,
  CircleDot, Sparkles, Wind, ArrowRight, ChevronRight, CheckCircle2,
  Smartphone, CreditCard, Package,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { formatMZN } from "../data/mock-data";
import { usePharmacies, useMedicines, useCategories } from "../services/hooks";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { MedicineCardSkeleton, PharmacyCardSkeleton, CategoryCardSkeleton } from "../components/skeletons";

const iconMap: Record<string, any> = {
  Pill, Shield, Flame, Heart, Droplets, CircleDot, Sparkles, Wind,
};

export function HomePage() {
  const navigate = useNavigate();
  const [heroSearch, setHeroSearch] = useState("");
  const { data: pharmacies, loading: loadingPharmacies } = usePharmacies();
  const { data: medicines, loading: loadingMedicines } = useMedicines();
  const { data: categories, loading: loadingCategories } = useCategories();

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/pesquisa?q=${encodeURIComponent(heroSearch.trim())}`);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary to-[#065f42] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <Badge className="bg-white/20 text-white border-white/30 mb-4">
                <MapPin className="w-3 h-3 mr-1" /> Maputo, Moçambique
              </Badge>
              <h1 className="text-3xl md:text-5xl mb-4" style={{ fontWeight: 700, lineHeight: 1.2 }}>
                Encontre medicamentos perto de si, ao melhor preço
              </h1>
              <p className="text-white/80 mb-8 text-lg">
                Compare preços, verifique disponibilidade e encomende medicamentos de farmácias locais com entrega ao domicílio ou levantamento na loja.
              </p>
              <form onSubmit={handleHeroSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Nome do medicamento ou princípio ativo..."
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                  />
                </div>
                <Button type="submit" size="lg" className="rounded-xl bg-[#065f42] hover:bg-[#054d36] text-white shadow-lg px-6">
                  Pesquisar
                </Button>
              </form>
              <div className="flex flex-wrap gap-2 mt-4">
                {["Paracetamol", "Ibuprofeno", "Vitamina C", "Amoxicilina"].map((term) => (
                  <button
                    key={term}
                    onClick={() => navigate(`/pesquisa?q=${term}`)}
                    className="px-3 py-1 text-sm bg-white/15 hover:bg-white/25 text-white rounded-full transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
            <div className="hidden md:block">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1576091358783-a212ec293ff3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaGFybWFjaXN0JTIwaGVscGluZyUyMGN1c3RvbWVyfGVufDF8fHx8MTc3MjY0OTgyMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Farmácia"
                className="rounded-2xl shadow-2xl w-full h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Farmácias Parceiras", value: "50+", icon: Package },
              { label: "Medicamentos", value: "2.500+", icon: Pill },
              { label: "Entregas/Mês", value: "10.000+", icon: Truck },
              { label: "Clientes Activos", value: "25.000+", icon: CheckCircle2 },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl text-foreground" style={{ fontWeight: 700 }}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2>Categorias de Medicamentos</h2>
            <p className="text-muted-foreground text-sm mt-1">Encontre o que precisa por categoria</p>
          </div>
          <Link to="/pesquisa" className="text-primary text-sm flex items-center gap-1 hover:underline">
            Ver todas <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {loadingCategories
            ? Array.from({ length: 8 }).map((_, i) => <CategoryCardSkeleton key={i} />)
            : categories.map((cat) => {
            const Icon = iconMap[cat.icon] || Pill;
            return (
              <Link
                key={cat.id}
                to={`/pesquisa?categoria=${encodeURIComponent(cat.name)}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-center">{cat.name}</span>
                <span className="text-xs text-muted-foreground">{cat.count} itens</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Popular medicines */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2>Medicamentos Populares</h2>
            <p className="text-muted-foreground text-sm mt-1">Os mais procurados em Maputo</p>
          </div>
          <Link to="/pesquisa" className="text-primary text-sm flex items-center gap-1 hover:underline">
            Ver todos <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingMedicines
            ? Array.from({ length: 4 }).map((_, i) => <MedicineCardSkeleton key={i} />)
            : medicines.slice(0, 4).map((med) => {
            const lowestPrice = Math.min(...med.prices.filter((p) => p.inStock).map((p) => p.price));
            const availableCount = med.prices.filter((p) => p.inStock).length;
            return (
              <Link key={med.id} to={`/medicamento/${med.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full">
                  <div className="relative h-40 bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                    <Pill className="w-16 h-16 text-primary/20" />
                    {med.requiresPrescription && (
                      <Badge className="absolute top-3 left-3 bg-amber-500 text-white text-xs">
                        Receita Obrigatória
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{med.category}</p>
                    <h3 className="group-hover:text-primary transition-colors line-clamp-1">{med.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{med.genericName}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">A partir de</p>
                        <p className="text-lg text-primary" style={{ fontWeight: 700 }}>
                          {formatMZN(lowestPrice)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {availableCount} farmácias
                      </Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured pharmacies */}
      <section className="bg-secondary/50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2>Farmácias em Destaque</h2>
              <p className="text-muted-foreground text-sm mt-1">Farmácias parceiras mais bem avaliadas</p>
            </div>
            <Link to="/pesquisa" className="text-primary text-sm flex items-center gap-1 hover:underline">
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pharmacies.slice(0, 3).map((ph) => (
              <Link key={ph.id} to={`/farmacia/${ph.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className="relative h-44">
                    <ImageWithFallback
                      src={ph.image}
                      alt={ph.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <Badge
                      className={`absolute top-3 right-3 ${ph.isOpen ? "bg-green-500" : "bg-red-500"} text-white text-xs`}
                    >
                      {ph.isOpen ? "Aberta" : "Fechada"}
                    </Badge>
                    <div className="absolute bottom-3 left-3 text-white">
                      <h3 className="text-white">{ph.name}</h3>
                      <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {ph.district} &middot; {ph.distance}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {ph.rating}
                      </span>
                      <span className="text-xs text-muted-foreground">({ph.reviewCount} avaliações)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Truck className="w-3.5 h-3.5" />
                      {ph.deliveryTime}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2>Como Funciona</h2>
          <p className="text-muted-foreground mt-2">Simples, rápido e seguro</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Search,
              title: "1. Pesquise",
              desc: "Procure pelo nome do medicamento ou princípio ativo. Compare preços entre farmácias.",
              color: "bg-blue-50 text-blue-600",
            },
            {
              icon: CreditCard,
              title: "2. Encomende",
              desc: "Escolha a farmácia, adicione ao carrinho e pague via M-Pesa, e-Mola ou cartão bancário.",
              color: "bg-amber-50 text-amber-600",
            },
            {
              icon: Truck,
              title: "3. Receba",
              desc: "Receba em casa com rastreamento em tempo real ou levante na farmácia mais próxima.",
              color: "bg-green-50 text-green-600",
            },
          ].map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="text-center group">
                <div className="relative">
                  <div className={`w-20 h-20 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-9 h-9" />
                  </div>
                  {i < 2 && (
                    <div className="hidden md:block absolute top-10 left-[calc(50%+3rem)] w-[calc(100%-6rem)] border-t-2 border-dashed border-border" />
                  )}
                </div>
                <h3 className="mb-2" style={{ fontWeight: 600 }}>{step.title}</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-secondary/50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2>O Que Dizem os Nossos Utilizadores</h2>
            <p className="text-muted-foreground mt-2">Milhares de moçambicanos confiam na FarmaMap</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Ana Cossa",
                role: "Cliente desde 2025",
                text: "A FarmaMap mudou completamente a forma como compro medicamentos. Consigo comparar preços e receber em casa sem sair do sofá!",
                rating: 5,
              },
              {
                name: "Dr. Pedro Nhambe",
                role: "Farmacêutico Parceiro",
                text: "Desde que registei a minha farmácia na plataforma, as vendas aumentaram 40%. O painel de gestão é muito intuitivo.",
                rating: 5,
              },
              {
                name: "Marta Bila",
                role: "Mãe e Professora",
                text: "Com crianças pequenas em casa, a entrega ao domicílio é uma salvação. Medicamentos chegam sempre a tempo.",
                rating: 5,
              },
            ].map((testimonial, i) => (
              <Card key={i} className="p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm text-primary" style={{ fontWeight: 600 }}>{testimonial.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm" style={{ fontWeight: 600 }}>{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* App benefits */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Porquê a FarmaMap?</Badge>
            <h2 className="text-3xl mb-6" style={{ fontWeight: 700, lineHeight: 1.3 }}>
              A forma mais inteligente de aceder a medicamentos em Moçambique
            </h2>
            <div className="space-y-4">
              {[
                { icon: Shield, title: "Seguro e Verificado", desc: "Todas as farmácias são verificadas e licenciadas pela autoridade reguladora." },
                { icon: Smartphone, title: "Pagamento Fácil", desc: "Pague com M-Pesa, e-Mola, cartão ou seguro de saúde — sem complicações." },
                { icon: Truck, title: "Entrega Rápida", desc: "Receba os seus medicamentos em 30-60 minutos, ou levante gratuitamente na farmácia." },
                { icon: CheckCircle2, title: "Melhor Preço Garantido", desc: "Compare preços entre dezenas de farmácias e escolha a melhor opção para si." },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm" style={{ fontWeight: 600 }}>{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-8 text-center">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1576091358783-a212ec293ff3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaGFybWFjaXN0JTIwaGVscGluZyUyMGN1c3RvbWVyfGVufDF8fHx8MTc3MjY0OTgyMnww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="FarmaMap mobile"
                className="rounded-2xl shadow-xl w-full h-72 object-cover"
              />
              <div className="mt-6 flex items-center justify-center gap-4">
                <div className="text-center">
                  <p className="text-2xl text-primary" style={{ fontWeight: 700 }}>4.8★</p>
                  <p className="text-xs text-muted-foreground">Avaliação Média</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <p className="text-2xl text-primary" style={{ fontWeight: 700 }}>25K+</p>
                  <p className="text-xs text-muted-foreground">Utilizadores Activos</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <p className="text-2xl text-primary" style={{ fontWeight: 700 }}>50+</p>
                  <p className="text-xs text-muted-foreground">Farmácias</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary to-[#065f42] py-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-white">
          <h2 className="text-white text-3xl mb-4" style={{ fontWeight: 700 }}>
            É farmacêutico? Junte-se à FarmaMap
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Aumente as suas vendas, alcance novos clientes e modernize a gestão da sua farmácia com o nosso painel de controlo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/farmacia/registar">
              <Button size="lg" variant="secondary" className="rounded-full px-8">
                Registar Farmácia <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/registar">
              <Button size="lg" variant="outline" className="rounded-full px-8 text-white border-white/30 hover:bg-white/10">
                Criar Conta Grátis
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
