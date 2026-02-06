import { useState, useEffect, useMemo } from "react";
import { Filter, X, MapPin, CheckCircle, Handshake, Users, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const API_BASE = "https://us-central1-akad-fbe7e.cloudfunctions.net/app";

interface CidadeData {
  id: string;
  nome: string;
  convenio: boolean;
}

interface Student {
  id: string;
  nome: string;
  cidade: string;
  status: string;
}

interface StudentFiltersProps {
  students: Student[];
  onFilterChange: (filtered: Student[]) => void;
}

export function StudentFilters({ students, onFilterChange }: StudentFiltersProps) {
  const [cidades, setCidades] = useState<CidadeData[]>([]);
  const [selectedCidade, setSelectedCidade] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedConvenio, setSelectedConvenio] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/cidades`)
      .then((res) => res.json())
      .then((data: CidadeData[]) => setCidades(data))
      .catch((err) => console.error("Erro ao carregar cidades:", err));
  }, []);

  const uniqueCidades = useMemo(() => {
    const cidadesSet = new Set(students.map(s => s.cidade).filter(Boolean));
    return Array.from(cidadesSet).sort();
  }, [students]);

  const uniqueStatuses = useMemo(() => {
    const statusSet = new Set(students.map(s => s.status).filter(Boolean));
    return Array.from(statusSet).sort();
  }, [students]);

  const isConvenioCidade = (cidadeNome: string) => {
    return cidades.find(c => c.nome === cidadeNome)?.convenio || false;
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (selectedCidade !== "all" && student.cidade !== selectedCidade) return false;
      if (selectedStatus !== "all" && student.status !== selectedStatus) return false;
      if (selectedConvenio !== "all") {
        const isConvenio = isConvenioCidade(student.cidade);
        if (selectedConvenio === "convenio" && !isConvenio) return false;
        if (selectedConvenio === "normal" && isConvenio) return false;
      }
      return true;
    });
  }, [students, selectedCidade, selectedStatus, selectedConvenio, cidades]);

  useEffect(() => {
    onFilterChange(filteredStudents);
  }, [filteredStudents, onFilterChange]);

  const stats = useMemo(() => {
    const byCidade: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let convenioCount = 0;
    let normalCount = 0;

    students.forEach(student => {
      if (student.cidade) byCidade[student.cidade] = (byCidade[student.cidade] || 0) + 1;
      if (student.status) byStatus[student.status] = (byStatus[student.status] || 0) + 1;
      if (isConvenioCidade(student.cidade)) convenioCount++;
      else normalCount++;
    });

    return { total: students.length, filtered: filteredStudents.length, byCidade, byStatus, convenio: convenioCount, normal: normalCount };
  }, [students, filteredStudents, cidades]);

  const hasActiveFilters = selectedCidade !== "all" || selectedStatus !== "all" || selectedConvenio !== "all";

  const clearFilters = () => {
    setSelectedCidade("all");
    setSelectedStatus("all");
    setSelectedConvenio("all");
  };

  return (
    <div className="space-y-3">
      {/* Stats Cards - compact on mobile */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        <div className="card-elevated rounded-xl p-2.5 sm:p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:text-sm mb-0.5 sm:mb-1">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 hidden sm:block" />
            <span className="truncate">Total</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
        </div>

        <div className="card-elevated rounded-xl p-2.5 sm:p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:text-sm mb-0.5 sm:mb-1">
            <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 hidden sm:block" />
            <span className="truncate">Filtrados</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-primary">{stats.filtered}</p>
        </div>

        <div className="card-elevated rounded-xl p-2.5 sm:p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:text-sm mb-0.5 sm:mb-1">
            <Handshake className="h-3.5 w-3.5 sm:h-4 sm:w-4 hidden sm:block" />
            <span className="truncate">Convênio</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-yellow-500">{stats.convenio}</p>
        </div>

        <div className="card-elevated rounded-xl p-2.5 sm:p-4">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:text-sm mb-0.5 sm:mb-1">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 hidden sm:block" />
            <span className="truncate">Normal</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-blue-500">{stats.normal}</p>
        </div>
      </div>

      {/* Filters toggle on mobile */}
      <div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="sm:hidden flex items-center gap-2 text-sm text-muted-foreground w-full px-3 py-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span>Filtros</span>
          {hasActiveFilters && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
              {[selectedCidade !== "all", selectedStatus !== "all", selectedConvenio !== "all"].filter(Boolean).length}
            </Badge>
          )}
          <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Filters Row - always visible on desktop, toggleable on mobile */}
        <div className={`${filtersOpen ? "flex" : "hidden"} sm:flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 items-start sm:items-center mt-2 sm:mt-0`}>
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filtros:
          </div>

          {/* Cidade Filter */}
          <Select value={selectedCidade} onValueChange={setSelectedCidade}>
            <SelectTrigger className="w-full sm:w-[180px] bg-muted/50 border-border/50 rounded-xl h-10">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Todas as cidades" />
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">Todas as cidades ({stats.total})</SelectItem>
              {uniqueCidades.map((cidade) => (
                <SelectItem key={cidade} value={cidade}>
                  <span className="flex items-center gap-2">
                    {cidade}
                    <Badge variant="secondary" className="text-xs">{stats.byCidade[cidade] || 0}</Badge>
                    {isConvenioCidade(cidade) && (
                      <Badge className="text-xs bg-yellow-500/20 text-yellow-500 border-0">Conv.</Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[180px] bg-muted/50 border-border/50 rounded-xl h-10">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Todos os status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status ({stats.total})</SelectItem>
              {uniqueStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  <span className="flex items-center gap-2">
                    {status}
                    <Badge variant="secondary" className="text-xs">{stats.byStatus[status] || 0}</Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Convenio Filter */}
          <Select value={selectedConvenio} onValueChange={setSelectedConvenio}>
            <SelectTrigger className="w-full sm:w-[180px] bg-muted/50 border-border/50 rounded-xl h-10">
              <div className="flex items-center gap-2">
                <Handshake className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Tipo de cidade" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ({stats.total})</SelectItem>
              <SelectItem value="convenio">
                <span className="flex items-center gap-2">
                  Convênio
                  <Badge className="text-xs bg-yellow-500/20 text-yellow-500 border-0">{stats.convenio}</Badge>
                </span>
              </SelectItem>
              <SelectItem value="normal">
                <span className="flex items-center gap-2">
                  Normal
                  <Badge variant="secondary" className="text-xs">{stats.normal}</Badge>
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-10 px-3 text-muted-foreground hover:text-foreground w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedCidade !== "all" && (
            <Badge variant="secondary" className="rounded-lg px-3 py-1">
              Cidade: {selectedCidade}
              <button onClick={() => setSelectedCidade("all")} className="ml-2 hover:text-destructive"><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {selectedStatus !== "all" && (
            <Badge variant="secondary" className="rounded-lg px-3 py-1">
              Status: {selectedStatus}
              <button onClick={() => setSelectedStatus("all")} className="ml-2 hover:text-destructive"><X className="h-3 w-3" /></button>
            </Badge>
          )}
          {selectedConvenio !== "all" && (
            <Badge variant="secondary" className="rounded-lg px-3 py-1">
              Tipo: {selectedConvenio === "convenio" ? "Convênio" : "Normal"}
              <button onClick={() => setSelectedConvenio("all")} className="ml-2 hover:text-destructive"><X className="h-3 w-3" /></button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
