import { Link, useNavigate } from "react-router";
import { useState } from "react";
import {
  ShoppingCart, Minus, Plus, Trash2, ArrowLeft, MapPin, CreditCard,
  Smartphone, Truck, Store, CheckCircle2, Shield,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { useCart } from "../context/cart-context";
import { useAuth } from "../context/use-auth";
import { formatMZN } from "../data/mock-data";
import { usePharmacies } from "../services/hooks";
import { ordersApi, paymentsApi } from "../services/api";
import { toast } from "sonner";

export function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, total } = useCart();
  const { data: pharmacies } = usePharmacies();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [deliveryMethod, setDeliveryMethod] = useState("delivery");
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const deliveryFee = deliveryMethod === "delivery" ? 150 : 0;
  const grandTotal = total + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      toast.error("Inicie sessão para finalizar o pedido.");
      navigate("/entrar");
      return;
    }
    setSubmitting(true);
    try {
      // Create order via API
      const order = await ordersApi.create({
        user_id: user!.id,
        delivery_address: deliveryMethod === "delivery" ? (user!.address || "Maputo") : "Levantamento na farmácia",
        delivery_method: deliveryMethod,
        payment_method: paymentMethod,
        total_amount: grandTotal,
        items: items.map((item) => ({
          medicine_id: item.medicine.id,
          pharmacy_id: item.pharmacyId,
          quantity: item.quantity,
          price: item.price,
        })),
      });
      // Process payment
      await paymentsApi.process({
        order_id: order.id,
        provider: paymentMethod,
        amount: grandTotal,
      });
      setOrderId(order.id);
      setOrderPlaced(true);
      clearCart();
      toast.success("Pedido realizado com sucesso!");
    } catch (err: any) {
      console.error("Order error:", err);
      toast.error(err.message || "Erro ao realizar pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="mb-2">Pedido Realizado!</h1>
        <p className="text-muted-foreground mb-2">
          O seu pedido foi recebido e está a ser processado.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Número do pedido: <span style={{ fontWeight: 600 }}>{orderId || `FM-${Date.now().toString().slice(-6)}`}</span>
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/">
            <Button variant="outline" className="rounded-full">Voltar ao Início</Button>
          </Link>
          <Link to="/perfil">
            <Button className="rounded-full">Ver Meus Pedidos</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h2>O seu carrinho está vazio</h2>
        <p className="text-muted-foreground text-sm mt-2">
          Adicione medicamentos ao carrinho para prosseguir com a compra.
        </p>
        <Link to="/pesquisa">
          <Button className="mt-6 rounded-full">Pesquisar Medicamentos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Link to="/pesquisa" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="w-4 h-4" /> Continuar a comprar
      </Link>

      <h1 className="mb-6">Carrinho de Compras</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const pharmacy = pharmacies.find((p) => p.id === item.pharmacyId);
            return (
              <Card key={item.medicine.id} className="p-4">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-6 h-6 text-primary/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="truncate">{item.medicine.name}</h4>
                    <p className="text-xs text-muted-foreground">{item.medicine.genericName}</p>
                    {pharmacy && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {pharmacy.name}
                      </p>
                    )}
                    {item.medicine.requiresPrescription && (
                      <Badge className="bg-amber-500 text-white text-xs mt-1">Receita necessária</Badge>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg text-primary" style={{ fontWeight: 700 }}>
                      {formatMZN(item.price * item.quantity)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatMZN(item.price)} /unid.</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0 rounded-full"
                      onClick={() => updateQuantity(item.medicine.id, item.quantity - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-8 h-8 p-0 rounded-full"
                      onClick={() => updateQuantity(item.medicine.id, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeItem(item.medicine.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Remover
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="space-y-4">
          {/* Delivery method */}
          <Card className="p-5">
            <h3 className="mb-3">Método de Entrega</h3>
            <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod} className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />
                    <span>Entrega ao Domicílio</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">30-60 min &middot; {formatMZN(150)}</p>
                </Label>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-primary" />
                    <span>Levantamento na Farmácia</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Pronto em 15-30 min &middot; Grátis</p>
                </Label>
              </div>
            </RadioGroup>
          </Card>

          {/* Payment method */}
          <Card className="p-5">
            <h3 className="mb-3">Método de Pagamento</h3>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer">
                <RadioGroupItem value="mpesa" id="mpesa" />
                <Label htmlFor="mpesa" className="cursor-pointer flex items-center gap-2 flex-1">
                  <Smartphone className="w-4 h-4 text-primary" />
                  M-Pesa
                </Label>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer">
                <RadioGroupItem value="emola" id="emola" />
                <Label htmlFor="emola" className="cursor-pointer flex items-center gap-2 flex-1">
                  <Smartphone className="w-4 h-4 text-primary" />
                  e-Mola
                </Label>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="cursor-pointer flex items-center gap-2 flex-1">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Cartão Bancário
                </Label>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer">
                <RadioGroupItem value="insurance" id="insurance" />
                <Label htmlFor="insurance" className="cursor-pointer flex items-center gap-2 flex-1">
                  <Shield className="w-4 h-4 text-primary" />
                  Seguro de Saúde
                </Label>
              </div>
            </RadioGroup>
          </Card>

          {/* Summary */}
          <Card className="p-5">
            <h3 className="mb-4">Resumo do Pedido</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal ({items.length} itens)</span>
                <span>{formatMZN(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de entrega</span>
                <span>{deliveryFee === 0 ? "Grátis" : formatMZN(deliveryFee)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-lg" style={{ fontWeight: 700 }}>
                <span>Total</span>
                <span className="text-primary">{formatMZN(grandTotal)}</span>
              </div>
            </div>
            <Button className="w-full mt-4 rounded-full" size="lg" onClick={handlePlaceOrder} disabled={submitting}>
              {submitting ? "A processar..." : isAuthenticated ? "Finalizar Pedido" : "Iniciar Sessão para Comprar"}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3" /> Pagamento seguro e encriptado
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
