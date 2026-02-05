import { useState, useMemo, useCallback } from "react";
import { Menu, Search, Plus, Eye, Trash2, Loader2, Users } from "lucide-react";
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
  const [filteredByFilters, setFilteredByFilters] = useState<Student[]>([]);

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
    const baseList = filteredByFilters.length > 0 || students.length === 0 ? filteredByFilters : students;
    
    if (!searchTerm) return baseList;

    return baseList.filter(
      (s) =>
        s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.responsavel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cidade.toLowerCase().includes(searchTerm.toLowerCase()),
    );
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
        {/* HEADER MOBILE */}
        <header className="lg:hidden sticky top-0 z-30 border-b p-4 flex justify-between items-center">
          <button onClick={() => setSidebarOpen(true)} className="p-2.5 rounded-xl hover:bg-muted/80">
            <Menu className="h-5 w-5" />
          </button>

          <h1 className="font-bold">Alunos</h1>

          {/* botão removido */}
          <div className="w-6" />
        </header>

        <div className="p-6 space-y-6">
          {/* FILTROS */}
          <StudentFilters students={students} onFilterChange={handleFilterChange} />

          {/* BUSCA + BOTÃO */}
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno, responsável ou cidade"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muted/50 border-border/50 rounded-xl h-11"
              />
            </div>

            <Button onClick={() => setModalOpen(true)} className="rounded-xl h-11 px-6">
              <Plus className="mr-2 h-4 w-4" />
              Novo Aluno
            </Button>
          </div>

          {/* ================= TABELA ================= */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Responsável</TableHead>
                <TableHead className="hidden md:table-cell">Telefone</TableHead>
                <TableHead className="hidden md:table-cell">Cidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10">
                    <Loader2 className="animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-20">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl border-border/50 py-12">
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
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.nome}</TableCell>

                    <TableCell className="hidden md:table-cell">{student.responsavel}</TableCell>
                    <TableCell className="hidden md:table-cell">{student.telefone}</TableCell>
                    <TableCell className="hidden md:table-cell">{student.cidade}</TableCell>

                    {/* STATUS */}
                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium
                          ${
                            student.status?.toLowerCase() === "matriculado"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                      >
                        {student.status}
                      </span>
                    </TableCell>

                    {/* AÇÕES */}
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleViewStudent(student)}
                          className="p-2 hover:bg-blue-500/10 rounded-lg"
                        >
                          <Eye className="h-4 w-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => openDeleteDialog(student)}
                          className="p-2 hover:bg-red-500/10 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
