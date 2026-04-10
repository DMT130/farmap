import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth";
import { pos } from "@/services/api";
import { formatMZN, formatDate, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Calendar,
  FileText,
  Download,
  Loader2,
  CreditCard,
  Banknote,
  Smartphone,
  Eye,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type View = "overview" | "transactions" | "detail";

const PAYMENT_ICONS: Record<string, typeof Banknote> = {
  cash: Banknote,
  card: CreditCard,
  mpesa: Smartphone,
};

const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Sales() {
  const { user } = useAuth();
  const pharmacyId = user?.pharmacy_id || "";
  const [view, setView] = useState<View>("overview");
  const [loading, setLoading] = useState(true);

  // Date range
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "custom">("today");

  // Data
  const [todayReport, setTodayReport] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [weekData, setWeekData] = useState<any[]>([]);
  const [selectedSale, setSelectedSale] = useState<any>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (!pharmacyId) return;
    loadData();
  }, [pharmacyId, selectedDate]);

  async function loadData() {
    setLoading(true);
    try {
      const [reportRes, salesRes] = await Promise.allSettled([
        pos.dailyReport(pharmacyId, selectedDate),
        pos.getSales(pharmacyId, 0, 200),
      ]);
      if (reportRes.status === "fulfilled") setTodayReport(reportRes.value);
      if (salesRes.status === "fulfilled") setSales(salesRes.value);

      // Load week data
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        try {
          const report = await pos.dailyReport(pharmacyId, dateStr);
          days.push({
            date: dateStr,
            day: d.toLocaleDateString("pt-MZ", { weekday: "short" }),
            vendas: report.total_sales || 0,
            transacoes: report.transaction_count || 0,
          });
        } catch {
          days.push({
            date: dateStr,
            day: d.toLocaleDateString("pt-MZ", { weekday: "short" }),
            vendas: 0,
            transacoes: 0,
          });
        }
      }
      setWeekData(days);
    } finally {
      setLoading(false);
    }
  }

  // Revenue by payment method
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const sale of sales) {
      if (sale.status === "voided") continue;
      const method = sale.payment_method || "cash";
      map[method] = (map[method] || 0) + (sale.total || 0);
    }
    return Object.entries(map).map(([name, value]) => ({
      name: name === "cash" ? "Dinheiro" : name === "card" ? "Cartão" : name === "mpesa" ? "M-Pesa" : name,
      value,
      key: name,
    }));
  }, [sales]);

  // Filter sales for current date
  const dateSales = useMemo(() => {
    return sales.filter((s) => s.created_at?.startsWith(selectedDate));
  }, [sales, selectedDate]);

  const paginatedSales = useMemo(() => {
    return dateSales.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  }, [dateSales, page]);

  const totalPages = Math.ceil(dateSales.length / PAGE_SIZE);

  function navigateDate(delta: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split("T")[0]);
  }

  async function handleVoidSale(saleId: string) {
    if (!confirm("Tem certeza que deseja anular esta venda?")) return;
    try {
      await pos.voidSale(saleId);
      toast.success("Venda anulada com sucesso");
      loadData();
      setSelectedSale(null);
    } catch (err: any) {
      toast.error(err.message || "Erro ao anular venda");
    }
  }

  const weekTotal = weekData.reduce((s, d) => s + d.vendas, 0);
  const weekTransactions = weekData.reduce((s, d) => s + d.transacoes, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Sale detail view
  if (view === "detail" && selectedSale) {
    return (
      <div className="p-6 max-w-2xl">
        <button
          onClick={() => { setView("transactions"); setSelectedSale(null); }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar às transacções
        </button>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold">Venda #{selectedSale.id?.slice(-8).toUpperCase()}</h2>
              <p className="text-sm text-muted-foreground">{formatDateTime(selectedSale.created_at)}</p>
            </div>
            <span
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full",
                selectedSale.status === "voided"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-emerald-500/20 text-emerald-400"
              )}
            >
              {selectedSale.status === "voided" ? "Anulada" : "Concluída"}
            </span>
          </div>

          {/* Items */}
          <div className="space-y-2 mb-6">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Itens</h3>
            {(selectedSale.items || []).map((item: any, i: number) => (
              <div key={i} className="flex justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{item.medicine_name || "Produto"}</p>
                  <p className="text-xs text-muted-foreground">{item.quantity}x @ {formatMZN(item.unit_price)}</p>
                </div>
                <p className="text-sm font-semibold">{formatMZN(item.unit_price * item.quantity)}</p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-2 pt-4 border-t border-border">
            {selectedSale.discount_percent > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto ({selectedSale.discount_percent}%)</span>
                <span className="text-amber-400">-{formatMZN(selectedSale.subtotal * selectedSale.discount_percent / 100)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatMZN(selectedSale.total)}</span>
            </div>
          </div>

          {/* Meta */}
          <div className="mt-6 pt-4 border-t border-border grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Pagamento</p>
              <p className="font-medium capitalize">{selectedSale.payment_method}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="font-medium">{selectedSale.customer_name || "Anónimo"}</p>
            </div>
          </div>

          {/* Void button */}
          {selectedSale.status !== "voided" && (
            <button
              onClick={() => handleVoidSale(selectedSale.id)}
              className="mt-6 h-9 px-4 rounded-lg border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Anular Venda
            </button>
          )}
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
              <BarChart3 className="w-5 h-5 text-primary" />
              Vendas & Relatórios
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Análise detalhada das vendas da sua farmácia
            </p>
          </div>

          {/* Date navigation */}
          <div className="flex items-center gap-2 bg-card px-2 py-1 rounded-lg border border-border">
            <button onClick={() => navigateDate(-1)} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-8 px-2 bg-transparent text-sm border-0 focus:outline-none"
            />
            <button
              onClick={() => navigateDate(1)}
              disabled={selectedDate >= new Date().toISOString().split("T")[0]}
              className="p-1.5 rounded-md hover:bg-secondary transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View tabs */}
        <div className="flex gap-1">
          <button
            onClick={() => setView("overview")}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              view === "overview" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Visão Geral
          </button>
          <button
            onClick={() => setView("transactions")}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              view === "transactions" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <FileText className="w-4 h-4" />
            Transacções
            {dateSales.length > 0 && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{dateSales.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {view === "overview" && (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground font-medium">Vendas Hoje</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold">{formatMZN(todayReport?.total_sales || 0)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{todayReport?.transaction_count || 0} transacções</p>
              </div>

              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground font-medium">Vendas da Semana</span>
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold">{formatMZN(weekTotal)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{weekTransactions} transacções</p>
              </div>

              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground font-medium">Ticket Médio</span>
                  <ShoppingCart className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-bold">
                  {formatMZN(todayReport?.transaction_count > 0 ? todayReport.total_sales / todayReport.transaction_count : 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">por transacção</p>
              </div>

              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground font-medium">Itens Vendidos</span>
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-2xl font-bold">{todayReport?.total_items_sold || 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">unidades hoje</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-3 gap-4">
              {/* Weekly sales chart */}
              <div className="col-span-2 bg-card rounded-xl border border-border p-5">
                <h2 className="text-sm font-semibold mb-4">Vendas — 7 Dias</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={weekData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="day" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#fafafa" }}
                      formatter={(value: number) => [formatMZN(value), "Vendas"]}
                    />
                    <Bar dataKey="vendas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Payment breakdown pie */}
              <div className="bg-card rounded-xl border border-border p-5">
                <h2 className="text-sm font-semibold mb-4">Por Método de Pagamento</h2>
                {paymentBreakdown.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">Sem dados</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={paymentBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          dataKey="value"
                          paddingAngle={3}
                        >
                          {paymentBreakdown.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#fafafa" }}
                          formatter={(value: number) => [formatMZN(value), "Receita"]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {paymentBreakdown.map((item, i) => (
                        <div key={item.key} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-muted-foreground">{item.name}</span>
                          </div>
                          <span className="font-medium">{formatMZN(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Top products today */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-sm font-semibold mb-4">Produtos Mais Vendidos — {formatDate(selectedDate)}</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {(todayReport?.top_medicines || []).length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-2">Sem vendas nesta data</p>
                )}
                {(todayReport?.top_medicines || []).map((med: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <span className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{med.name}</p>
                      <p className="text-xs text-muted-foreground">{med.quantity_sold} unidades</p>
                    </div>
                    <span className="text-sm font-semibold text-primary">{formatMZN(med.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {view === "transactions" && (
          <div>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-card border-b border-border">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Hora</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Itens</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Pagamento</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-muted-foreground">
                        Sem transacções nesta data
                      </td>
                    </tr>
                  ) : (
                    paginatedSales.map((sale) => {
                      const PayIcon = PAYMENT_ICONS[sale.payment_method] || Banknote;
                      return (
                        <tr key={sale.id} className="border-b border-border last:border-0 hover:bg-card/50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            #{sale.id?.slice(-8).toUpperCase()}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(sale.created_at).toLocaleTimeString("pt-MZ", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="px-4 py-3">{sale.customer_name || "Anónimo"}</td>
                          <td className="px-4 py-3 text-center">{sale.items?.length || 0}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <PayIcon className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="capitalize text-xs">{sale.payment_method}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">{formatMZN(sale.total)}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={cn(
                                "text-[11px] font-medium px-2 py-0.5 rounded-full",
                                sale.status === "voided"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-emerald-500/20 text-emerald-400"
                              )}
                            >
                              {sale.status === "voided" ? "Anulada" : "OK"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => { setSelectedSale(sale); setView("detail"); }}
                              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  {dateSales.length} transacções
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="h-8 px-3 rounded-lg border border-border text-sm hover:bg-secondary transition-colors disabled:opacity-30"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="h-8 px-3 rounded-lg border border-border text-sm hover:bg-secondary transition-colors disabled:opacity-30"
                  >
                    Seguinte
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
