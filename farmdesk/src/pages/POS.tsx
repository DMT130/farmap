import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/auth";
import { pos, medicines as medApi } from "@/services/api";
import { formatMZN } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  Receipt,
  User,
  X,
  Loader2,
  Barcode,
  Percent,
} from "lucide-react";

interface CartItem {
  medicine_id: string;
  name: string;
  price: number;
  quantity: number;
  max_stock?: number;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Dinheiro", icon: Banknote },
  { value: "card", label: "Cartão", icon: CreditCard },
  { value: "mpesa", label: "M-Pesa", icon: Smartphone },
];

export default function POS() {
  const { user } = useAuth();
  const pharmacyId = user?.pharmacy_id || "";

  // Product search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [allMedicines, setAllMedicines] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [processing, setProcessing] = useState(false);

  // Receipt modal
  const [lastSale, setLastSale] = useState<any>(null);

  // Load all medicines on mount
  useEffect(() => {
    medApi.list().then(setAllMedicines).catch(() => {});
  }, []);

  // Search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      const q = query.toLowerCase();
      const filtered = allMedicines.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.generic_name?.toLowerCase().includes(q) ||
          m.barcode?.toLowerCase().includes(q)
      );
      setResults(filtered.slice(0, 8));
      setSearching(false);
    }, 150);
    return () => clearTimeout(timeout);
  }, [query, allMedicines]);

  // Keyboard shortcut: focus search with F2
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "F9") {
        e.preventDefault();
        handleCheckout();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cart, paymentMethod, customerName, discount]);

  const addToCart = useCallback(
    (med: any) => {
      setCart((prev) => {
        const existing = prev.find((item) => item.medicine_id === med.id);
        if (existing) {
          return prev.map((item) =>
            item.medicine_id === med.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [
          ...prev,
          {
            medicine_id: med.id,
            name: med.name,
            price: med.price,
            quantity: 1,
          },
        ];
      });
      setQuery("");
      setResults([]);
      searchRef.current?.focus();
    },
    []
  );

  const updateQuantity = (medicineId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.medicine_id === medicineId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (medicineId: string) => {
    setCart((prev) => prev.filter((item) => item.medicine_id !== medicineId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    try {
      const sale = await pos.createSale({
        pharmacy_id: pharmacyId,
        items: cart.map((item) => ({
          medicine_id: item.medicine_id,
          quantity: item.quantity,
          unit_price: item.price,
        })),
        payment_method: paymentMethod,
        customer_name: customerName || undefined,
        discount_percent: discount || 0,
      });
      setLastSale(sale);
      setCart([]);
      setCustomerName("");
      setDiscount(0);
      toast.success("Venda registada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar venda");
    } finally {
      setProcessing(false);
    }
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName("");
    setDiscount(0);
  };

  return (
    <div className="flex h-full">
      {/* Left: Product search + list */}
      <div className="flex-1 flex flex-col border-r border-border">
        {/* Search bar */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar medicamento... (F2)"
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground/50"
              autoFocus
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          {results.length > 0 && (
            <div className="mt-2 rounded-lg border border-border bg-card shadow-xl max-h-72 overflow-y-auto">
              {results.map((med) => (
                <button
                  key={med.id}
                  onClick={() => addToCart(med)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors text-left border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{med.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {med.generic_name} • {med.dosage}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">
                      {formatMZN(med.price)}
                    </p>
                    {med.requires_prescription && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                        Receita
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {query && results.length === 0 && !searching && (
            <p className="text-sm text-muted-foreground mt-2 px-1">
              Nenhum medicamento encontrado
            </p>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Carrinho vazio</p>
              <p className="text-xs mt-1">Pesquise e adicione medicamentos</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_100px_120px_100px_36px] gap-2 px-3 py-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                <span>Produto</span>
                <span className="text-center">Preço</span>
                <span className="text-center">Qtd</span>
                <span className="text-right">Subtotal</span>
                <span />
              </div>

              {cart.map((item) => (
                <div
                  key={item.medicine_id}
                  className="grid grid-cols-[1fr_100px_120px_100px_36px] gap-2 items-center px-3 py-2.5 rounded-lg bg-card border border-border"
                >
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-sm text-center text-muted-foreground">
                    {formatMZN(item.price)}
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.medicine_id, -1)}
                      className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.medicine_id, 1)}
                      className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-sm text-right font-semibold">
                    {formatMZN(item.price * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeItem(item.medicine_id)}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Checkout panel */}
      <div className="w-80 flex flex-col bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            Resumo da Venda
          </h2>
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Customer name */}
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
              Cliente (opcional)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nome do cliente"
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground/50"
              />
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
              Método de Pagamento
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  onClick={() => setPaymentMethod(pm.value)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                    paymentMethod === pm.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <pm.icon className="w-4 h-4" />
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Discount */}
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">
              Desconto (%)
            </label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="number"
                min="0"
                max="100"
                value={discount || ""}
                onChange={(e) =>
                  setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))
                }
                placeholder="0"
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
        </div>

        {/* Totals & checkout button */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal ({itemCount} itens)</span>
              <span>{formatMZN(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>Desconto ({discount}%)</span>
                <span>-{formatMZN(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-1.5 border-t border-border">
              <span>Total</span>
              <span className="text-primary">{formatMZN(total)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="h-10 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-30"
            >
              Limpar
            </button>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || processing}
              className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Finalizar (F9)
            </button>
          </div>
        </div>
      </div>

      {/* Receipt modal */}
      {lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card rounded-xl border border-border w-full max-w-sm p-6 shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold">Venda Registada</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                #{lastSale.id?.slice(-8).toUpperCase()}
              </p>
            </div>

            <div className="space-y-2 mb-5">
              {lastSale.items?.map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between text-sm py-1 border-b border-border last:border-0"
                >
                  <span className="text-muted-foreground">
                    {item.quantity}x {item.medicine_name || "Produto"}
                  </span>
                  <span className="font-medium">
                    {formatMZN(item.unit_price * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-base font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">{formatMZN(lastSale.total)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Pagamento</span>
                <span className="capitalize">{lastSale.payment_method}</span>
              </div>
              {lastSale.customer_name && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Cliente</span>
                  <span>{lastSale.customer_name}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setLastSale(null);
                searchRef.current?.focus();
              }}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Nova Venda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
