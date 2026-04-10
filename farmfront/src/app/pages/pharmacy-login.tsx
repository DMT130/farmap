import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Building2, Mail, Lock, Eye, EyeOff, Shield, BarChart3, Package, TrendingUp,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/use-auth";
import { toast } from "sonner";

export function PharmacyLoginPage() {
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
      if (user.role !== "pharmacy_owner" && user.role !== "admin") {
        toast.error("Esta conta não é de uma farmácia. Use o login de cliente.");
        return;
      }
      toast.success("Bem-vindo ao Painel de Gestão!");
      navigate("/painel");
    } catch (err: any) {
      toast.error(err.message || "Credenciais inválidas.");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — pharmacy branding */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between bg-gradient-to-br from-[#052e22] via-[#0a4a36] to-[#065f42] p-12 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Building2 className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <span className="text-2xl tracking-tight" style={{ fontWeight: 700 }}>FarmaMap</span>
              <p className="text-sm text-emerald-300/80 -mt-0.5">Portal de Gestão</p>
            </div>
          </div>

          <h1 className="text-4xl text-white mb-6" style={{ fontWeight: 700, lineHeight: 1.2 }}>
            Gerencie a sua farmácia com controlo total
          </h1>
          <p className="text-lg text-white/60 leading-relaxed max-w-lg">
            Controle de stock em tempo real, alertas de validade, gestão de encomendas e relatórios — tudo numa única plataforma.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-6">
          {[
            { icon: Package, label: "Stock", desc: "Gestão de lotes e inventário" },
            { icon: BarChart3, label: "Relatórios", desc: "Vendas e análise de dados" },
            { icon: TrendingUp, label: "Crescimento", desc: "Aumente as suas vendas" },
          ].map((feat) => (
            <div key={feat.label} className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <feat.icon className="w-8 h-8 text-emerald-300 mb-3" />
              <p className="text-white text-sm" style={{ fontWeight: 600 }}>{feat.label}</p>
              <p className="text-xs text-white/50 mt-1">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl text-primary" style={{ fontWeight: 700 }}>FarmaMap</span>
              <p className="text-xs text-muted-foreground -mt-0.5">Portal de Gestão</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-xs text-primary uppercase tracking-widest" style={{ fontWeight: 600 }}>Acesso Profissional</span>
            </div>
            <h2 className="text-3xl text-foreground" style={{ fontWeight: 700 }}>
              Entrar no Painel
            </h2>
            <p className="text-muted-foreground mt-2">
              Aceda ao painel de gestão da sua farmácia
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email da Farmácia</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="farmacia@email.co.mz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11 h-12 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm">Palavra-passe</Label>
                <a href="#" className="text-xs text-primary hover:underline">Esqueceu?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11 h-12 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl text-base" disabled={loading}>
              {loading ? "A entrar..." : "Aceder ao Painel"}
            </Button>
          </form>

          <div className="mt-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">ou</span></div>
            </div>

            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Ainda não tem farmácia registada?{" "}
                <Link to="/farmacia/registar" className="text-primary hover:underline" style={{ fontWeight: 600 }}>
                  Registar Farmácia
                </Link>
              </p>
              <p className="text-sm text-muted-foreground">
                É cliente?{" "}
                <Link to="/entrar" className="text-primary hover:underline" style={{ fontWeight: 600 }}>
                  Login de Cliente
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-accent/50 border border-border">
            <p className="text-xs text-muted-foreground text-center mb-2" style={{ fontWeight: 600 }}>Conta demo farmácia:</p>
            <p className="text-xs text-muted-foreground text-center">
              <span className="font-mono bg-background px-1.5 py-0.5 rounded">maria.tembe@email.co.mz</span>
              {" / "}
              <span className="font-mono bg-background px-1.5 py-0.5 rounded">password123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
