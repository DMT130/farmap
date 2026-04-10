import { useState, useEffect, useMemo, Fragment } from "react";
import { useNavigate } from "react-router";
import {
  LayoutDashboard, Package, TrendingUp, DollarSign, Clock, CheckCircle2,
  XCircle, AlertTriangle, Pill, ShoppingCart,
  BarChart3, Bell, Plus, Save, X, Edit, Trash2,
  Building2, Search, ChevronDown, ChevronUp, Calendar, Boxes, Truck,
  AlertCircle, LogOut,
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
  ordersApi, medicinesApi, pharmaciesApi, categoriesApi, inventoryApi, suppliersApi,
  type Order, type Medicine, type PriceRecord, type Category,
  type StockBatch, type InventorySummary, type InventoryAlert, type Supplier,
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
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/farmacia/entrar", { replace: true });
    } else if (user?.role !== "pharmacy_owner" && user?.role !== "admin") {
      toast.error("Acesso restrito a gestores de farmácia.");
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, user]);

  const pharmacyId = user?.pharmacy_id || "";

  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [pharmacyPrices, setPharmacyPrices] = useState<PriceRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pharmacyName, setPharmacyName] = useState("A minha farmácia");

  // Inventory states
  const [stockBatches, setStockBatches] = useState<StockBatch[]>([]);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Loading states
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingMedicines, setLoadingMedicines] = useState(true);
  const [loadingStock, setLoadingStock] = useState(true);

  // Stock search
  const [stockSearch, setStockSearch] = useState("");

  // Receive stock form
  const [showReceiveStock, setShowReceiveStock] = useState(false);
  const [receiveForm, setReceiveForm] = useState({
    medicine_id: "", supplier_id: "", batch_number: "",
    quantity_received: 0, cost_price: 0, sale_price: 0, expiry_date: "",
  });

  // Add medicine form
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: "", generic_name: "", category: "", description: "",
    requires_prescription: false, price: 0, in_stock: true,
  });

  // Edit batch
  const [editingBatch, setEditingBatch] = useState<StockBatch | null>(null);
  const [editBatchForm, setEditBatchForm] = useState({
    quantity_remaining: 0, sale_price: 0, expiry_date: "",
  });

  // Add supplier form
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "", contact_person: "", phone: "", email: "", address: "",
  });

  // Expanded inventory rows
  const [expandedMedicine, setExpandedMedicine] = useState<string | null>(null);
  const [medicineBatches, setMedicineBatches] = useState<Record<string, StockBatch[]>>({});

  // Fetch all data
  useEffect(() => {
    if (!pharmacyId && user?.role !== "admin") return;

    ordersApi.list()
      .then((allOrders) => {
        if (pharmacyId && user?.role !== "admin") {
          setOrders(allOrders.filter((o) => o.items.some((item) => item.pharmacy_id === pharmacyId)));
        } else {
          setOrders(allOrders);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));

    medicinesApi.list().then(setMedicines).catch(() => {}).finally(() => setLoadingMedicines(false));
    categoriesApi.list().then(setCategories).catch(() => {});
    suppliersApi.list().then(setSuppliers).catch(() => {});

    if (pharmacyId) {
      pharmaciesApi.get(pharmacyId).then((ph) => setPharmacyName(ph.name)).catch(() => {});
      pharmaciesApi.listPrices(pharmacyId).then(setPharmacyPrices).catch(() => {});
      loadInventoryData();
    }
  }, [pharmacyId]);

  const loadInventoryData = () => {
    if (!pharmacyId) return;
    setLoadingStock(true);
    Promise.all([
      inventoryApi.listBatches(pharmacyId).catch(() => []),
      inventoryApi.summary(pharmacyId).catch(() => []),
      inventoryApi.alerts(pharmacyId).catch(() => []),
    ]).then(([batches, summary, alerts]) => {
      setStockBatches(batches);
      setInventorySummary(summary);
      setInventoryAlerts(alerts);
    }).finally(() => setLoadingStock(false));
  };

  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "confirmed");
  const completedOrders = orders.filter((o) => o.status === "delivered");
  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString());
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);

  const getMyPrice = (medId: string) => pharmacyPrices.find((p) => p.medicine_id === medId);

  // Filtered inventory summary
  const filteredSummary = useMemo(() => {
    if (!stockSearch) return inventorySummary;
    const q = stockSearch.toLowerCase();
    return inventorySummary.filter((s) =>
      s.medicine_name.toLowerCase().includes(q) ||
      (s.category || "").toLowerCase().includes(q)
    );
  }, [inventorySummary, stockSearch]);

  // Total stock value
  const totalStockValue = useMemo(() =>
    inventorySummary.reduce((sum, s) => sum + s.total_stock * s.sale_price, 0)
  , [inventorySummary]);

  const totalUnits = useMemo(() =>
    inventorySummary.reduce((sum, s) => sum + s.total_stock, 0)
  , [inventorySummary]);

  // --- Handlers ---

  const handleOrderAction = async (orderId: string, action: string) => {
    const statusMap: Record<string, string> = {
      accepted: "confirmed", preparing: "preparing", ready: "ready", delivered: "delivered", rejected: "cancelled",
    };
    const newStatus = statusMap[action] || action;
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      toast.success(action === "rejected" ? "Pedido rejeitado." : `Pedido actualizado para "${statusLabel(newStatus)}".`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao actualizar pedido.");
    }
  };

  const handleReceiveStock = async () => {
    if (!receiveForm.medicine_id || receiveForm.quantity_received <= 0) {
      toast.error("Selecione um medicamento e quantidade válida.");
      return;
    }
    try {
      await inventoryApi.receiveBatch({
        pharmacy_id: pharmacyId,
        medicine_id: receiveForm.medicine_id,
        supplier_id: receiveForm.supplier_id || null,
        batch_number: receiveForm.batch_number || null,
        quantity_received: receiveForm.quantity_received,
        cost_price: receiveForm.cost_price,
        sale_price: receiveForm.sale_price,
        expiry_date: receiveForm.expiry_date || null,
      });
      toast.success("Stock recebido com sucesso!");
      setShowReceiveStock(false);
      setReceiveForm({ medicine_id: "", supplier_id: "", batch_number: "", quantity_received: 0, cost_price: 0, sale_price: 0, expiry_date: "" });
      loadInventoryData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao receber stock.");
    }
  };

  const handleAddMedicine = async () => {
    if (!newMedicine.name) { toast.error("Nome do medicamento é obrigatório."); return; }
    try {
      const created = await medicinesApi.create({
        name: newMedicine.name, generic_name: newMedicine.generic_name || null,
        category: newMedicine.category || null, description: newMedicine.description || null,
        requires_prescription: newMedicine.requires_prescription, image: null,
      });
      setMedicines((prev) => [...prev, created]);
      if (pharmacyId && newMedicine.price > 0) {
        try {
          const priceRec = await pharmaciesApi.upsertPrice(pharmacyId, {
            medicine_id: created.id, price: newMedicine.price, in_stock: newMedicine.in_stock,
          });
          setPharmacyPrices((prev) => [...prev, priceRec]);
        } catch {}
      }
      setNewMedicine({ name: "", generic_name: "", category: "", description: "", requires_prescription: false, price: 0, in_stock: true });
      setShowAddMedicine(false);
      toast.success("Medicamento adicionado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar medicamento.");
    }
  };

  const handleUpdateBatch = async () => {
    if (!editingBatch) return;
    try {
      await inventoryApi.updateBatch(editingBatch.id, {
        quantity_remaining: editBatchForm.quantity_remaining,
        sale_price: editBatchForm.sale_price,
        expiry_date: editBatchForm.expiry_date || undefined,
      });
      toast.success("Lote actualizado!");
      setEditingBatch(null);
      loadInventoryData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao actualizar lote.");
    }
  };

  const handleAddSupplier = async () => {
    if (!newSupplier.name) { toast.error("Nome do fornecedor é obrigatório."); return; }
    try {
      const created = await suppliersApi.create(newSupplier);
      setSuppliers((prev) => [...prev, created]);
      setNewSupplier({ name: "", contact_person: "", phone: "", email: "", address: "" });
      setShowAddSupplier(false);
      toast.success("Fornecedor adicionado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar fornecedor.");
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!window.confirm("Remover este fornecedor?")) return;
    try {
      await suppliersApi.delete(id);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      toast.success("Fornecedor removido.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover fornecedor.");
    }
  };

  const toggleExpandMedicine = async (medicineId: string) => {
    if (expandedMedicine === medicineId) {
      setExpandedMedicine(null);
      return;
    }
    setExpandedMedicine(medicineId);
    if (!medicineBatches[medicineId]) {
      try {
        const batches = await inventoryApi.listBatches(pharmacyId, medicineId);
        setMedicineBatches((prev) => ({ ...prev, [medicineId]: batches }));
      } catch {
        setMedicineBatches((prev) => ({ ...prev, [medicineId]: [] }));
      }
    }
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "Pendente", confirmed: "Aceite", preparing: "Em preparação",
      ready: "Pronto", delivered: "Entregue", cancelled: "Cancelado",
    };
    return map[status] || status;
  };

  const alertIcon = (type: string) => {
    if (type === "low_stock") return <Package className="w-4 h-4 text-amber-500" />;
    if (type === "expired") return <XCircle className="w-4 h-4 text-red-500" />;
    return <AlertTriangle className="w-4 h-4 text-orange-500" />;
  };

  const alertLabel = (type: string) => {
    if (type === "low_stock") return "Stock Baixo";
    if (type === "expired") return "Expirado";
    return "Expira em Breve";
  };

  if (!isAuthenticated || (user?.role !== "pharmacy_owner" && user?.role !== "admin")) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Pharmacy header bar */}
      <div className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg" style={{ fontWeight: 700 }}>{pharmacyName}</h1>
              <p className="text-xs text-muted-foreground">Painel de Gestão</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {inventoryAlerts.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                {inventoryAlerts.length} alerta(s)
              </Badge>
            )}
            <Button
              variant="ghost" size="sm" className="text-muted-foreground"
              onClick={() => { logout(); navigate("/farmacia/entrar"); }}
            >
              <LogOut className="w-4 h-4 mr-1" /> Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[
            { label: "Receita Total", value: formatMZN(totalRevenue), icon: DollarSign, color: "text-emerald-600" },
            { label: "Pedidos Hoje", value: String(todayOrders.length), icon: ShoppingCart, color: "text-blue-600" },
            { label: "Total Pedidos", value: String(orders.length), icon: Package, color: "text-purple-600" },
            { label: "Unidades em Stock", value: totalUnits.toLocaleString(), icon: Boxes, color: "text-amber-600" },
            { label: "Valor do Stock", value: formatMZN(totalStockValue), icon: TrendingUp, color: "text-emerald-600" },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-accent flex items-center justify-center ${kpi.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xl text-foreground" style={{ fontWeight: 700 }}>{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Alerts banner */}
        {inventoryAlerts.length > 0 && (
          <Card className="p-4 mb-6 border-amber-300/50 bg-amber-50/50 dark:bg-amber-900/10">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-amber-800 dark:text-amber-300" style={{ fontWeight: 600 }}>Alertas de Inventário</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {inventoryAlerts.map((alert, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border text-sm">
                  {alertIcon(alert.alert_type)}
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ fontWeight: 500 }}>{alert.medicine_name}</p>
                    <p className="text-xs text-muted-foreground">{alert.quantity_remaining} un. · {alertLabel(alert.alert_type)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Tabs defaultValue="stock" className="w-full">
          <TabsList className="mb-6 bg-card border border-border rounded-xl p-1">
            <TabsTrigger value="stock" className="rounded-lg">
              <Boxes className="w-4 h-4 mr-1.5" /> Inventário
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg">
              <Package className="w-4 h-4 mr-1.5" /> Pedidos
              {pendingOrders.length > 0 && (
                <Badge variant="destructive" className="ml-1.5 text-xs h-5 w-5 p-0 flex items-center justify-center">{pendingOrders.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="medicines" className="rounded-lg">
              <Pill className="w-4 h-4 mr-1.5" /> Catálogo
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="rounded-lg">
              <Truck className="w-4 h-4 mr-1.5" /> Fornecedores
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg">
              <BarChart3 className="w-4 h-4 mr-1.5" /> Relatórios
            </TabsTrigger>
          </TabsList>

          {/* ============================================================= */}
          {/* INVENTORY TAB */}
          {/* ============================================================= */}
          <TabsContent value="stock">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2>Gestão de Inventário</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {inventorySummary.length} medicamento(s) em stock · {stockBatches.length} lote(s) total
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="rounded-full" onClick={() => setShowReceiveStock(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Receber Stock
                </Button>
              </div>
            </div>

            {/* Receive stock form */}
            {showReceiveStock && (
              <Card className="p-5 mb-6 border-primary/30">
                <h3 className="mb-4 flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-primary" /> Receber Novo Lote de Stock
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                    <Label className="text-xs">Medicamento *</Label>
                    <select
                      value={receiveForm.medicine_id}
                      onChange={(e) => setReceiveForm((f) => ({ ...f, medicine_id: e.target.value }))}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Selecionar medicamento...</option>
                      {medicines.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fornecedor</Label>
                    <select
                      value={receiveForm.supplier_id}
                      onChange={(e) => setReceiveForm((f) => ({ ...f, supplier_id: e.target.value }))}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Selecionar fornecedor...</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Nº do Lote</Label>
                    <Input value={receiveForm.batch_number} onChange={(e) => setReceiveForm((f) => ({ ...f, batch_number: e.target.value }))} placeholder="Ex: LOT-2026-001" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Quantidade Recebida *</Label>
                    <Input type="number" min={1} value={receiveForm.quantity_received || ""} onChange={(e) => setReceiveForm((f) => ({ ...f, quantity_received: Number(e.target.value) }))} placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Preço de Custo (MT) *</Label>
                    <Input type="number" min={0} step={0.01} value={receiveForm.cost_price || ""} onChange={(e) => setReceiveForm((f) => ({ ...f, cost_price: Number(e.target.value) }))} placeholder="0.00" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Preço de Venda (MT) *</Label>
                    <Input type="number" min={0} step={0.01} value={receiveForm.sale_price || ""} onChange={(e) => setReceiveForm((f) => ({ ...f, sale_price: Number(e.target.value) }))} placeholder="0.00" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Data de Validade</Label>
                    <Input type="date" value={receiveForm.expiry_date} onChange={(e) => setReceiveForm((f) => ({ ...f, expiry_date: e.target.value }))} />
                  </div>
                </div>
                {receiveForm.cost_price > 0 && receiveForm.sale_price > 0 && (
                  <div className="mt-3 p-2 rounded-lg bg-accent/50 text-sm">
                    Margem: <span style={{ fontWeight: 600 }} className="text-primary">
                      {((receiveForm.sale_price - receiveForm.cost_price) / receiveForm.cost_price * 100).toFixed(1)}%
                    </span>
                    {receiveForm.quantity_received > 0 && (
                      <> · Valor total: <span style={{ fontWeight: 600 }}>{formatMZN(receiveForm.quantity_received * receiveForm.cost_price)}</span></>
                    )}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button className="rounded-full" onClick={handleReceiveStock}><Save className="w-4 h-4 mr-1" /> Registar Entrada</Button>
                  <Button variant="outline" className="rounded-full" onClick={() => setShowReceiveStock(false)}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
                </div>
              </Card>
            )}

            {/* Edit batch form */}
            {editingBatch && (
              <Card className="p-5 mb-6 border-amber-300">
                <h3 className="mb-4">Editar Lote — {editingBatch.batch_number || editingBatch.id.slice(0, 8)}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Quantidade Restante</Label>
                    <Input type="number" min={0} value={editBatchForm.quantity_remaining} onChange={(e) => setEditBatchForm((f) => ({ ...f, quantity_remaining: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Preço de Venda (MT)</Label>
                    <Input type="number" min={0} step={0.01} value={editBatchForm.sale_price} onChange={(e) => setEditBatchForm((f) => ({ ...f, sale_price: Number(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Data de Validade</Label>
                    <Input type="date" value={editBatchForm.expiry_date} onChange={(e) => setEditBatchForm((f) => ({ ...f, expiry_date: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button className="rounded-full" onClick={handleUpdateBatch}><Save className="w-4 h-4 mr-1" /> Guardar</Button>
                  <Button variant="outline" className="rounded-full" onClick={() => setEditingBatch(null)}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
                </div>
              </Card>
            )}

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por medicamento ou categoria..."
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            {loadingStock && <p className="text-sm text-muted-foreground py-4">A carregar inventário...</p>}

            {!loadingStock && filteredSummary.length === 0 && (
              <Card className="p-12 text-center">
                <Boxes className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                <h3>Sem stock registado</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Comece por adicionar um medicamento e depois receba stock.</p>
                <Button size="sm" className="rounded-full" onClick={() => setShowReceiveStock(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Receber Primeiro Lote
                </Button>
              </Card>
            )}

            {!loadingStock && filteredSummary.length > 0 && (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-accent/50">
                        <th className="text-left p-4 w-8"></th>
                        <th className="text-left p-4">Medicamento</th>
                        <th className="text-left p-4">Categoria</th>
                        <th className="text-right p-4">Stock</th>
                        <th className="text-right p-4">Lotes</th>
                        <th className="text-right p-4">Custo Médio</th>
                        <th className="text-right p-4">Preço Venda</th>
                        <th className="text-left p-4">Validade</th>
                        <th className="text-left p-4">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSummary.map((item) => {
                        const isExpanded = expandedMedicine === item.medicine_id;
                        const batches = medicineBatches[item.medicine_id] || [];
                        const isLow = item.total_stock <= 10;
                        const isExpiring = item.nearest_expiry && item.nearest_expiry <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

                        return (
                          <Fragment key={item.medicine_id}>
                            <tr
                              className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors cursor-pointer"
                              onClick={() => toggleExpandMedicine(item.medicine_id)}
                            >
                              <td className="p-4">
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                              </td>
                              <td className="p-4">
                                <p style={{ fontWeight: 500 }}>{item.medicine_name}</p>
                              </td>
                              <td className="p-4 text-muted-foreground">{item.category || "—"}</td>
                              <td className="p-4 text-right">
                                <span style={{ fontWeight: 600 }} className={isLow ? "text-amber-600" : ""}>{item.total_stock}</span>
                              </td>
                              <td className="p-4 text-right text-muted-foreground">{item.batches}</td>
                              <td className="p-4 text-right text-muted-foreground">{formatMZN(item.avg_cost)}</td>
                              <td className="p-4 text-right">
                                <span className="text-primary" style={{ fontWeight: 600 }}>{formatMZN(item.sale_price)}</span>
                              </td>
                              <td className="p-4">
                                {item.nearest_expiry ? (
                                  <span className={`text-xs ${isExpiring ? "text-amber-600" : "text-muted-foreground"}`}>
                                    {item.nearest_expiry}
                                  </span>
                                ) : <span className="text-xs text-muted-foreground">—</span>}
                              </td>
                              <td className="p-4">
                                {isLow ? (
                                  <Badge className="bg-amber-100 text-amber-700 text-xs">Stock Baixo</Badge>
                                ) : (
                                  <Badge className="bg-green-100 text-green-700 text-xs">OK</Badge>
                                )}
                              </td>
                            </tr>
                            {/* Expanded: show batches */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={9} className="p-0">
                                  <div className="bg-accent/20 px-8 py-4 border-b border-border">
                                    <div className="flex items-center justify-between mb-3">
                                      <p className="text-sm" style={{ fontWeight: 600 }}>Lotes de {item.medicine_name}</p>
                                    </div>
                                    {batches.length === 0 && (
                                      <p className="text-sm text-muted-foreground">A carregar lotes...</p>
                                    )}
                                    {batches.length > 0 && (
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="text-muted-foreground">
                                            <th className="text-left pb-2">Lote</th>
                                            <th className="text-right pb-2">Recebido</th>
                                            <th className="text-right pb-2">Restante</th>
                                            <th className="text-right pb-2">Custo</th>
                                            <th className="text-right pb-2">Venda</th>
                                            <th className="text-left pb-2">Validade</th>
                                            <th className="text-left pb-2">Data Entrada</th>
                                            <th className="text-right pb-2"></th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {batches.map((b) => (
                                            <tr key={b.id} className="border-t border-border/50">
                                              <td className="py-2 font-mono">{b.batch_number || b.id.slice(0, 8)}</td>
                                              <td className="py-2 text-right">{b.quantity_received}</td>
                                              <td className="py-2 text-right" style={{ fontWeight: 600 }}>
                                                {b.quantity_remaining}
                                                {b.quantity_remaining === 0 && <Badge variant="secondary" className="ml-1 text-[10px]">Esgotado</Badge>}
                                              </td>
                                              <td className="py-2 text-right">{formatMZN(b.cost_price)}</td>
                                              <td className="py-2 text-right text-primary" style={{ fontWeight: 500 }}>{formatMZN(b.sale_price)}</td>
                                              <td className="py-2">{b.expiry_date || "—"}</td>
                                              <td className="py-2 text-muted-foreground">{new Date(b.received_at).toLocaleDateString("pt-MZ")}</td>
                                              <td className="py-2 text-right">
                                                <Button
                                                  variant="ghost" size="sm" className="h-7 w-7 p-0"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingBatch(b);
                                                    setEditBatchForm({
                                                      quantity_remaining: b.quantity_remaining,
                                                      sale_price: b.sale_price,
                                                      expiry_date: b.expiry_date || "",
                                                    });
                                                  }}
                                                >
                                                  <Edit className="w-3.5 h-3.5" />
                                                </Button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* ============================================================= */}
          {/* ORDERS TAB */}
          {/* ============================================================= */}
          <TabsContent value="orders">
            <div className="flex items-center justify-between mb-4">
              <h2>Pedidos</h2>
              <Badge variant="secondary">{pendingOrders.length} pendentes</Badge>
            </div>

            {loadingOrders && <p className="text-sm text-muted-foreground">A carregar pedidos...</p>}

            {!loadingOrders && pendingOrders.length === 0 && (
              <Card className="p-8 text-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-500/30 mx-auto mb-3" />
                <h3>Nenhum pedido pendente</h3>
                <p className="text-sm text-muted-foreground mt-1">Todos os pedidos foram processados.</p>
              </Card>
            )}

            {pendingOrders.length > 0 && (
              <div className="space-y-3 mb-8">
                {pendingOrders.map((order) => (
                  <Card key={order.id} className="p-5">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4>{order.id.slice(0, 8).toUpperCase()}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {order.delivery_method === "delivery" ? "Entrega" : "Levantamento"}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">{statusLabel(order.status)}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {order.items.length} item(s) · {order.payment_method}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleString("pt-MZ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="text-lg text-primary" style={{ fontWeight: 700 }}>{formatMZN(order.total_amount)}</p>
                        <div className="flex gap-2">
                          {order.status === "pending" && (
                            <>
                              <Button size="sm" className="rounded-full" onClick={() => handleOrderAction(order.id, "accepted")}>
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Aceitar
                              </Button>
                              <Button size="sm" variant="outline" className="rounded-full text-destructive hover:text-destructive" onClick={() => handleOrderAction(order.id, "rejected")}>
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {order.status === "confirmed" && (
                            <Button size="sm" className="rounded-full" onClick={() => handleOrderAction(order.id, "preparing")}>Preparar</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* All orders table */}
            {orders.length > 0 && (
              <div>
                <h3 className="mb-3">Todos os Pedidos ({orders.length})</h3>
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
                            <td className="p-4 text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-MZ")}</td>
                            <td className="p-4">{order.items.length} item(s)</td>
                            <td className="p-4" style={{ fontWeight: 600 }}>{formatMZN(order.total_amount)}</td>
                            <td className="p-4">
                              <Badge variant="secondary" className={
                                order.status === "delivered" ? "bg-green-100 text-green-700"
                                  : order.status === "cancelled" ? "bg-red-100 text-red-700"
                                  : order.status === "preparing" ? "bg-amber-100 text-amber-700"
                                  : ""
                              }>
                                {statusLabel(order.status)}
                              </Badge>
                            </td>
                            <td className="p-4">
                              {order.status === "preparing" && (
                                <Button size="sm" variant="outline" className="text-xs rounded-full" onClick={() => handleOrderAction(order.id, "ready")}>Pronto</Button>
                              )}
                              {order.status === "ready" && (
                                <Button size="sm" variant="outline" className="text-xs rounded-full" onClick={() => handleOrderAction(order.id, "delivered")}>Entregue</Button>
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

          {/* ============================================================= */}
          {/* MEDICINES CATALOG TAB */}
          {/* ============================================================= */}
          <TabsContent value="medicines">
            <div className="flex items-center justify-between mb-4">
              <h2>Catálogo de Medicamentos</h2>
              <Button size="sm" className="rounded-full" onClick={() => setShowAddMedicine(true)}>
                <Plus className="w-4 h-4 mr-1" /> Novo Medicamento
              </Button>
            </div>

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
                    <select value={newMedicine.category} onChange={(e) => setNewMedicine((f) => ({ ...f, category: e.target.value }))} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <option value="">Selecionar categoria...</option>
                      {categories.map((cat) => (<option key={cat.id} value={cat.name}>{cat.name}</option>))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Descrição</Label>
                    <Input value={newMedicine.description} onChange={(e) => setNewMedicine((f) => ({ ...f, description: e.target.value }))} placeholder="Descrição do medicamento" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Preço Inicial (MT)</Label>
                    <Input type="number" min={0} value={newMedicine.price} onChange={(e) => setNewMedicine((f) => ({ ...f, price: Number(e.target.value) }))} />
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

            {loadingMedicines && <p className="text-sm text-muted-foreground">A carregar medicamentos...</p>}

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-accent/50">
                      <th className="text-left p-4">Medicamento</th>
                      <th className="text-left p-4">Categoria</th>
                      <th className="text-left p-4">Preço</th>
                      <th className="text-left p-4">Em Stock</th>
                      <th className="text-left p-4">Receita</th>
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
                            {myPrice ? <span className="text-primary font-semibold">{formatMZN(myPrice.price)}</span> : <span className="text-muted-foreground">—</span>}
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* ============================================================= */}
          {/* SUPPLIERS TAB */}
          {/* ============================================================= */}
          <TabsContent value="suppliers">
            <div className="flex items-center justify-between mb-4">
              <h2>Fornecedores</h2>
              <Button size="sm" className="rounded-full" onClick={() => setShowAddSupplier(true)}>
                <Plus className="w-4 h-4 mr-1" /> Novo Fornecedor
              </Button>
            </div>

            {showAddSupplier && (
              <Card className="p-5 mb-6 border-primary/30">
                <h3 className="mb-4">Novo Fornecedor</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Nome *</Label>
                    <Input value={newSupplier.name} onChange={(e) => setNewSupplier((f) => ({ ...f, name: e.target.value }))} placeholder="Nome da empresa" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Pessoa de Contacto</Label>
                    <Input value={newSupplier.contact_person} onChange={(e) => setNewSupplier((f) => ({ ...f, contact_person: e.target.value }))} placeholder="Nome do contacto" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Telefone</Label>
                    <Input value={newSupplier.phone} onChange={(e) => setNewSupplier((f) => ({ ...f, phone: e.target.value }))} placeholder="+258 ..." />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input value={newSupplier.email} onChange={(e) => setNewSupplier((f) => ({ ...f, email: e.target.value }))} placeholder="email@empresa.co.mz" />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Endereço</Label>
                    <Input value={newSupplier.address} onChange={(e) => setNewSupplier((f) => ({ ...f, address: e.target.value }))} placeholder="Endereço da empresa" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button className="rounded-full" onClick={handleAddSupplier}><Save className="w-4 h-4 mr-1" /> Guardar</Button>
                  <Button variant="outline" className="rounded-full" onClick={() => setShowAddSupplier(false)}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
                </div>
              </Card>
            )}

            {suppliers.length === 0 && (
              <Card className="p-12 text-center">
                <Truck className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                <h3>Sem fornecedores</h3>
                <p className="text-sm text-muted-foreground mt-1">Adicione fornecedores para rastrear entradas de stock.</p>
              </Card>
            )}

            {suppliers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suppliers.map((s) => (
                  <Card key={s.id} className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4>{s.name}</h4>
                        {s.contact_person && <p className="text-sm text-muted-foreground">{s.contact_person}</p>}
                        {s.phone && <p className="text-xs text-muted-foreground mt-1">{s.phone}</p>}
                        {s.email && <p className="text-xs text-muted-foreground">{s.email}</p>}
                        {s.address && <p className="text-xs text-muted-foreground mt-1">{s.address}</p>}
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteSupplier(s.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ============================================================= */}
          {/* ANALYTICS TAB */}
          {/* ============================================================= */}
          <TabsContent value="analytics">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="p-5">
                <h3 className="mb-4">Vendas Mensais (MT)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => [`${value.toLocaleString()} MT`, "Vendas"]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
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
                    <Tooltip formatter={(value: number) => [value, "Pedidos"]} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                    <Line type="monotone" dataKey="pedidos" stroke="#0d9668" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-5 lg:col-span-2">
                <h3 className="mb-4">Resumo</h3>
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
    </div>
  );
}
