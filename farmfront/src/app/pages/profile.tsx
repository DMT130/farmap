import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  User, MapPin, Phone, Mail, Shield, CreditCard, Package, FileText,
  Clock, Star, ChevronRight, Edit, Camera, Bell, LogOut, Heart,
  Smartphone, CheckCircle2, Upload, Save, X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { formatMZN, insurers } from "../data/mock-data";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useAuth } from "../context/use-auth";
import { ordersApi, appointmentsApi, type Order, type Appointment } from "../services/api";
import { toast } from "sonner";

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const [activeInsurer, setActiveInsurer] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    address: "",
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/entrar");
    }
  }, [isAuthenticated, navigate]);

  // Fetch user orders
  useEffect(() => {
    if (!user) return;
    setLoadingOrders(true);
    ordersApi.userOrders(user.id)
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoadingOrders(false));

    appointmentsApi.userAppointments(user.id)
      .then(setAppointments)
      .catch(() => {});
  }, [user]);

  // Populate edit form
  useEffect(() => {
    if (user) {
      setEditForm({
        full_name: user.full_name || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const handleCancelOrder = async (orderId: string) => {
    try {
      await ordersApi.updateStatus(orderId, "cancelled");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o))
      );
      toast.success("Pedido cancelado com sucesso.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao cancelar pedido.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Sessão terminada.");
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "Pendente",
      confirmed: "Confirmado",
      preparing: "Em preparação",
      ready: "Pronto",
      delivered: "Entregue",
      cancelled: "Cancelado",
    };
    return map[status] || status;
  };

  const statusColor = (status: string) => {
    if (status === "delivered") return "bg-green-100 text-green-700";
    if (status === "cancelled") return "bg-red-100 text-red-700";
    if (status === "preparing" || status === "confirmed") return "bg-amber-500 text-white";
    return "";
  };

  if (!isAuthenticated || !user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Profile sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                <User className="w-10 h-10 text-primary/50" />
              </div>
            </div>
            <h3>{user.full_name || "Utilizador"}</h3>
            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
            <Badge variant="secondary" className="mt-2">
              Membro desde {new Date(user.created_at).getFullYear()}
            </Badge>

            <div className="mt-6 space-y-1 text-sm text-left">
              {user.phone && (
                <div className="flex items-center gap-2 text-muted-foreground p-2">
                  <Phone className="w-4 h-4" /> {user.phone}
                </div>
              )}
              {user.address && (
                <div className="flex items-center gap-2 text-muted-foreground p-2">
                  <MapPin className="w-4 h-4" /> {user.address}
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border space-y-1">
              <button
                onClick={() => setEditMode(!editMode)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors text-left"
              >
                <Edit className="w-4 h-4" /> Editar Perfil
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors text-left">
                <Bell className="w-4 h-4" /> Notificações
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors text-left text-destructive"
              >
                <LogOut className="w-4 h-4" /> Terminar Sessão
              </button>
            </div>

            {editMode && (
              <div className="mt-4 pt-4 border-t border-border space-y-3 text-left">
                <div className="space-y-1">
                  <Label className="text-xs">Nome</Label>
                  <Input
                    value={editForm.full_name}
                    onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Telefone</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Endereço</Label>
                  <Input
                    value={editForm.address}
                    onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-full flex-1" onClick={async () => {
                    try {
                      await updateProfile(editForm);
                      toast.success("Perfil actualizado.");
                      setEditMode(false);
                    } catch (err: any) {
                      toast.error(err.message || "Erro ao actualizar perfil.");
                    }
                  }}>
                    <Save className="w-3 h-3 mr-1" /> Guardar
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => setEditMode(false)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="w-full justify-start mb-6 bg-card border border-border rounded-xl p-1 overflow-x-auto">
              <TabsTrigger value="orders" className="rounded-lg">
                <Package className="w-4 h-4 mr-1.5" /> Pedidos
              </TabsTrigger>
              <TabsTrigger value="appointments" className="rounded-lg">
                <Clock className="w-4 h-4 mr-1.5" /> Consultas
              </TabsTrigger>
              <TabsTrigger value="insurance" className="rounded-lg">
                <Shield className="w-4 h-4 mr-1.5" /> Seguro
              </TabsTrigger>
              <TabsTrigger value="payments" className="rounded-lg">
                <CreditCard className="w-4 h-4 mr-1.5" /> Pagamentos
              </TabsTrigger>
            </TabsList>

            {/* ORDERS TAB */}
            <TabsContent value="orders">
              <div className="space-y-4">
                {loadingOrders && (
                  <p className="text-sm text-muted-foreground">A carregar pedidos...</p>
                )}
                {!loadingOrders && orders.length === 0 && (
                  <Card className="p-8 text-center">
                    <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <h3>Nenhum pedido encontrado</h3>
                    <p className="text-sm text-muted-foreground mt-1">Faça o seu primeiro pedido!</p>
                    <Link to="/pesquisa">
                      <Button className="mt-4 rounded-full" size="sm">Pesquisar Medicamentos</Button>
                    </Link>
                  </Card>
                )}
                {orders.map((order) => (
                  <Card key={order.id} className="p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4>{order.id.slice(0, 8).toUpperCase()}</h4>
                          <Badge variant="secondary" className={statusColor(order.status)}>
                            {statusLabel(order.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleDateString("pt-MZ")}
                          {" · "}
                          {order.delivery_method === "delivery" ? "Entrega" : "Levantamento"}
                        </p>
                      </div>
                      <p className="text-lg text-primary" style={{ fontWeight: 700 }}>
                        {formatMZN(order.total_amount)}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.items.length} item(s) · {order.payment_method.toUpperCase()}
                    </div>
                    <div className="mt-3 flex gap-2">
                      {(order.status === "pending" || order.status === "confirmed") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs text-destructive hover:text-destructive"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          <X className="w-3 h-3 mr-1" /> Cancelar
                        </Button>
                      )}
                      {order.status === "delivered" && (
                        <Button variant="outline" size="sm" className="rounded-full text-xs">
                          <Star className="w-3 h-3 mr-1" /> Avaliar
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* APPOINTMENTS TAB */}
            <TabsContent value="appointments">
              <div className="space-y-4">
                {appointments.length === 0 && (
                  <Card className="p-8 text-center">
                    <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <h3>Nenhuma consulta agendada</h3>
                    <Link to="/consultas">
                      <Button className="mt-4 rounded-full" size="sm">Agendar Consulta</Button>
                    </Link>
                  </Card>
                )}
                {appointments.map((apt) => (
                  <Card key={apt.id} className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4>Consulta</h4>
                          <Badge variant={apt.status === "confirmed" || apt.status === "Confirmada" ? "default" : "secondary"}>
                            {apt.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(apt.date).toLocaleDateString("pt-MZ")} às {apt.time}
                        </p>
                      </div>
                      {(apt.status === "confirmed" || apt.status === "Confirmada" || apt.status === "pending") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-xs text-destructive hover:text-destructive"
                          onClick={async () => {
                            try {
                              await appointmentsApi.cancel(apt.id);
                              setAppointments((prev) =>
                                prev.map((a) => a.id === apt.id ? { ...a, status: "cancelled" } : a)
                              );
                              toast.success("Consulta cancelada.");
                            } catch (err: any) {
                              toast.error(err.message || "Erro ao cancelar consulta.");
                            }
                          }}
                        >
                          <X className="w-3 h-3 mr-1" /> Cancelar
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* INSURANCE TAB */}
            <TabsContent value="insurance">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Associe o seu seguro de saúde para pagamento automático e cálculo de copagamentos.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {insurers.map((ins) => (
                    <Card
                      key={ins.id}
                      className={`p-4 cursor-pointer transition-all ${
                        activeInsurer === ins.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "hover:border-primary/30"
                      }`}
                      onClick={() => setActiveInsurer(activeInsurer === ins.id ? null : ins.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h4>{ins.name}</h4>
                          {activeInsurer === ins.id ? (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Associado
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Toque para associar</span>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
              {activeInsurer && (
                <Card className="p-5 bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <h4>Seguro Associado com Sucesso</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    O seu seguro será automaticamente aplicado nas próximas compras elegíveis.
                    Os copagamentos serão calculados em tempo real no checkout.
                  </p>
                </Card>
              )}
            </TabsContent>

            {/* PAYMENTS TAB */}
            <TabsContent value="payments">
              <div className="space-y-4">
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Smartphone className="w-5 h-5 text-primary" />
                    <div>
                      <h4>M-Pesa</h4>
                      <p className="text-sm text-muted-foreground">{user.phone || "+258 84 *** **67"}</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto">Principal</Badge>
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <div>
                      <h4>Cartão Visa</h4>
                      <p className="text-sm text-muted-foreground">**** **** **** 4521</p>
                    </div>
                  </div>
                </Card>
                <Button variant="outline" className="rounded-full">
                  <CreditCard className="w-4 h-4 mr-2" /> Adicionar Método de Pagamento
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
