import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Shield, Users, Building2, Pill, Stethoscope, Package, Tag,
  Plus, Save, X, Edit, Trash2, CheckCircle2, Eye,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";
import {
  adminApi, pharmaciesApi, medicinesApi, categoriesApi, ordersApi, appointmentsApi,
  type User, type Pharmacy, type Medicine, type Category, type Order, type Doctor,
} from "../services/api";
import { formatMZN } from "../data/mock-data";
import { toast } from "sonner";
import { useAuth } from "../context/use-auth";

export function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/entrar", { replace: true });
    } else if (user?.role !== "admin") {
      toast.error("Acesso restrito a administradores.");
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, user]);

  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  // Loading
  const [loading, setLoading] = useState(true);

  // Forms
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userRoleForm, setUserRoleForm] = useState({ role: "", pharmacy_id: "" });

  const [showAddPharmacy, setShowAddPharmacy] = useState(false);
  const [newPharmacy, setNewPharmacy] = useState({ name: "", address: "", district: "", phone: "", open_hours: "08:00 - 20:00" });

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", icon: "" });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editCatForm, setEditCatForm] = useState({ name: "", icon: "" });

  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: "", generic_name: "", category: "", description: "", requires_prescription: false,
  });

  // Fetch all data
  useEffect(() => {
    if (user?.role !== "admin") return;

    Promise.allSettled([
      adminApi.listUsers().then(setUsers),
      pharmaciesApi.list().then(setPharmacies),
      medicinesApi.list().then(setMedicines),
      categoriesApi.list().then(setCategories),
      ordersApi.list().then(setOrders),
      appointmentsApi.doctors().then(setDoctors),
    ]).finally(() => setLoading(false));
  }, [user]);

  // ---------- Handlers ----------

  const handleUpdateUserRole = async (userId: string) => {
    try {
      const updated = await adminApi.updateUser(userId, {
        role: userRoleForm.role || undefined,
        pharmacy_id: userRoleForm.pharmacy_id || null,
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      setEditingUserId(null);
      toast.success("Utilizador actualizado.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao actualizar utilizador.");
    }
  };

  const handleAddPharmacy = async () => {
    if (!newPharmacy.name || !newPharmacy.address || !newPharmacy.district) {
      toast.error("Nome, endereço e distrito são obrigatórios.");
      return;
    }
    try {
      const created = await pharmaciesApi.create({
        ...newPharmacy,
        rating: 0, review_count: 0, image: null, is_open: true,
        delivery_fee: 150, delivery_time: "30-45 min", distance: null,
      } as any);
      setPharmacies((prev) => [...prev, created]);
      setNewPharmacy({ name: "", address: "", district: "", phone: "", open_hours: "08:00 - 20:00" });
      setShowAddPharmacy(false);
      toast.success("Farmácia criada com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar farmácia.");
    }
  };

  const handleDeletePharmacy = async (id: string) => {
    if (!window.confirm("Tem a certeza que deseja remover esta farmácia?")) return;
    try {
      await pharmaciesApi.delete(id);
      setPharmacies((prev) => prev.filter((p) => p.id !== id));
      toast.success("Farmácia removida.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover farmácia.");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name) { toast.error("Nome é obrigatório."); return; }
    try {
      const created = await categoriesApi.create({ name: newCategory.name, icon: newCategory.icon || undefined, count: 0 });
      setCategories((prev) => [...prev, created]);
      setNewCategory({ name: "", icon: "" });
      setShowAddCategory(false);
      toast.success("Categoria criada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar categoria.");
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory) return;
    try {
      const updated = await categoriesApi.update(editingCategory.id, { name: editCatForm.name, icon: editCatForm.icon || undefined });
      setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? { ...c, ...updated } : c)));
      setEditingCategory(null);
      toast.success("Categoria actualizada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao actualizar categoria.");
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Tem a certeza que deseja remover esta categoria?")) return;
    try {
      await categoriesApi.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Categoria removida.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover categoria.");
    }
  };

  const handleAddMedicine = async () => {
    if (!newMedicine.name) { toast.error("Nome é obrigatório."); return; }
    try {
      const created = await medicinesApi.create({ ...newMedicine, image: null });
      setMedicines((prev) => [...prev, created]);
      setNewMedicine({ name: "", generic_name: "", category: "", description: "", requires_prescription: false });
      setShowAddMedicine(false);
      toast.success("Medicamento adicionado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar medicamento.");
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    if (!window.confirm("Tem a certeza que deseja remover este medicamento?")) return;
    try {
      await medicinesApi.delete(id);
      setMedicines((prev) => prev.filter((m) => m.id !== id));
      toast.success("Medicamento removido.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover medicamento.");
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!window.confirm("Tem a certeza que deseja remover este médico?")) return;
    try {
      await appointmentsApi.deleteDoctor(id);
      setDoctors((prev) => prev.filter((d) => d.id !== id));
      toast.success("Médico removido.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover médico.");
    }
  };

  const roleLabel = (role: string) => {
    const map: Record<string, string> = { customer: "Cliente", pharmacy_owner: "Farmácia", admin: "Admin" };
    return map[role] || role;
  };

  const roleBadgeColor = (role: string) => {
    if (role === "admin") return "bg-purple-100 text-purple-700";
    if (role === "pharmacy_owner") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-700";
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "Pendente", confirmed: "Aceite", preparing: "Em preparação",
      ready: "Pronto", delivered: "Entregue", cancelled: "Cancelado",
    };
    return map[status] || status;
  };

  if (!isAuthenticated || user?.role !== "admin") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Painel de Administração
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gestão global da plataforma FarmaMap</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: "Utilizadores", value: users.length, icon: Users },
          { label: "Farmácias", value: pharmacies.length, icon: Building2 },
          { label: "Categorias", value: categories.length, icon: Tag },
          { label: "Medicamentos", value: medicines.length, icon: Pill },
          { label: "Médicos", value: doctors.length, icon: Stethoscope },
          { label: "Pedidos", value: orders.length, icon: Package },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xl" style={{ fontWeight: 700 }}>{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {loading && <p className="text-sm text-muted-foreground mb-4">A carregar dados...</p>}

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-6 bg-card border border-border rounded-xl p-1 flex-wrap h-auto">
          <TabsTrigger value="users" className="rounded-lg"><Users className="w-4 h-4 mr-1.5" /> Utilizadores</TabsTrigger>
          <TabsTrigger value="pharmacies" className="rounded-lg"><Building2 className="w-4 h-4 mr-1.5" /> Farmácias</TabsTrigger>
          <TabsTrigger value="categories" className="rounded-lg"><Tag className="w-4 h-4 mr-1.5" /> Categorias</TabsTrigger>
          <TabsTrigger value="medicines" className="rounded-lg"><Pill className="w-4 h-4 mr-1.5" /> Medicamentos</TabsTrigger>
          <TabsTrigger value="doctors" className="rounded-lg"><Stethoscope className="w-4 h-4 mr-1.5" /> Médicos</TabsTrigger>
          <TabsTrigger value="orders" className="rounded-lg"><Package className="w-4 h-4 mr-1.5" /> Pedidos</TabsTrigger>
        </TabsList>

        {/* USERS TAB */}
        <TabsContent value="users">
          <h2 className="mb-4">Todos os Utilizadores ({users.length})</h2>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-accent/50">
                    <th className="text-left p-4">Nome</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Telefone</th>
                    <th className="text-left p-4">Papel</th>
                    <th className="text-left p-4">Farmácia</th>
                    <th className="text-left p-4">Desde</th>
                    <th className="text-left p-4">Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                      <td className="p-4 font-medium">{u.full_name || "—"}</td>
                      <td className="p-4 text-muted-foreground">{u.email}</td>
                      <td className="p-4 text-muted-foreground">{u.phone || "—"}</td>
                      <td className="p-4"><Badge variant="secondary" className={roleBadgeColor(u.role)}>{roleLabel(u.role)}</Badge></td>
                      <td className="p-4 text-muted-foreground">
                        {u.pharmacy_id ? pharmacies.find((p) => p.id === u.pharmacy_id)?.name || u.pharmacy_id : "—"}
                      </td>
                      <td className="p-4 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString("pt-MZ")}</td>
                      <td className="p-4">
                        {editingUserId === u.id ? (
                          <div className="space-y-2">
                            <select
                              value={userRoleForm.role}
                              onChange={(e) => setUserRoleForm((f) => ({ ...f, role: e.target.value }))}
                              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                            >
                              <option value="customer">Cliente</option>
                              <option value="pharmacy_owner">Farmácia</option>
                              <option value="admin">Admin</option>
                            </select>
                            {userRoleForm.role === "pharmacy_owner" && (
                              <select
                                value={userRoleForm.pharmacy_id}
                                onChange={(e) => setUserRoleForm((f) => ({ ...f, pharmacy_id: e.target.value }))}
                                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                              >
                                <option value="">Sem farmácia</option>
                                {pharmacies.map((p) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            )}
                            <div className="flex gap-1">
                              <Button size="sm" className="text-xs h-7 rounded-full" onClick={() => handleUpdateUserRole(u.id)}>
                                <Save className="w-3 h-3 mr-1" /> Guardar
                              </Button>
                              <Button size="sm" variant="outline" className="text-xs h-7 rounded-full" onClick={() => setEditingUserId(null)}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="ghost" size="sm" className="h-8 w-8 p-0"
                            onClick={() => {
                              setEditingUserId(u.id);
                              setUserRoleForm({ role: u.role, pharmacy_id: u.pharmacy_id || "" });
                            }}
                          ><Edit className="w-4 h-4" /></Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* PHARMACIES TAB */}
        <TabsContent value="pharmacies">
          <div className="flex items-center justify-between mb-4">
            <h2>Todas as Farmácias ({pharmacies.length})</h2>
            <Button size="sm" className="rounded-full" onClick={() => setShowAddPharmacy(true)}>
              <Plus className="w-4 h-4 mr-1" /> Nova Farmácia
            </Button>
          </div>

          {showAddPharmacy && (
            <Card className="p-5 mb-6 border-primary/30">
              <h3 className="mb-4">Nova Farmácia</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-xs">Nome *</Label><Input value={newPharmacy.name} onChange={(e) => setNewPharmacy((f) => ({ ...f, name: e.target.value }))} placeholder="Nome da farmácia" /></div>
                <div className="space-y-1"><Label className="text-xs">Endereço *</Label><Input value={newPharmacy.address} onChange={(e) => setNewPharmacy((f) => ({ ...f, address: e.target.value }))} placeholder="Endereço" /></div>
                <div className="space-y-1"><Label className="text-xs">Distrito *</Label><Input value={newPharmacy.district} onChange={(e) => setNewPharmacy((f) => ({ ...f, district: e.target.value }))} placeholder="Distrito" /></div>
                <div className="space-y-1"><Label className="text-xs">Telefone</Label><Input value={newPharmacy.phone} onChange={(e) => setNewPharmacy((f) => ({ ...f, phone: e.target.value }))} placeholder="+258..." /></div>
                <div className="space-y-1"><Label className="text-xs">Horário</Label><Input value={newPharmacy.open_hours} onChange={(e) => setNewPharmacy((f) => ({ ...f, open_hours: e.target.value }))} /></div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button className="rounded-full" onClick={handleAddPharmacy}><Save className="w-4 h-4 mr-1" /> Criar</Button>
                <Button variant="outline" className="rounded-full" onClick={() => setShowAddPharmacy(false)}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pharmacies.map((p) => (
              <Card key={p.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      {p.name}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">{p.address}</p>
                    <p className="text-xs text-muted-foreground">{p.district} · {p.phone || "Sem telefone"}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className={p.is_open ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                        {p.is_open ? "Aberta" : "Fechada"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">★ {p.rating} ({p.review_count})</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Entrega: {formatMZN(p.delivery_fee)} · {p.delivery_time || "N/A"}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Ver detalhes"
                      onClick={() => navigate(`/farmacia/${p.id}`)}
                    ><Eye className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeletePharmacy(p.id)}
                    ><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* CATEGORIES TAB */}
        <TabsContent value="categories">
          <div className="flex items-center justify-between mb-4">
            <h2>Categorias ({categories.length})</h2>
            <Button size="sm" className="rounded-full" onClick={() => setShowAddCategory(true)}>
              <Plus className="w-4 h-4 mr-1" /> Nova Categoria
            </Button>
          </div>

          {showAddCategory && (
            <Card className="p-5 mb-6 border-primary/30">
              <h3 className="mb-4">Nova Categoria</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-xs">Nome *</Label><Input value={newCategory.name} onChange={(e) => setNewCategory((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Vitaminas" /></div>
                <div className="space-y-1"><Label className="text-xs">Ícone (Lucide)</Label><Input value={newCategory.icon} onChange={(e) => setNewCategory((f) => ({ ...f, icon: e.target.value }))} placeholder="Ex: Sparkles" /></div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button className="rounded-full" onClick={handleAddCategory}><Save className="w-4 h-4 mr-1" /> Criar</Button>
                <Button variant="outline" className="rounded-full" onClick={() => setShowAddCategory(false)}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
              </div>
            </Card>
          )}

          {editingCategory && (
            <Card className="p-5 mb-6 border-amber-300">
              <h3 className="mb-4">Editar Categoria — {editingCategory.name}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-xs">Nome *</Label><Input value={editCatForm.name} onChange={(e) => setEditCatForm((f) => ({ ...f, name: e.target.value }))} /></div>
                <div className="space-y-1"><Label className="text-xs">Ícone</Label><Input value={editCatForm.icon} onChange={(e) => setEditCatForm((f) => ({ ...f, icon: e.target.value }))} /></div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button className="rounded-full" onClick={handleEditCategory}><Save className="w-4 h-4 mr-1" /> Guardar</Button>
                <Button variant="outline" className="rounded-full" onClick={() => setEditingCategory(null)}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Card key={cat.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium flex items-center gap-2"><Tag className="w-4 h-4 text-primary" /> {cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.count} medicamentos · Ícone: {cat.icon || "—"}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0"
                    onClick={() => { setEditingCategory(cat); setEditCatForm({ name: cat.name, icon: cat.icon || "" }); }}
                  ><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCategory(cat.id)}
                  ><Trash2 className="w-4 h-4" /></Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* MEDICINES TAB */}
        <TabsContent value="medicines">
          <div className="flex items-center justify-between mb-4">
            <h2>Todos os Medicamentos ({medicines.length})</h2>
            <Button size="sm" className="rounded-full" onClick={() => setShowAddMedicine(true)}>
              <Plus className="w-4 h-4 mr-1" /> Novo Medicamento
            </Button>
          </div>

          {showAddMedicine && (
            <Card className="p-5 mb-6 border-primary/30">
              <h3 className="mb-4">Novo Medicamento</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-xs">Nome *</Label><Input value={newMedicine.name} onChange={(e) => setNewMedicine((f) => ({ ...f, name: e.target.value }))} placeholder="Ex: Paracetamol 500mg" /></div>
                <div className="space-y-1"><Label className="text-xs">Nome Genérico</Label><Input value={newMedicine.generic_name} onChange={(e) => setNewMedicine((f) => ({ ...f, generic_name: e.target.value }))} placeholder="Ex: Paracetamol" /></div>
                <div className="space-y-1">
                  <Label className="text-xs">Categoria</Label>
                  <select
                    value={newMedicine.category}
                    onChange={(e) => setNewMedicine((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Selecionar categoria...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1"><Label className="text-xs">Descrição</Label><Input value={newMedicine.description} onChange={(e) => setNewMedicine((f) => ({ ...f, description: e.target.value }))} placeholder="Descrição" /></div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Switch checked={newMedicine.requires_prescription} onCheckedChange={(v) => setNewMedicine((f) => ({ ...f, requires_prescription: v }))} />
                  <span className="text-sm">Requer Receita Médica</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button className="rounded-full" onClick={handleAddMedicine}><Save className="w-4 h-4 mr-1" /> Guardar</Button>
                <Button variant="outline" className="rounded-full" onClick={() => setShowAddMedicine(false)}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
              </div>
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-accent/50">
                    <th className="text-left p-4">Nome</th>
                    <th className="text-left p-4">Genérico</th>
                    <th className="text-left p-4">Categoria</th>
                    <th className="text-left p-4">Receita</th>
                    <th className="text-left p-4">Farmácias</th>
                    <th className="text-left p-4">Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((med) => (
                    <tr key={med.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                      <td className="p-4 font-medium">{med.name}</td>
                      <td className="p-4 text-muted-foreground">{med.generic_name || "—"}</td>
                      <td className="p-4 text-muted-foreground">{med.category || "—"}</td>
                      <td className="p-4">
                        {med.requires_prescription
                          ? <Badge className="bg-amber-100 text-amber-700 text-xs">Sim</Badge>
                          : <Badge variant="secondary" className="text-xs">Não</Badge>}
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className="text-xs">{med.prices?.length || 0} farmácia(s)</Badge>
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteMedicine(med.id)}
                        ><Trash2 className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* DOCTORS TAB */}
        <TabsContent value="doctors">
          <h2 className="mb-4">Todos os Médicos ({doctors.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doc) => {
              let slots: string[] = [];
              if (typeof doc.available_slots === "string") {
                try { slots = JSON.parse(doc.available_slots); } catch { slots = []; }
              } else if (Array.isArray(doc.available_slots)) {
                slots = doc.available_slots;
              }
              return (
                <Card key={doc.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="flex items-center gap-2"><Stethoscope className="w-4 h-4 text-primary" /> {doc.name}</h4>
                      <p className="text-sm text-muted-foreground">{doc.specialty || "—"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{doc.clinic} · {doc.address}</p>
                      <p className="text-primary font-semibold mt-2">{(doc.consultation_fee || 0).toLocaleString()} MT</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {slots.map((s: string) => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteDoctor(doc.id)}
                    ><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </Card>
              );
            })}
            {doctors.length === 0 && (
              <Card className="p-8 text-center col-span-full">
                <Stethoscope className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum médico registado.</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ORDERS TAB */}
        <TabsContent value="orders">
          <h2 className="mb-4">Todos os Pedidos ({orders.length})</h2>
          {orders.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum pedido registado.</p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-accent/50">
                      <th className="text-left p-4">ID</th>
                      <th className="text-left p-4">Utilizador</th>
                      <th className="text-left p-4">Data</th>
                      <th className="text-left p-4">Itens</th>
                      <th className="text-left p-4">Total</th>
                      <th className="text-left p-4">Estado</th>
                      <th className="text-left p-4">Pagamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                        <td className="p-4 font-medium">{order.id.slice(0, 8).toUpperCase()}</td>
                        <td className="p-4 text-muted-foreground">
                          {users.find((u) => u.id === order.user_id)?.full_name || order.user_id || "Anónimo"}
                        </td>
                        <td className="p-4 text-muted-foreground text-xs">{new Date(order.created_at).toLocaleDateString("pt-MZ")}</td>
                        <td className="p-4">{order.items.length} item(s)</td>
                        <td className="p-4 font-semibold">{formatMZN(order.total_amount)}</td>
                        <td className="p-4">
                          <Badge variant="secondary" className={
                            order.status === "delivered" ? "bg-green-100 text-green-700"
                              : order.status === "cancelled" ? "bg-red-100 text-red-700"
                              : order.status === "preparing" ? "bg-amber-100 text-amber-700"
                              : ""
                          }>{statusLabel(order.status)}</Badge>
                        </td>
                        <td className="p-4 text-muted-foreground text-xs">{order.payment_method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
