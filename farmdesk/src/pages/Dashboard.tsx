import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth";
import { pos, inventory, orders as ordersApi } from "@/services/api";
import { formatMZN, formatDate } from "@/lib/utils";
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const pharmacyId = user?.pharmacy_id || "";
  const [todayReport, setTodayReport] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [onlineOrders, setOnlineOrders] = useState<any[]>([]);
  const [weekData, setWeekData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pharmacyId) return;
    const today = new Date().toISOString().split("T")[0];

    Promise.allSettled([
      pos.dailyReport(pharmacyId, today),
      inventory.getAlerts(pharmacyId),
      pos.getSales(pharmacyId, 0, 5),
      ordersApi.list(),
      loadWeekData(),
    ]).then(([reportRes, alertsRes, salesRes, ordersRes]) => {
      if (reportRes.status === "fulfilled") setTodayReport(reportRes.value);
      if (alertsRes.status === "fulfilled") setAlerts(alertsRes.value);
      if (salesRes.status === "fulfilled") setRecentSales(salesRes.value);
      if (ordersRes.status === "fulfilled") setOnlineOrders(ordersRes.value.filter((o: any) => o.status === "pending"));
      setLoading(false);
    });

    async function loadWeekData() {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        try {
          const report = await pos.dailyReport(pharmacyId, dateStr);
          days.push({
            day: d.toLocaleDateString("pt-MZ", { weekday: "short" }),
            vendas: report.total_sales,
            transacoes: report.transaction_count,
          });
        } catch {
          days.push({ day: d.toLocaleDateString("pt-MZ", { weekday: "short" }), vendas: 0, transacoes: 0 });
        }
      }
      setWeekData(days);
    }
  }, [pharmacyId]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{greeting()}, {user?.full_name?.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {formatDate(new Date())} — Resumo da sua farmácia
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          title="Vendas Hoje"
          value={formatMZN(todayReport?.total_sales || 0)}
          icon={DollarSign}
          trend={todayReport?.total_sales > 0 ? "up" : undefined}
          color="text-emerald-400"
        />
        <KPICard
          title="Transacções"
          value={String(todayReport?.transaction_count || 0)}
          icon={ShoppingCart}
          color="text-blue-400"
        />
        <KPICard
          title="Pedidos Online"
          value={String(onlineOrders.length)}
          subtitle="pendentes"
          icon={Clock}
          color="text-amber-400"
        />
        <KPICard
          title="Alertas"
          value={String(alerts.length)}
          subtitle="stock baixo / validade"
          icon={AlertTriangle}
          color={alerts.length > 0 ? "text-red-400" : "text-muted-foreground"}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Weekly sales chart */}
        <div className="col-span-2 bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold mb-4">Vendas — Últimos 7 dias</h2>
          <ResponsiveContainer width="100%" height={260}>
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

        {/* Top medicines today */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold mb-4">Mais Vendidos Hoje</h2>
          <div className="space-y-3">
            {(todayReport?.top_medicines || []).length === 0 && (
              <p className="text-sm text-muted-foreground">Sem vendas hoje</p>
            )}
            {(todayReport?.top_medicines || []).map((med: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="text-sm">{med.name}</span>
                </div>
                <span className="text-sm font-medium text-primary">{formatMZN(med.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row: recent sales + alerts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recent sales */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold mb-4">Vendas Recentes</h2>
          <div className="space-y-2">
            {recentSales.length === 0 && <p className="text-sm text-muted-foreground">Sem vendas recentes</p>}
            {recentSales.map((sale: any) => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium">{sale.customer_name || "Cliente Anónimo"}</p>
                  <p className="text-xs text-muted-foreground">{sale.items?.length || 0} itens • {sale.payment_method}</p>
                </div>
                <span className="text-sm font-semibold">{formatMZN(sale.total)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory alerts */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold mb-4">Alertas de Inventário</h2>
          <div className="space-y-2">
            {alerts.length === 0 && <p className="text-sm text-muted-foreground">Sem alertas</p>}
            {alerts.map((alert: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <AlertTriangle
                  className={`w-4 h-4 flex-shrink-0 ${
                    alert.alert_type === "expired" ? "text-red-400" : alert.alert_type === "low_stock" ? "text-amber-400" : "text-orange-400"
                  }`}
                />
                <div className="flex-1">
                  <p className="text-sm">{alert.medicine_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {alert.alert_type === "low_stock" && `Stock: ${alert.quantity_remaining} unidades`}
                    {alert.alert_type === "expiring_soon" && "A expirar em breve"}
                    {alert.alert_type === "expired" && "Expirado"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "text-primary",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  trend?: "up" | "down";
  color?: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground font-medium">{title}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      {trend && (
        <div className={`flex items-center gap-1 mt-1 text-xs ${trend === "up" ? "text-emerald-400" : "text-red-400"}`}>
          {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        </div>
      )}
    </div>
  );
}
