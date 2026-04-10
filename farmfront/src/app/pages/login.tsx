import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Pill, Mail, Lock, Eye, EyeOff, Heart, Search, ShoppingCart } from "lucide-react";
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
      <div className="w-full max-w-4xl grid md:grid-cols-2 overflow-hidden rounded-2xl shadow-xl border border-border">
        {/* Left panel - branding */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-primary via-primary to-[#065f42] p-10 text-white">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl" style={{ fontWeight: 700 }}>FarmaMap</span>
            </div>
            <h2 className="text-3xl text-white mb-4" style={{ fontWeight: 700, lineHeight: 1.3 }}>
              Medicamentos ao alcance de um clique
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              Compare preços, verifique disponibilidade e encomende medicamentos de farmácias locais em Moçambique.
            </p>
            <div className="space-y-3">
              {[
                { icon: Search, text: "Pesquise entre milhares de medicamentos" },
                { icon: Heart, text: "Compare preços de 50+ farmácias" },
                { icon: ShoppingCart, text: "Encomende e receba em casa" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 text-sm text-white/80">
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-3.5 h-3.5" />
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/60">
            <div className="text-center">
              <p className="text-2xl text-white" style={{ fontWeight: 700 }}>50+</p>
              <p>Farmácias</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl text-white" style={{ fontWeight: 700 }}>2.5K+</p>
              <p>Medicamentos</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl text-white" style={{ fontWeight: 700 }}>25K+</p>
              <p>Utilizadores</p>
            </div>
          </div>
        </div>

        {/* Right panel - form */}
        <Card className="p-8 border-0 shadow-none rounded-none md:rounded-r-2xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4 md:hidden">
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

          <div className="mt-4 p-3 rounded-lg bg-accent/50 text-xs text-muted-foreground text-center space-y-1">
            <p>Conta demo cliente:</p>
            <p><strong>joao.cliente@email.co.mz</strong> / <strong>password123</strong></p>
          </div>
        </Card>
      </div>
    </div>
  );
}
