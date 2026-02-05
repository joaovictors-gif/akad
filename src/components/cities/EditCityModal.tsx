import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, DollarSign, ArrowRightLeft, Calendar, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { format, addMonths, isAfter, isBefore, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface City {
  id: string;
  nome: string;
  convenio: boolean;
  valorDesconto: number;
  valorNormal: number;
  valorAtraso: number;
  convenioInicio?: string;
  convenioFim?: string;
}

interface EditCityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  city: City | null;
  onSave: (cityName: string, valores: { desconto: number; normal: number; atraso: number }) => Promise<void>;
  onConvert: (city: City) => Promise<void>;
  onRenewConvenio?: (cityName: string, novaDataInicio: string, novaDataFim: string) => Promise<void>;
}

export function EditCityModal({ open, onOpenChange, city, onSave, onConvert, onRenewConvenio }: EditCityModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [valores, setValores] = useState({
    desconto: 0,
    normal: 0,
    atraso: 0,
  });
  const [novaDataInicio, setNovaDataInicio] = useState("");

  // Reset form when city changes
  useEffect(() => {
    if (city) {
      setValores({
        desconto: city.valorDesconto,
        normal: city.valorNormal,
        atraso: city.valorAtraso,
      });
      setNovaDataInicio("");
    }
  }, [city]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city) return;

    setIsLoading(true);
    try {
      await onSave(city.nome, valores);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!city) return;

    setIsConverting(true);
    try {
      await onConvert(city);
      onOpenChange(false);
    } finally {
      setIsConverting(false);
    }
  };

  const handleRenew = async () => {
    if (!city || !novaDataInicio || !onRenewConvenio) return;

    setIsRenewing(true);
    try {
      const startDate = new Date(novaDataInicio);
      const endDate = addMonths(startDate, 12);
      await onRenewConvenio(city.nome, novaDataInicio, format(endDate, "yyyy-MM-dd"));
      onOpenChange(false);
    } finally {
      setIsRenewing(false);
    }
  };

  const hasChanges = city && (
    valores.desconto !== city.valorDesconto ||
    valores.normal !== city.valorNormal ||
    valores.atraso !== city.valorAtraso
  );

  const getConvenioStatus = () => {
    if (!city?.convenio || !city.convenioFim) return null;

    const today = new Date();
    const endDate = new Date(city.convenioFim);
    const daysRemaining = differenceInDays(endDate, today);

    if (isBefore(endDate, today)) {
      return { status: "expired", label: "Expirado", color: "text-destructive", bgColor: "bg-destructive/10" };
    } else if (daysRemaining <= 30) {
      return { status: "expiring", label: `Expira em ${daysRemaining} dias`, color: "text-yellow-400", bgColor: "bg-yellow-500/10" };
    } else {
      return { status: "active", label: "Ativo", color: "text-green-400", bgColor: "bg-green-500/10" };
    }
  };

  const convenioStatus = city?.convenio ? getConvenioStatus() : null;

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
  };

  if (!city) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md card-elevated border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Editar Cidade
          </DialogTitle>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-muted-foreground">{city.nome}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              city.convenio 
                ? "bg-yellow-500/20 text-yellow-400" 
                : "bg-primary/20 text-primary"
            }`}>
              {city.convenio ? "CONVÊNIO" : "NORMAL"}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Valores - Apenas para cidades normais */}
          {!city.convenio ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Valor Desconto */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-green-500/10">
                    <DollarSign className="h-4 w-4 text-green-400" />
                  </div>
                  Valor com Desconto
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valores.desconto || ""}
                    onChange={(e) => setValores({ ...valores, desconto: Number(e.target.value) || 0 })}
                    className="pl-10 bg-muted/50 border-border/50 rounded-xl h-12 text-lg font-medium"
                    placeholder="0,00"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor para pagamento até o dia 10
                </p>
              </div>

              {/* Valor Normal */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/10">
                    <DollarSign className="h-4 w-4 text-blue-400" />
                  </div>
                  Valor Normal
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valores.normal || ""}
                    onChange={(e) => setValores({ ...valores, normal: Number(e.target.value) || 0 })}
                    className="pl-10 bg-muted/50 border-border/50 rounded-xl h-12 text-lg font-medium"
                    placeholder="0,00"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor padrão da mensalidade
                </p>
              </div>

              {/* Valor Atraso */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-red-500/10">
                    <DollarSign className="h-4 w-4 text-red-400" />
                  </div>
                  Valor com Atraso
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valores.atraso || ""}
                    onChange={(e) => setValores({ ...valores, atraso: Number(e.target.value) || 0 })}
                    className="pl-10 bg-muted/50 border-border/50 rounded-xl h-12 text-lg font-medium"
                    placeholder="0,00"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor para pagamento após o vencimento
                </p>
              </div>

              {/* Converter Convênio */}
              <div className="pt-2 border-t border-border/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleConvert}
                  disabled={isConverting || isLoading}
                  className="w-full rounded-xl h-11 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                >
                  {isConverting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                  )}
                  Converter para Convênio
                </Button>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 rounded-xl h-11 border-border/50"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !hasChanges}
                  className="flex-1 bg-primary hover:bg-primary/90 rounded-xl h-11 btn-glow"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            /* Cidade é convênio */
            <div className="space-y-6">
              {/* Status do Convênio */}
              {convenioStatus && (
                <div className={`p-4 rounded-xl ${convenioStatus.bgColor}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {convenioStatus.status === "expired" ? (
                      <AlertTriangle className={`h-5 w-5 ${convenioStatus.color}`} />
                    ) : convenioStatus.status === "expiring" ? (
                      <AlertTriangle className={`h-5 w-5 ${convenioStatus.color}`} />
                    ) : (
                      <CheckCircle className={`h-5 w-5 ${convenioStatus.color}`} />
                    )}
                    <span className={`font-semibold ${convenioStatus.color}`}>
                      {convenioStatus.label}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><span className="font-medium">Início:</span> {formatDateDisplay(city.convenioInicio)}</p>
                    <p><span className="font-medium">Término:</span> {formatDateDisplay(city.convenioFim)}</p>
                  </div>
                </div>
              )}

              {/* Info sobre convênio */}
              <div className="text-center py-2 text-muted-foreground">
                <p className="text-sm">
                  Alunos de cidades em convênio têm mensalidades automaticamente pagas durante a vigência.
                </p>
              </div>

              {/* Renovar Convênio */}
              {onRenewConvenio && (
                <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/30">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <RefreshCw className="h-4 w-4" />
                    Renovar Convênio
                  </Label>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Nova data de início</Label>
                    <Input
                      type="date"
                      value={novaDataInicio}
                      onChange={(e) => setNovaDataInicio(e.target.value)}
                      className="bg-background/50 border-border/50 rounded-xl h-11"
                    />
                  </div>
                  {novaDataInicio && (
                    <p className="text-xs text-muted-foreground">
                      Válido até: {formatDateDisplay(format(addMonths(new Date(novaDataInicio), 12), "yyyy-MM-dd"))}
                    </p>
                  )}
                  <Button
                    type="button"
                    onClick={handleRenew}
                    disabled={isRenewing || !novaDataInicio}
                    className="w-full rounded-xl h-11 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isRenewing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Renovar por mais 12 meses
                  </Button>
                </div>
              )}

              {/* Converter para Normal */}
              <div className="pt-2 border-t border-border/30">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleConvert}
                  disabled={isConverting}
                  className="w-full rounded-xl h-11"
                >
                  {isConverting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                  )}
                  Converter para Normal
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full rounded-xl h-11 border-border/50"
              >
                Fechar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}