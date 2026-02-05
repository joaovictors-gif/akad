import { useState, useEffect, useMemo } from "react";
import { Filter, X, MapPin, CheckCircle, Handshake, Users } from "lucide-react";
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

  // Fetch cities to know which ones are convenio
  useEffect(() => {
    fetch(`${API_BASE}/cidades`)
      .then((res) => res.json())
      .then((data: CidadeData[]) => {
        setCidades(data);
      })
      .catch((err) => {
        console.error("Erro ao carregar cidades:", err);
      });
  }, []);

  // Get unique cities from students
  const uniqueCidades = useMemo(() => {
    const cidadesSet = new Set(students.map(s => s.cidade).filter(Boolean));
    return Array.from(cidadesSet).sort();
  }, [students]);

  // Get unique statuses from students
  const uniqueStatuses = useMemo(() => {
    const statusSet = new Set(students.map(s => s.status).filter(Boolean));
    return Array.from(statusSet).sort();
  }, [students]);

  // Check if a student's city is convenio
  const isConvenioCidade = (cidadeNome: string) => {
    const cidade = cidades.find(c => c.nome === cidadeNome);
    return cidade?.convenio || false;
  };

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Filter by cidade
      if (selectedCidade !== "all" && student.cidade !== selectedCidade) {
        return false;
      }

      // Filter by status
      if (selectedStatus !== "all" && student.status !== selectedStatus) {
        return false;
      }

      // Filter by convenio
      if (selectedConvenio !== "all") {
        const isConvenio = isConvenioCidade(student.cidade);
        if (selectedConvenio === "convenio" && !isConvenio) return false;
        if (selectedConvenio === "normal" && isConvenio) return false;
      }

      return true;
    });
  }, [students, selectedCidade, selectedStatus, selectedConvenio, cidades]);

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange(filteredStudents);
  }, [filteredStudents, onFilterChange]);

  // Stats
  const stats = useMemo(() => {
    const byCidade: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let convenioCount = 0;
    let normalCount = 0;

    students.forEach(student => {
      // By cidade
      if (student.cidade) {
        byCidade[student.cidade] = (byCidade[student.cidade] || 0) + 1;
      }

      // By status
      if (student.status) {
        byStatus[student.status] = (byStatus[student.status] || 0) + 1;
      }

      // By convenio
      if (isConvenioCidade(student.cidade)) {
        convenioCount++;
      } else {
        normalCount++;
      }
    });

    return {
      total: students.length,
      filtered: filteredStudents.length,
      byCidade,
      byStatus,
      convenio: convenioCount,
      normal: normalCount,
    };
  }, [students, filteredStudents, cidades]);

  const hasActiveFilters = selectedCidade !== "all" || selectedStatus !== "all" || selectedConvenio !== "all";

  const clearFilters = () => {
    setSelectedCidade("all");
    setSelectedStatus("all");
    setSelectedConvenio("all");
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-elevated rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Users className="h-4 w-4" />
            Total
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>

        <div className="card-elevated rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Filter className="h-4 w-4" />
            Filtrados
          </div>
          <p className="text-2xl font-bold text-primary">{stats.filtered}</p>
        </div>

        <div className="card-elevated rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Handshake className="h-4 w-4" />
            Convênio
          </div>
          <p className="text-2xl font-bold text-yellow-500">{stats.convenio}</p>
        </div>

        <div className="card-elevated rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <MapPin className="h-4 w-4" />
            Normal
          </div>
          <p className="text-2xl font-bold text-blue-500">{stats.normal}</p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtros:
        </div>

        {/* Cidade Filter */}
        <Select value={selectedCidade} onValueChange={setSelectedCidade}>
          <SelectTrigger className="w-[180px] bg-muted/50 border-border/50 rounded-xl h-10">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Todas as cidades" />
            </div>
          </SelectTrigger>
          <SelectContent className="max-h-60">
            <SelectItem value="all">
              Todas as cidades ({stats.total})
            </SelectItem>
            {uniqueCidades.map((cidade) => (
              <SelectItem key={cidade} value={cidade}>
                <span className="flex items-center gap-2">
                  {cidade}
                  <Badge variant="secondary" className="text-xs">
                    {stats.byCidade[cidade] || 0}
                  </Badge>
                  {isConvenioCidade(cidade) && (
                    <Badge className="text-xs bg-yellow-500/20 text-yellow-500 border-0">
                      Conv.
                    </Badge>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px] bg-muted/50 border-border/50 rounded-xl h-10">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Todos os status" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              Todos os status ({stats.total})
            </SelectItem>
            {uniqueStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                <span className="flex items-center gap-2">
                  {status}
                  <Badge variant="secondary" className="text-xs">
                    {stats.byStatus[status] || 0}
                  </Badge>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Convenio Filter */}
        <Select value={selectedConvenio} onValueChange={setSelectedConvenio}>
          <SelectTrigger className="w-[180px] bg-muted/50 border-border/50 rounded-xl h-10">
            <div className="flex items-center gap-2">
              <Handshake className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Tipo de cidade" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              Todos ({stats.total})
            </SelectItem>
            <SelectItem value="convenio">
              <span className="flex items-center gap-2">
                Convênio
                <Badge className="text-xs bg-yellow-500/20 text-yellow-500 border-0">
                  {stats.convenio}
                </Badge>
              </span>
            </SelectItem>
            <SelectItem value="normal">
              <span className="flex items-center gap-2">
                Normal
                <Badge variant="secondary" className="text-xs">
                  {stats.normal}
                </Badge>
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-10 px-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedCidade !== "all" && (
            <Badge variant="secondary" className="rounded-lg px-3 py-1">
              Cidade: {selectedCidade}
              <button onClick={() => setSelectedCidade("all")} className="ml-2 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedStatus !== "all" && (
            <Badge variant="secondary" className="rounded-lg px-3 py-1">
              Status: {selectedStatus}
              <button onClick={() => setSelectedStatus("all")} className="ml-2 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedConvenio !== "all" && (
            <Badge variant="secondary" className="rounded-lg px-3 py-1">
              Tipo: {selectedConvenio === "convenio" ? "Convênio" : "Normal"}
              <button onClick={() => setSelectedConvenio("all")} className="ml-2 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}