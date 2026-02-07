import { useState, useMemo, useCallback } from "react";
import { Search, Plus, Eye, Trash2, Loader2, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { useToast } from "@/hooks/use-toast";
import { useStudentsRealtime, StudentData } from "@/hooks/useStudentsRealtime";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddStudentModal, StudentFormData } from "@/components/students/AddStudentModal";
import { StudentDetailsModal } from "@/components/students/StudentDetailsModal";
import { StudentFilters } from "@/components/students/StudentFilters";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Student {
  id: string;
  nome: string;
  responsavel: string;
  telefone: string;
  cidade: string;
  status: string;
  email?: string;
  dataNascimento?: string;
  faixa?: string;
  cpf?: string;
  religiao?: string;
  observacoes?: string;
}

export default function Students() {
  const { toast } = useToast();
  const { students: rawStudents, loading: isLoading, setStudents: setRawStudents } = useStudentsRealtime();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filteredByFilters, setFilteredByFilters] = useState<Student[] | null>(null);

  // Format raw students data
  const students: Student[] = useMemo(() => {
    return rawStudents.map((item: StudentData) => ({
      id: item.id,
      nome: item.infor.nome || "",
      responsavel: item.infor.responsavel || "Próprio",
      telefone: item.infor.telefone || "",
      cidade: item.infor.cidade || "-",
      status: item.infor.status || "",
      email: item.infor.email,
      dataNascimento: item.infor.data_nascimento,
      faixa: item.infor.faixa,
      cpf: item.infor.cpf,
      religiao: item.infor.religiao,
      observacoes: item.infor.obs,
    }));
  }, [rawStudents]);

  // Handle filter changes from StudentFilters component
  const handleFilterChange = useCallback((filtered: Student[]) => {
    setFilteredByFilters(filtered);
  }, []);

  // =====================
  // FILTRO DE BUSCA (applies on top of filters)
  // =====================
  const filteredStudents = useMemo(() => {
    const baseList = filteredByFilters ?? students;
    const term = searchTerm.toLowerCase().trim();
    
    if (!term) return baseList.sort((a, b) => a.nome.localeCompare(b.nome));

    return baseList
      .filter(
        (s) =>
          s.nome.toLowerCase().includes(term) ||
          s.responsavel.toLowerCase().includes(term) ||
          s.cidade.toLowerCase().includes(term),
      )
      .sort((a, b) => {
        // Prioritize name matches
        const aStartsWithTerm = a.nome.toLowerCase().startsWith(term);
        const bStartsWithTerm = b.nome.toLowerCase().startsWith(term);
        if (aStartsWithTerm && !bStartsWithTerm) return -1;
        if (!aStartsWithTerm && bStartsWithTerm) return 1;
        return a.nome.localeCompare(b.nome);
      });
  }, [filteredByFilters, students, searchTerm]);

  // =====================
  // POST - ADICIONAR
  // =====================
  const handleAddStudent = async (formData: StudentFormData) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        nome: formData.nome,
        religiao: formData.religiao,
        responsavel: formData.responsavel,
        telefone: formData.telefone,
        cidade: formData.cidade,
        faixa: formData.faixaInicial,
        email: formData.email,
        data_nascimento: formData.dataNascimento,
        obs: formData.observacoes || "",
      };

      // Se a cidade tem convênio ativo, incluir informação para a API
      if (formData.convenioAtivo && formData.convenioFim) {
        payload.convenioAtivo = true;
        payload.convenioFim = formData.convenioFim;
      }

      const response = await fetch("https://us-central1-akad-fbe7e.cloudfunctions.net/app/alunos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!data.success) throw new Error();

      toast({ 
        title: "Aluno cadastrado com sucesso!",
        description: formData.convenioAtivo 
          ? "As mensalidades do período do convênio foram marcadas como pagas." 
          : undefined
      });
      setModalOpen(false);
      // Real-time listener will update automatically
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o aluno",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setDetailsModalOpen(true);
  };

  const openDeleteDialog = (student: Student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `https://us-central1-akad-fbe7e.cloudfunctions.net/app/alunos/${studentToDelete.id}`,
        { method: "DELETE" },
      );

      const data = await response.json();
      if (!data.success) throw new Error();

      toast({ title: "Aluno excluído com sucesso!" });
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
      // Real-time listener will update automatically
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o aluno",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 h-screen overflow-y-auto">
        <AdminPageHeader
          title="Alunos"
          subtitle="Gerencie seus alunos"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* FILTROS */}
          <StudentFilters students={students} onFilterChange={handleFilterChange} />

          {/* BUSCA + BOTÃO */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, responsável ou cidade"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muted/50 border-border/50 rounded-xl h-11"
              />
            </div>

            <Button onClick={() => setModalOpen(true)} className="rounded-xl h-11 px-6 w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Aluno
            </Button>
          </div>

          {/* ================= MOBILE: CARDS / DESKTOP: TABELA ================= */}
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl border-border/50 py-12">
              <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">Nenhum aluno encontrado</h3>
              <p className="text-muted-foreground text-sm text-center px-4">
                {searchTerm ? `Não há resultados para "${searchTerm}"` : "A base de alunos está vazia."}
              </p>
              {searchTerm && (
                <Button variant="link" onClick={() => setSearchTerm("")} className="mt-2 text-primary">
                  Limpar busca
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="card-elevated rounded-xl p-4 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{student.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{student.cidade}</p>
                    </div>

                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                        student.status?.toLowerCase() === "matriculado"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {student.status}
                    </span>

                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => handleViewStudent(student)}
                        className="p-2 hover:bg-accent rounded-lg"
                      >
                        <Eye className="h-4 w-4 text-primary" />
                      </button>
                      <button
                        onClick={() => openDeleteDialog(student)}
                        className="p-2 hover:bg-destructive/10 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.nome}</TableCell>
                        <TableCell>{student.responsavel}</TableCell>
                        <TableCell>{student.telefone}</TableCell>
                        <TableCell>{student.cidade}</TableCell>
                        <TableCell>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              student.status?.toLowerCase() === "matriculado"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {student.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleViewStudent(student)}
                              className="p-2 hover:bg-accent rounded-lg"
                            >
                              <Eye className="h-4 w-4 text-primary" />
                            </button>
                            <button
                              onClick={() => openDeleteDialog(student)}
                              className="p-2 hover:bg-destructive/10 rounded-lg"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </div>

      <AddStudentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onAddStudent={handleAddStudent}
        isLoading={isSubmitting}
      />

      <StudentDetailsModal 
        open={detailsModalOpen} 
        onOpenChange={setDetailsModalOpen} 
        student={selectedStudent}
        onStudentUpdated={() => {}} // Real-time listener handles updates
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o aluno{" "}
              <span className="font-semibold text-foreground">{studentToDelete?.nome}</span>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStudent}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Excluindo...
                </span>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
