import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Building2, Mail, Lock, Eye, EyeOff, User, Phone, MapPin,
  Clock, Truck, Shield, Package, BarChart3, ChevronRight,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { authApi } from "../services/api";

export function RegisterPharmacyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    // Account credentials (step 1)
    email: "",
    password: "",
    confirmPassword: "",
    owner_name: "",
    owner_phone: "",
    // Pharmacy details (step 2)
    pharmacy_name: "",
    address: "",
    district: "",
    phone: "",
    open_hours: "08:00 - 20:00",
    delivery_fee: 150,
    delivery_time: "30-45 min",
  });

  const update = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validateStep1 = () => {
    if (!form.owner_name || !form.email || !form.password) {
      toast.error("Nome, email e palavra-passe são obrigatórios.");
      return false;
    }
    if (form.password.length < 6) {
      toast.error("A palavra-passe deve ter pelo menos 6 caracteres.");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("As palavras-passe não coincidem.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pharmacy_name || !form.address || !form.district) {
      toast.error("Nome da farmácia, endereço e distrito são obrigatórios.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authApi.registerPharmacy({
        email: form.email,
        password: form.password,
        owner_name: form.owner_name,
        owner_phone: form.owner_phone || undefined,
        pharmacy_name: form.pharmacy_name,
        address: form.address,
        district: form.district,
        phone: form.phone || undefined,
        open_hours: form.open_hours || undefined,
        delivery_fee: form.delivery_fee,
        delivery_time: form.delivery_time || undefined,
      });
      // Store auth data
      localStorage.setItem("farmamap_token", res.access_token);
      localStorage.setItem("farmamap_user", JSON.stringify(res.user));
      toast.success("Farmácia registada com sucesso!");
      navigate("/painel");
    } catch (err: any) {
      toast.error(err.message || "Erro ao registar farmácia.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between bg-gradient-to-br from-[#052e22] via-[#0a4a36] to-[#065f42] p-12 text-white relative overflow-hidden">
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
            Junte a sua farmácia ao FarmaMap
          </h1>
          <p className="text-lg text-white/60 leading-relaxed max-w-lg">
            Registe a sua farmácia e comece a gerir stock, vendas e encomendas numa plataforma moderna e eficiente.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-6">
          {[
            { icon: Package, label: "Inventário", desc: "Gestão de stock e lotes" },
            { icon: BarChart3, label: "Análise", desc: "Relatórios de vendas" },
            { icon: Shield, label: "Segurança", desc: "Dados protegidos" },
          ].map((feat) => (
            <div key={feat.label} className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <feat.icon className="w-8 h-8 text-emerald-300 mb-3" />
              <p className="text-white text-sm" style={{ fontWeight: 600 }}>{feat.label}</p>
              <p className="text-xs text-white/50 mt-1">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-xl text-primary" style={{ fontWeight: 700 }}>FarmaMap</span>
              <p className="text-xs text-muted-foreground -mt-0.5">Registar Farmácia</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step === 1 ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"}`}>1</div>
            <div className="flex-1 h-0.5 bg-border rounded">
              <div className={`h-full rounded transition-all ${step === 2 ? "w-full bg-primary" : "w-0"}`} />
            </div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</div>
          </div>

          {step === 1 ? (
            /* ── Step 1: Account Credentials ── */
            <div>
              <div className="mb-6">
                <h2 className="text-2xl" style={{ fontWeight: 700 }}>Criar Conta da Farmácia</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Passo 1 — Dados de acesso da farmácia
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="owner_name">Nome do Responsável *</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="owner_name"
                      placeholder="Nome completo do proprietário"
                      value={form.owner_name}
                      onChange={(e) => update("owner_name", e.target.value)}
                      className="pl-11 h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email da Farmácia *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="farmacia@email.co.mz"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      className="pl-11 h-11 rounded-xl"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Este email será usado exclusivamente para aceder ao painel da farmácia.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner_phone">Telefone do Responsável</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="owner_phone"
                      placeholder="+258 84 000 0000"
                      value={form.owner_phone}
                      onChange={(e) => update("owner_phone", e.target.value)}
                      className="pl-11 h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Palavra-passe *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      className="pl-11 pr-11 h-11 rounded-xl"
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Palavra-passe *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Repita a palavra-passe"
                      value={form.confirmPassword}
                      onChange={(e) => update("confirmPassword", e.target.value)}
                      className="pl-11 h-11 rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full h-11 rounded-xl text-base mt-2"
                  onClick={handleNext}
                >
                  Continuar <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          ) : (
            /* ── Step 2: Pharmacy Details ── */
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h2 className="text-2xl" style={{ fontWeight: 700 }}>Detalhes da Farmácia</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Passo 2 — Informações da farmácia
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pharmacy_name">Nome da Farmácia *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="pharmacy_name"
                      placeholder="Ex: Farmácia Central de Maputo"
                      value={form.pharmacy_name}
                      onChange={(e) => update("pharmacy_name", e.target.value)}
                      className="pl-11 h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="address"
                      placeholder="Av. 25 de Setembro, 1234"
                      value={form.address}
                      onChange={(e) => update("address", e.target.value)}
                      className="pl-11 h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="district">Distrito *</Label>
                    <Input
                      id="district"
                      placeholder="Baixa"
                      value={form.district}
                      onChange={(e) => update("district", e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone Farmácia</Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="+258 21 ..."
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        className="pl-11 h-11 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="open_hours">Horário</Label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="open_hours"
                        placeholder="08:00 - 20:00"
                        value={form.open_hours}
                        onChange={(e) => update("open_hours", e.target.value)}
                        className="pl-11 h-11 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery_fee">Taxa Entrega (MT)</Label>
                    <div className="relative">
                      <Truck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="delivery_fee"
                        type="number"
                        value={form.delivery_fee}
                        onChange={(e) => update("delivery_fee", Number(e.target.value))}
                        className="pl-11 h-11 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-11 rounded-xl"
                    onClick={() => setStep(1)}
                  >
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 rounded-xl text-base"
                    disabled={submitting}
                  >
                    {submitting ? "A registar..." : "Registar Farmácia"}
                  </Button>
                </div>
              </div>
            </form>
          )}

          <div className="mt-8 space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">ou</span></div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Já tem farmácia registada?{" "}
                <Link to="/farmacia/entrar" className="text-primary hover:underline" style={{ fontWeight: 600 }}>
                  Entrar no Painel
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
        </div>
      </div>
    </div>
  );
}
