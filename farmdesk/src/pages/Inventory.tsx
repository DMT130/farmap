import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth";
import { inventory, medicines as medApi, suppliers as supApi } from "@/services/api";
import { formatMZN, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Loader2,
  Calendar,
  Truck,
  PackagePlus,
  ClipboardList,
  BarChart3,
} from "lucide-react";

type Tab = "summary" | "batches" | "alerts" | "receive";

interface InventoryItem {
  medicine_id: string;
  medicine_name: string;
  total_quantity: number;
  total_cost: number;
  avg_unit_cost: number;
  earliest_expiry: string | null;
  batch_count: number;
}

interface StockBatch {
  id: string;
  pharmacy_id: string;
  medicine_id: string;
  medicine_name?: string;
  supplier_id?: string;
  supplier_name?: string;
  batch_number: string;
  quantity_received: number;
  quantity_remaining: number;
  unit_cost: number;
  expiry_date: string;
  received_at: string;
}

interface Alert {
  medicine_id: string;
  medicine_name: string;
  alert_type: "low_stock" | "expiring_soon" | "expired";
  quantity_remaining: number;
  expiry_date?: string;
  batch_number?: string;
}

export default function Inventory() {
  const { user } = useAuth();
  const pharmacyId = user?.pharmacy_id || "";
  const [tab, setTab] = useState<Tab>("summary");
  const [loading, setLoading] = useState(true);

  // Data
  const [summary, setSummary] = useState<InventoryItem[]>([]);
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);

  // Search/filter
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("medicine_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Receive stock form
  const [receiveForm, setReceiveForm] = useState({
    medicine_id: "",
    supplier_id: "",
    batch_number: "",
    quantity_received: "",
    unit_cost: "",
    expiry_date: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Load data
  useEffect(() => {
    if (!pharmacyId) return;
    loadData();
  }, [pharmacyId]);

  async function loadData() {
    setLoading(true);
    try {
      const [summaryRes, batchRes, alertRes, medRes, supRes] = await Promise.allSettled([
        inventory.getSummary(pharmacyId),
        inventory.getBatches(pharmacyId),
        inventory.getAlerts(pharmacyId),
        medApi.list(),
        supApi.list(),
      ]);
      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value);
      if (batchRes.status === "fulfilled") setBatches(batchRes.value);
      if (alertRes.status === "fulfilled") setAlerts(alertRes.value);
      if (medRes.status === "fulfilled") setMedicines(medRes.value);
      if (supRes.status === "fulfilled") setSuppliersList(supRes.value);
    } finally {
      setLoading(false);
    }
  }

  // Filtered & sorted summary
  const filteredSummary = useMemo(() => {
    let items = [...summary];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter((i) => i.medicine_name.toLowerCase().includes(q));
    }
    items.sort((a, b) => {
      const aVal = (a as any)[sortField];
      const bVal = (b as any)[sortField];
      if (typeof aVal === "string") return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
    return items;
  }, [summary, searchQuery, sortField, sortDir]);

  const filteredBatches = useMemo(() => {
    if (!searchQuery) return batches;
    const q = searchQuery.toLowerCase();
    return batches.filter(
      (b) =>
        b.medicine_name?.toLowerCase().includes(q) ||
        b.batch_number?.toLowerCase().includes(q) ||
        b.supplier_name?.toLowerCase().includes(q)
    );
  }, [batches, searchQuery]);

  function toggleSort(field: string) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  async function handleReceiveStock(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inventory.receiveBatch({
        pharmacy_id: pharmacyId,
        medicine_id: receiveForm.medicine_id,
        supplier_id: receiveForm.supplier_id || undefined,
        batch_number: receiveForm.batch_number,
        quantity_received: Number(receiveForm.quantity_received),
        unit_cost: Number(receiveForm.unit_cost),
        expiry_date: receiveForm.expiry_date,
      });
      toast.success("Stock recebido com sucesso!");
      setReceiveForm({ medicine_id: "", supplier_id: "", batch_number: "", quantity_received: "", unit_cost: "", expiry_date: "" });
      loadData();
      setTab("summary");
    } catch (err: any) {
      toast.error(err.message || "Erro ao receber stock");
    } finally {
      setSubmitting(false);
    }
  }

  const totalItems = summary.reduce((s, i) => s + i.total_quantity, 0);
  const totalValue = summary.reduce((s, i) => s + i.total_cost, 0);
  const uniqueProducts = summary.length;

  const TABS: { key: Tab; label: string; icon: typeof Package; count?: number }[] = [
    { key: "summary", label: "Resumo", icon: ClipboardList },
    { key: "batches", label: "Lotes", icon: Package, count: batches.length },
    { key: "alerts", label: "Alertas", icon: AlertTriangle, count: alerts.length },
    { key: "receive", label: "Receber Stock", icon: PackagePlus },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Inventário
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {uniqueProducts} produtos • {totalItems.toLocaleString()} unidades • Valor: {formatMZN(totalValue)}
            </p>
          </div>
          <button
            onClick={() => setTab("receive")}
            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Receber Stock
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
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={cn(
                  "text-[11px] px-1.5 py-0.5 rounded-full",
                  t.key === "alerts" ? "bg-red-500/20 text-red-400" : "bg-secondary text-muted-foreground"
                )}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Search bar for summary & batches tabs */}
            {(tab === "summary" || tab === "batches") && (
              <div className="px-6 pt-4">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquisar produto, lote, fornecedor..."
                    className="w-full h-9 pl-10 pr-9 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground/50"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Summary tab */}
            {tab === "summary" && (
              <div className="px-6 py-4">
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-card border-b border-border">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                          <button onClick={() => toggleSort("medicine_name")} className="flex items-center gap-1 hover:text-foreground transition-colors">
                            Produto <SortIcon field="medicine_name" />
                          </button>
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                          <button onClick={() => toggleSort("total_quantity")} className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors">
                            Stock <SortIcon field="total_quantity" />
                          </button>
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                          <button onClick={() => toggleSort("avg_unit_cost")} className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors">
                            Custo Médio <SortIcon field="avg_unit_cost" />
                          </button>
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                          <button onClick={() => toggleSort("total_cost")} className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors">
                            Valor Total <SortIcon field="total_cost" />
                          </button>
                        </th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Lotes</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Validade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSummary.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-muted-foreground">
                            {searchQuery ? "Nenhum produto encontrado" : "Inventário vazio"}
                          </td>
                        </tr>
                      ) : (
                        filteredSummary.map((item) => {
                          const isLow = item.total_quantity < 10;
                          const isExpiring =
                            item.earliest_expiry &&
                            new Date(item.earliest_expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                          const isExpired =
                            item.earliest_expiry && new Date(item.earliest_expiry) < new Date();
                          return (
                            <tr key={item.medicine_id} className="border-b border-border last:border-0 hover:bg-card/50 transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-medium">{item.medicine_name}</p>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={cn("font-semibold", isLow ? "text-red-400" : "text-foreground")}>
                                  {item.total_quantity}
                                </span>
                                {isLow && <AlertTriangle className="w-3 h-3 text-red-400 inline ml-1" />}
                              </td>
                              <td className="px-4 py-3 text-right text-muted-foreground">
                                {formatMZN(item.avg_unit_cost)}
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                {formatMZN(item.total_cost)}
                              </td>
                              <td className="px-4 py-3 text-center text-muted-foreground">{item.batch_count}</td>
                              <td className="px-4 py-3 text-center">
                                {item.earliest_expiry ? (
                                  <span
                                    className={cn(
                                      "text-xs px-2 py-0.5 rounded-full",
                                      isExpired
                                        ? "bg-red-500/20 text-red-400"
                                        : isExpiring
                                          ? "bg-amber-500/20 text-amber-400"
                                          : "bg-emerald-500/20 text-emerald-400"
                                    )}
                                  >
                                    {formatDate(item.earliest_expiry)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Batches tab */}
            {tab === "batches" && (
              <div className="px-6 py-4">
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-card border-b border-border">
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Produto</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nº Lote</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fornecedor</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Recebido</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Restante</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Custo Unit.</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Validade</th>
                        <th className="text-center px-4 py-3 font-medium text-muted-foreground">Recebido em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBatches.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-muted-foreground">
                            Nenhum lote encontrado
                          </td>
                        </tr>
                      ) : (
                        filteredBatches.map((batch) => {
                          const isExpired = new Date(batch.expiry_date) < new Date();
                          const usedPercent = batch.quantity_received > 0
                            ? ((batch.quantity_received - batch.quantity_remaining) / batch.quantity_received) * 100
                            : 0;
                          return (
                            <tr key={batch.id} className="border-b border-border last:border-0 hover:bg-card/50 transition-colors">
                              <td className="px-4 py-3 font-medium">{batch.medicine_name}</td>
                              <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{batch.batch_number}</td>
                              <td className="px-4 py-3 text-muted-foreground">{batch.supplier_name || "—"}</td>
                              <td className="px-4 py-3 text-right">{batch.quantity_received}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                                    <div
                                      className={cn(
                                        "h-full rounded-full",
                                        batch.quantity_remaining < 10 ? "bg-red-400" : "bg-primary"
                                      )}
                                      style={{ width: `${100 - usedPercent}%` }}
                                    />
                                  </div>
                                  <span className="font-medium">{batch.quantity_remaining}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-muted-foreground">{formatMZN(batch.unit_cost)}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={cn(
                                  "text-xs px-2 py-0.5 rounded-full",
                                  isExpired ? "bg-red-500/20 text-red-400" : "bg-secondary text-muted-foreground"
                                )}>
                                  {formatDate(batch.expiry_date)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center text-muted-foreground text-xs">{formatDate(batch.received_at)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Alerts tab */}
            {tab === "alerts" && (
              <div className="px-6 py-4 space-y-3">
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <AlertTriangle className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm">Sem alertas de inventário</p>
                    <p className="text-xs mt-1">Todos os produtos estão com stock e validade adequados</p>
                  </div>
                ) : (
                  alerts.map((alert, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border",
                        alert.alert_type === "expired"
                          ? "border-red-500/30 bg-red-500/5"
                          : alert.alert_type === "low_stock"
                            ? "border-amber-500/30 bg-amber-500/5"
                            : "border-orange-500/30 bg-orange-500/5"
                      )}
                    >
                      <AlertTriangle
                        className={cn(
                          "w-5 h-5 flex-shrink-0",
                          alert.alert_type === "expired"
                            ? "text-red-400"
                            : alert.alert_type === "low_stock"
                              ? "text-amber-400"
                              : "text-orange-400"
                        )}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{alert.medicine_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {alert.alert_type === "low_stock" && `Stock baixo: ${alert.quantity_remaining} unidades restantes`}
                          {alert.alert_type === "expiring_soon" && `A expirar em breve${alert.expiry_date ? ` — ${formatDate(alert.expiry_date)}` : ""}`}
                          {alert.alert_type === "expired" && `Expirado${alert.expiry_date ? ` em ${formatDate(alert.expiry_date)}` : ""}`}
                        </p>
                        {alert.batch_number && (
                          <p className="text-xs text-muted-foreground mt-0.5">Lote: {alert.batch_number}</p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium px-2.5 py-1 rounded-full",
                          alert.alert_type === "expired"
                            ? "bg-red-500/20 text-red-400"
                            : alert.alert_type === "low_stock"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-orange-500/20 text-orange-400"
                        )}
                      >
                        {alert.alert_type === "low_stock" && "Stock Baixo"}
                        {alert.alert_type === "expiring_soon" && "A Expirar"}
                        {alert.alert_type === "expired" && "Expirado"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Receive stock form */}
            {tab === "receive" && (
              <div className="px-6 py-6 max-w-xl">
                <h2 className="text-lg font-semibold mb-1">Receber Stock</h2>
                <p className="text-sm text-muted-foreground mb-6">Registar nova entrega de medicamentos no inventário</p>
                <form onSubmit={handleReceiveStock} className="space-y-4">
                  {/* Medicine */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Medicamento *</label>
                    <select
                      required
                      value={receiveForm.medicine_id}
                      onChange={(e) => setReceiveForm((f) => ({ ...f, medicine_id: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    >
                      <option value="">Seleccione um medicamento</option>
                      {medicines.map((m) => (
                        <option key={m.id} value={m.id}>{m.name} — {m.dosage}</option>
                      ))}
                    </select>
                  </div>

                  {/* Supplier */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Fornecedor</label>
                    <select
                      value={receiveForm.supplier_id}
                      onChange={(e) => setReceiveForm((f) => ({ ...f, supplier_id: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    >
                      <option value="">Seleccione (opcional)</option>
                      {suppliersList.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Batch number */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Número do Lote *</label>
                    <input
                      required
                      type="text"
                      value={receiveForm.batch_number}
                      onChange={(e) => setReceiveForm((f) => ({ ...f, batch_number: e.target.value }))}
                      placeholder="Ex: LOT-2026-001"
                      className="w-full h-10 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground/50"
                    />
                  </div>

                  {/* Quantity + Unit cost in a row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Quantidade *</label>
                      <input
                        required
                        type="number"
                        min="1"
                        value={receiveForm.quantity_received}
                        onChange={(e) => setReceiveForm((f) => ({ ...f, quantity_received: e.target.value }))}
                        placeholder="0"
                        className="w-full h-10 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground/50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Custo Unitário (MZN) *</label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={receiveForm.unit_cost}
                        onChange={(e) => setReceiveForm((f) => ({ ...f, unit_cost: e.target.value }))}
                        placeholder="0.00"
                        className="w-full h-10 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>

                  {/* Expiry date */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Data de Validade *</label>
                    <input
                      required
                      type="date"
                      value={receiveForm.expiry_date}
                      onChange={(e) => setReceiveForm((f) => ({ ...f, expiry_date: e.target.value }))}
                      className="w-full h-10 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>

                  {/* Total preview */}
                  {receiveForm.quantity_received && receiveForm.unit_cost && (
                    <div className="bg-secondary/50 rounded-lg p-3 flex justify-between text-sm">
                      <span className="text-muted-foreground">Custo Total do Lote</span>
                      <span className="font-semibold text-primary">
                        {formatMZN(Number(receiveForm.quantity_received) * Number(receiveForm.unit_cost))}
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackagePlus className="w-4 h-4" />}
                    Registar Stock
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
