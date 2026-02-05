import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, DollarSign, ArrowRightLeft } from "lucide-react";

interface City {
  id: string;
  nome: string;
  convenio: boolean;
  valorDesconto: number;
  valorNormal: number;
  valorAtraso: number;
}

interface EditCityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  city: City | null;
  onSave: (cityName: string, valores: { desconto: number; normal: number; atraso: number }) => Promise<void>;
  onConvert: (city: City) => Promise<void>;
}

export function EditCityModal({ open, onOpenChange, city, onSave, onConvert }: EditCityModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [valores, setValores] = useState({
    desconto: 0,
    normal: 0,
    atraso: 0,
  });

  // Reset form when city changes
  useEffect(() => {
    if (city) {
      setValores({
        desconto: city.valorDesconto,
        normal: city.valorNormal,
        atraso: city.valorAtraso,
      });
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

  const hasChanges = city && (
    valores.desconto !== city.valorDesconto ||
    valores.normal !== city.valorNormal ||
    valores.atraso !== city.valorAtraso
  );

  if (!city) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md card-elevated border-border/50">
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
            /* Cidade é convênio - apenas mostra opção de converter */
            <div className="space-y-6">
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">
                  Cidades em convênio não possuem valores de mensalidade próprios.
                </p>
                <p className="text-xs mt-2">
                  Converta para normal para definir valores.
                </p>
              </div>

              {/* Converter para Normal */}
              <Button
                type="button"
                onClick={handleConvert}
                disabled={isConverting}
                className="w-full rounded-xl h-11 bg-primary hover:bg-primary/90"
              >
                {isConverting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                )}
                Converter para Normal
              </Button>

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
