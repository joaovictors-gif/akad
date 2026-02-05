import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, X, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query } from "firebase/firestore";

// Professor fixo
const PROFESSOR = "Adriano Santos";

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
  motivo?: string;
}

interface PresencaRegistro {
  data: string;
  horario: string;
  presentes: Record<string, boolean>;
}

interface AulaFormatada {
  id: string;
  horario: string;
  tipoAula: string;
  professor: string;
  isFlexivel?: boolean;
}

interface AulasPorDia {
  [key: number]: AulaFormatada[];
}

interface DiasCancelados {
  [key: string]: string | undefined; // data ISO -> motivo
}

interface PresencasPorDia {
  [key: string]: "presente" | "falta" | null; // data ISO -> status
}

const StudentAulas = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cidadeAluno, setCidadeAluno] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [aulasFixas, setAulasFixas] = useState<AulaFixa[]>([]);
  const [aulasFlexiveis, setAulasFlexiveis] = useState<AulaFlexivel[]>([]);
  const [aulasCanceladas, setAulasCanceladas] = useState<AulaCancelada[]>([]);
  const [aulasPorDia, setAulasPorDia] = useState<AulasPorDia>({});
  const [diasCancelados, setDiasCancelados] = useState<DiasCancelados>({});
  const [presencasPorDia, setPresencasPorDia] = useState<PresencasPorDia>({});

  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  // Buscar cidade do aluno
  useEffect(() => {
    const fetchStudentCity = async () => {
      if (!currentUser?.uid || !db) return;
      
      try {
        const alunosRef = collection(db, "alunos");
        const q = query(alunosRef);
        const alunosSnap = await getDocs(q);
        
        let foundStudentId: string | null = null;
        
        for (const alunoDoc of alunosSnap.docs) {
          const infoRef = doc(db, `alunos/${alunoDoc.id}/infor/infor`);
          const infoSnap = await getDoc(infoRef);
          if (infoSnap.exists()) {
            const data = infoSnap.data();
            if (data.email?.toLowerCase() === currentUser.email?.toLowerCase()) {
              foundStudentId = alunoDoc.id;
              setStudentId(alunoDoc.id);
              setCidadeAluno(data.cidade || "");
              break;
            }
          }
        }
        
        if (!foundStudentId) {
          const infoRef = doc(db, `alunos/${currentUser.uid}/infor/infor`);
          const infoSnap = await getDoc(infoRef);
          if (infoSnap.exists()) {
            setStudentId(currentUser.uid);
            setCidadeAluno(infoSnap.data().cidade || "");
          }
        }
      } catch (error) {
        console.error("Erro ao buscar cidade do aluno:", error);
      }
    };
    
    fetchStudentCity();
  }, [currentUser]);

  // Buscar aulas da cidade e presenças do aluno
  useEffect(() => {
    const fetchAulas = async () => {
      if (!cidadeAluno || !db || !studentId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Fetch aulas fixas
        const aulasFixasRef = collection(db, `horarios/${cidadeAluno}/aulas`);
        const aulasFixasSnap = await getDocs(aulasFixasRef);
        const aulasFixasData: AulaFixa[] = aulasFixasSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as AulaFixa));
        setAulasFixas(aulasFixasData);

        // Fetch aulas flexíveis
        const aulasFlexiveisRef = collection(db, `horarios/${cidadeAluno}/aulasFlexiveis`);
        const aulasFlexiveisSnap = await getDocs(aulasFlexiveisRef);
        const aulasFlexiveisData: AulaFlexivel[] = aulasFlexiveisSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as AulaFlexivel));
        setAulasFlexiveis(aulasFlexiveisData);

        // Fetch aulas canceladas
        const aulasCanceladasRef = collection(db, `horarios/${cidadeAluno}/aulasCanceladas`);
        const aulasCanceladasSnap = await getDocs(aulasCanceladasRef);
        const aulasCanceladasData: AulaCancelada[] = aulasCanceladasSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as AulaCancelada));
        setAulasCanceladas(aulasCanceladasData);

        // Criar mapa de dias cancelados
        const canceladosMap: DiasCancelados = {};
        aulasCanceladasData.forEach(c => {
          canceladosMap[c.data] = c.motivo;
        });
        setDiasCancelados(canceladosMap);

        // Fetch attendance records
        const presencasRef = collection(db, `presencas/${cidadeAluno}/registros`);
        const presencasSnap = await getDocs(presencasRef);
        const presencasMap: PresencasPorDia = {};
        
        presencasSnap.docs.forEach(doc => {
          const registro = doc.data() as PresencaRegistro;
          if (registro.presentes && registro.presentes[studentId] !== undefined) {
            presencasMap[registro.data] = registro.presentes[studentId] ? "presente" : "falta";
          }
        });
        
        setPresencasPorDia(presencasMap);

      } catch (error) {
        console.error("Erro ao carregar aulas:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAulas();
  }, [cidadeAluno, studentId]);

  // Calcular aulas por dia do mês
  useEffect(() => {
    const ultimoDia = new Date(anoAtual, mesAtual + 1, 0).getDate();
    const novasAulasPorDia: AulasPorDia = {};

    for (let dia = 1; dia <= ultimoDia; dia++) {
      const data = new Date(anoAtual, mesAtual, dia);
      const diaSemana = data.getDay();
      const dataISO = `${anoAtual}-${String(mesAtual + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
      
      // Verificar se o dia está cancelado
      if (diasCancelados[dataISO] !== undefined) {
        continue; // Pular dias cancelados
      }
      
      const aulasNoDia: AulaFormatada[] = [];
      
      // Adicionar aulas fixas
      aulasFixas
        .filter(aula => aula.diaSemana === diaSemana)
        .forEach(aula => {
          aulasNoDia.push({
            id: aula.id,
            horario: formatHorario(aula.horarioInicio, aula.duracao),
            tipoAula: aula.tipoAula,
            professor: PROFESSOR,
          });
        });
      
      // Adicionar aulas flexíveis
      aulasFlexiveis
        .filter(aula => aula.data === dataISO)
        .forEach(aula => {
          aulasNoDia.push({
            id: aula.id,
            horario: formatHorario(aula.horarioInicio, aula.duracao),
            tipoAula: aula.tipoAula,
            professor: PROFESSOR,
            isFlexivel: true,
          });
        });
      
      if (aulasNoDia.length > 0) {
        novasAulasPorDia[dia] = aulasNoDia;
      }
    }

    setAulasPorDia(novasAulasPorDia);
  }, [aulasFixas, aulasFlexiveis, diasCancelados, mesAtual, anoAtual]);

  const formatHorario = (inicio: string, duracao: number) => {
    const [h, m] = inicio.split(":").map(Number);
    const totalMinutos = h * 60 + m + duracao;
    const hFim = Math.floor(totalMinutos / 60) % 24;
    const mFim = totalMinutos % 60;
    return `${inicio} - ${String(hFim).padStart(2, "0")}:${String(mFim).padStart(2, "0")}`;
  };

  const getNomeMes = (mes: number) => {
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ];
    return meses[mes];
  };

  const getDiasDoMes = () => {
    const primeiroDia = new Date(anoAtual, mesAtual, 1);
    const ultimoDia = new Date(anoAtual, mesAtual + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay();

    const dias: { dia: number | null; dataISO: string }[] = [];

    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push({ dia: null, dataISO: "" });
    }

    for (let i = 1; i <= diasNoMes; i++) {
      const dataISO = `${anoAtual}-${String(mesAtual + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      dias.push({ dia: i, dataISO });
    }

    return dias;
  };

  const handleDayClick = (dia: number, dataISO: string) => {
    if (diasCancelados[dataISO] !== undefined) {
      return; // Não abrir modal para dias cancelados
    }
    if (aulasPorDia[dia]) {
      setSelectedDay(dia);
      setIsModalOpen(true);
    }
  };

  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const diasDoMes = getDiasDoMes();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/aluno")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-bold text-foreground">AKAD - Karatê</h1>
              <p className="text-xs text-muted-foreground">Minhas Aulas</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Calendário de Aulas</h2>
          <p className="text-muted-foreground">
            {cidadeAluno ? `Aulas em ${cidadeAluno} • Prof. ${PROFESSOR}` : "Visualize suas aulas do mês"}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !cidadeAluno ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Cidade não encontrada no seu cadastro. Entre em contato com a academia.
              </p>
            </CardContent>
          </Card>
        ) : aulasFixas.length === 0 && aulasFlexiveis.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Nenhuma aula cadastrada para {cidadeAluno}. Entre em contato com a academia.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-center">
                <CardTitle className="text-xl">
                  {getNomeMes(mesAtual)} {anoAtual}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {/* Days of week header */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {diasSemana.map((dia) => (
                  <div key={dia} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {dia}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {diasDoMes.map((item, index) => {
                  const temAula = item.dia && aulasPorDia[item.dia];
                  const ehHoje = item.dia === hoje.getDate();
                  const isCancelado = item.dataISO && diasCancelados[item.dataISO] !== undefined;
                  const temAulaFlexivel = item.dia && aulasPorDia[item.dia]?.some(a => a.isFlexivel);
                  const presencaStatus = item.dataISO ? presencasPorDia[item.dataISO] : null;
                  const isPassado = item.dia && new Date(anoAtual, mesAtual, item.dia) < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

                  return (
                    <div
                      key={index}
                      className={`
                        relative aspect-square flex flex-col items-center justify-center rounded-lg transition-colors
                        ${item.dia && !isCancelado ? "cursor-pointer hover:bg-accent/50" : ""}
                        ${ehHoje ? "ring-2 ring-primary" : ""}
                        ${isCancelado ? "bg-destructive/10" : ""}
                        ${presencaStatus === "presente" ? "bg-green-500/20" : ""}
                        ${presencaStatus === "falta" ? "bg-red-500/20" : ""}
                        ${temAulaFlexivel && !isCancelado && !presencaStatus ? "bg-accent/30" : ""}
                        ${temAula && !temAulaFlexivel && !isCancelado && !presencaStatus ? "bg-primary/10" : ""}
                      `}
                      onClick={() => item.dia && handleDayClick(item.dia, item.dataISO)}
                    >
                      {item.dia && (
                        <>
                          <span className={`text-sm ${ehHoje ? "font-bold text-primary" : isCancelado ? "text-destructive line-through" : "text-foreground"}`}>
                            {item.dia}
                          </span>
                          {isCancelado && (
                            <X className="absolute bottom-1 h-3 w-3 text-destructive" />
                          )}
                          {presencaStatus === "presente" && (
                            <CheckCircle2 className="absolute bottom-0.5 h-3 w-3 text-green-600" />
                          )}
                          {presencaStatus === "falta" && isPassado && temAula && (
                            <XCircle className="absolute bottom-0.5 h-3 w-3 text-red-500" />
                          )}
                          {temAula && !isCancelado && !presencaStatus && (
                            <div className={`absolute bottom-1 w-2 h-2 rounded-full ${temAulaFlexivel ? "bg-accent-foreground" : "bg-primary"}`} />
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm text-muted-foreground">Aula regular</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-accent-foreground" />
                  <span className="text-sm text-muted-foreground">Aula especial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  <span className="text-sm text-muted-foreground">Presente</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-3 h-3 text-red-500" />
                  <span className="text-sm text-muted-foreground">Falta</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="w-3 h-3 text-destructive" />
                  <span className="text-sm text-muted-foreground">Cancelada</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Classes Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Aulas do dia {selectedDay} de {getNomeMes(mesAtual)}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-4">
            {selectedDay &&
              aulasPorDia[selectedDay]?.map((aula) => (
                <Card key={aula.id} className={aula.isFlexivel ? "bg-accent/30" : "bg-primary/10"}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground">{aula.tipoAula}</h4>
                          {aula.isFlexivel && (
                            <span className="text-xs px-2 py-0.5 bg-accent rounded-full text-accent-foreground">
                              Especial
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{aula.professor}</p>
                      </div>
                      <span className="text-sm font-medium text-primary">{aula.horario}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentAulas;
