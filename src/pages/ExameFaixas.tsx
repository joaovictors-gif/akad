import { useState, useMemo } from "react";
import { Search, Loader2, Pencil, Users, AlertCircle } from "lucide-react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  { value: "Branca", label: "Branca", image: BeltBranca },
  { value: "Amarela", label: "Amarela", image: BeltAmarela },
  { value: "Laranja", label: "Laranja", image: BeltLaranja },
  { value: "Verde", label: "Verde", image: BeltVerde },
  { value: "Azul", label: "Azul", image: BeltAzul },
  { value: "Roxa", label: "Roxa", image: BeltRoxa },
  { value: "Marrom", label: "Marrom", image: BeltMarrom },
  { value: "Preta", label: "Preta", image: BeltPreta },
  { value: "Vermelha", label: "Vermelha", image: BeltVermelha },
];

const getBeltImage = (faixa: string): string => {
  if (!faixa) return BeltBranca;
  const belt = BELT_OPTIONS.find((b) => b.value.toLowerCase() === faixa.toLowerCase());
  return belt?.image || BeltBranca;
};

const ExameFaixas = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [changeBeltModalOpen, setChangeBeltModalOpen] = useState(false);
  const { toast } = useToast();
  
  const { students: rawStudents, loading, setStudents } = useStudentsRealtime();

  // Convert to the expected format
  const students: Student[] = useMemo(() => {
    return rawStudents.map((item: StudentData) => ({
      id: item.id,
      infor: item.infor,
    }));
  }, [rawStudents]);

  // Filtro de alunos (memoizado para performance)
  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    return students.filter((student) => student.infor?.nome?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [students, searchTerm]);

  // Agrupamento por faixa
  const groupedStudents = useMemo(() => {
    return BELT_OPTIONS.reduce(
      (acc, belt) => {
        const studentsWithBelt = filteredStudents.filter(
          (s) => s.infor?.faixa?.toLowerCase() === belt.value.toLowerCase(),
        );
        if (studentsWithBelt.length > 0) {
          acc[belt.value] = studentsWithBelt;
        }
        return acc;
      },
      {} as Record<string, Student[]>,
    );
  }, [filteredStudents]);

  // Alunos sem faixa ou com faixa inválida
  const studentsWithoutBelt = useMemo(() => {
    return filteredStudents.filter(
      (s) => !s.infor?.faixa || !BELT_OPTIONS.some((b) => b.value.toLowerCase() === s.infor?.faixa?.toLowerCase()),
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

      // Atualização otimista no estado local
      setStudents((prev) =>
        prev.map((student) =>
          student.id === studentId ? { ...student, infor: { ...student.infor, faixa: newBelt } } : student,
        ),
      );



      toast({
        title: "Sucesso!",
        description: `Graduação para ${newBelt} confirmada.`,
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

      <main className="flex-1 overflow-auto">
        <AdminPageHeader
          title="Exame de Faixas"
          subtitle="Gerencie as graduações"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="p-4 lg:p-6 space-y-6">
          {/* Busca */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Estado de Carregamento */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">Buscando alunos...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Caso não existam alunos ou a busca não retorne nada */}
              {filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl border-border/50">
                  <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-medium">Nenhum aluno encontrado</h3>
                  <p className="text-muted-foreground">
                    {searchTerm ? `Não há resultados para "${searchTerm}"` : "A base de alunos está vazia."}
                  </p>
                  {searchTerm && (
                    <Button variant="link" onClick={() => setSearchTerm("")} className="mt-2 text-primary">
                      Limpar filtros
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Listagem por Grupos de Faixa */}
                  {Object.entries(groupedStudents).map(([belt, beltStudents]) => (
                    <div key={belt} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <img src={getBeltImage(belt)} alt={belt} className="h-10 w-10 object-contain" />
                        <h2 className="text-lg font-semibold">Faixa {belt}</h2>
                        <span className="text-xs bg-secondary px-2 py-1 rounded-full text-secondary-foreground">
                          {beltStudents.length} {beltStudents.length === 1 ? "aluno" : "alunos"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {beltStudents.map((student) => (
                          <StudentCard key={student.id} student={student} onEdit={handleOpenChangeBelt} />
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Alunos sem Faixa Definida */}
                  {studentsWithoutBelt.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h2 className="text-lg font-semibold">Sem faixa definida</h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {studentsWithoutBelt.map((student) => (
                          <StudentCard key={student.id} student={student} onEdit={handleOpenChangeBelt} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
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

/**
 * Sub-componente Card para renderizar cada aluno
 */
const StudentCard = ({ student, onEdit }: { student: Student; onEdit: (s: Student) => void }) => (
  <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-200 group">
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img src={getBeltImage(student.infor?.faixa)} alt="Faixa" className="h-12 w-12 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {student.infor?.nome || "Nome não informado"}
          </h3>
          <p className="text-xs text-muted-foreground italic">{student.infor?.faixa || "Faixa não definida"}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(student)}
          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default ExameFaixas;
