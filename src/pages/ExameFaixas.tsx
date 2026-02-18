import { useState, useMemo } from "react";
import { Search, Loader2, Pencil, Users, AlertCircle, Award, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useStudentsRealtime, StudentData } from "@/hooks/useStudentsRealtime";
import { ChangeBeltModal } from "@/components/belt-exam/ChangeBeltModal";

// Belt images
import BeltBranca from "@/assets/belts/Branca.png";
import BeltAmarela from "@/assets/belts/Amarela.png";
import BeltLaranja from "@/assets/belts/Laranja.png";
import BeltVerde from "@/assets/belts/Verde.png";
import BeltAzul from "@/assets/belts/Azul.png";
import BeltRoxa from "@/assets/belts/Roxa.png";
import BeltMarrom from "@/assets/belts/Marrom.png";
import BeltPreta from "@/assets/belts/Preta.png";
import BeltVermelha from "@/assets/belts/Vermelha.png";

interface Student {
  id: string;
  infor: {
    nome: string;
    faixa?: string;
    [key: string]: any;
  };
}

const BELT_OPTIONS = [
  { value: "Branca", label: "Branca", image: BeltBranca, color: "#a3a3a3" },
  { value: "Amarela", label: "Amarela", image: BeltAmarela, color: "#facc15" },
  { value: "Vermelha", label: "Vermelha", image: BeltVermelha, color: "#ef4444" },
  { value: "Laranja", label: "Laranja", image: BeltLaranja, color: "#f97316" },
  { value: "Verde", label: "Verde", image: BeltVerde, color: "#22c55e" },
  { value: "Azul", label: "Azul", image: BeltAzul, color: "#3b82f6" },
  { value: "Roxa", label: "Roxa", image: BeltRoxa, color: "#a855f7" },
  { value: "Marrom", label: "Marrom", image: BeltMarrom, color: "#a16207" },
  { value: "Preta", label: "Preta", image: BeltPreta, color: "#171717" },
];

const getBeltImage = (faixa: string): string => {
  if (!faixa) return BeltBranca;
  const belt = BELT_OPTIONS.find((b) => b.value.toLowerCase() === faixa.toLowerCase());
  return belt?.image || BeltBranca;
};

const getBeltColor = (faixa: string): string => {
  if (!faixa) return "#a3a3a3";
  const belt = BELT_OPTIONS.find((b) => b.value.toLowerCase() === faixa.toLowerCase());
  return belt?.color || "#a3a3a3";
};

const ExameFaixas = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBeltFilter, setSelectedBeltFilter] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [changeBeltModalOpen, setChangeBeltModalOpen] = useState(false);
  const { toast } = useToast();

  const { students: rawStudents, loading, setStudents } = useStudentsRealtime();

  const students: Student[] = useMemo(() => {
    return rawStudents.map((item: StudentData) => ({
      id: item.id,
      infor: item.infor,
    }));
  }, [rawStudents]);

  // Belt counts for filter chips
  const beltCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    students.forEach((s) => {
      const belt = s.infor?.faixa || "Sem faixa";
      const normalizedBelt = BELT_OPTIONS.find(
        (b) => b.value.toLowerCase() === belt.toLowerCase()
      )?.value || "Sem faixa";
      counts[normalizedBelt] = (counts[normalizedBelt] || 0) + 1;
    });
    return counts;
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    return students.filter((student) => {
      const matchesSearch = student.infor?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!selectedBeltFilter) return matchesSearch;
      if (selectedBeltFilter === "Sem faixa") {
        return matchesSearch && (!student.infor?.faixa || !BELT_OPTIONS.some((b) => b.value.toLowerCase() === student.infor?.faixa?.toLowerCase()));
      }
      return matchesSearch && student.infor?.faixa?.toLowerCase() === selectedBeltFilter.toLowerCase();
    });
  }, [students, searchTerm, selectedBeltFilter]);

  // Grouped students
  const groupedStudents = useMemo(() => {
    return BELT_OPTIONS.reduce((acc, belt) => {
      const beltStudents = filteredStudents.filter(
        (s) => s.infor?.faixa?.toLowerCase() === belt.value.toLowerCase()
      );
      if (beltStudents.length > 0) acc[belt.value] = beltStudents;
      return acc;
    }, {} as Record<string, Student[]>);
  }, [filteredStudents]);

  const studentsWithoutBelt = useMemo(() => {
    return filteredStudents.filter(
      (s) => !s.infor?.faixa || !BELT_OPTIONS.some((b) => b.value.toLowerCase() === s.infor?.faixa?.toLowerCase())
    );
  }, [filteredStudents]);

  const handleOpenChangeBelt = (student: Student) => {
    setSelectedStudent(student);
    setChangeBeltModalOpen(true);
  };

  const handleBeltChange = async (studentId: string, newBelt: string) => {
    try {
      const response = await fetch(`https://us-central1-akad-fbe7e.cloudfunctions.net/app/alunos/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faixa: newBelt }),
      });

      if (!response.ok) throw new Error("Erro no servidor ao atualizar");

      setStudents((prev) =>
        prev.map((student) =>
          student.id === studentId ? { ...student, infor: { ...student.infor, faixa: newBelt } } : student
        )
      );

      toast({
        title: "Sucesso!",
        description: `Graduação para ${newBelt} confirmada.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "A alteração não pôde ser salva.",
      });
      throw error;
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <AdminPageHeader
          title="Exame de Faixas"
          subtitle="Gerencie as graduações"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="flex-1 flex flex-col min-h-0 p-4 lg:p-6 gap-4">
          {/* Stats Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{students.length}</span>
              <span className="text-xs text-muted-foreground">alunos</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {filteredStudents.length === students.length
                  ? "Mostrando todos"
                  : `${filteredStudents.length} resultado${filteredStudents.length !== 1 ? "s" : ""}`}
              </span>
            </div>
          </div>

          {/* Search + Belt Filters */}
          <div className="space-y-3">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Belt filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedBeltFilter(null)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                  selectedBeltFilter === null
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                Todas ({students.length})
              </button>
              {BELT_OPTIONS.map((belt) => {
                const count = beltCounts[belt.value] || 0;
                if (count === 0) return null;
                return (
                  <button
                    key={belt.value}
                    onClick={() => setSelectedBeltFilter(selectedBeltFilter === belt.value ? null : belt.value)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                      selectedBeltFilter === belt.value
                        ? "shadow-sm border-transparent"
                        : "bg-card border-border hover:border-primary/40"
                    }`}
                    style={
                      selectedBeltFilter === belt.value
                        ? { backgroundColor: `${belt.color}20`, color: belt.color, borderColor: `${belt.color}60` }
                        : {}
                    }
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: belt.color }}
                    />
                    {belt.label} ({count})
                  </button>
                );
              })}
              {(beltCounts["Sem faixa"] || 0) > 0 && (
                <button
                  onClick={() => setSelectedBeltFilter(selectedBeltFilter === "Sem faixa" ? null : "Sem faixa")}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                    selectedBeltFilter === "Sem faixa"
                      ? "bg-muted text-foreground border-border shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:border-primary/40"
                  }`}
                >
                  <AlertCircle className="h-3 w-3" />
                  Sem faixa ({beltCounts["Sem faixa"]})
                </button>
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pb-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Buscando alunos...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl border-border/50">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium">Nenhum aluno encontrado</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? `Não há resultados para "${searchTerm}"` : "A base de alunos está vazia."}
                </p>
                {(searchTerm || selectedBeltFilter) && (
                  <Button
                    variant="link"
                    onClick={() => { setSearchTerm(""); setSelectedBeltFilter(null); }}
                    className="mt-2 text-primary"
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedBeltFilter || "all"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {Object.entries(groupedStudents).map(([belt, beltStudents]) => (
                    <BeltGroup
                      key={belt}
                      belt={belt}
                      students={beltStudents}
                      onEdit={handleOpenChangeBelt}
                    />
                  ))}

                  {studentsWithoutBelt.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-muted rounded-lg flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold">Sem faixa definida</h2>
                          <p className="text-xs text-muted-foreground">{studentsWithoutBelt.length} aluno{studentsWithoutBelt.length !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {studentsWithoutBelt.map((student, i) => (
                          <StudentCard key={student.id} student={student} onEdit={handleOpenChangeBelt} index={i} />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>

      <ChangeBeltModal
        open={changeBeltModalOpen}
        onOpenChange={setChangeBeltModalOpen}
        student={selectedStudent}
        onConfirm={handleBeltChange}
      />
    </div>
  );
};

/** Belt Group Section */
const BeltGroup = ({
  belt,
  students,
  onEdit,
}: {
  belt: string;
  students: Student[];
  onEdit: (s: Student) => void;
}) => {
  const beltColor = getBeltColor(belt);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center p-1.5"
          style={{ backgroundColor: `${beltColor}15` }}
        >
          <img src={getBeltImage(belt)} alt={belt} className="h-full w-full object-contain" />
        </div>
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Faixa {belt}</h2>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {students.length}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {students.map((student, i) => (
          <StudentCard key={student.id} student={student} onEdit={onEdit} index={i} />
        ))}
      </div>
    </div>
  );
};

/** Student Card */
const StudentCard = ({
  student,
  onEdit,
  index,
}: {
  student: Student;
  onEdit: (s: Student) => void;
  index: number;
}) => {
  const beltColor = getBeltColor(student.infor?.faixa || "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
    >
      <Card className="group bg-card border-border/60 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={() => onEdit(student)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div
              className="relative h-10 w-10 rounded-lg flex items-center justify-center p-1.5 shrink-0"
              style={{ backgroundColor: `${beltColor}12` }}
            >
              <img
                src={getBeltImage(student.infor?.faixa)}
                alt="Faixa"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {student.infor?.nome || "Nome não informado"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {student.infor?.faixa || "Sem faixa"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onEdit(student); }}
              className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-primary/10 transition-all"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExameFaixas;
