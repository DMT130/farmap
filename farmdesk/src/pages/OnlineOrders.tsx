import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth";
import { orders as ordersApi } from "@/services/api";
import { formatMZN, formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Globe,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
  Phone,
  User,
  Loader2,
  RefreshCw,
  Eye,
  ChevronLeft,
  Filter,
} from "lucide-react";

interface Order {
  id: string;
  user_id: string;
  user_name?: string;
  user_phone?: string;
  pharmacy_id: string;
  items: { medicine_id: string; medicine_name: string; quantity: number; unit_price: number }[];
  total: number;
  status: string;
  delivery_method: string;
  delivery_address?: string;
  created_at: string;
  updated_at?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pendente", color: "text-amber-400 bg-amber-500/20", icon: Clock },
  confirmed: { label: "Confirmado", color: "text-blue-400 bg-blue-500/20", icon: CheckCircle },
  preparing: { label: "Em Preparação", color: "text-purple-400 bg-purple-500/20", icon: Package },
  ready: { label: "Pronto", color: "text-emerald-400 bg-emerald-500/20", icon: CheckCircle },
  delivering: { label: "Em Entrega", color: "text-blue-400 bg-blue-500/20", icon: Truck },
  delivered: { label: "Entregue", color: "text-emerald-400 bg-emerald-500/20", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "text-red-400 bg-red-500/20", icon: XCircle },
};

const STATUS_FLOW = ["pending", "confirmed", "preparing", "ready", "delivering", "delivered"];

type Tab = "pending" | "active" | "completed" | "all";

export default function OnlineOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("pending");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await ordersApi.list();
      setOrders(data);
    } catch (err: any) {
      toast.error("Erro ao carregar pedidos");
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = useMemo(() => {
    switch (tab) {
      case "pending":
        return orders.filter((o) => o.status === "pending");
      case "active":
        return orders.filter((o) => ["confirmed", "preparing", "ready", "delivering"].includes(o.status));
      case "completed":
        return orders.filter((o) => ["delivered", "cancelled"].includes(o.status));
      default:
        return orders;
    }
  }, [orders, tab]);

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const activeCount = orders.filter((o) => ["confirmed", "preparing", "ready", "delivering"].includes(o.status)).length;

  async function updateOrderStatus(orderId: string, newStatus: string) {
    setUpdating(orderId);
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      toast.success(`Pedido actualizado para: ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao actualizar pedido");
    } finally {
      setUpdating(null);
    }
  }

  function getNextStatus(currentStatus: string): string | null {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
  }

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "pending", label: "Pendentes", count: pendingCount },
    { key: "active", label: "Em Processo", count: activeCount },
    { key: "completed", label: "Concluídos" },
    { key: "all", label: "Todos" },
  ];

  // Detail view
  if (selectedOrder) {
    const config = STATUS_CONFIG[selectedOrder.status] || STATUS_CONFIG.pending;
    const StatusIcon = config.icon;
    const nextStatus = getNextStatus(selectedOrder.status);

    return (
      <div className="p-6 max-w-2xl">
        <button
          onClick={() => setSelectedOrder(null)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar aos pedidos
        </button>

        <div className="bg-card rounded-xl border border-border p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Pedido #{selectedOrder.id?.slice(-8).toUpperCase()}</h2>
              <p className="text-sm text-muted-foreground">{formatDateTime(selectedOrder.created_at)}</p>
            </div>
            <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1", config.color)}>
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </span>
          </div>

          {/* Customer info */}
          <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Cliente</h3>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{selectedOrder.user_name || "Cliente"}</span>
            </div>
            {selectedOrder.user_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{selectedOrder.user_phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Truck className="w-4 h-4 text-muted-foreground" />
              <span className="capitalize">{selectedOrder.delivery_method === "delivery" ? "Entrega" : "Levantamento"}</span>
            </div>
            {selectedOrder.delivery_address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{selectedOrder.delivery_address}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Itens do Pedido</h3>
            <div className="space-y-2">
              {(selectedOrder.items || []).map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{item.medicine_name || "Produto"}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity}x @ {formatMZN(item.unit_price)}</p>
                  </div>
                  <p className="text-sm font-semibold">{formatMZN(item.unit_price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-3 mt-3 border-t border-border">
              <span className="font-medium">Total</span>
              <span className="text-lg font-bold text-primary">{formatMZN(selectedOrder.total)}</span>
            </div>
          </div>

          {/* Status progress */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Progresso</h3>
            <div className="flex items-center gap-1">
              {STATUS_FLOW.map((status, i) => {
                const currentIdx = STATUS_FLOW.indexOf(selectedOrder.status);
                const isCompleted = i <= currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={status} className="flex-1 flex items-center gap-1">
                    <div
                      className={cn(
                        "flex-1 h-1.5 rounded-full transition-colors",
                        isCompleted ? "bg-primary" : "bg-secondary"
                      )}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              {STATUS_FLOW.map((status) => (
                <span key={status} className="text-[10px] text-muted-foreground">
                  {STATUS_CONFIG[status]?.label}
                </span>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            {nextStatus && selectedOrder.status !== "cancelled" && (
              <button
                onClick={() => updateOrderStatus(selectedOrder.id, nextStatus)}
                disabled={updating === selectedOrder.id}
                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updating === selectedOrder.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Avançar para: {STATUS_CONFIG[nextStatus]?.label}
              </button>
            )}
            {selectedOrder.status !== "cancelled" && selectedOrder.status !== "delivered" && (
              <button
                onClick={() => updateOrderStatus(selectedOrder.id, "cancelled")}
                disabled={updating === selectedOrder.id}
                className="h-10 px-4 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Cancelar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Pedidos Online
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {pendingCount > 0
                ? `${pendingCount} pedido${pendingCount > 1 ? "s" : ""} pendente${pendingCount > 1 ? "s" : ""}`
                : "Sem pedidos pendentes"}
            </p>
          </div>
          <button
            onClick={loadOrders}
            disabled={loading}
            className="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Actualizar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={cn(
                  "text-[11px] px-1.5 py-0.5 rounded-full",
                  t.key === "pending" ? "bg-amber-500/20 text-amber-400" : "bg-secondary text-muted-foreground"
                )}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Globe className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">
              {tab === "pending" ? "Sem pedidos pendentes" : tab === "active" ? "Sem pedidos em processo" : "Sem pedidos"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = config.icon;
              const nextStatus = getNextStatus(order.status);

              return (
                <div
                  key={order.id}
                  className="bg-card rounded-xl border border-border p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">#{order.id?.slice(-8).toUpperCase()}</h3>
                        <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1", config.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTime(order.created_at)} • {order.user_name || "Cliente"}
                      </p>
                    </div>
                    <p className="text-base font-bold text-primary">{formatMZN(order.total)}</p>
                  </div>

                  {/* Items preview */}
                  <div className="text-xs text-muted-foreground mb-3">
                    {(order.items || []).slice(0, 3).map((item, i) => (
                      <span key={i}>
                        {i > 0 && " • "}
                        {item.quantity}x {item.medicine_name}
                      </span>
                    ))}
                    {(order.items || []).length > 3 && (
                      <span> +{order.items.length - 3} mais</span>
                    )}
                  </div>

                  {/* Delivery info */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      {order.delivery_method === "delivery" ? "Entrega" : "Levantamento"}
                    </span>
                    {order.delivery_address && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3" />
                        {order.delivery_address}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="h-8 px-3 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Detalhes
                    </button>
                    {nextStatus && order.status !== "cancelled" && (
                      <button
                        onClick={() => updateOrderStatus(order.id, nextStatus)}
                        disabled={updating === order.id}
                        className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {updating === order.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        {STATUS_CONFIG[nextStatus]?.label}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
