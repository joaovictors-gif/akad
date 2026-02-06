import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { differenceInYears } from "date-fns";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const API_BASE = "https://us-central1-akad-fbe7e.cloudfunctions.net/app";

interface StudentData {
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

interface EditStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentData | null;
  onStudentUpdated?: () => void;
}

const religioes = ["Católica", "Evangélica", "Espírita", "Budista", "Outra", "Sem religião"];

// Format phone: (XX) XXXXX-XXXX
const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

// Format CPF: XXX.XXX.XXX-XX
const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

// Remove formatting from phone
const unformatPhone = (value: string): string => value.replace(/\D/g, "");

export function EditStudentModal({ open, onOpenChange, student, onStudentUpdated }: EditStudentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    dataNascimento: "",
    religiao: "",
    email: "",
    telefone: "",
    observacoes: "",
    responsavel: "",
  });

  // Initialize form when student changes
  useEffect(() => {
    if (student && open) {
      setFormData({
        nome: student.nome || "",
        dataNascimento: student.dataNascimento || "",
        religiao: student.religiao || "",
        email: student.email || "",
        telefone: formatPhone(student.telefone || ""),
        observacoes: student.observacoes || "",
        responsavel: student.responsavel || "",
      });
    }
  }, [student, open]);


  const isMaiorIdade = useMemo(() => {
    if (!formData.dataNascimento) return null;
    const birthDate = new Date(formData.dataNascimento);
    const age = differenceInYears(new Date(), birthDate);
    return age >= 18;
  }, [formData.dataNascimento]);

  const handleSubmit = async () => {
    if (!student) return;
    
    // Validate phone (11 digits)
    const phoneDigits = unformatPhone(formData.telefone);
    
    if (phoneDigits.length !== 11) {
      toast.error("Telefone deve ter 11 dígitos");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const updateData = {
        obs: formData.observacoes,
        nome: formData.nome,
        dataNascimento: formData.dataNascimento,
        religiao: formData.religiao,
        email: formData.email,
        telefone: phoneDigits,
        responsavel: isMaiorIdade ? "Próprio" : formData.responsavel,
      };
      
      const response = await fetch(`${API_BASE}/alunos/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      
      if (!response.ok || data.success === false) {
        throw new Error(data.error || "Erro ao atualizar aluno");
      }

      toast.success("Dados do aluno atualizados com sucesso!");
      onOpenChange(false);
      onStudentUpdated?.();
    } catch (error: any) {
      console.error("Erro ao atualizar aluno:", error);
      toast.error(error.message || "Erro ao atualizar dados do aluno");
    } finally {
      setIsLoading(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto card-elevated border-border/30 rounded-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold">Editar Dados do Aluno</DialogTitle>
          <div className="divider-gradient mt-4" />
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="edit-nome" className="text-sm font-medium">Nome *</Label>
            <Input
              id="edit-nome"
              placeholder="Nome completo"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="bg-muted/50 border-border/50 rounded-xl h-11 focus:bg-muted transition-all duration-200"
            />
          </div>

          {/* Data de Nascimento */}
          <div className="space-y-2">
            <Label htmlFor="edit-dataNascimento" className="text-sm font-medium">Data de Nascimento *</Label>
            <Input
              id="edit-dataNascimento"
              type="date"
              value={formData.dataNascimento}
              onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
              className="bg-muted/50 border-border/50 rounded-xl h-11 focus:bg-muted transition-all duration-200"
            />
          </div>

          {/* Religião */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Religião</Label>
            <Select
              value={formData.religiao}
              onValueChange={(value) => setFormData({ ...formData, religiao: value })}
            >
              <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-11">
                <SelectValue placeholder="Selecione uma religião" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {religioes.map((religiao) => (
                  <SelectItem key={religiao} value={religiao} className="rounded-lg">
                    {religiao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="edit-email" className="text-sm font-medium">Email</Label>
            <Input
              id="edit-email"
              type="email"
              placeholder="exemplo@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-muted/50 border-border/50 rounded-xl h-11 focus:bg-muted transition-all duration-200"
            />
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="edit-telefone" className="text-sm font-medium">Telefone *</Label>
            <Input
              id="edit-telefone"
              placeholder="(89) 81234-5678"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
              className="bg-muted/50 border-border/50 rounded-xl h-11 focus:bg-muted transition-all duration-200"
              maxLength={16}
            />
          </div>

          {/* Maior de Idade - Calculado automaticamente */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Aluno é maior de idade?</Label>
            <div className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl ${
              isMaiorIdade === null 
                ? "bg-muted/30 text-muted-foreground" 
                : isMaiorIdade 
                  ? "bg-green-500/10 text-green-400" 
                  : "bg-yellow-500/10 text-yellow-400"
            }`}>
              {isMaiorIdade === null ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {isMaiorIdade === null 
                ? "Informe a data de nascimento" 
                : isMaiorIdade 
                  ? "Sim - Maior de 18 anos" 
                  : "Não - Menor de 18 anos"}
            </div>
          </div>

          {/* Responsável - Apenas para menores de idade */}
          {isMaiorIdade === false && (
            <div className="space-y-2">
              <Label htmlFor="edit-responsavel" className="text-sm font-medium">Nome do Responsável *</Label>
              <Input
                id="edit-responsavel"
                placeholder="Nome completo do responsável"
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                className="bg-muted/50 border-border/50 rounded-xl h-11 focus:bg-muted transition-all duration-200"
              />
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="edit-observacoes" className="text-sm font-medium">Observações</Label>
            <Textarea
              id="edit-observacoes"
              placeholder="Informações adicionais..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              className="bg-muted/50 border-border/50 rounded-xl resize-none focus:bg-muted transition-all duration-200"
              rows={3}
            />
          </div>
        </div>

        <div className="divider-gradient mb-4" />

        <div className="flex justify-end gap-3">
          <Button 
            variant="secondary" 
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-6 hover-lift"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 rounded-xl px-6 shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Alterações"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
