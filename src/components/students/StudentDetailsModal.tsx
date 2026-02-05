import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Mail, User, Phone, MapPin, Calendar, BookOpen, AlertTriangle, RefreshCw, Loader2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EditStudentModal } from "./EditStudentModal";

interface StudentDetails {
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

interface Mensalidade {
  id: string;
  valor: number;
  status: string;
  vencimento: string;
}

interface StudentDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentDetails | null;
  onStudentUpdated?: () => void;
}

export function StudentDetailsModal({ open, onOpenChange, student, onStudentUpdated }: StudentDetailsModalProps) {
  const { toast } = useToast();
  const [mensalidadesAtrasadas, setMensalidadesAtrasadas] = useState<Mensalidade[]>([]);
  const [totalAtrasado, setTotalAtrasado] = useState(0);
  const [isLoadingMensalidades, setIsLoadingMensalidades] = useState(false);
  const [isRematricula, setIsRematricula] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const isCancelado = student?.status?.toLowerCase() === "cancelado";

  // Buscar mensalidades atrasadas quando o aluno estiver cancelado
  useEffect(() => {
    const fetchMensalidadesAtrasadas = async () => {
      if (!student?.id || !isCancelado) {
        setMensalidadesAtrasadas([]);
        setTotalAtrasado(0);
        return;
      }

      setIsLoadingMensalidades(true);
      try {
        const response = await fetch(
          `https://us-central1-akad-fbe7e.cloudfunctions.net/app/alunos/${student.id}/mensalidades`
        );
        const result = await response.json();

        if (result.success && result.data) {
          const atrasadas = result.data.filter(
            (m: any) => m.status?.toLowerCase() === "atrasado" || m.status?.toLowerCase() === "pendente"
          );
          
          const total = atrasadas.reduce((acc: number, m: any) => acc + (parseFloat(m.valor) || 0), 0);
          
          setMensalidadesAtrasadas(atrasadas);
          setTotalAtrasado(total);
        }
      } catch (error) {
        console.error("Erro ao buscar mensalidades:", error);
      } finally {
        setIsLoadingMensalidades(false);
      }
    };

    if (open && student) {
      fetchMensalidadesAtrasadas();
    }
  }, [student?.id, isCancelado, open]);

  if (!student) return null;

  const handleWhatsApp = () => {
    const phone = student.telefone.replace(/\D/g, "");
    
    // Se o responsável for diferente de "Próprio", significa que é menor de idade
    const isMenor = student.responsavel && student.responsavel !== "Próprio";
    const nomeContato = isMenor ? student.responsavel : student.nome;
    
    const message = encodeURIComponent(`Olá ${nomeContato}, tudo bem?`);
    window.open(`https://wa.me/55${phone}?text=${message}`, "_blank");
  };

  const handleEmail = () => {
    if (student.email) {
      const subject = encodeURIComponent("Contato - AKAD");
      const body = encodeURIComponent(`Olá ${student.nome},\n\n`);
      window.open(`mailto:${student.email}?subject=${subject}&body=${body}`, "_blank");
    }
  };

  const handleRematricula = async () => {
    setIsRematricula(true);
    try {
      const response = await fetch(
        `https://us-central1-akad-fbe7e.cloudfunctions.net/app/alunos/${student.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Matriculado" }),
        }
      );

      const data = await response.json();
      if (!data.success) throw new Error();

      toast({ title: "Aluno rematriculado com sucesso!" });
      onOpenChange(false);
      onStudentUpdated?.();
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível rematricular o aluno",
        variant: "destructive",
      });
    } finally {
      setIsRematricula(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md card-elevated border-border/30 rounded-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Detalhes do Aluno
          </DialogTitle>
          <div className="divider-gradient mt-4" />
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nome e Status */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{student.nome}</h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                student.status?.toLowerCase() === "matriculado" || student.status?.toLowerCase() === "matrículado"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                  : student.status?.toLowerCase() === "cancelado"
                  ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {student.status}
            </span>
          </div>

          {/* Alerta de Mensalidades Atrasadas para alunos cancelados */}
          {isCancelado && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">Conta Cancelada</span>
              </div>
              
              {isLoadingMensalidades ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando mensalidades...
                </div>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground">
                    {mensalidadesAtrasadas.length > 0 ? (
                      <>
                        <span>Total de mensalidades pendentes: </span>
                        <span className="font-bold text-red-600 dark:text-red-400">
                          {mensalidadesAtrasadas.length}
                        </span>
                      </>
                    ) : (
                      "Nenhuma mensalidade pendente encontrada"
                    )}
                  </div>
                  
                  {totalAtrasado > 0 && (
                    <div className="flex items-center justify-between bg-red-500/10 rounded-lg p-3">
                      <span className="text-sm font-medium">Valor total em aberto:</span>
                      <span className="text-lg font-bold text-red-600 dark:text-red-400">
                        {totalAtrasado.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </span>
                    </div>
                  )}

                  <Button
                    onClick={handleRematricula}
                    disabled={isRematricula}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300"
                  >
                    {isRematricula ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Rematriculando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Re-matricular Aluno
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Informações */}
          <div className="space-y-3 bg-muted/30 rounded-xl p-4">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Responsável:</span>
              <span className="font-medium">{student.responsavel}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Telefone:</span>
              <span className="font-medium">{student.telefone}</span>
            </div>

            {student.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium truncate">{student.email}</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Cidade:</span>
              <span className="font-medium">{student.cidade || "-"}</span>
            </div>

            {student.faixa && (
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Faixa:</span>
                <span className="font-medium">{student.faixa}</span>
              </div>
            )}

            {student.dataNascimento && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Nascimento:</span>
                <span className="font-medium">
                  {new Date(student.dataNascimento + "T00:00:00").toLocaleDateString("pt-BR")}
                </span>
              </div>
            )}

            {student.observacoes && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-1">Observações:</p>
                <p className="text-sm">{student.observacoes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="divider-gradient mb-4" />

        {/* Botões de Ação */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={() => setEditModalOpen(true)}
            variant="outline"
            className="w-full rounded-xl hover:scale-[1.02] transition-all duration-300"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar Dados
          </Button>
          
          <div className="flex gap-3">
            <Button
              onClick={handleWhatsApp}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300 hover:scale-105"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
            
            <Button
              onClick={handleEmail}
              disabled={!student.email}
              variant="secondary"
              className="flex-1 rounded-xl hover:scale-105 transition-all duration-300"
            >
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Edit Student Modal */}
      <EditStudentModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        student={student}
        onStudentUpdated={onStudentUpdated}
      />
    </Dialog>
  );
}
