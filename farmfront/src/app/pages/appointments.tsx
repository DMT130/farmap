import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  CalendarCheck, Clock, MapPin, User, Star, ChevronRight, CheckCircle2,
  Stethoscope, Building2, X,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { appointmentsApi } from "../services/api";
import { useAuth } from "../context/use-auth";

const fallbackDoctors = [
  {
    id: "doc1",
    name: "Dr. Manuel Sitoe",
    specialty: "Clínica Geral",
    clinic: "Clínica Saúde Plus",
    address: "Av. Mao Tse Tung, 234, Sommerschield",
    rating: 4.9,
    reviewCount: 128,
    image: "https://images.unsplash.com/photo-1758691463198-dc663b8a64e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZG9jdG9yJTIwY29uc3VsdGF0aW9ufGVufDF8fHx8MTc3MjYwMzkwNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    availableSlots: ["09:00", "10:30", "14:00", "15:30", "17:00"],
    consultationFee: 1500,
    available_slots: ["09:00", "10:30", "14:00", "15:30", "17:00"],
    consultation_fee: 1500,
    review_count: 128,
  },
  {
    id: "doc2",
    name: "Dra. Ana Machel",
    specialty: "Cardiologia",
    clinic: "Hospital Central de Maputo",
    address: "Av. Eduardo Mondlane, 567, Baixa",
    rating: 4.8,
    reviewCount: 95,
    image: "https://images.unsplash.com/photo-1758691463198-dc663b8a64e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZG9jdG9yJTIwY29uc3VsdGF0aW9ufGVufDF8fHx8MTc3MjYwMzkwNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    availableSlots: ["08:00", "11:00", "14:30", "16:00"],
    consultationFee: 2500,
    available_slots: ["08:00", "11:00", "14:30", "16:00"],
    consultation_fee: 2500,
    review_count: 95,
  },
  {
    id: "doc3",
    name: "Dr. Carlos Nhaca",
    specialty: "Endocrinologia",
    clinic: "Clínica Médica da Polana",
    address: "Rua da Resistência, 123, Polana Cimento",
    rating: 4.7,
    reviewCount: 72,
    image: "https://images.unsplash.com/photo-1758691463198-dc663b8a64e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZG9jdG9yJTIwY29uc3VsdGF0aW9ufGVufDF8fHx8MTc3MjYwMzkwNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    availableSlots: ["09:30", "11:30", "15:00", "16:30"],
    consultationFee: 2000,
    available_slots: ["09:30", "11:30", "15:00", "16:30"],
    consultation_fee: 2000,
    review_count: 72,
  },
];

const fallbackAppointments = [
  {
    id: "apt1",
    doctor: "Dr. Manuel Sitoe",
    specialty: "Clínica Geral",
    clinic: "Clínica Saúde Plus",
    date: "10 Mar 2026",
    time: "14:00",
    status: "Confirmada",
    doctor_name: "Dr. Manuel Sitoe",
  },
  {
    id: "apt2",
    doctor: "Dra. Ana Machel",
    specialty: "Cardiologia",
    clinic: "Hospital Central de Maputo",
    date: "05 Mar 2026",
    time: "11:00",
    status: "Concluída",
    doctor_name: "Dra. Ana Machel",
  },
];

export function AppointmentsPage() {
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("2026-03-12");
  const [doctors, setDoctors] = useState<any[]>(fallbackDoctors);
  const [appointments, setAppointments] = useState<any[]>(fallbackAppointments);
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id || "user1";

  useEffect(() => {
    appointmentsApi.doctors()
      .then((data) => {
        if (data.length > 0) {
          // Normalize API response fields for template compatibility
          setDoctors(data.map((d: any) => {
            // available_slots may be a JSON string from the API — parse it
            let slots = d.available_slots || d.availableSlots || [];
            if (typeof slots === "string") {
              try { slots = JSON.parse(slots); } catch { slots = []; }
            }
            return {
              ...d,
              availableSlots: slots,
              available_slots: slots,
              consultationFee: d.consultation_fee || d.consultationFee || 0,
              reviewCount: d.review_count || d.reviewCount || 0,
            };
          }));
        }
      })
      .catch(() => {});
    appointmentsApi.userAppointments(userId)
      .then((data) => {
        if (data.length > 0) {
          setAppointments(data.map((a: any) => ({
            ...a,
            doctor: a.doctor_name || a.doctor || "",
          })));
        }
      })
      .catch(() => {});
  }, [userId]);

  const handleBook = async () => {
    if (!selectedDoctor || !selectedSlot) return;
    if (!isAuthenticated) {
      toast.error("Inicie sessão para agendar consultas.");
      return;
    }
    try {
      const newApt = await appointmentsApi.book({
        user_id: userId,
        doctor_id: selectedDoctor,
        date: selectedDate,
        time: selectedSlot,
      });
      // Add to local state
      const doc = doctors.find((d) => d.id === selectedDoctor);
      setAppointments((prev) => [
        {
          ...newApt,
          doctor: doc?.name || "",
          specialty: doc?.specialty || "",
          clinic: doc?.clinic || "",
        },
        ...prev,
      ]);
      toast.success("Consulta agendada com sucesso! Receberá confirmação por SMS.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao agendar consulta.");
    }
    setSelectedDoctor(null);
    setSelectedSlot(null);
  };

  const mockDoctors = doctors;
  const mockAppointments = appointments;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1>Consultas Médicas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Agende consultas em clínicas parceiras. Após a consulta, a receita será vinculada automaticamente ao seu perfil.
        </p>
      </div>

      {/* My appointments */}
      <div className="mb-10">
        <h2 className="mb-4">As Minhas Consultas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockAppointments.map((apt) => (
            <Card key={apt.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4>{apt.doctor}</h4>
                    <Badge
                      variant={apt.status === "Confirmada" || apt.status === "confirmed" ? "default" : "secondary"}
                    >
                      {apt.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{apt.specialty} &middot; {apt.clinic}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarCheck className="w-3.5 h-3.5" /> {apt.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {apt.time}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                {apt.status === "Concluída" && (
                  <Button variant="outline" size="sm" className="rounded-full text-xs">
                    Ver Receita <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
                {(apt.status === "Confirmada" || apt.status === "confirmed" || apt.status === "pending") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs text-destructive hover:text-destructive"
                    onClick={async () => {
                      try {
                        await appointmentsApi.cancel(apt.id);
                        setAppointments((prev) =>
                          prev.map((a) => a.id === apt.id ? { ...a, status: "cancelled" } : a)
                        );
                        toast.success("Consulta cancelada.");
                      } catch (err: any) {
                        toast.error(err.message || "Erro ao cancelar consulta.");
                      }
                    }}
                  >
                    <X className="w-3 h-3 mr-1" /> Cancelar
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Available doctors */}
      <h2 className="mb-4">Médicos Disponíveis</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mockDoctors.map((doc) => (
          <Card
            key={doc.id}
            className={`overflow-hidden transition-all ${
              selectedDoctor === doc.id ? "ring-2 ring-primary border-primary" : "hover:shadow-md"
            }`}
          >
            <div className="flex">
              <div className="w-32 h-40 shrink-0">
                <ImageWithFallback src={doc.image} alt={doc.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4>{doc.name}</h4>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Stethoscope className="w-3.5 h-3.5" /> {doc.specialty}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Building2 className="w-3 h-3" /> {doc.clinic}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {doc.address}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="flex items-center gap-1 text-sm">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {doc.rating}
                    </span>
                    <p className="text-xs text-muted-foreground">({doc.reviewCount})</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-primary" style={{ fontWeight: 700 }}>{doc.consultationFee.toLocaleString()} MT</p>
                  <Button
                    size="sm"
                    variant={selectedDoctor === doc.id ? "default" : "outline"}
                    className="rounded-full text-xs"
                    onClick={() => {
                      setSelectedDoctor(selectedDoctor === doc.id ? null : doc.id);
                      setSelectedSlot(null);
                    }}
                  >
                    {selectedDoctor === doc.id ? "Selecionado" : "Agendar"}
                  </Button>
                </div>
              </div>
            </div>

            {selectedDoctor === doc.id && (
              <div className="p-4 border-t border-border bg-accent/30">
                <div className="mb-3">
                  <label className="text-sm text-muted-foreground block mb-1">Data</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min="2026-03-05"
                    className="px-3 py-2 rounded-lg border border-border bg-card text-sm w-full sm:w-auto"
                  />
                </div>
                <label className="text-sm text-muted-foreground block mb-2">Horários Disponíveis</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {doc.availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`px-4 py-2 rounded-lg text-sm border transition-colors ${
                        selectedSlot === slot
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary/50 bg-card"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                <Button
                  className="rounded-full"
                  disabled={!selectedSlot}
                  onClick={handleBook}
                >
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  Confirmar Agendamento
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
