import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Building2, MapPin, Phone, Clock, Truck, Save,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { toast } from "sonner";
import { pharmaciesApi, authApi } from "../services/api";
import { useAuth } from "../context/use-auth";

export function RegisterPharmacyPage() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Already a pharmacy owner or admin? Redirect away
  useEffect(() => {
    if (isAuthenticated && user?.role === "pharmacy_owner") {
      navigate("/painel", { replace: true });
    } else if (isAuthenticated && user?.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, user]);

  const [form, setForm] = useState({
    name: "",
    address: "",
    district: "",
    phone: "",
    open_hours: "08:00 - 20:00",
    delivery_fee: 150,
    delivery_time: "30-45 min",
    is_open: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.address || !form.district) {
      toast.error("Nome, endereço e distrito são obrigatórios.");
      return;
    }
    if (!isAuthenticated || !user) {
      toast.error("Inicie sessão antes de registar uma farmácia.");
      navigate("/entrar");
      return;
    }
    setSubmitting(true);
    try {
      // Create the pharmacy
      const pharmacy = await pharmaciesApi.create({
        name: form.name,
        address: form.address,
        district: form.district,
        phone: form.phone || null,
        open_hours: form.open_hours || null,
        delivery_fee: form.delivery_fee,
        delivery_time: form.delivery_time || null,
        is_open: form.is_open,
        rating: 0,
        review_count: 0,
        image: null,
        distance: null,
      });

      // Link the user to this pharmacy and set role
      const updatedUser = await authApi.updateProfile(user.id, {
        role: "pharmacy_owner",
        pharmacy_id: pharmacy.id,
      } as any);

      // Update auth context in-memory (no page reload needed)
      refreshUser({ ...updatedUser, role: "pharmacy_owner", pharmacy_id: pharmacy.id });

      toast.success("Farmácia registada com sucesso! A redirecionar para o painel...");
      navigate("/painel");
    } catch (err: any) {
      toast.error(err.message || "Erro ao registar farmácia.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" />
          Registar Farmácia
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registe a sua farmácia para começar a vender medicamentos na plataforma FarmaMap.
        </p>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-sm flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> Nome da Farmácia *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Farmácia Central de Maputo"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-sm flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Endereço *</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Ex: Av. 25 de Setembro, 1234"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Distrito *</Label>
            <Input
              value={form.district}
              onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
              placeholder="Ex: Baixa"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Telefone</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+258 21 123 456"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Horário de Funcionamento</Label>
            <Input
              value={form.open_hours}
              onChange={(e) => setForm((f) => ({ ...f, open_hours: e.target.value }))}
              placeholder="08:00 - 20:00"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Taxa de Entrega (MT)</Label>
            <Input
              type="number"
              value={form.delivery_fee}
              onChange={(e) => setForm((f) => ({ ...f, delivery_fee: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm">Tempo de Entrega</Label>
            <Input
              value={form.delivery_time}
              onChange={(e) => setForm((f) => ({ ...f, delivery_time: e.target.value }))}
              placeholder="30-45 min"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={form.is_open}
              onCheckedChange={(v) => setForm((f) => ({ ...f, is_open: v }))}
            />
            <span className="text-sm">Aberta agora</span>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button className="rounded-full" onClick={handleSubmit} disabled={submitting}>
            <Save className="w-4 h-4 mr-2" />
            {submitting ? "A registar..." : "Registar Farmácia"}
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
        </div>
      </Card>
    </div>
  );
}
