import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface CityFormData {
  nome: string;
  convenio: boolean;
  valorDesconto: number;
  valorNormal: number;
  valorAtraso: number;
}

interface AddCityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCity: (data: CityFormData) => void;
}

export function AddCityModal({ open, onOpenChange, onAddCity }: AddCityModalProps) {
  const [estado, setEstado] = useState<"PI" | "PE" | "">("");
  const [cidades, setCidades] = useState<string[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(false);

  const [formData, setFormData] = useState<CityFormData>({
    nome: "",
    convenio: false,
    valorDesconto: 0,
    valorNormal: 0,
    valorAtraso: 0,
  });

  // =====================
  // BUSCAR CIDADES (IBGE)
  // =====================
  useEffect(() => {
    if (!estado) return;

    setLoadingCidades(true);
    setCidades([]);
    setFormData((prev) => ({ ...prev, nome: "" }));

    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`)
      .then((res) => res.json())
      .then((data) => {
        const nomes = data.map((c: any) => c.nome).sort((a: string, b: string) => a.localeCompare(b));

        setCidades(nomes);
      })
      .finally(() => setLoadingCidades(false));
  }, [estado]);

  // =====================
  // SUBMIT
  // =====================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCity(formData);

    setEstado("");
    setCidades([]);
    setFormData({
      nome: "",
      convenio: false,
      valorDesconto: 0,
      valorNormal: 0,
      valorAtraso: 0,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md card-elevated border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">Adicionar Nova Cidade</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* ESTADO */}
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={estado} onValueChange={(v) => setEstado(v as any)}>
              <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-11">
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PI">Piauí (PI)</SelectItem>
                <SelectItem value="PE">Pernambuco (PE)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* CIDADE */}
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Select
              value={formData.nome}
              onValueChange={(value) => setFormData({ ...formData, nome: value })}
              disabled={!estado || loadingCidades}
            >
              <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-11">
                <SelectValue placeholder={loadingCidades ? "Carregando cidades..." : "Selecione a cidade"} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {cidades.map((cidade) => (
                  <SelectItem key={cidade} value={cidade}>
                    {cidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CONVÊNIO */}
          <div className="space-y-2">
            <Label>Convênio</Label>
            <Select
              value={formData.convenio ? "sim" : "nao"}
              onValueChange={(value) => setFormData({ ...formData, convenio: value === "sim" })}
            >
              <SelectTrigger className="bg-muted/50 border-border/50 rounded-xl h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nao">NÃO</SelectItem>
                <SelectItem value="sim">SIM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* VALORES */}
          <div className="space-y-2">
            <Label>Valor Desconto (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.valorDesconto || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  valorDesconto: Number(e.target.value) || 0,
                })
              }
              className="bg-muted/50 border-border/50 rounded-xl h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>Valor Normal (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.valorNormal || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  valorNormal: Number(e.target.value) || 0,
                })
              }
              className="bg-muted/50 border-border/50 rounded-xl h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>Valor Atraso (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.valorAtraso || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  valorAtraso: Number(e.target.value) || 0,
                })
              }
              className="bg-muted/50 border-border/50 rounded-xl h-11"
            />
          </div>

          {/* BOTÕES */}
          <div className="flex gap-3 pt-4">
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
              disabled={!formData.nome}
              className="flex-1 bg-primary hover:bg-primary/90 rounded-xl h-11 btn-glow"
            >
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
