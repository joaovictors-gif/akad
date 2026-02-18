import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, LayoutGrid, LayoutList, Trash2, Loader2, Pencil } from "lucide-react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { AddCityModal, CityFormData } from "@/components/cities/AddCityModal";
import { EditCityModal } from "@/components/cities/EditCityModal";
import { UpdateDueDatesModal } from "@/components/dashboard/UpdateDueDatesModal";
import { toast } from "sonner";

const API_BASE = "https://us-central1-akad-fbe7e.cloudfunctions.net/app";

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

export default function Cities() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cityToEdit, setCityToEdit] = useState<City | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cityToDelete, setCityToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch cities from API
  useEffect(() => {
    fetchCities();
  }, []);

const fetchCities = async () => {
  setIsLoading(true);
  try {
    const response = await fetch(`${API_BASE}/cidades`);
    if (!response.ok) throw new Error("Erro ao carregar cidades");

    const data = await response.json();

    const transformed: City[] = data.map((item: any) => ({
      id: item.id ?? item.nome,
      nome: item.nome,
      convenio: item.convenio ?? false,

      valorDesconto: item.valores?.desconto ?? 0,
      valorNormal: item.valores?.normal ?? 0,
      valorAtraso: item.valores?.atraso ?? 0,

      convenioInicio: item.convenio ? item.convenioInicio ?? null : null,
      convenioFim: item.convenio ? item.convenioFim ?? null : null,
    }));

    setCities(transformed);
  } catch (error) {
    console.error("Erro ao carregar cidades:", error);
    toast.error("Erro ao carregar cidades");
  } finally {
    setIsLoading(false);
  }
};
  const filteredCities = cities.filter(
    (city) =>
      city.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (city.convenio ? "sim" : "não").includes(searchTerm.toLowerCase())
  );

  const handleAddCity = async (formData: CityFormData) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        nome: formData.nome,
        convenio: formData.convenio,
      };

      if (formData.convenio) {
        payload.convenioInicio = formData.convenioInicio;
        payload.convenioFim = formData.convenioFim;
      } else {
        payload.valores = {
          desconto: formData.valorDesconto,
          normal: formData.valorNormal,
          atraso: formData.valorAtraso,
        };
      }

      const response = await fetch(`${API_BASE}/cidades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Erro ao adicionar cidade");

      toast.success("Cidade adicionada com sucesso!");
      await fetchCities();
    } catch (error) {
      console.error("Erro ao adicionar cidade:", error);
      toast.error("Erro ao adicionar cidade");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenewConvenio = async (cityName: string, novaDataInicio: string, novaDataFim: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/cidades/${encodeURIComponent(cityName)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          convenio: true,
          convenioInicio: novaDataInicio,
          convenioFim: novaDataFim,
        }),
      });

      if (!response.ok) throw new Error("Erro ao renovar convênio");

      toast.success("Convênio renovado com sucesso!");
      await fetchCities();
    } catch (error) {
      console.error("Erro ao renovar convênio:", error);
      toast.error("Erro ao renovar convênio");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCity = (city: City) => {
    setCityToEdit(city);
    setEditModalOpen(true);
  };

  const handleSaveValues = async (cityName: string, valores: { desconto: number; normal: number; atraso: number }) => {
    try {
      const response = await fetch(`${API_BASE}/cidades/${encodeURIComponent(cityName)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valores: {
            desconto: valores.desconto,
            normal: valores.normal,
            atraso: valores.atraso,
          },
        }),
      });

      if (!response.ok) throw new Error("Erro ao salvar alterações");

      toast.success("Valores atualizados com sucesso!");
      await fetchCities();
    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
      toast.error("Erro ao salvar alterações");
      throw error;
    }
  };

  const handleDeleteClick = (nome: string) => {
    setCityToDelete(nome);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!cityToDelete) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/cidades/${encodeURIComponent(cityToDelete)}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao excluir cidade");

      toast.success("Cidade excluída com sucesso!");
      await fetchCities();
    } catch (error) {
      console.error("Erro ao excluir cidade:", error);
      toast.error("Erro ao excluir cidade");
    } finally {
      setCityToDelete(null);
      setDeleteDialogOpen(false);
      setIsSubmitting(false);
    }
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "table" ? "cards" : "table");
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace(".", ",")}`;
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 h-screen flex flex-col overflow-hidden">
        <div className="flex-shrink-0">
          <AdminPageHeader
            title="Cidades e Valores"
            subtitle="Gerencie cidades e convênios"
            onMenuClick={() => setSidebarOpen(true)}
            rightContent={
              <button
                onClick={toggleViewMode}
                className="p-2.5 rounded-xl border border-border/50 hover:bg-muted/80 transition-all duration-200"
              >
                {viewMode === "table" ? <LayoutGrid className="h-5 w-5" /> : <LayoutList className="h-5 w-5" />}
              </button>
            }
          />

          <div className="p-4 md:p-6 lg:p-8 pb-0">
            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-fade-in-up stagger-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cidade ou convênio"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 bg-muted/50 border-border/50 rounded-xl h-11 focus:bg-muted transition-all duration-200"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={toggleViewMode}
                  className="hidden lg:flex p-2.5 rounded-xl border border-border/50 hover:bg-muted/80 transition-all duration-200"
                >
                  {viewMode === "table" ? <LayoutGrid className="h-5 w-5" /> : <LayoutList className="h-5 w-5" />}
                </button>
                <UpdateDueDatesModal />
                <Button 
                  onClick={() => setModalOpen(true)} 
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 rounded-xl h-11 px-4 sm:px-6 btn-glow shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30"
                >
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Adicionar nova cidade</span>
                  <span className="sm:hidden">Adicionar</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8">
          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Card View */}
              {viewMode === "cards" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in-up stagger-2">
                  {filteredCities.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      Nenhuma cidade encontrada
                    </div>
                  ) : (
                    filteredCities.map((city, index) => (
                      <div
                        key={city.id}
                        className={`card-elevated rounded-2xl overflow-hidden border-t-4 animate-fade-in-up ${
                          city.convenio ? "border-t-yellow-500" : "border-t-primary"
                        }`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-foreground">{city.nome}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              city.convenio 
                                ? "bg-yellow-500/20 text-yellow-400" 
                                : "bg-primary/20 text-primary"
                            }`}>
                              {city.convenio ? "CONVÊNIO" : "NORMAL"}
                            </span>
                          </div>
                          
                          {!city.convenio && (
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Desconto:</span>
                                <span className="font-semibold text-foreground">{formatCurrency(city.valorDesconto)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Normal:</span>
                                <span className="font-semibold text-foreground">{formatCurrency(city.valorNormal)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Atraso:</span>
                                <span className="font-semibold text-foreground">{formatCurrency(city.valorAtraso)}</span>
                              </div>
                            </div>
                          )}

                          {city.convenio && (
                            <div className="py-4 text-center text-muted-foreground text-sm">
                              Convênio não possui valores próprios
                            </div>
                          )}

                          <div className="flex gap-2 mt-4 pt-4 border-t border-border/30">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditCity(city)}
                              disabled={isSubmitting}
                              className="flex-1 rounded-lg"
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              {city.convenio ? "Gerenciar" : "Editar Valores"}
                            </Button>
                            <button
                              onClick={() => handleDeleteClick(city.nome)}
                              disabled={isSubmitting}
                              className="p-2 hover:bg-destructive/10 rounded-lg transition-all duration-200 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Table View */}
              {viewMode === "table" && (
                <div className="card-elevated rounded-2xl overflow-hidden animate-fade-in-up stagger-2">
                  <Table>
                    <TableHeader>
                      <TableRow className="table-header-gradient hover:bg-primary border-none">
                        <TableHead className="text-primary-foreground font-bold py-4">CIDADE</TableHead>
                        <TableHead className="text-primary-foreground font-bold text-center hidden sm:table-cell">DESCONTO</TableHead>
                        <TableHead className="text-primary-foreground font-bold text-center hidden sm:table-cell">NORMAL</TableHead>
                        <TableHead className="text-primary-foreground font-bold text-center hidden md:table-cell">ATRASO</TableHead>
                        <TableHead className="text-primary-foreground font-bold text-center hidden md:table-cell">TIPO</TableHead>
                        <TableHead className="text-primary-foreground font-bold text-center">AÇÕES</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCities.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                            Nenhuma cidade encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCities.map((city, index) => (
                          <TableRow 
                            key={city.id} 
                            className="border-border/30 hover:bg-muted/30 transition-colors duration-200"
                            style={{ animationDelay: `${index * 0.05}s` }}
                          >
                            <TableCell className="font-medium py-4">{city.nome}</TableCell>
                            <TableCell className="text-center hidden sm:table-cell">
                              {city.convenio ? (
                                <span className="text-muted-foreground">-</span>
                              ) : (
                                <span className="font-medium">{formatCurrency(city.valorDesconto)}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center hidden sm:table-cell">
                              {city.convenio ? (
                                <span className="text-muted-foreground">-</span>
                              ) : (
                                <span className="font-medium">{formatCurrency(city.valorNormal)}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center hidden md:table-cell">
                              {city.convenio ? (
                                <span className="text-muted-foreground">-</span>
                              ) : (
                                <span className="font-medium">{formatCurrency(city.valorAtraso)}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center hidden md:table-cell">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                city.convenio 
                                  ? "bg-yellow-500/20 text-yellow-400" 
                                  : "bg-primary/20 text-primary"
                              }`}>
                                {city.convenio ? "CONVÊNIO" : "NORMAL"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => handleEditCity(city)}
                                  disabled={isSubmitting}
                                  className="p-2 hover:bg-muted rounded-lg transition-all duration-200 text-muted-foreground hover:text-foreground"
                                  title={city.convenio ? "Gerenciar cidade" : "Editar valores"}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(city.nome)}
                                  disabled={isSubmitting}
                                  className="p-2 hover:bg-destructive/10 rounded-lg transition-all duration-200 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </div>
      </div>


      {/* Add City Modal */}
      <AddCityModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onAddCity={handleAddCity}
      />

      {/* Edit City Modal */}
      <EditCityModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        city={cityToEdit}
        onSave={handleSaveValues}
        onRenewConvenio={handleRenewConvenio}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="card-elevated border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta cidade? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90 rounded-xl"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
