import { useParams, Link } from "react-router";
import {
  Pill, Star, MapPin, Truck, Clock, ShieldCheck, AlertTriangle,
  ShoppingCart, CheckCircle2, XCircle, ArrowLeft, Info,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { formatMZN } from "../data/mock-data";
import { useMedicine, usePharmacies } from "../services/hooks";
import { useCart } from "../context/cart-context";
import { toast } from "sonner";

export function MedicineDetailPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { data: medicine, loading } = useMedicine(id || "");
  const { data: pharmacies } = usePharmacies();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Pill className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4 animate-pulse" />
        <p className="text-muted-foreground">A carregar...</p>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Pill className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2>Medicamento não encontrado</h2>
        <Link to="/pesquisa">
          <Button className="mt-4">Voltar à pesquisa</Button>
        </Link>
      </div>
    );
  }

  const availablePrices = medicine.prices
    .map((p: any) => ({
      ...p,
      pharmacy: pharmacies.find((ph: any) => ph.id === p.pharmacyId)!,
    }))
    .filter((p: any) => p.pharmacy)
    .sort((a: any, b: any) => a.price - b.price);

  const lowestPrice = availablePrices.find((p) => p.inStock)?.price;

  const handleAddToCart = (pharmacyId: string, price: number) => {
    if (medicine.requiresPrescription) {
      toast.info("Este medicamento requer receita médica. Faça upload da sua prescrição no perfil.");
    }
    addItem(medicine, pharmacyId, price);
    toast.success(`${medicine.name} adicionado ao carrinho`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Link to="/pesquisa" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar aos resultados
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Medicine info */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-40">
            <div className="h-48 bg-gradient-to-br from-secondary to-accent rounded-xl flex items-center justify-center mb-6">
              <Pill className="w-20 h-20 text-primary/20" />
            </div>

            <div className="flex items-start gap-2 mb-2">
              <h1 className="flex-1">{medicine.name}</h1>
              {medicine.requiresPrescription && (
                <Badge className="bg-amber-500 text-white shrink-0">Receita</Badge>
              )}
            </div>

            <p className="text-muted-foreground text-sm mb-1">
              Princípio ativo: <span className="text-foreground">{medicine.genericName}</span>
            </p>
            <Badge variant="secondary" className="mb-4">{medicine.category}</Badge>

            <p className="text-sm text-muted-foreground mb-4">{medicine.description}</p>

            {medicine.requiresPrescription && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="text-amber-800" style={{ fontWeight: 600 }}>Medicamento Sujeito a Receita Médica</p>
                  <p className="text-amber-700 text-xs mt-1">
                    Para comprar este medicamento, é necessário apresentar uma prescrição médica válida.
                    Pode fazer upload da receita no seu perfil ou vincular uma receita eletrónica.
                  </p>
                </div>
              </div>
            )}

            {lowestPrice && (
              <div className="bg-primary/5 rounded-xl p-4">
                <p className="text-xs text-muted-foreground">Melhor preço disponível</p>
                <p className="text-2xl text-primary" style={{ fontWeight: 700 }}>
                  {formatMZN(lowestPrice)}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Pharmacy prices comparison */}
        <div className="lg:col-span-2">
          <h2 className="mb-4">Comparar Preços em Farmácias</h2>
          <div className="space-y-3">
            {availablePrices.map((item) => (
              <Card
                key={item.pharmacyId}
                className={`p-4 ${!item.inStock ? "opacity-60" : ""} hover:shadow-md transition-shadow`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        to={`/farmacia/${item.pharmacyId}`}
                        className="hover:text-primary transition-colors"
                      >
                        <h4 className="truncate">{item.pharmacy.name}</h4>
                      </Link>
                      <Badge
                        className={`shrink-0 text-xs ${
                          item.pharmacy.isOpen ? "bg-green-500" : "bg-red-500"
                        } text-white`}
                      >
                        {item.pharmacy.isOpen ? "Aberta" : "Fechada"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {item.pharmacy.address} &middot; {item.pharmacy.distance}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        {item.pharmacy.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        Entrega: {formatMZN(item.pharmacy.deliveryFee)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.pharmacy.deliveryTime}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-xl text-primary" style={{ fontWeight: 700 }}>
                        {formatMZN(item.price)}
                      </p>
                      {item.inStock ? (
                        <span className="text-xs text-green-600 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Em stock
                        </span>
                      ) : (
                        <span className="text-xs text-red-500 flex items-center justify-end gap-1">
                          <XCircle className="w-3 h-3" /> Sem stock
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      disabled={!item.inStock}
                      onClick={() => handleAddToCart(item.pharmacyId, item.price)}
                      className="rounded-full"
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Info section */}
          <Card className="mt-6 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-primary" />
              <h3>Informações Importantes</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                Todos os medicamentos são verificados pela Autoridade Nacional Reguladora de Medicamentos de Moçambique.
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                Os preços podem variar. Confirme sempre o valor final antes da compra.
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                Medicamentos sujeitos a receita médica requerem prescrição válida.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
