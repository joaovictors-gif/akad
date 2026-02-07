import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Check,
  X,
  Clock,
  QrCode,
  Send,
  CalendarDays,
  Loader2,
  Copy,
  RefreshCw,
  ExternalLink,
  Filter,
  ChevronDown,
  MapPin,
} from "lucide-react";
import { AdminPageHeader } from "@/components/AdminPageHeader";

// Firebase
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, doc, getDoc, getDocs } from "firebase/firestore";

import { AppSidebar } from "@/components/AppSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
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
import {
  createPixPayment,
  checkPaymentStatus,
  type PixPaymentResponse,
} from "@/services/paymentApi";

const mesesMap: { [key: string]: string } = {
  Janeiro: "01",
  Fevereiro: "02",
  Março: "03",
  Abril: "04",
  Maio: "05",
  Junho: "06",
  Julho: "07",
  Agosto: "08",
  Setembro: "09",
  Outubro: "10",
  Novembro: "11",
  Dezembro: "12",
};

const mesesDoAno = Object.keys(mesesMap);
const anosDisponiveis = ["24", "25", "26", "27"];

const API_BASE = "https://us-central1-akad-fbe7e.cloudfunctions.net/app";

interface Mensalidade {
  id: string;
  alunoId: string;
  aluno: string;
  cidade: string;
  mesReferencia: string;
  valor: number;
  status: "pago" | "pendente" | "atrasado";
  statusOriginal: string;
  tipoPagamento: string;
  dataPagamento: string;
  email?: string;
}

export default function Mensalidades() {
  const navigate = useNavigate();

  const dataAtual = new Date();
  const mesAtualNome = mesesDoAno[dataAtual.getMonth()];
  const anoAtualCurto = dataAtual.getFullYear().toString().slice(-2);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [mesFilter, setMesFilter] = useState(mesAtualNome);
  const [anoFilter, setAnoFilter] = useState(anoAtualCurto);

  const [selectedMensalidade, setSelectedMensalidade] = useState<Mensalidade | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showEnviarOptions, setShowEnviarOptions] = useState(false);

  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [cities, setCities] = useState<string[]>(["Todas"]);

  // Estados do PIX
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState<PixPaymentResponse | null>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Limpa polling ao desmontar
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Busca cidades da API
  useEffect(() => {
    fetch(`${API_BASE}/cidades`)
      .then((res) => res.json())
      .then((data) => {
        const nomes = data.map((c: any) => c.nome).sort((a: string, b: string) => a.localeCompare(b));
        setCities(["Todas", ...nomes]);
      })
      .catch((err) => {
        console.error("Erro ao carregar cidades:", err);
      });
  }, []);

  // Busca Mensalidades de TODOS os alunos
  useEffect(() => {
    setLoading(true);

    const unsubAlunos = onSnapshot(collection(db, "alunos"), async (alunoSnapshot) => {
      const allMensalidades: Mensalidade[] = [];

      const promises = alunoSnapshot.docs.map(async (alunoDoc) => {
        const studentId = alunoDoc.id;

        const infoDocRef = doc(db, `alunos/${studentId}/infor/infor`);
        const infoSnap = await getDoc(infoDocRef);
        const infoData = infoSnap.exists() ? infoSnap.data() : { nome: "Não informado", cidade: "Não informada", email: "" };

        const mensRef = collection(db, `alunos/${studentId}/mensalidades`);
        const mensSnap = await getDocs(mensRef);

        mensSnap.forEach((mDoc) => {
          const data = mDoc.data();

          let dataFormatada = "N/A";
          if (data.data_pagamento) {
            if (data.data_pagamento.seconds) {
              dataFormatada = new Date(data.data_pagamento.seconds * 1000).toLocaleDateString("pt-BR");
            } else {
              dataFormatada = String(data.data_pagamento);
            }
          }

          let statusTraduzido: "pago" | "pendente" | "atrasado" = "pendente";
          if (["Pago", "Pago com Desconto", "Pago com Atraso", "Convênio"].includes(data.status)) {
            statusTraduzido = "pago";
          } else if (data.status === "Atrasada") {
            statusTraduzido = "atrasado";
          }

          allMensalidades.push({
            id: mDoc.id,
            alunoId: studentId,
            aluno: infoData.nome || "Não informado",
            cidade: infoData.cidade || "Não informada",
            mesReferencia: mDoc.id,
            valor: data.valor || 0,
            status: statusTraduzido,
            statusOriginal: data.status,
            tipoPagamento:
              data.tipo_pagamento || data.tipoPagamento || (data.status === "Convênio" ? "Convênio" : "N/A"),
            dataPagamento: dataFormatada,
            email: infoData.email || "",
          });
        });
      });

      await Promise.all(promises);
      setMensalidades(allMensalidades);
      setLoading(false);
    });

    return () => unsubAlunos();
  }, []);

  // Verifica status do pagamento PIX
  const handleCheckPaymentStatus = useCallback(async () => {
    if (!pixData?.id) {
      toast.info("Verificação automática não disponível");
      return;
    }

    setIsCheckingStatus(true);
    try {
      const status = await checkPaymentStatus(pixData.id);

      if (status.status === "approved") {
        toast.success("Pagamento aprovado! 🎉");
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        setShowPixModal(false);
        setModalOpen(false);
      } else if (status.status === "rejected" || status.status === "cancelled") {
        toast.error("Pagamento não foi aprovado");
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } else {
        toast.info("Aguardando pagamento...");
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  }, [pixData?.id]);

  // Inicia polling automático
  const startPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    pollingRef.current = setInterval(() => {
      handleCheckPaymentStatus();
    }, 10000);
  }, [handleCheckPaymentStatus]);

  // Gera código PIX
  const handleGeneratePix = async () => {
    if (!selectedMensalidade) return;

    setIsGeneratingPix(true);
    try {
      const response = await createPixPayment(
        selectedMensalidade.alunoId,
        selectedMensalidade.id
      );

      // Verifica se já está pago
      if (response.mensagem) {
        toast.info(response.mensagem);
        return;
      }

      setPixData(response);
      setShowPixModal(true);
      if (response.id) {
        startPolling();
      }
      toast.success("Código PIX gerado!");
    } catch (error) {
      console.error("Erro ao gerar PIX:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar código PIX");
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const handleCopyPix = async () => {
    if (!pixData?.pixCopiaECola) return;
    try {
      await navigator.clipboard.writeText(pixData.pixCopiaECola);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar código");
    }
  };

  const handleClosePixModal = () => {
    setShowPixModal(false);
    setPixData(null);
    setCopied(false);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleConfirmarPagamento = async () => {
    if (!selectedMensalidade) return;

    setIsConfirming(true);
    try {
      const response = await fetch("https://app-vaglvpp5la-uc.a.run.app/cob/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alunoId: selectedMensalidade.alunoId,
          mensalidadeDocId: selectedMensalidade.id,
          nome: selectedMensalidade.aluno,
          valor: selectedMensalidade.valor,
        }),
      });

      if (response.ok) {
        toast.success("Pagamento confirmado com sucesso!");
        setModalOpen(false);
      } else {
        toast.error("Erro ao processar o pagamento.");
      }
    } catch (error) {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setIsConfirming(false);
    }
  };

  // Enviar cobrança via push notification
  const handleEnviarCobrancaPush = async () => {
    if (!selectedMensalidade) return;

    setIsSendingPush(true);
    try {
      const [mesNum, ano] = selectedMensalidade.mesReferencia.split("-");
      const mesesNomes: Record<string, string> = {
        "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril",
        "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto",
        "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro",
      };
      const mesNome = mesesNomes[mesNum] || mesNum;
      const mesFormatado = `${mesNome}/20${ano}`;

      const response = await fetch(`${API_BASE}/messaging/aviso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: selectedMensalidade.alunoId,
          mensagem: {
            title: "💰 Mensalidade Pendente",
            body: `Sua mensalidade de ${mesFormatado} (${formatCurrency(selectedMensalidade.valor)}) está ${selectedMensalidade.status === "atrasado" ? "atrasada" : "pendente"}. Toque para pagar.`,
            link: `https://akad-fbe7e.web.app/aluno/mensalidades?pay=true&mes=${mesFormatado}`,
          },
        }),
      });

      if (response.ok) {
        toast.success("Cobrança enviada via notificação! 🔔");
      } else {
        toast.error("Erro ao enviar notificação");
      }
    } catch (error) {
      console.error("Erro ao enviar cobrança push:", error);
      toast.error("Erro ao enviar cobrança");
    } finally {
      setIsSendingPush(false);
    }
  };

  const filteredMensalidades = mensalidades.filter((m) => {
    const matchesSearch = m.aluno.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = cityFilter === "Todas" || m.cidade === cityFilter;
    const matchesStatus = statusFilter === "Todos" || m.status === statusFilter;
    const formatoFiltro = `${mesesMap[mesFilter]}-${anoFilter}`;
    return m.mesReferencia === formatoFiltro && matchesSearch && matchesCity && matchesStatus;
  });

  const formatCurrency = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;

  const getStatusBadge = (status: Mensalidade["status"], size: "sm" | "lg" = "sm") => {
    const sizeClasses = size === "lg" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs";
    if (status === "pago")
      return (
        <span className={`inline-flex items-center gap-1 badge-success ${sizeClasses} rounded-full font-medium`}>
          <Check className="h-3 w-3" /> Pago
        </span>
      );
    if (status === "pendente")
      return (
        <span className={`inline-flex items-center gap-1 badge-warning ${sizeClasses} rounded-full font-medium`}>
          <Clock className="h-3 w-3" /> Pendente
        </span>
      );
    return (
      <span className={`inline-flex items-center gap-1 badge-danger ${sizeClasses} rounded-full font-medium`}>
        <X className="h-3 w-3" /> Atrasado
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 h-screen overflow-y-auto">
        <AdminPageHeader
          title="Mensalidades"
          subtitle="Gerencie os pagamentos"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="card-elevated rounded-xl p-2.5 sm:p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:text-sm mb-0.5 sm:mb-1">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 hidden sm:block" />
                <span className="truncate">Pagos</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-green-500">
                {filteredMensalidades.filter((m) => m.status === "pago").length}
              </p>
            </div>
            <div className="card-elevated rounded-xl p-2.5 sm:p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:text-sm mb-0.5 sm:mb-1">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 hidden sm:block" />
                <span className="truncate">Pendentes</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-yellow-500">
                {filteredMensalidades.filter((m) => m.status === "pendente").length}
              </p>
            </div>
            <div className="card-elevated rounded-xl p-2.5 sm:p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:text-sm mb-0.5 sm:mb-1">
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 hidden sm:block" />
                <span className="truncate">Atrasados</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-red-500">
                {filteredMensalidades.filter((m) => m.status === "atrasado").length}
              </p>
            </div>
          </div>

          {/* Filters - collapsible on mobile */}
          <div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="sm:hidden flex items-center gap-2 text-sm text-muted-foreground w-full px-3 py-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
              <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
            </button>

            <div className={`${filtersOpen ? "flex" : "hidden"} sm:flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 items-start sm:items-center mt-2 sm:mt-0`}>
              <Select value={mesFilter} onValueChange={setMesFilter}>
                <SelectTrigger className="w-full sm:w-36 h-10 rounded-xl bg-muted/50 border-border/50">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {mesesDoAno.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={anoFilter} onValueChange={setAnoFilter}>
                <SelectTrigger className="w-full sm:w-24 h-10 rounded-xl bg-muted/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anosDisponiveis.map((a) => (
                    <SelectItem key={a} value={a}>20{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl bg-muted/50 border-border/50">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Cidade" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/50 border-border/50 rounded-xl h-11"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
            </div>
          ) : filteredMensalidades.length === 0 ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl border-border/50 py-12">
              <h3 className="text-lg font-medium">Nenhum registro encontrado</h3>
              <p className="text-muted-foreground text-sm">Tente alterar os filtros de busca.</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="flex flex-col gap-3 md:hidden">
                {filteredMensalidades.map((m) => (
                  <div
                    key={`${m.alunoId}-${m.id}`}
                    className="card-elevated rounded-xl p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => {
                      setSelectedMensalidade(m);
                      setShowEnviarOptions(false);
                      setModalOpen(true);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{m.aluno}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.cidade}</p>
                    </div>

                    <span className="shrink-0 text-sm font-semibold text-foreground">
                      {formatCurrency(m.valor)}
                    </span>

                    {getStatusBadge(m.status)}
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block card-elevated rounded-2xl overflow-hidden bg-card border border-border/40">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header-gradient hover:bg-primary border-none">
                      <TableHead className="text-primary-foreground font-bold py-4">ALUNO</TableHead>
                      <TableHead className="text-primary-foreground font-bold">CIDADE</TableHead>
                      <TableHead className="text-primary-foreground font-bold text-center">REF</TableHead>
                      <TableHead className="text-primary-foreground font-bold text-center">VALOR</TableHead>
                      <TableHead className="text-primary-foreground font-bold text-center">STATUS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMensalidades.map((m) => (
                      <TableRow
                        key={`${m.alunoId}-${m.id}`}
                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => {
                          setSelectedMensalidade(m);
                          setShowEnviarOptions(false);
                          setModalOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">{m.aluno}</TableCell>
                        <TableCell>{m.cidade}</TableCell>
                        <TableCell className="text-center font-mono">{m.mesReferencia}</TableCell>
                        <TableCell className="text-center">{formatCurrency(m.valor)}</TableCell>
                        <TableCell className="text-center">{getStatusBadge(m.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Detalhes</DialogTitle>
          </DialogHeader>
          {selectedMensalidade && (
            <div className="space-y-6 mt-4">
              <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Aluno:</span>
                  <span className="font-semibold">{selectedMensalidade.aluno}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Mês:</span>
                  <span>{selectedMensalidade.mesReferencia}</span>
                </div>
                <hr className="border-border/30" />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Valor:</span>
                  <span className="font-bold text-lg text-primary">{formatCurrency(selectedMensalidade.valor)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Status:</span>
                  {getStatusBadge(selectedMensalidade.status, "lg")}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Tipo:</span>
                  <span>{selectedMensalidade.tipoPagamento}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Data Pagto:</span>
                  <span>{selectedMensalidade.dataPagamento}</span>
                </div>
              </div>

              {selectedMensalidade.status !== "pago" ? (
                <div className="space-y-3">
                  <Button
                    onClick={() => setConfirmDialogOpen(true)}
                    disabled={isConfirming}
                    className="w-full bg-green-600 hover:bg-green-700 rounded-xl h-12 text-white font-bold transition-all active:scale-95"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Informar Pagamento
                  </Button>

                  <Button
                    onClick={handleGeneratePix}
                    disabled={isGeneratingPix}
                    className="w-full bg-primary hover:bg-primary/90 rounded-xl h-12 text-white font-bold transition-all active:scale-95"
                  >
                    {isGeneratingPix ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-5 w-5 mr-2" /> Gerar Código PIX
                      </>
                    )}
                  </Button>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      className="w-full border-border/50 rounded-xl h-12 font-bold transition-colors"
                      onClick={() => setShowEnviarOptions(!showEnviarOptions)}
                    >
                      <Send className="h-5 w-5 mr-2" /> {showEnviarOptions ? "Ocultar Opções" : "Enviar Cobrança"}
                    </Button>

                    {showEnviarOptions && (
                      <div className="grid grid-cols-1 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <button
                          onClick={handleEnviarCobrancaPush}
                          disabled={isSendingPush}
                          className="flex items-center justify-center gap-2 p-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all disabled:opacity-50"
                        >
                          {isSendingPush ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          ) : (
                            <Send className="h-5 w-5 text-primary" />
                          )}
                          <span className="text-sm font-bold text-primary">
                            {isSendingPush ? "Enviando..." : "Enviar via Push"}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                  <p className="text-green-600 font-bold text-sm">Mensalidade Quitada</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal PIX */}
      <Dialog open={showPixModal} onOpenChange={handleClosePixModal}>
        <DialogContent className="sm:max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Código PIX</DialogTitle>
          </DialogHeader>

          {pixData && (
            <div className="space-y-4 mt-4">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">{selectedMensalidade?.aluno}</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(selectedMensalidade?.valor || 0)}</p>
              </div>

              {pixData.qr_code_base64 && (
                <div className="flex justify-center">
                  <img
                    src={`data:image/png;base64,${pixData.qr_code_base64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 rounded-lg border border-border"
                  />
                </div>
              )}

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Código Copia e Cola:</p>
                <p className="text-xs font-mono break-all max-h-20 overflow-y-auto">{pixData.pixCopiaECola}</p>
              </div>

              <Button onClick={handleCopyPix} className="w-full" variant={copied ? "secondary" : "default"}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar código PIX
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleCheckPaymentStatus}
                disabled={isCheckingStatus}
                className="w-full"
              >
                {isCheckingStatus ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Verificar pagamento
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Envie o QR Code ou código para o aluno efetuar o pagamento.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmação de pagamento */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja confirmar o pagamento de{" "}
              <span className="font-semibold text-foreground">
                {selectedMensalidade ? formatCurrency(selectedMensalidade.valor) : ""}
              </span>{" "}
              do aluno{" "}
              <span className="font-semibold text-foreground">
                {selectedMensalidade?.aluno}
              </span>
              ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirming}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmarPagamento}
              disabled={isConfirming}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isConfirming ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </span>
              ) : (
                "Confirmar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
