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

const API_BASE = "https://us-central1-akad-fbe7e.cloudfunctions.net/app";

interface CidadeData {
  id: string;
  nome: string;
  convenio: boolean;
  convenioInicio?: string;
  convenioFim?: string;
  valores?: {
    desconto: number;
    normal: number;
    atraso: number;
  };
}
interface AddStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddStudent: (student: StudentFormData) => void;
  isLoading?: boolean;
}

export interface StudentFormData {
  nome: string;
  dataNascimento: string;
  religiao: string;
  cidade: string;
  email: string;
  faixaInicial: string;
  telefone: string;
  maiorIdade: boolean;
  observacoes: string;
  senha: string;
  responsavel: string;
  convenioAtivo?: boolean;
  convenioFim?: string;
}

type StudentFormState = Omit<StudentFormData, 'senha' | 'responsavel'> & { responsavel: string; cpf?: string };

const religioes = ["Católica", "Evangélica", "Espírita", "Budista", "Outra", "Sem religião"];
const faixas = ["Branca", "Cinza", "Azul", "Amarela", "Laranja", "Verde", "Roxa", "Marrom", "Preta"];

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

export function AddStudentModal({ open, onOpenChange, onAddStudent, isLoading = false }: AddStudentModalProps) {
  const [formData, setFormData] = useState<StudentFormState>({
    nome: "",
    dataNascimento: "",
    religiao: "",
    cidade: "",
    email: "",
    faixaInicial: "",
    telefone: "",
    maiorIdade: true,
    observacoes: "",
    responsavel: "",
  });

  const [cidades, setCidades] = useState<CidadeData[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(false);

  // Fetch cities from API when modal opens
  useEffect(() => {
    if (open) {
      setLoadingCidades(true);
      fetch(`${API_BASE}/cidades`)
        .then((res) => res.json())
        .then((data: CidadeData[]) => {
          const sorted = data.sort((a, b) => a.nome.localeCompare(b.nome));
          setCidades(sorted);
        })
        .catch((err) => {
          console.error("Erro ao carregar cidades:", err);
          setCidades([]);
        })
        .finally(() => setLoadingCidades(false));
    }
  }, [open]);

  // Check if selected city has active convenio
  const selectedCidade = cidades.find(c => c.nome === formData.cidade);
  const hasActiveConvenio = selectedCidade?.convenio && 
    selectedCidade.convenioFim && 
    new Date(selectedCidade.convenioFim) >= new Date();

  const isMaiorIdade = useMemo(() => {
    if (!formData.dataNascimento) return null;
    const birthDate = new Date(formData.dataNascimento);
    const age = differenceInYears(new Date(), birthDate);
    return age >= 18;
  }, [formData.dataNascimento]);

  const handleSubmit = () => {
    // Validate phone (11 digits) and CPF (11 digits)
    const phoneDigits = unformatPhone(formData.telefone);
    
    if (phoneDigits.length !== 11) {
      return; // Phone must have exactly 11 digits
    }
    
    // Generate password from birth date (DDMMYYYY format)
    let senha = "";
    if (formData.dataNascimento) {
      const [year, month, day] = formData.dataNascimento.split("-");
      senha = `${day}${month}${year}`;
    }
    
    const studentData: StudentFormData = { 
      ...formData, 
      telefone: phoneDigits, // Send unformatted phone
      maiorIdade: isMaiorIdade ?? true, 
      responsavel: isMaiorIdade ? "Próprio" : formData.responsavel,
      senha,
      convenioAtivo: hasActiveConvenio,
      convenioFim: hasActiveConvenio ? selectedCidade?.convenioFim : undefined,
    };
    onAddStudent(studentData);
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      dataNascimento: "",
      religiao: "",
      cidade: "",
      email: "",
      faixaInicial: "",
      telefone: "",
      maiorIdade: true,
      observacoes: "",
      responsavel: "",
    });
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto card-elevated border-border/30 rounded-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold">Adicionar Novo Aluno</DialogTitle>
          <div className="divider-gradient mt-4" />
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-sm font-medium">Nome *</Label>
            <Input
              id="nome"
              placeholder="Nome completo"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="bg-muted/50 border-border/50 rounded-xl h-11 focus:bg-muted transition-all duration-200"
            />
          </div>

          {/* Data de Nascimento */}
          <div className="space-y-2">
            <Label htmlFor="dataNascimento" className="text-sm font-medium">Data de Nascimento *</Label>
            <Input
              id="dataNascimento"
              type="date"
              value={formData.dataNascimento}
              onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
              className="bg-muted/50 border-border/50 rounded-xl h-11 focus:bg-muted transition-all duration-200"
            />
          </div>

          {/* Religião */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Religião *</Label>
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

          {/* Cidade */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Cidade *</Label>
            <Select
              value={formData.cidade}
              onValueChange={(value) => setFormData({ ...formData, cidade: value })}
              disabled={loadingCidades}
            >
              <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-11">
                <SelectValue placeholder={loadingCidades ? "Carregando cidades..." : "Selecione uma cidade"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-60">
                {cidades.length === 0 && !loadingCidades ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Nenhuma cidade cadastrada
                  </div>
                ) : (
                  cidades.map((cidade) => (
                    <SelectItem key={cidade.nome} value={cidade.nome} className="rounded-lg">
                      <span className="flex items-center gap-2">
                        {cidade.nome}
                        {cidade.convenio && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500">
                            Convênio
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Aviso de Convênio Ativo */}
          {hasActiveConvenio && (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
              <div className="flex items-start gap-2 text-sm text-green-400">
                <svg className="h-5 w-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium">Cidade com Convênio Ativo</p>
                  <p className="text-xs mt-1 text-muted-foreground">
                    As mensalidades deste aluno serão automaticamente marcadas como pagas até o término do convênio
                    {selectedCidade?.convenioFim && (
                      <span className="font-medium text-green-400">
                        {" "}({new Date(selectedCidade.convenioFim).toLocaleDateString("pt-BR")})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemplo@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-muted/50 border-border/50 rounded-xl h-11 focus:bg-muted transition-all duration-200"
            />
          </div>

          {/* Faixa Inicial */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Faixa Inicial *</Label>
            <Select
              value={formData.faixaInicial}
              onValueChange={(value) => setFormData({ ...formData, faixaInicial: value })}
            >
              <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-11">
                <SelectValue placeholder="Selecione uma faixa" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {faixas.map((faixa) => (
                  <SelectItem key={faixa} value={faixa} className="rounded-lg">
                    {faixa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Telefone - Para maiores de idade */}
          {isMaiorIdade !== false && (
            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-sm font-medium">Telefone *</Label>
              <Input
                id="telefone"
                placeholder="(89) 81234-5678"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                className="bg-muted/50 border-border/50 rounded-xl h-11 focus:bg-muted transition-all duration-200"
                maxLength={16}
              />
            </div>
          )}

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

          {/* Responsável e Telefone do Responsável - Apenas para menores de idade */}
          {isMaiorIdade === false && (
            <>
              <div className="space-y-2">
                <Label htmlFor="responsavel" className="text-sm font-medium">Nome do Responsável *</Label>
                <Input
                  id="responsavel"
                  placeholder="Nome completo do responsável"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  className="bg-muted/50 border-border/50 rounded-xl h-11 focus:bg-muted transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone-responsavel" className="text-sm font-medium">Telefone do Responsável *</Label>
                <Input
                  id="telefone-responsavel"
                  placeholder="(89) 81234-5678"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                  className="bg-muted/50 border-border/50 rounded-xl h-11 focus:bg-muted transition-all duration-200"
                  maxLength={16}
                />
              </div>
            </>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-sm font-medium">Observações</Label>
            <Textarea
              id="observacoes"
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
            onClick={handleCancel}
            className="rounded-xl px-6 hover-lift"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className={`bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl px-6 shadow-lg shadow-green-500/20 transition-all duration-300 ease-in-out ${
              isLoading 
                ? "scale-95 opacity-90" 
                : "hover:scale-105 hover:shadow-xl hover:shadow-green-500/30"
            }`}
          >
            <span className={`flex items-center justify-center transition-all duration-300 ${isLoading ? "gap-2" : "gap-0"}`}>
              <Loader2 className={`h-4 w-4 transition-all duration-300 ${isLoading ? "opacity-100 animate-spin mr-0" : "opacity-0 w-0 -ml-2"}`} />
              <span className="transition-opacity duration-200">
                {isLoading ? "Cadastrando..." : "Adicionar Aluno"}
              </span>
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
