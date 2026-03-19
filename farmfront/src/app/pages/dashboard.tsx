import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  LayoutDashboard, Package, TrendingUp, DollarSign, Clock, CheckCircle2,
  XCircle, AlertTriangle, Eye, Pill, Users, ShoppingCart, ArrowUp, ArrowDown,
  BarChart3, Bell, Settings, Plus, Save, X, Edit, Trash2, Stethoscope,
  Building2, Star,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";
import { formatMZN } from "../data/mock-data";
import {
  ordersApi, medicinesApi, pharmaciesApi, appointmentsApi, categoriesApi,
  type Order, type Medicine, type PriceRecord, type Doctor, type Category,
} from "../services/api";
import { toast } from "sonner";
import { useAuth } from "../context/use-auth";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";

// Static chart data
const salesData = [
  { month: "Set", vendas: 45000 },
  { month: "Out", vendas: 52000 },
  { month: "Nov", vendas: 48000 },
  { month: "Dez", vendas: 67000 },
  { month: "Jan", vendas: 58000 },
  { month: "Fev", vendas: 72000 },
];
const ordersChartData = [
  { day: "Seg", pedidos: 24 },
  { day: "Ter", pedidos: 31 },
  { day: "Qua", pedidos: 28 },
  { day: "Qui", pedidos: 35 },
  { day: "Sex", pedidos: 42 },
  { day: "Sáb", pedidos: 38 },
  { day: "Dom", pedidos: 18 },
];

export function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Access control: only pharmacy owners and admins
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/entrar", { replace: true });
    } else if (user?.role !== "pharmacy_owner" && user?.role !== "admin") {
      toast.error("Acesso restrito a gestores de farmácia.");
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, user]);

  const pharmacyId = user?.pharmacy_id || "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [pharmacyPrices, setPharmacyPrices] = useState<PriceRecord[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pharmacyName, setPharmacyName] = useState("A minha farmácia");
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingMedicines, setLoadingMedicines] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Medicine forms
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: "", generic_name: "", category: "", description: "", requires_prescription: false,
    price: 0, in_stock: true,
  });
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [editMedForm, setEditMedForm] = useState({
    name: "", generic_name: "", category: "", description: "", requires_prescription: false,
  });

  // Price form
  const [showPriceForm, setShowPriceForm] = useState<string | null>(null); // medicine_id
  const [priceFormData, setPriceFormData] = useState({ price: 0, in_stock: true });

  // Doctor forms
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    name: "", specialty: "", clinic: "", address: "", consultation_fee: 0, available_slots: "",
  });
  const [editingDoctor, setEditingDoctor] = useState<any | null>(null);
  const [editDocForm, setEditDocForm] = useState({
    name: "", specialty: "", clinic: "", address: "", consultation_fee: 0, available_slots: "",
  });

  // Fetch data
  useEffect(() => {
    if (!pharmacyId && user?.role !== "admin") return;

    // Fetch orders — filter by pharmacy for owners
    ordersApi.list()
      .then((allOrders) => {
        if (pharmacyId && user?.role !== "admin") {
          // Filter to only orders containing items from this pharmacy
          const filtered = allOrders.filter((o: Order) =>
            o.items.some((item: any) => item.pharmacy_id === pharmacyId)
          );
          setOrders(filtered);
        } else {
          setOrders(allOrders);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));

    medicinesApi.list()
      .then(setMedicines)
      .catch(() => {})
      .finally(() => setLoadingMedicines(false));

    categoriesApi.list()
      .then(setCategories)
      .catch(() => {});

    if (pharmacyId) {
      pharmaciesApi.get(pharmacyId)
        .then((ph) => setPharmacyName(ph.name))
        .catch(() => {});

      pharmaciesApi.listPrices(pharmacyId)
        .then(setPharmacyPrices)
        .catch(() => {});
    }

    appointmentsApi.doctors()
      .then((data) => {
        setDoctors(data.map((d: any) => {
          let slots = d.available_slots || [];
          if (typeof slots === "string") {
            try { slots = JSON.parse(slots); } catch { slots = []; }
          }
          return { ...d, availableSlots: slots, consultationFee: d.consultation_fee || 0, reviewCount: d.review_count || 0 };
        }));
      })
      .catch(() => {})
      .finally(() => setLoadingDoctors(false));
  }, [pharmacyId]);

  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "confirmed");
  const completedOrders = orders.filter((o) => o.status === "delivered");
  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString());
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);

  // Helpers: find price for this pharmacy on a medicine
  const getMyPrice = (medId: string) => pharmacyPrices.find((p) => p.medicine_id === medId);

  const handleOrderAction = async (orderId: string, action: string) => {
    const statusMap: Record<string, string> = {
      accepted: "confirmed", preparing: "preparing", ready: "ready", delivered: "delivered", rejected: "cancelled",
    };
    const newStatus = statusMap[action] || action;
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      toast.success(action === "rejected" ? "Pedido rejeitado." : `Pedido actualizado para "${newStatus}".`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao actualizar pedido.");
    }
  };

  const handleAddMedicine = async () => {
    if (!newMedicine.name) { toast.error("Nome do medicamento é obrigatório."); return; }
    try {
      const created = await medicinesApi.create({
        name: newMedicine.name,
        generic_name: newMedicine.generic_name || null,
        category: newMedicine.category || null,
        description: newMedicine.description || null,
        requires_prescription: newMedicine.requires_prescription,
        image: null,
      });
      setMedicines((prev) => [...prev, created]);

      // Auto-create price record for this pharmacy if price > 0
      if (pharmacyId && newMedicine.price > 0) {
        try {
          const priceRec = await pharmaciesApi.upsertPrice(pharmacyId, {
            medicine_id: created.id,
            price: newMedicine.price,
            in_stock: newMedicine.in_stock,
          });
          setPharmacyPrices((prev) => [...prev, priceRec]);
        } catch { /* price creation failed, medicine still created */ }
      }

      setNewMedicine({ name: "", generic_name: "", category: "", description: "", requires_prescription: false, price: 0, in_stock: true });
      setShowAddMedicine(false);
      toast.success("Medicamento adicionado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar medicamento.");
    }
  };

  const handleEditMedicine = async () => {
    if (!editingMedicine) return;
    try {
      const updated = await medicinesApi.update(editingMedicine.id, editMedForm);
      setMedicines((prev) => prev.map((m) => (m.id === editingMedicine.id ? updated : m)));
      setEditingMedicine(null);
      toast.success("Medicamento actualizado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao actualizar medicamento.");
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    if (!window.confirm("Tem a certeza que deseja remover este medicamento?")) return;
    try {
      await medicinesApi.delete(id);
      setMedicines((prev) => prev.filter((m) => m.id !== id));
      toast.success("Medicamento removido.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover medicamento.");
    }
  };

  const handleUpsertPrice = async (medicineId: string) => {
    try {
      const result = await pharmaciesApi.upsertPrice(pharmacyId, {
        medicine_id: medicineId,
        price: priceFormData.price,
        in_stock: priceFormData.in_stock,
      });
      setPharmacyPrices((prev) => {
        const idx = prev.findIndex((p) => p.medicine_id === medicineId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = result;
          return next;
        }
        return [...prev, result];
      });
      setShowPriceForm(null);
      toast.success("Preço actualizado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao actualizar preço.");
    }
  };

  const handleDeletePrice = async (medicineId: string) => {
    if (!window.confirm("Tem a certeza que deseja remover este preço?")) return;
    try {
      await pharmaciesApi.deletePrice(pharmacyId, medicineId);
      setPharmacyPrices((prev) => prev.filter((p) => p.medicine_id !== medicineId));
      toast.success("Preço removido.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover preço.");
    }
  };

  // Doctor handlers
  const handleAddDoctor = async () => {
    if (!newDoctor.name) { toast.error("Nome do médico é obrigatório."); return; }
    try {
      const slotsStr = newDoctor.available_slots
        ? JSON.stringify(newDoctor.available_slots.split(",").map((s) => s.trim()))
        : "[]";
      const created = await appointmentsApi.createDoctor({
        ...newDoctor,
        available_slots: slotsStr,
        consultation_fee: newDoctor.consultation_fee,
        rating: 0, review_count: 0, image: null,
      } as any);
      let slots: string[] = [];
      try { slots = JSON.parse(created.available_slots || "[]"); } catch { slots = []; }
      setDoctors((prev) => [...prev, { ...created, availableSlots: slots, consultationFee: created.consultation_fee, reviewCount: created.review_count }]);
      setNewDoctor({ name: "", specialty: "", clinic: "", address: "", consultation_fee: 0, available_slots: "" });
      setShowAddDoctor(false);
      toast.success("Médico adicionado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar médico.");
    }
  };

  const handleEditDoctor = async () => {
    if (!editingDoctor) return;
    try {
      const slotsStr = editDocForm.available_slots
        ? JSON.stringify(editDocForm.available_slots.split(",").map((s) => s.trim()))
        : "[]";
      const updated = await appointmentsApi.updateDoctor(editingDoctor.id, {
        ...editDocForm,
        available_slots: slotsStr,
      } as any);
      let slots: string[] = [];
      try { slots = JSON.parse(updated.available_slots || "[]"); } catch { slots = []; }
      setDoctors((prev) => prev.map((d) => d.id === editingDoctor.id
        ? { ...updated, availableSlots: slots, consultationFee: updated.consultation_fee, reviewCount: updated.review_count }
        : d
      ));
      setEditingDoctor(null);
      toast.success("Médico actualizado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao actualizar médico.");
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!window.confirm("Tem a certeza que deseja remover este médico?")) return;
    try {
      await appointmentsApi.deleteDoctor(id);
      setDoctors((prev) => prev.filter((d) => d.id !== id));
      toast.success("Médico removido.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover médico.");
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "Pendente", confirmed: "Aceite", preparing: "Em preparação",
      ready: "Pronto", delivered: "Entregue", cancelled: "Cancelado",
    };
    return map[status] || status;
  };

  if (!isAuthenticated || (user?.role !== "pharmacy_owner" && user?.role !== "admin")) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            Painel da Farmácia
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{pharmacyName} &middot; Dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-full">
            <Bell className="w-4 h-4 mr-1" /> {pendingOrders.length}
          </Button>
          <Button variant="outline" size="sm" className="rounded-full">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Receita Total", value: formatMZN(totalRevenue), icon: DollarSign },
          { label: "Pedidos Hoje", value: String(todayOrders.length), icon: ShoppingCart },
          { label: "Total Pedidos", value: String(orders.length), icon: Package },
          { label: "Medicamentos", value: String(medicines.length), icon: Pill },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-2xl text-foreground" style={{ fontWeight: 700 }}>{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="mb-6 bg-card border border-border rounded-xl p-1">
          <TabsTrigger value="orders" className="rounded-lg">
            <Package className="w-4 h-4 mr-1.5" /> Pedidos
          </TabsTrigger>
          <TabsTrigger value="stock" className="rounded-lg">
            <Pill className="w-4 h-4 mr-1.5" /> Stock
          </TabsTrigger>
          <TabsTrigger value="staff" className="rounded-lg">
            <Stethoscope className="w-4 h-4 mr-1.5" /> Staff
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg">
            <BarChart3 className="w-4 h-4 mr-1.5" /> Relatórios
          </TabsTrigger>
        </TabsList>

        {/* ORDERS TAB */}
        <TabsContent value="orders">
          <div className="flex items-center justify-between mb-4">
            <h2>Pedidos Pendentes</h2>
            <Badge variant="secondary">{pendingOrders.length} pendentes</Badge>
          </div>
          {loadingOrders && <p className="text-sm text-muted-foreground">A carregar pedidos...</p>}
          {!loadingOrders && pendingOrders.length === 0 && (
            <Card className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-500/30 mx-auto mb-3" />
              <h3>Nenhum pedido pendente</h3>
              <p className="text-sm text-muted-foreground mt-1">Todos os pedidos foram processados.</p>
            </Card>
          )}
          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <Card key={order.id} className="p-5">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4>{order.id.slice(0, 8).toUpperCase()}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {order.delivery_method === "delivery" ? "Entrega" : "Levantamento"}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {statusLabel(order.status)}
                      </Badge>
                    </div>
                    <p className="text-sm">{order.user_id || "Cliente"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.items.length} item(s) · {order.payment_method}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleString("pt-MZ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-lg text-primary" style={{ fontWeight: 700 }}>
                      {formatMZN(order.total_amount)}
                    </p>
                    <div className="flex gap-2">
                      {order.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="rounded-full"
                            onClick={() => handleOrderAction(order.id, "accepted")}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Aceitar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full text-destructive hover:text-destructive"
                            onClick={() => handleOrderAction(order.id, "rejected")}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {order.status === "confirmed" && (
                        <Button
                          size="sm"
                          className="rounded-full"
                          onClick={() => handleOrderAction(order.id, "preparing")}
                        >
                          Preparar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* All orders */}
          {orders.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4">Todos os Pedidos ({orders.length})</h2>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-accent/50">
                        <th className="text-left p-4">ID</th>
                        <th className="text-left p-4">Data</th>
                        <th className="text-left p-4">Itens</th>
                        <th className="text-left p-4">Total</th>
                        <th className="text-left p-4">Estado</th>
                        <th className="text-left p-4">Acções</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                          <td className="p-4 font-medium">{order.id.slice(0, 8).toUpperCase()}</td>
                          <td className="p-4 text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString("pt-MZ")}
                          </td>
                          <td className="p-4">{order.items.length} item(s)</td>
                          <td className="p-4" style={{ fontWeight: 600 }}>{formatMZN(order.total_amount)}</td>
                          <td className="p-4">
                            <Badge
                              variant="secondary"
                              className={
                                order.status === "delivered"
                                  ? "bg-green-100 text-green-700"
                                  : order.status === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : order.status === "preparing"
                                  ? "bg-amber-100 text-amber-700"
                                  : ""
                              }
                            >
                              {statusLabel(order.status)}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {order.status === "preparing" && (
                              <Button size="sm" variant="outline" className="text-xs rounded-full"
                                onClick={() => handleOrderAction(order.id, "ready")}>
                                Pronto
                              </Button>
                            )}
                            {order.status === "ready" && (
                              <Button size="sm" variant="outline" className="text-xs rounded-full"
                                onClick={() => handleOrderAction(order.id, "delivered")}>
                                Entregue
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* STOCK TAB */}
        <TabsContent value="stock">
          <div className="flex items-center justify-between mb-4">
            <h2>Gestão de Stock & Preços</h2>
            <Button size="sm" className="rounded-full" onClick={() => setShowAddMedicine(true)}>
              <Plus className="w-4 h-4 mr-1" /> Novo Medicamento
            </Button>
          </div>

          {/* Add medicine form */}
          {showAddMedicine && (
            <Card className="p-5 mb-6 border-primary/30">
              <h3 className="mb-4">Novo Medicamento</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Nome *</Label>
                  <Input value={newMedicine.name} onChange={(e) => setNewMedicine((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Paracetamol 500mg" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nome Genérico</Label>
                  <Input value={newMedicine.generic_name} onChange={(e) => setNewMedicine((f) => ({ ...f, generic_name: e.target.value }))} placeholder="Ex: Paracetamol" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Categoria</Label>
                  <select
                    value={newMedicine.category}
                    onChange={(e) => setNewMedicine((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Selecionar categoria...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Descrição</Label>
                  <Input value={newMedicine.description} onChange={(e) => setNewMedicine((f) => ({ ...f, description: e.target.value }))} placeholder="Descrição do medicamento" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Preço na Minha Farmácia (MT)</Label>
                  <Input type="number" min={0} value={newMedicine.price} onChange={(e) => setNewMedicine((f) => ({ ...f, price: Number(e.target.value) }))} placeholder="Ex: 150" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={newMedicine.in_stock} onCheckedChange={(v) => setNewMedicine((f) => ({ ...f, in_stock: v }))} />
                    <span className="text-sm">Em Stock</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={newMedicine.requires_prescription} onCheckedChange={(v) => setNewMedicine((f) => ({ ...f, requires_prescription: v }))} />
                    <span className="text-sm">Requer Receita</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button className="rounded-full" onClick={handleAddMedicine}><Save className="w-4 h-4 mr-1" /> Guardar</Button>
                <Button variant="outline" className="rounded-full" onClick={() => setShowAddMedicine(false)}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
              </div>
            </Card>
          )}

          {editingMedicine && (
            <Card className="p-5 mb-6 border-amber-300">
              <h3 className="mb-4">Editar Medicamento — {editingMedicine.name}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-xs">Nome *</Label><Input value={editMedForm.name} onChange={(e) => setEditMedForm((f) => ({ ...f, name: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs">Nome Genérico</Label><Input value={editMedForm.generic_name} onChange={(e) => setEditMedForm((f) => ({ ...f, generic_name: e.target.value }))} /></div>
                <div className="space-y-1">
                  <Label className="text-xs">Categoria</Label>
                  <select
                    value={editMedForm.category}
                    onChange={(e) => setEditMedForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Selecionar categoria...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1"><Label className="text-xs">Descrição</Label><Input value={editMedForm.description} onChange={(e) => setEditMedForm((f) => ({ ...f, description: e.target.value }))} /></div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Switch checked={editMedForm.requires_prescription} onCheckedChange={(v) => setEditMedForm((f) => ({ ...f, requires_prescription: v }))} />
                  <span className="text-sm">Requer Receita Médica</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button className="rounded-full" onClick={handleEditMedicine}><Save className="w-4 h-4 mr-1" /> Guardar</Button>
                <Button variant="outline" className="rounded-full" onClick={() => setEditingMedicine(null)}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
              </div>
            </Card>
          )}

          {loadingMedicines && <p className="text-sm text-muted-foreground">A carregar stock...</p>}

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-accent/50">
                    <th className="text-left p-4">Medicamento</th>
                    <th className="text-left p-4">Categoria</th>
                    <th className="text-left p-4">Meu Preço</th>
                    <th className="text-left p-4">Em Stock</th>
                    <th className="text-left p-4">Receita</th>
                    <th className="text-left p-4">Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((item) => {
                    const myPrice = getMyPrice(item.id);
                    return (
                      <tr key={item.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                        <td className="p-4">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.generic_name || ""}</p>
                        </td>
                        <td className="p-4 text-muted-foreground">{item.category || "—"}</td>
                        <td className="p-4">
                          {myPrice
                            ? <span className="text-primary font-semibold">{formatMZN(myPrice.price)}</span>
                            : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="p-4">
                          {myPrice ? (
                            myPrice.in_stock
                              ? <Badge className="bg-green-100 text-green-700 text-xs">Sim</Badge>
                              : <Badge className="bg-red-100 text-red-700 text-xs">Não</Badge>
                          ) : <span className="text-muted-foreground text-xs">N/A</span>}
                        </td>
                        <td className="p-4">
                          {item.requires_prescription
                            ? <Badge className="bg-amber-100 text-amber-700 text-xs">Sim</Badge>
                            : <Badge variant="secondary" className="text-xs">Não</Badge>}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Definir preço"
                              onClick={() => {
                                setShowPriceForm(item.id);
                                setPriceFormData({ price: myPrice?.price || 0, in_stock: myPrice?.in_stock ?? true });
                              }}
                            ><DollarSign className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                              onClick={() => {
                                setEditingMedicine(item);
                                setEditMedForm({ name: item.name, generic_name: item.generic_name || "", category: item.category || "", description: item.description || "", requires_prescription: item.requires_prescription });
                              }}
                            ><Edit className="w-4 h-4" /></Button>
                            {myPrice && (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" title="Remover preço"
                                onClick={() => handleDeletePrice(item.id)}
                              ><Trash2 className="w-4 h-4" /></Button>
                            )}
                          </div>
                          {showPriceForm === item.id && (
                            <div className="mt-2 p-3 bg-accent/50 rounded-lg space-y-2">
                              <div className="flex items-center gap-2">
                                <Input type="number" className="w-28" value={priceFormData.price} onChange={(e) => setPriceFormData((f) => ({ ...f, price: Number(e.target.value) }))} placeholder="Preço (MT)" />
                                <div className="flex items-center gap-1">
                                  <Switch checked={priceFormData.in_stock} onCheckedChange={(v) => setPriceFormData((f) => ({ ...f, in_stock: v }))} />
                                  <span className="text-xs">Stock</span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button size="sm" className="rounded-full text-xs" onClick={() => handleUpsertPrice(item.id)}><Save className="w-3 h-3 mr-1" /> Guardar</Button>
                                <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => setShowPriceForm(null)}><X className="w-3 h-3" /></Button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* STAFF TAB */}
        <TabsContent value="staff">
          <div className="flex items-center justify-between mb-4">
            <h2>Gestão de Staff / Médicos</h2>
            <Button size="sm" className="rounded-full" onClick={() => setShowAddDoctor(true)}>
              <Plus className="w-4 h-4 mr-1" /> Novo Médico
            </Button>
          </div>

          {showAddDoctor && (
            <Card className="p-5 mb-6 border-primary/30">
              <h3 className="mb-4">Novo Médico</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-xs">Nome *</Label><Input value={newDoctor.name} onChange={(e) => setNewDoctor((f) => ({ ...f, name: e.target.value }))} placeholder="Dr. João Silva" /></div>
                <div className="space-y-1"><Label className="text-xs">Especialidade</Label><Input value={newDoctor.specialty} onChange={(e) => setNewDoctor((f) => ({ ...f, specialty: e.target.value }))} placeholder="Clínica Geral" /></div>
                <div className="space-y-1"><Label className="text-xs">Clínica</Label><Input value={newDoctor.clinic} onChange={(e) => setNewDoctor((f) => ({ ...f, clinic: e.target.value }))} placeholder="Clínica Saúde Plus" /></div>
                <div className="space-y-1"><Label className="text-xs">Endereço</Label><Input value={newDoctor.address} onChange={(e) => setNewDoctor((f) => ({ ...f, address: e.target.value }))} placeholder="Av. ..." /></div>
                <div className="space-y-1"><Label className="text-xs">Taxa Consulta (MT)</Label><Input type="number" value={newDoctor.consultation_fee} onChange={(e) => setNewDoctor((f) => ({ ...f, consultation_fee: Number(e.target.value) }))} /></div>
                <div className="space-y-1"><Label className="text-xs">Horários (separados por vírgula)</Label><Input value={newDoctor.available_slots} onChange={(e) => setNewDoctor((f) => ({ ...f, available_slots: e.target.value }))} placeholder="09:00, 10:30, 14:00" /></div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button className="rounded-full" onClick={handleAddDoctor}><Save className="w-4 h-4 mr-1" /> Guardar</Button>
                <Button variant="outline" className="rounded-full" onClick={() => setShowAddDoctor(false)}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
              </div>
            </Card>
          )}

          {editingDoctor && (
            <Card className="p-5 mb-6 border-amber-300">
              <h3 className="mb-4">Editar Médico — {editingDoctor.name}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-xs">Nome *</Label><Input value={editDocForm.name} onChange={(e) => setEditDocForm((f) => ({ ...f, name: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs">Especialidade</Label><Input value={editDocForm.specialty} onChange={(e) => setEditDocForm((f) => ({ ...f, specialty: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs">Clínica</Label><Input value={editDocForm.clinic} onChange={(e) => setEditDocForm((f) => ({ ...f, clinic: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs">Endereço</Label><Input value={editDocForm.address} onChange={(e) => setEditDocForm((f) => ({ ...f, address: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs">Taxa Consulta (MT)</Label><Input type="number" value={editDocForm.consultation_fee} onChange={(e) => setEditDocForm((f) => ({ ...f, consultation_fee: Number(e.target.value) }))} /></div>
                <div className="space-y-1"><Label className="text-xs">Horários (separados por vírgula)</Label><Input value={editDocForm.available_slots} onChange={(e) => setEditDocForm((f) => ({ ...f, available_slots: e.target.value }))} /></div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button className="rounded-full" onClick={handleEditDoctor}><Save className="w-4 h-4 mr-1" /> Guardar</Button>
                <Button variant="outline" className="rounded-full" onClick={() => setEditingDoctor(null)}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
              </div>
            </Card>
          )}

          {loadingDoctors && <p className="text-sm text-muted-foreground">A carregar médicos...</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doc) => (
              <Card key={doc.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="flex items-center gap-2">{doc.name}
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {doc.rating}
                      </span>
                    </h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><Stethoscope className="w-3.5 h-3.5" /> {doc.specialty}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Building2 className="w-3 h-3" /> {doc.clinic}</p>
                    <p className="text-xs text-muted-foreground mt-1">{doc.address}</p>
                    <p className="text-primary font-semibold mt-2">{(doc.consultationFee || 0).toLocaleString()} MT</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(doc.availableSlots || []).map((slot: string) => (
                        <Badge key={slot} variant="secondary" className="text-xs">{slot}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                      onClick={() => {
                        setEditingDoctor(doc);
                        setEditDocForm({
                          name: doc.name,
                          specialty: doc.specialty || "",
                          clinic: doc.clinic || "",
                          address: doc.address || "",
                          consultation_fee: doc.consultationFee || 0,
                          available_slots: (doc.availableSlots || []).join(", "),
                        });
                      }}
                    ><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteDoctor(doc.id)}
                    ><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </Card>
            ))}
            {!loadingDoctors && doctors.length === 0 && (
              <Card className="p-8 text-center col-span-full">
                <Stethoscope className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <h3>Nenhum médico registado</h3>
                <p className="text-sm text-muted-foreground mt-1">Adicione médicos para consultas.</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="mb-4">Vendas Mensais (MT)</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString()} MT`, "Vendas"]}
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Bar dataKey="vendas" fill="#0d9668" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5">
              <h3 className="mb-4">Pedidos por Dia</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={ordersChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [value, "Pedidos"]}
                    contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Line type="monotone" dataKey="pedidos" stroke="#0d9668" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5 lg:col-span-2">
              <h3 className="mb-4">Resumo de Pedidos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: "Pendentes", count: orders.filter((o) => o.status === "pending").length, color: "bg-amber-100 text-amber-700" },
                  { name: "Em Preparação", count: orders.filter((o) => o.status === "preparing").length, color: "bg-blue-100 text-blue-700" },
                  { name: "Entregues", count: completedOrders.length, color: "bg-green-100 text-green-700" },
                  { name: "Cancelados", count: orders.filter((o) => o.status === "cancelled").length, color: "bg-red-100 text-red-700" },
                ].map((item) => (
                  <div key={item.name} className="p-4 rounded-xl bg-accent/50">
                    <p className="text-sm">{item.name}</p>
                    <p className="text-2xl text-foreground mt-1" style={{ fontWeight: 700 }}>{item.count}</p>
                    <Badge variant="secondary" className={`mt-2 ${item.color}`}>{item.name}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
