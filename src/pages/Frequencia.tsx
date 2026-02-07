import { useState, useEffect } from "react";
import { Calendar, Users, Clock, CheckCircle2, Loader2, ChevronRight } from "lucide-react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Label } from "@/components/ui/label";
import { AppSidebar } from "@/components/AppSidebar";
import { AttendanceModal } from "@/components/horarios/AttendanceModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

interface City {
  id: string;
  nome: string;
}

interface AulaFixa {
  id: string;
  diaSemana: number;
  horarioInicio: string;
  duracao: number;
  tipoAula: string;
}

interface AulaFlexivel {
  id: string;
  data: string;
  horarioInicio: string;
  duracao: number;
  tipoAula: string;
}

interface AulaCancelada {
  id: string;
  data: string;
}

interface RegistroPresenca {
  id: string;
  data: string;
  horario: string;
  tipoAula: string;
  cidade: string;
  presentes: Record<string, boolean>;
  updatedAt: string;
}

const API_BASE = "https://us-central1-akad-fbe7e.cloudfunctions.net/app";
const diasSemanaLabels = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function Frequencia() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Aulas
  const [aulasFixas, setAulasFixas] = useState<AulaFixa[]>([]);
  const [aulasFlexiveis, setAulasFlexiveis] = useState<AulaFlexivel[]>([]);
  const [aulasCanceladas, setAulasCanceladas] = useState<AulaCancelada[]>([]);
  
  // Registros de presença
  const [registrosPresenca, setRegistrosPresenca] = useState<RegistroPresenca[]>([]);
  
  // Modal de presença
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState<{
    data: string;
    horario: string;
    tipoAula: string;
  } | null>(null);

  // Fetch cities from API
  useEffect(() => {
    const fetchCities = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/cidades`);
        if (!response.ok) throw new Error("Erro ao carregar cidades");
        const data = await response.json();
        
        // Transforma os dados da API para o formato esperado
        const transformed: City[] = data.map((item: any) => ({
          id: item.id || item.nome,
          nome: item.nome,
        }));
        
        setCities(transformed);
        
        // Seleciona a primeira cidade automaticamente
        if (transformed.length > 0) {
          setSelectedCity(transformed[0].nome);
        }
      } catch (error) {
        console.error("Erro ao carregar cidades:", error);
        toast.error("Erro ao carregar cidades");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCities();
  }, []);

  // Fetch aulas e registros de presença quando cidade muda (usando Firebase)
  useEffect(() => {
    if (!selectedCity || !db) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Buscar aulas fixas do Firebase
        const aulasRef = collection(db, `horarios/${selectedCity}/aulas`);
        const aulasSnap = await getDocs(aulasRef);
        const aulasData: AulaFixa[] = [];
        aulasSnap.forEach((doc) => {
          aulasData.push({ id: doc.id, ...doc.data() } as AulaFixa);
        });
        setAulasFixas(aulasData);

        // Buscar aulas flexíveis do Firebase
        const flexiveisRef = collection(db, `horarios/${selectedCity}/aulasFlexiveis`);
        const flexiveisSnap = await getDocs(flexiveisRef);
        const flexiveisData: AulaFlexivel[] = [];
        flexiveisSnap.forEach((doc) => {
          flexiveisData.push({ id: doc.id, ...doc.data() } as AulaFlexivel);
        });
        setAulasFlexiveis(flexiveisData);

        // Buscar aulas canceladas do Firebase
        const canceladasRef = collection(db, `horarios/${selectedCity}/aulasCanceladas`);
        const canceladasSnap = await getDocs(canceladasRef);
        const canceladasData: AulaCancelada[] = [];
        canceladasSnap.forEach((doc) => {
          canceladasData.push({ id: doc.id, ...doc.data() } as AulaCancelada);
        });
        setAulasCanceladas(canceladasData);

        // Buscar registros de presença do Firebase
        const presencasRef = collection(db, `presencas/${selectedCity}/registros`);
        const presencasSnap = await getDocs(presencasRef);
        const presencasData: RegistroPresenca[] = [];
        presencasSnap.forEach((doc) => {
          presencasData.push({ id: doc.id, ...doc.data() } as RegistroPresenca);
        });
        // Ordenar por data (mais recente primeiro)
        presencasData.sort((a, b) => b.data.localeCompare(a.data));
        setRegistrosPresenca(presencasData);
      } catch (error) {
        console.error("Erro ao carregar dados do Firebase:", error);
        toast.error("Erro ao carregar dados da cidade");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedCity]);

  // Gerar lista de aulas disponíveis para chamada (APENAS HOJE)
  const getAulasDisponiveis = () => {
    const hoje = new Date();
    const dataISO = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
    const diaSemana = hoje.getDay();
    
    const aulasDisponiveis: Array<{
      data: string;
      horario: string;
      tipoAula: string;
      tipo: "fixa" | "flexivel";
      jaFeita: boolean;
    }> = [];

    // Verificar se há aula cancelada hoje
    const cancelada = aulasCanceladas.some((c) => c.data === dataISO);
    if (cancelada) {
      return aulasDisponiveis; // Retorna vazio se cancelada
    }

    // Verificar todas as aulas flexíveis hoje
    const aulasFlexiveisHoje = aulasFlexiveis.filter((a) => a.data === dataISO);
    aulasFlexiveisHoje.forEach((aulaFlexivel) => {
      const jaFeita = registrosPresenca.some(
        (r) => r.data === dataISO && r.horario === aulaFlexivel.horarioInicio
      );
      aulasDisponiveis.push({
        data: dataISO,
        horario: aulaFlexivel.horarioInicio,
        tipoAula: aulaFlexivel.tipoAula,
        tipo: "flexivel",
        jaFeita,
      });
    });

    // Verificar todas as aulas fixas hoje (somente se não há aula flexível no mesmo horário)
    const aulasFixasHoje = aulasFixas.filter((a) => a.diaSemana === diaSemana);
    aulasFixasHoje.forEach((aulaFixa) => {
      // Verificar se já existe uma aula flexível no mesmo horário
      const temFlexivelMesmoHorario = aulasFlexiveisHoje.some(
        (af) => af.horarioInicio === aulaFixa.horarioInicio
      );
      if (temFlexivelMesmoHorario) return;
      
      const jaFeita = registrosPresenca.some(
        (r) => r.data === dataISO && r.horario === aulaFixa.horarioInicio
      );
      aulasDisponiveis.push({
        data: dataISO,
        horario: aulaFixa.horarioInicio,
        tipoAula: aulaFixa.tipoAula,
        tipo: "fixa",
        jaFeita,
      });
    });

    return aulasDisponiveis;
  };

  const formatDataBR = (dataISO: string) => {
    const [ano, mes, dia] = dataISO.split("-");
    const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    if (data.toDateString() === hoje.toDateString()) {
      return "Hoje";
    }
    
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    if (data.toDateString() === ontem.toDateString()) {
      return "Ontem";
    }
    
    return `${dia}/${mes} (${diasSemanaLabels[data.getDay()]})`;
  };

  const contarPresentes = (presentes: Record<string, boolean>) => {
    return Object.values(presentes).filter(Boolean).length;
  };

  const aulasDisponiveis = getAulasDisponiveis();

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 h-screen overflow-y-auto">
        <AdminPageHeader
          title="Frequência"
          subtitle="Controle de presença"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="p-4 md:p-6 lg:p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* City Selector */}
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium text-muted-foreground">Cidade:</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-[200px] bg-muted/50 border-border/50 rounded-xl h-11">
                    <SelectValue placeholder="Selecione a cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.nome}>
                        {city.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Aulas Disponíveis para Chamada (APENAS HOJE) */}
              <Card className="card-elevated rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    Fazer Chamada (Hoje)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aulasDisponiveis.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-6">
                      Nenhuma aula disponível para chamada hoje
                    </p>
                  ) : (
                    aulasDisponiveis.map((aula, idx) => (
                      <div
                        key={`${aula.data}-${aula.horario}-${idx}`}
                        onClick={() => {
                          if (!aula.jaFeita) {
                            setSelectedClassForAttendance({
                              data: aula.data,
                              horario: aula.horario,
                              tipoAula: aula.tipoAula,
                            });
                            setAttendanceModalOpen(true);
                          }
                        }}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          aula.jaFeita
                            ? "bg-muted/30 border-border/30 cursor-default"
                            : "bg-card hover:bg-muted/50 border-border/50 cursor-pointer hover:border-primary/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              aula.jaFeita ? "bg-primary/20" : "bg-primary/10"
                            }`}
                          >
                            {aula.jaFeita ? (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            ) : (
                              <Clock className="h-5 w-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{formatDataBR(aula.data)}</p>
                            <p className="text-sm text-muted-foreground">
                              {aula.horario} • {aula.tipoAula}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {aula.jaFeita ? (
                            <Badge variant="secondary" className="bg-primary/20 text-primary">
                              Concluída
                            </Badge>
                          ) : (
                            <>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                Disponível
                              </Badge>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Histórico de Chamadas */}
              <Card className="card-elevated rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Histórico de Chamadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {registrosPresenca.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-6">
                      Nenhuma chamada registrada ainda
                    </p>
                  ) : (
                    registrosPresenca.slice(0, 10).map((registro) => (
                      <div
                        key={registro.id}
                        onClick={() => {
                          setSelectedClassForAttendance({
                            data: registro.data,
                            horario: registro.horario,
                            tipoAula: registro.tipoAula,
                          });
                          setAttendanceModalOpen(true);
                        }}
                        className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/50 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{formatDataBR(registro.data)}</p>
                            <p className="text-sm text-muted-foreground">
                              {registro.horario} • {registro.tipoAula}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-foreground">
                          {contarPresentes(registro.presentes)} presentes
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Presença */}
      {selectedClassForAttendance && (
        <AttendanceModal
          open={attendanceModalOpen}
          onOpenChange={setAttendanceModalOpen}
          cidade={selectedCity}
          data={selectedClassForAttendance.data}
          tipoAula={selectedClassForAttendance.tipoAula}
          horario={selectedClassForAttendance.horario}
        />
      )}
    </div>
  );
}