import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/auth";
import Shell from "@/components/Shell";
import Login from "@/pages/Login";
import { Loader2 } from "lucide-react";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const POS = lazy(() => import("@/pages/POS"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const Sales = lazy(() => import("@/pages/Sales"));
const OnlineOrders = lazy(() => import("@/pages/OnlineOrders"));
const Settings = lazy(() => import("@/pages/Settings"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function ProtectedRoutes() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.pharmacy_id && user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        <p>A sua conta não está associada a nenhuma farmácia.</p>
      </div>
    );
  }
  return (
    <Shell>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/orders" element={<OnlineOrders />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Shell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </HashRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#18181b",
            color: "#fafafa",
            border: "1px solid #27272a",
          },
        }}
      />
    </AuthProvider>
  );
}
