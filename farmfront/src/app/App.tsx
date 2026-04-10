import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./context/auth-context";
import { CartProvider } from "./context/cart-context";
import { ErrorBoundary } from "./components/error-boundary";
import { Toaster } from "sonner";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors closeButton />
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
