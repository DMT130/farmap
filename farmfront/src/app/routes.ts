import { createBrowserRouter } from "react-router";
import { Layout } from "./components/layout";
import { HomePage } from "./pages/home";
import { SearchPage } from "./pages/search";
import { NotFoundPage } from "./pages/not-found";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "pesquisa", Component: SearchPage },
      { path: "medicamento/:id", lazy: () => import("./pages/medicine-detail").then((m) => ({ Component: m.MedicineDetailPage })) },
      { path: "farmacia/:id", lazy: () => import("./pages/pharmacy-detail").then((m) => ({ Component: m.PharmacyDetailPage })) },
      { path: "carrinho", lazy: () => import("./pages/cart").then((m) => ({ Component: m.CartPage })) },
      { path: "perfil", lazy: () => import("./pages/profile").then((m) => ({ Component: m.ProfilePage })) },
      { path: "consultas", lazy: () => import("./pages/appointments").then((m) => ({ Component: m.AppointmentsPage })) },
      { path: "painel", lazy: () => import("./pages/dashboard").then((m) => ({ Component: m.DashboardPage })) },
      { path: "admin", lazy: () => import("./pages/admin").then((m) => ({ Component: m.AdminPage })) },
      { path: "entrar", lazy: () => import("./pages/login").then((m) => ({ Component: m.LoginPage })) },
      { path: "farmacia/entrar", lazy: () => import("./pages/pharmacy-login").then((m) => ({ Component: m.PharmacyLoginPage })) },
      { path: "registar", lazy: () => import("./pages/register").then((m) => ({ Component: m.RegisterPage })) },
      { path: "farmacia/registar", lazy: () => import("./pages/register-pharmacy").then((m) => ({ Component: m.RegisterPharmacyPage })) },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
