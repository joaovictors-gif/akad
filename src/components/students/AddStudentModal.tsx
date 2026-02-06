import { useState, useMemo, useEffect, useCallback } from "react";
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
import { Progress } from "@/components/ui/progress";
import { differenceInYears } from "date-fns";
import { Check, AlertCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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
const faixas = ["Branca", "Amarela", "Laranja", "Verde", "Azul", "Roxa", "Marrom", "Preta", "Vermelha"];

const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const unformatPhone = (value: string): string => value.replace(/\D/g, "");

const INITIAL_FORM: StudentFormState = {
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
};

type StepId = "nome" | "nascimento" | "religiao" | "cidade" | "email" | "faixa" | "responsavel" | "telefone" | "observacoes";

interface StepDef {
  id: StepId;
  label: string;
}

export function AddStudentModal({ open, onOpenChange, onAddStudent, isLoading = false }: AddStudentModalProps) {
  const [formData, setFormData] = useState<StudentFormState>({ ...INITIAL_FORM });
  const [currentStep, setCurrentStep] = useState(0);
  const [cidades, setCidades] = useState<CidadeData[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(false);

  useEffect(() => {
    if (open) {
      setLoadingCidades(true);
      fetch(`${API_BASE}/cidades`)
        .then((res) => res.json())
        .then((data: CidadeData[]) => setCidades(data.sort((a, b) => a.nome.localeCompare(b.nome))))
        .catch(() => setCidades([]))
        .finally(() => setLoadingCidades(false));
    }
  }, [open]);

  const selectedCidade = cidades.find(c => c.nome === formData.cidade);
  const hasActiveConvenio = selectedCidade?.convenio &&
    selectedCidade.convenioFim &&
    new Date(selectedCidade.convenioFim) >= new Date();

  const isMaiorIdade = useMemo(() => {
    if (!formData.dataNascimento) return null;
    return differenceInYears(new Date(), new Date(formData.dataNascimento)) >= 18;
  }, [formData.dataNascimento]);

  // Dynamic steps based on minor status
  const steps: StepDef[] = useMemo(() => {
    const base: StepDef[] = [
      { id: "nome", label: "Nome" },
      { id: "nascimento", label: "Data de Nascimento" },
      { id: "religiao", label: "Religião" },
      { id: "cidade", label: "Cidade" },
      { id: "email", label: "Email" },
      { id: "faixa", label: "Faixa Inicial" },
    ];

    if (isMaiorIdade === false) {
      base.push({ id: "responsavel", label: "Responsável" });
      base.push({ id: "telefone", label: "Telefone do Responsável" });
    } else {
      base.push({ id: "telefone", label: "Telefone" });
    }

    base.push({ id: "observacoes", label: "Observações" });
    return base;
  }, [isMaiorIdade]);

  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const currentStepDef = steps[currentStep];

  // Clamp step if steps change (e.g. minor→adult reduces steps)
  useEffect(() => {
    if (currentStep >= steps.length) {
      setCurrentStep(steps.length - 1);
    }
  }, [steps.length, currentStep]);

  const isCurrentStepValid = useCallback(() => {
    if (!currentStepDef) return false;
    switch (currentStepDef.id) {
      case "nome": return formData.nome.trim().length > 0;
      case "nascimento": return formData.dataNascimento.length > 0;
      case "religiao": return formData.religiao.length > 0;
      case "cidade": return formData.cidade.length > 0;
      case "email": return formData.email.includes("@");
      case "faixa": return formData.faixaInicial.length > 0;
      case "responsavel": return formData.responsavel.trim().length > 0;
      case "telefone": return unformatPhone(formData.telefone).length === 11;
      case "observacoes": return true; // optional
      default: return true;
    }
  }, [currentStepDef, formData]);

  const isLastStep = currentStep === totalSteps - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
    }
  };

  const handleBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const handleSubmit = () => {
    const phoneDigits = unformatPhone(formData.telefone);
    if (phoneDigits.length !== 11) return;

    let senha = "";
    if (formData.dataNascimento) {
      const [year, month, day] = formData.dataNascimento.split("-");
      senha = `${day}${month}${year}`;
    }

    onAddStudent({
      ...formData,
      telefone: phoneDigits,
      maiorIdade: isMaiorIdade ?? true,
      responsavel: isMaiorIdade ? "Próprio" : formData.responsavel,
      senha,
      convenioAtivo: hasActiveConvenio || false,
      convenioFim: hasActiveConvenio ? selectedCidade?.convenioFim : undefined,
    });
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setFormData({ ...INITIAL_FORM });
      setCurrentStep(0);
    }
    onOpenChange(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isCurrentStepValid() && !isLoading) {
      e.preventDefault();
      handleNext();
    }
  };

  const renderStepContent = () => {
    if (!currentStepDef) return null;

    switch (currentStepDef.id) {
      case "nome":
        return (
          <div className="space-y-3">
            <Label htmlFor="nome" className="text-sm font-medium">Nome completo *</Label>
            <Input
              id="nome"
              placeholder="Nome completo do aluno"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              onKeyDown={handleKeyDown}
              autoFocus
              className="bg-muted/50 border-border/50 rounded-xl h-12 text-base focus:bg-muted transition-all duration-200"
            />
          </div>
        );

      case "nascimento":
        return (
          <div className="space-y-3">
            <Label htmlFor="dataNascimento" className="text-sm font-medium">Data de Nascimento *</Label>
            <Input
              id="dataNascimento"
              type="date"
              value={formData.dataNascimento}
              onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
              onKeyDown={handleKeyDown}
              autoFocus
              className="bg-muted/50 border-border/50 rounded-xl h-12 text-base focus:bg-muted transition-all duration-200"
            />
            {isMaiorIdade !== null && (
              <div className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl mt-2 ${
                isMaiorIdade
                  ? "bg-green-500/10 text-green-500"
                  : "bg-yellow-500/10 text-yellow-500"
              }`}>
                <Check className="h-4 w-4" />
                {isMaiorIdade ? "Maior de 18 anos" : "Menor de 18 anos"}
              </div>
            )}
          </div>
        );

      case "religiao":
        return (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Religião *</Label>
            <Select
              value={formData.religiao}
              onValueChange={(value) => setFormData({ ...formData, religiao: value })}
            >
              <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-12 text-base">
                <SelectValue placeholder="Selecione uma religião" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {religioes.map((r) => (
                  <SelectItem key={r} value={r} className="rounded-lg">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "cidade":
        return (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Cidade *</Label>
            <Select
              value={formData.cidade}
              onValueChange={(value) => setFormData({ ...formData, cidade: value })}
              disabled={loadingCidades}
            >
              <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-12 text-base">
                <SelectValue placeholder={loadingCidades ? "Carregando..." : "Selecione uma cidade"} />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-60">
                {cidades.length === 0 && !loadingCidades ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Nenhuma cidade cadastrada</div>
                ) : (
                  cidades.map((c) => (
                    <SelectItem key={c.nome} value={c.nome} className="rounded-lg">
                      <span className="flex items-center gap-2">
                        {c.nome}
                        {c.convenio && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500">Convênio</span>
                        )}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {hasActiveConvenio && (
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 mt-2">
                <div className="flex items-start gap-2 text-sm text-green-500">
                  <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Convênio Ativo</p>
                    <p className="text-xs mt-0.5 text-muted-foreground">
                      Mensalidades pagas até{" "}
                      {selectedCidade?.convenioFim && (
                        <span className="font-medium text-green-500">
                          {new Date(selectedCidade.convenioFim).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "email":
        return (
          <div className="space-y-3">
            <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemplo@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onKeyDown={handleKeyDown}
              autoFocus
              className="bg-muted/50 border-border/50 rounded-xl h-12 text-base focus:bg-muted transition-all duration-200"
            />
          </div>
        );

      case "faixa":
        return (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Faixa Inicial *</Label>
            <Select
              value={formData.faixaInicial}
              onValueChange={(value) => setFormData({ ...formData, faixaInicial: value })}
            >
              <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-12 text-base">
                <SelectValue placeholder="Selecione uma faixa" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {faixas.map((f) => (
                  <SelectItem key={f} value={f} className="rounded-lg">{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "responsavel":
        return (
          <div className="space-y-3">
            <Label htmlFor="responsavel" className="text-sm font-medium">Nome do Responsável *</Label>
            <Input
              id="responsavel"
              placeholder="Nome completo do responsável"
              value={formData.responsavel}
              onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              onKeyDown={handleKeyDown}
              autoFocus
              className="bg-muted/50 border-border/50 rounded-xl h-12 text-base focus:bg-muted transition-all duration-200"
            />
          </div>
        );

      case "telefone":
        return (
          <div className="space-y-3">
            <Label htmlFor="telefone" className="text-sm font-medium">
              {isMaiorIdade === false ? "Telefone do Responsável *" : "Telefone *"}
            </Label>
            <Input
              id="telefone"
              placeholder="(89) 81234-5678"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
              onKeyDown={handleKeyDown}
              autoFocus
              className="bg-muted/50 border-border/50 rounded-xl h-12 text-base focus:bg-muted transition-all duration-200"
              maxLength={16}
            />
          </div>
        );

      case "observacoes":
        return (
          <div className="space-y-3">
            <Label htmlFor="observacoes" className="text-sm font-medium">Observações <span className="text-muted-foreground">(opcional)</span></Label>
            <Textarea
              id="observacoes"
              placeholder="Informações adicionais..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              autoFocus
              className="bg-muted/50 border-border/50 rounded-xl resize-none text-base focus:bg-muted transition-all duration-200"
              rows={4}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md border-border/30 rounded-2xl p-0 overflow-hidden">
        {/* Progress bar */}
        <div className="px-6 pt-6 pb-0">
          <Progress value={progress} className="h-1.5 bg-muted/50" />
          <p className="text-xs text-muted-foreground mt-2 text-right">
            {currentStep + 1} de {totalSteps}
          </p>
        </div>

        <div className="px-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{currentStepDef?.label}</DialogTitle>
          </DialogHeader>
        </div>

        {/* Step content */}
        <div className="px-6 py-2 min-h-[140px] flex flex-col justify-center">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="px-6 pb-6 pt-2 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={currentStep === 0 ? () => handleOpenChange(false) : handleBack}
            className="rounded-xl px-4 h-11"
            disabled={isLoading}
          >
            {currentStep === 0 ? (
              "Cancelar"
            ) : (
              <span className="flex items-center gap-1">
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </span>
            )}
          </Button>

          <Button
            onClick={handleNext}
            disabled={!isCurrentStepValid() || isLoading}
            className={`rounded-xl px-6 h-11 ${
              isLastStep
                ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/20"
                : ""
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cadastrando...
              </span>
            ) : isLastStep ? (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Cadastrar
              </span>
            ) : (
              <span className="flex items-center gap-1">
                Próximo
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
