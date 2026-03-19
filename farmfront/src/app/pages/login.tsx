import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Pill, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/use-auth";
import { toast } from "sonner";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos.");
      return;
    }
    try {
      const user = await login(email, password);
      toast.success("Sessão iniciada com sucesso!");
      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "pharmacy_owner") {
        navigate("/painel");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao iniciar sessão. Verifique as credenciais.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Pill className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl" style={{ fontWeight: 700 }}>Bem-vindo de volta</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Inicie sessão na sua conta FarmaMap
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.co.mz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Palavra-passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>
            {loading ? "A entrar..." : "Iniciar Sessão"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Não tem conta? </span>
          <Link to="/registar" className="text-primary hover:underline font-medium">
            Criar conta
          </Link>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-accent/50 text-xs text-muted-foreground text-center">
          <p>Conta demo: <strong>maria.tembe@email.co.mz</strong> / <strong>password123</strong></p>
        </div>
      </Card>
    </div>
  );
}
