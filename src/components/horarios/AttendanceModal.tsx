import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Users, CheckCircle2, XCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, setDoc, getDoc, updateDoc, increment } from "firebase/firestore";
import { toast } from "sonner";

const API_BASE = "https://us-central1-akad-fbe7e.cloudfunctions.net/app";

// Conquistas baseadas em aulas assistidas
const ACHIEVEMENT_MILESTONES = [
  { id: "first-class", count: 1, name: "Primeira Aula", description: "Você participou da sua primeira aula! 🥋" },
  { id: "10-classes", count: 10, name: "Dedicação", description: "Você completou 10 aulas! Continue assim! 💪" },
  { id: "50-classes", count: 50, name: "Comprometido", description: "Incrível! Você completou 50 aulas! 🔥" },
  { id: "100-classes", count: 100, name: "Guerreiro", description: "Lendário! Você completou 100 aulas! 🏆" },
];

// Função para enviar notificação de conquista
const enviarNotificacaoConquista = async (uid: string, conquista: { id: string; name: string; description: string }) => {
  try {
    await fetch(`${API_BASE}/messaging/aviso`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid,
        mensagem: {
          title: `🏆 Nova Conquista: ${conquista.name}`,
          body: conquista.description,
          // Link que abre a celebração da conquista
          link: `https://akad1.lovable.app/aluno/perfil?conquista=${conquista.id}`,
        },
      }),
    });
    console.log(`Notificação de conquista enviada para ${uid}: ${conquista.name}`);
  } catch (error) {
    console.error("Erro ao enviar notificação de conquista:", error);
  }
};

interface Student {
  id: string;
  nome: string;
  faixa?: string;
  presente?: boolean;
}

interface AttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cidade: string;
  data: string; // YYYY-MM-DD
  tipoAula: string;
  horario: string;
}

export function AttendanceModal({
  open,
  onOpenChange,
  cidade,
  data,
  tipoAula,
  horario,
}: AttendanceModalProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingAttendance, setExistingAttendance] = useState<Record<string, boolean>>({});

  // Fetch students from the city
  useEffect(() => {
    if (!open || !cidade || !db) return;

    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const alunosRef = collection(db, "alunos");
        const alunosSnap = await getDocs(alunosRef);
        
        const studentsFromCity: Student[] = [];
        
        for (const alunoDoc of alunosSnap.docs) {
          const infoRef = doc(db, `alunos/${alunoDoc.id}/infor/infor`);
          const infoSnap = await getDoc(infoRef);
          
          if (infoSnap.exists()) {
            const studentData = infoSnap.data();
            if (studentData.cidade === cidade && studentData.status !== "Bloqueado") {
              studentsFromCity.push({
                id: alunoDoc.id,
                nome: studentData.nome || "Sem nome",
                faixa: studentData.faixa || "Branca",
              });
            }
          }
        }
        
        // Sort by name
        studentsFromCity.sort((a, b) => a.nome.localeCompare(b.nome));
        setStudents(studentsFromCity);
        
        // Check existing attendance for this date
        const attendanceId = `${data}-${horario.replace(":", "")}`;
        const attendanceRef = doc(db, `presencas/${cidade}/registros/${attendanceId}`);
        const attendanceSnap = await getDoc(attendanceRef);
        
        if (attendanceSnap.exists()) {
          const existingData = attendanceSnap.data().presentes || {};
          setExistingAttendance(existingData);
          setAttendance(existingData);
        } else {
          // Initialize all as absent
          const initialAttendance: Record<string, boolean> = {};
          studentsFromCity.forEach(s => {
            initialAttendance[s.id] = false;
          });
          setAttendance(initialAttendance);
          setExistingAttendance({});
        }
      } catch (error) {
        console.error("Erro ao buscar alunos:", error);
        toast.error("Erro ao carregar alunos");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [open, cidade, data, horario]);

  const handleToggleAttendance = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const handleSelectAll = () => {
    const allPresent: Record<string, boolean> = {};
    students.forEach(s => {
      allPresent[s.id] = true;
    });
    setAttendance(allPresent);
  };

  const handleDeselectAll = () => {
    const allAbsent: Record<string, boolean> = {};
    students.forEach(s => {
      allAbsent[s.id] = false;
    });
    setAttendance(allAbsent);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const attendanceId = `${data}-${horario.replace(":", "")}`;
      const attendanceRef = doc(db, `presencas/${cidade}/registros/${attendanceId}`);
      
      // Save attendance record
      await setDoc(attendanceRef, {
        data,
        horario,
        tipoAula,
        cidade,
        presentes: attendance,
        updatedAt: new Date().toISOString(),
      });

      // Update aulasAssistidas for each student and check for achievements
      for (const studentId of Object.keys(attendance)) {
        const wasPresent = existingAttendance[studentId] || false;
        const isNowPresent = attendance[studentId];
        
        if (isNowPresent && !wasPresent) {
          // Student newly marked as present - get current count first
          const studentInfoRef = doc(db, `alunos/${studentId}/infor/infor`);
          const studentSnap = await getDoc(studentInfoRef);
          const currentCount = studentSnap.exists() ? (studentSnap.data().aulasAssistidas || 0) : 0;
          const newCount = currentCount + 1;
          
          // Increment counter
          await updateDoc(studentInfoRef, {
            aulasAssistidas: increment(1),
          });
          
          // Check if new count unlocks an achievement
          const unlockedAchievement = ACHIEVEMENT_MILESTONES.find(m => m.count === newCount);
          if (unlockedAchievement) {
            // Send push notification for the achievement
            enviarNotificacaoConquista(studentId, unlockedAchievement);
          }
        } else if (!isNowPresent && wasPresent) {
          // Student was present but now marked as absent - decrement counter
          const studentInfoRef = doc(db, `alunos/${studentId}/infor/infor`);
          await updateDoc(studentInfoRef, {
            aulasAssistidas: increment(-1),
          });
        }
      }

      toast.success("Presença salva com sucesso!");
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar presença:", error);
      toast.error("Erro ao salvar presença");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDataBR = (dataISO: string) => {
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Marcar Presença
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{tipoAula}</span>
            {" • "}
            {formatDataBR(data)} às {horario}
            {" • "}
            {cidade}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum aluno encontrado em {cidade}
            </div>
          ) : (
            <>
              {/* Quick actions */}
              <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                <span className="text-sm text-muted-foreground">
                  {presentCount} de {students.length} presentes
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Nenhum
                  </Button>
                </div>
              </div>

              {/* Student list */}
              <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer ${
                      attendance[student.id]
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-muted/30 border border-border/50 hover:bg-muted/50"
                    }`}
                    onClick={() => handleToggleAttendance(student.id)}
                  >
                    <Checkbox
                      checked={attendance[student.id] || false}
                      onCheckedChange={() => handleToggleAttendance(student.id)}
                      className="pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{student.nome}</p>
                      <p className="text-xs text-muted-foreground">Faixa {student.faixa}</p>
                    </div>
                    {attendance[student.id] ? (
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Salvar Presença
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
