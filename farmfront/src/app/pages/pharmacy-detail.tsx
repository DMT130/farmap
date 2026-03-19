import { useParams, Link } from "react-router";
import {
  MapPin, Star, Phone, Clock, Truck, Pill, ArrowLeft,
  ShoppingCart, CheckCircle2, XCircle, Navigation,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { formatMZN } from "../data/mock-data";
import { usePharmacy, useMedicines } from "../services/hooks";
import { useCart } from "../context/cart-context";
import { toast } from "sonner";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function PharmacyDetailPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { data: pharmacy, loading } = usePharmacy(id || "");
  const { data: medicines } = useMedicines();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">A carregar...</p>
      </div>
    );
  }

  if (!pharmacy) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2>Farmácia não encontrada</h2>
        <Link to="/pesquisa">
          <Button className="mt-4">Voltar à pesquisa</Button>
        </Link>
      </div>
    );
  }

  const availableMedicines = medicines
    .map((med: any) => {
      const priceInfo = med.prices.find((p: any) => p.pharmacyId === pharmacy.id);
      return priceInfo ? { medicine: med, ...priceInfo } : null;
    })
    .filter(Boolean) as { medicine: (typeof medicines)[0]; price: number; inStock: boolean; pharmacyId: string }[];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Link to="/pesquisa" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      {/* Pharmacy header */}
      <Card className="overflow-hidden mb-8">
        <div className="relative h-56 md:h-72">
          <ImageWithFallback src={pharmacy.image} alt={pharmacy.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <Badge className={`mb-2 ${pharmacy.isOpen ? "bg-green-500" : "bg-red-500"} text-white`}>
                  {pharmacy.isOpen ? "Aberta Agora" : "Fechada"}
                </Badge>
                <h1 className="text-white text-2xl md:text-3xl" style={{ fontWeight: 700 }}>{pharmacy.name}</h1>
                <p className="text-white/80 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" /> {pharmacy.address}, {pharmacy.district}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span style={{ fontWeight: 600 }}>{pharmacy.rating}</span>
            <span className="text-sm text-muted-foreground">({pharmacy.reviewCount} avaliações)</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            Horário: {pharmacy.openHours}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="w-4 h-4" />
            {pharmacy.phone}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="w-4 h-4" />
            Entrega: {formatMZN(pharmacy.deliveryFee)} &middot; {pharmacy.deliveryTime}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Navigation className="w-4 h-4" />
            {pharmacy.distance}
          </div>
        </div>
      </Card>

      {/* Available medicines */}
      <h2 className="mb-4">Medicamentos Disponíveis</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableMedicines.map((item) => (
          <Card
            key={item.medicine.id}
            className={`p-4 ${!item.inStock ? "opacity-60" : ""} hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Pill className="w-7 h-7 text-primary/40" />
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/medicamento/${item.medicine.id}`} className="hover:text-primary transition-colors">
                  <h4 className="truncate">{item.medicine.name}</h4>
                </Link>
                <p className="text-xs text-muted-foreground">{item.medicine.genericName}</p>
                {item.medicine.requiresPrescription && (
                  <Badge className="bg-amber-500 text-white text-xs mt-1">Receita</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-lg text-primary" style={{ fontWeight: 700 }}>{formatMZN(item.price)}</p>
                {item.inStock ? (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Em stock
                  </span>
                ) : (
                  <span className="text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Sem stock
                  </span>
                )}
              </div>
              <Button
                size="sm"
                disabled={!item.inStock}
                onClick={() => {
                  addItem(item.medicine, pharmacy.id, item.price);
                  toast.success(`${item.medicine.name} adicionado ao carrinho`);
                }}
                className="rounded-full"
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
