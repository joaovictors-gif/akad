import { useState, useEffect } from "react";
import { Menu, Search, FileText, Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { Input } from "@/components/ui/input";

interface Report {
  name: string;
  link: string;
}

const API_URL = "https://app-vaglvpp5la-uc.a.run.app/files";

export default function Reports() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Erro ao carregar relatórios");
        const data = await response.json();
        setReports(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const filteredReports = reports.filter((report) =>
    report.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenReport = (link: string) => {
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 h-screen overflow-y-auto">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 glass border-b border-border/30 p-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2.5 rounded-xl hover:bg-muted/80 transition-all duration-200"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">Relatórios</h1>
          <div className="w-10" />
        </header>

        <div className="p-4 md:p-6 lg:p-8">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between mb-8 animate-fade-in-up">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold tracking-wider">
                RELATÓRIOS <span className="text-primary">AKAD</span>
              </h1>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar relatório..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 bg-muted/50 border-border/50 rounded-xl h-11 focus:bg-muted transition-all duration-200"
              />
            </div>
          </div>

          {/* Mobile Title and Search */}
          <div className="lg:hidden mb-6 space-y-4 animate-fade-in-up">
            <h1 className="text-2xl font-bold tracking-wider">
              RELATÓRIOS <span className="text-primary">AKAD</span>
            </h1>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar relatório..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 bg-muted/50 border-border/50 rounded-xl h-11 focus:bg-muted transition-all duration-200"
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12 text-destructive">
              {error}
            </div>
          )}

          {/* Reports Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in-up stagger-1">
              {filteredReports.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  Nenhum relatório encontrado
                </div>
              ) : (
                filteredReports.map((report, index) => (
                  <button
                    key={index}
                    className="card-elevated card-interactive rounded-2xl p-8 flex flex-col items-center gap-4 animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => handleOpenReport(report.link)}
                  >
                    <FileText className="h-12 w-12 text-primary" />
                    <h3 className="text-lg font-semibold text-primary capitalize">
                      {report.name}
                    </h3>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
