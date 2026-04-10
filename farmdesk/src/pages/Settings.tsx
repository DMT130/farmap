import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { pharmacy as pharmacyApi, suppliers as supApi } from "@/services/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  Building2,
  Users,
  Truck,
  Clock,
  MapPin,
  Phone,
  Mail,
  Save,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

type Tab = "pharmacy" | "suppliers";

interface PharmacyData {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude?: number;
  longitude?: number;
  opening_hours?: string;
  delivery_available?: boolean;
  description?: string;
}

interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export default function Settings() {
  const { user } = useAuth();
  const pharmacyId = user?.pharmacy_id || "";
  const [tab, setTab] = useState<Tab>("pharmacy");
  const [loading, setLoading] = useState(true);

  // Pharmacy settings
  const [pharmacyData, setPharmacyData] = useState<PharmacyData | null>(null);
  const [saving, setSaving] = useState(false);

  // Suppliers
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ name: "", contact_person: "", phone: "", email: "", address: "" });
  const [savingSupplier, setSavingSupplier] = useState(false);

  useEffect(() => {
    if (!pharmacyId) return;
    loadData();
  }, [pharmacyId]);

  async function loadData() {
    setLoading(true);
    try {
      const [phRes, supRes] = await Promise.allSettled([
        pharmacyApi.get(pharmacyId),
        supApi.list(),
      ]);
      if (phRes.status === "fulfilled") setPharmacyData(phRes.value);
      if (supRes.status === "fulfilled") setSuppliersList(supRes.value);
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePharmacy(e: React.FormEvent) {
    e.preventDefault();
    if (!pharmacyData) return;
    setSaving(true);
    try {
      const updated = await pharmacyApi.update(pharmacyId, {
        name: pharmacyData.name,
        address: pharmacyData.address,
        phone: pharmacyData.phone,
        latitude: pharmacyData.latitude,
        longitude: pharmacyData.longitude,
        opening_hours: pharmacyData.opening_hours,
        delivery_available: pharmacyData.delivery_available,
        description: pharmacyData.description,
      });
      setPharmacyData(updated);
      toast.success("Dados da farmácia actualizados!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  }

  function openSupplierForm(supplier?: Supplier) {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierForm({
        name: supplier.name,
        contact_person: supplier.contact_person || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
      });
    } else {
      setEditingSupplier(null);
      setSupplierForm({ name: "", contact_person: "", phone: "", email: "", address: "" });
    }
    setShowSupplierForm(true);
  }

  async function handleSaveSupplier(e: React.FormEvent) {
    e.preventDefault();
    setSavingSupplier(true);
    try {
      if (editingSupplier) {
        await supApi.update(editingSupplier.id, supplierForm);
        toast.success("Fornecedor actualizado!");
      } else {
        await supApi.create(supplierForm);
        toast.success("Fornecedor adicionado!");
      }
      setShowSupplierForm(false);
      const data = await supApi.list();
      setSuppliersList(data);
    } catch (err: any) {
      toast.error(err.message || "Erro ao guardar fornecedor");
    } finally {
      setSavingSupplier(false);
    }
  }

  async function handleDeleteSupplier(id: string) {
    if (!confirm("Tem certeza que deseja remover este fornecedor?")) return;
    try {
      await supApi.delete(id);
      setSuppliersList((prev) => prev.filter((s) => s.id !== id));
      toast.success("Fornecedor removido");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover");
    }
  }

  const TABS: { key: Tab; label: string; icon: typeof Building2 }[] = [
    { key: "pharmacy", label: "Farmácia", icon: Building2 },
    { key: "suppliers", label: "Fornecedores", icon: Truck },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border">
        <h1 className="text-xl font-bold flex items-center gap-2 mb-4">
          <SettingsIcon className="w-5 h-5 text-primary" />
          Configurações
        </h1>
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Pharmacy settings */}
        {tab === "pharmacy" && pharmacyData && (
          <form onSubmit={handleSavePharmacy} className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Dados da Farmácia</h2>
              <p className="text-sm text-muted-foreground mb-6">Informações visíveis no marketplace para os clientes</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Nome da Farmácia</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={pharmacyData.name}
                    onChange={(e) => setPharmacyData({ ...pharmacyData, name: e.target.value })}
                    className="w-full h-10 pl-10 pr-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={pharmacyData.phone}
                    onChange={(e) => setPharmacyData({ ...pharmacyData, phone: e.target.value })}
                    className="w-full h-10 pl-10 pr-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Horário de Funcionamento</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={pharmacyData.opening_hours || ""}
                    onChange={(e) => setPharmacyData({ ...pharmacyData, opening_hours: e.target.value })}
                    placeholder="Ex: 07:00 - 21:00"
                    className="w-full h-10 pl-10 pr-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Endereço</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={pharmacyData.address}
                    onChange={(e) => setPharmacyData({ ...pharmacyData, address: e.target.value })}
                    className="w-full h-10 pl-10 pr-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={pharmacyData.latitude || ""}
                  onChange={(e) => setPharmacyData({ ...pharmacyData, latitude: Number(e.target.value) || undefined })}
                  placeholder="-25.9692"
                  className="w-full h-10 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={pharmacyData.longitude || ""}
                  onChange={(e) => setPharmacyData({ ...pharmacyData, longitude: Number(e.target.value) || undefined })}
                  placeholder="32.5732"
                  className="w-full h-10 px-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Descrição</label>
                <textarea
                  rows={3}
                  value={pharmacyData.description || ""}
                  onChange={(e) => setPharmacyData({ ...pharmacyData, description: e.target.value })}
                  placeholder="Breve descrição da sua farmácia..."
                  className="w-full px-3 py-2.5 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground/50 resize-none"
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={cn(
                      "w-10 h-5 rounded-full relative transition-colors",
                      pharmacyData.delivery_available ? "bg-primary" : "bg-secondary"
                    )}
                    onClick={() => setPharmacyData({ ...pharmacyData, delivery_available: !pharmacyData.delivery_available })}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform",
                        pharmacyData.delivery_available ? "translate-x-5" : "translate-x-0.5"
                      )}
                    />
                  </div>
                  <div>
                    <span className="text-sm font-medium">Entrega ao Domicílio</span>
                    <p className="text-xs text-muted-foreground">Activar serviço de entrega para pedidos online</p>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar Alterações
            </button>
          </form>
        )}

        {/* Suppliers management */}
        {tab === "suppliers" && (
          <div className="max-w-3xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Fornecedores</h2>
                <p className="text-sm text-muted-foreground">Gerir fornecedores de medicamentos</p>
              </div>
              <button
                onClick={() => openSupplierForm()}
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>

            {/* Supplier form modal */}
            {showSupplierForm && (
              <div className="mb-6 bg-card rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">
                    {editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
                  </h3>
                  <button
                    onClick={() => setShowSupplierForm(false)}
                    className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleSaveSupplier} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome *</label>
                      <input
                        required
                        type="text"
                        value={supplierForm.name}
                        onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Pessoa de Contacto</label>
                      <input
                        type="text"
                        value={supplierForm.contact_person}
                        onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Telefone</label>
                      <input
                        type="tel"
                        value={supplierForm.phone}
                        onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                      <input
                        type="email"
                        value={supplierForm.email}
                        onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Endereço</label>
                      <input
                        type="text"
                        value={supplierForm.address}
                        onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                        className="w-full h-9 px-3 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowSupplierForm(false)}
                      className="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingSupplier}
                      className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingSupplier && <Loader2 className="w-4 h-4 animate-spin" />}
                      {editingSupplier ? "Actualizar" : "Adicionar"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Suppliers list */}
            {suppliersList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Truck className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Nenhum fornecedor registado</p>
                <p className="text-xs mt-1">Adicione fornecedores para gerir o inventário</p>
              </div>
            ) : (
              <div className="space-y-2">
                {suppliersList.map((supplier) => (
                  <div key={supplier.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">{supplier.name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        {supplier.contact_person && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {supplier.contact_person}
                          </span>
                        )}
                        {supplier.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {supplier.phone}
                          </span>
                        )}
                        {supplier.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {supplier.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openSupplierForm(supplier)}
                        className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
