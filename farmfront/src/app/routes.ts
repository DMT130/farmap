import { createBrowserRouter } from "react-router";
import { Layout } from "./components/layout";
import { HomePage } from "./pages/home";
import { SearchPage } from "./pages/search";
import { MedicineDetailPage } from "./pages/medicine-detail";
import { PharmacyDetailPage } from "./pages/pharmacy-detail";
import { CartPage } from "./pages/cart";
import { ProfilePage } from "./pages/profile";
import { AppointmentsPage } from "./pages/appointments";
import { DashboardPage } from "./pages/dashboard";
import { AdminPage } from "./pages/admin";
import { LoginPage } from "./pages/login";
import { RegisterPage } from "./pages/register";
import { RegisterPharmacyPage } from "./pages/register-pharmacy";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: "pesquisa", Component: SearchPage },
      { path: "medicamento/:id", Component: MedicineDetailPage },
      { path: "farmacia/:id", Component: PharmacyDetailPage },
      { path: "carrinho", Component: CartPage },
      { path: "perfil", Component: ProfilePage },
      { path: "consultas", Component: AppointmentsPage },
      { path: "painel", Component: DashboardPage },
      { path: "admin", Component: AdminPage },
      { path: "entrar", Component: LoginPage },
      { path: "registar", Component: RegisterPage },
      { path: "registar-farmacia", Component: RegisterPharmacyPage },
    ],
  },
]);
