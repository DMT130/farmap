import { Link, useSearchParams } from "react-router";
import { useState, useMemo } from "react";
import {
  Search, Filter, MapPin, Star, Pill, ChevronDown, SlidersHorizontal, X,
  Truck, Clock,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Checkbox } from "../components/ui/checkbox";
import { formatMZN } from "../data/mock-data";
import { usePharmacies, useMedicines, useCategories } from "../services/hooks";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

type ViewTab = "medicamentos" | "farmacias";

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const categoryFilter = searchParams.get("categoria") || "";

  const { data: medicines } = useMedicines();
  const { data: pharmacies } = usePharmacies();
  const { data: categories } = useCategories();

  const [activeTab, setActiveTab] = useState<ViewTab>("medicamentos");
  const [localSearch, setLocalSearch] = useState(query);
  const [showFilters, setShowFilters] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [noPrescriptionOnly, setNoPrescriptionOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter);
  const [sortBy, setSortBy] = useState<"price" | "name" | "availability">("price");

  const filteredMedicines = useMemo(() => {
    let results = [...medicines];
    const searchTerm = (localSearch || query).toLowerCase();
    if (searchTerm) {
      results = results.filter(
        (m) =>
          m.name.toLowerCase().includes(searchTerm) ||
          m.genericName.toLowerCase().includes(searchTerm) ||
          m.category.toLowerCase().includes(searchTerm)
      );
    }
    if (selectedCategory) {
      results = results.filter((m) => m.category === selectedCategory);
    }
    if (inStockOnly) {
      results = results.filter((m) => m.prices.some((p) => p.inStock));
    }
    if (noPrescriptionOnly) {
      results = results.filter((m) => !m.requiresPrescription);
    }
    if (sortBy === "price") {
      results.sort((a, b) => {
        const aMin = Math.min(...a.prices.filter((p) => p.inStock).map((p) => p.price), Infinity);
        const bMin = Math.min(...b.prices.filter((p) => p.inStock).map((p) => p.price), Infinity);
        return aMin - bMin;
      });
    } else if (sortBy === "name") {
      results.sort((a, b) => a.name.localeCompare(b.name));
    }
    return results;
  }, [medicines, localSearch, query, selectedCategory, inStockOnly, noPrescriptionOnly, sortBy]);

  const filteredPharmacies = useMemo(() => {
    const searchTerm = (localSearch || query).toLowerCase();
    if (!searchTerm) return pharmacies;
    return pharmacies.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.district.toLowerCase().includes(searchTerm) ||
        p.address.toLowerCase().includes(searchTerm)
    );
  }, [pharmacies, localSearch, query]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search input */}
      <div className="mb-6">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Pesquisar medicamentos, farmácias..."
            className="w-full pl-12 pr-10 py-3 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1>
            {query || categoryFilter ? `Resultados para "${query || categoryFilter}"` : "Pesquisar Medicamentos"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeTab === "medicamentos"
              ? `${filteredMedicines.length} medicamentos encontrados`
              : `${filteredPharmacies.length} farmácias encontradas`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === "medicamentos" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("medicamentos")}
            className="rounded-full"
          >
            <Pill className="w-4 h-4 mr-1" /> Medicamentos
          </Button>
          <Button
            variant={activeTab === "farmacias" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("farmacias")}
            className="rounded-full"
          >
            <MapPin className="w-4 h-4 mr-1" /> Farmácias
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters sidebar - desktop */}
        <aside className="hidden lg:block w-64 shrink-0">
          <Card className="p-5 sticky top-40">
            <h3 className="mb-4 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" /> Filtros
            </h3>

            <div className="space-y-5">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Categoria</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      !selectedCategory ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                    }`}
                  >
                    Todas
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedCategory === cat.name
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Checkbox
                    id="instock"
                    checked={inStockOnly}
                    onCheckedChange={(v) => setInStockOnly(!!v)}
                  />
                  <label htmlFor="instock" className="text-sm cursor-pointer">Em stock apenas</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="norx"
                    checked={noPrescriptionOnly}
                    onCheckedChange={(v) => setNoPrescriptionOnly(!!v)}
                  />
                  <label htmlFor="norx" className="text-sm cursor-pointer">Sem receita</label>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <label className="text-sm text-muted-foreground mb-2 block">Ordenar por</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input-background text-sm"
                >
                  <option value="price">Menor Preço</option>
                  <option value="name">Nome A-Z</option>
                  <option value="availability">Disponibilidade</option>
                </select>
              </div>
            </div>
          </Card>
        </aside>

        {/* Mobile filter toggle */}
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-full shadow-lg"
            size="lg"
          >
            <Filter className="w-4 h-4 mr-2" /> Filtros
          </Button>
        </div>

        {/* Results */}
        <div className="flex-1">
          {activeTab === "medicamentos" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMedicines.map((med) => {
                const availablePrices = med.prices.filter((p) => p.inStock);
                const lowestPrice = availablePrices.length
                  ? Math.min(...availablePrices.map((p) => p.price))
                  : null;
                return (
                  <Link key={med.id} to={`/medicamento/${med.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow group h-full flex flex-col">
                      <div className="relative h-36 bg-gradient-to-br from-secondary to-accent flex items-center justify-center">
                        <Pill className="w-14 h-14 text-primary/20" />
                        {med.requiresPrescription && (
                          <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-xs">
                            Receita
                          </Badge>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <p className="text-xs text-muted-foreground">{med.category}</p>
                        <h4 className="mt-1 group-hover:text-primary transition-colors">{med.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{med.genericName}</p>
                        <div className="mt-auto pt-3 flex items-end justify-between">
                          {lowestPrice ? (
                            <div>
                              <p className="text-xs text-muted-foreground">A partir de</p>
                              <p className="text-lg text-primary" style={{ fontWeight: 700 }}>
                                {formatMZN(lowestPrice)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-destructive">Indisponível</p>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {availablePrices.length} farmácias
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
              {filteredMedicines.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <Pill className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3>Nenhum medicamento encontrado</h3>
                  <p className="text-muted-foreground text-sm mt-2">Tente outra pesquisa ou remova os filtros</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPharmacies.map((ph) => (
                <Link key={ph.id} to={`/farmacia/${ph.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="flex">
                      <div className="w-36 h-36 shrink-0">
                        <ImageWithFallback
                          src={ph.image}
                          alt={ph.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="group-hover:text-primary transition-colors">{ph.name}</h4>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" /> {ph.address}
                            </p>
                          </div>
                          <Badge className={`shrink-0 ${ph.isOpen ? "bg-green-500" : "bg-red-500"} text-white text-xs`}>
                            {ph.isOpen ? "Aberta" : "Fechada"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            {ph.rating}
                          </span>
                          <span className="flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5" />
                            {formatMZN(ph.deliveryFee)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {ph.deliveryTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
