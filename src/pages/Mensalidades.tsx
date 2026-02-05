import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  Check,
  X,
  Clock,
  QrCode,
  Send,
  MessageCircle,
  Mail,
  CalendarDays,
  Loader2,
  Copy,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

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
        <header className="lg:hidden sticky top-0 z-30 glass border-b p-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2.5 rounded-xl hover:bg-muted/80">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">Mensalidades</h1>
          <div className="w-10" />
        </header>

        <div className="p-4 md:p-6 lg:p-8">
          <div className="hidden lg:flex items-center justify-center mb-8 relative">
            <h1 className="text-3xl font-bold">Mensalidades</h1>
          </div>

          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aluno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 bg-muted/50 rounded-xl h-11 border-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Select value={mesFilter} onValueChange={setMesFilter}>
                  <SelectTrigger className="w-36 h-11 rounded-xl bg-muted/50 border-none">
                    <CalendarDays className="h-4 w-4 mr-2 text-primary" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mesesDoAno.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={anoFilter} onValueChange={setAnoFilter}>
                  <SelectTrigger className="w-24 h-11 rounded-xl bg-muted/50 border-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {anosDisponiveis.map((a) => (
                      <SelectItem key={a} value={a}>
                        20{a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-36 h-11 rounded-xl bg-muted/50 border-none">
                    <SelectValue placeholder="Cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="card-elevated rounded-2xl p-4 border-l-4 border-l-green-500 bg-card shadow-sm">
              <p className="text-sm text-muted-foreground">Pagos</p>
              <p className="text-2xl font-bold text-green-500">
                {mensalidades.filter((m) => m.status === "pago").length}
              </p>
            </div>
            <div className="card-elevated rounded-2xl p-4 border-l-4 border-l-yellow-500 bg-card shadow-sm">
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-500">
                {mensalidades.filter((m) => m.status === "pendente").length}
              </p>
            </div>
            <div className="card-elevated rounded-2xl p-4 border-l-4 border-l-red-500 bg-card shadow-sm">
              <p className="text-sm text-muted-foreground">Atrasados</p>
              <p className="text-2xl font-bold text-red-500">
                {mensalidades.filter((m) => m.status === "atrasado").length}
              </p>
            </div>
          </div>

          <div className="card-elevated rounded-2xl overflow-hidden bg-card border border-border/40">
            <Table>
              <TableHeader>
                <TableRow className="table-header-gradient hover:bg-primary border-none">
                  <TableHead className="text-primary-foreground font-bold py-4">ALUNO</TableHead>
                  <TableHead className="text-primary-foreground font-bold hidden sm:table-cell">CIDADE</TableHead>
                  <TableHead className="text-primary-foreground font-bold text-center">REF</TableHead>
                  <TableHead className="text-primary-foreground font-bold text-center">VALOR</TableHead>
                  <TableHead className="text-primary-foreground font-bold text-center">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" /> Carregando registros...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredMensalidades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMensalidades.map((m) => (
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
                      <TableCell className="hidden sm:table-cell">{m.cidade}</TableCell>
                      <TableCell className="text-center font-mono">{m.mesReferencia}</TableCell>
                      <TableCell className="text-center">{formatCurrency(m.valor)}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(m.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
                    onClick={handleConfirmarPagamento}
                    disabled={isConfirming}
                    className="w-full bg-green-600 hover:bg-green-700 rounded-xl h-12 text-white font-bold transition-all active:scale-95"
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Informar Pagamento
                      </>
                    )}
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
                      <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <button className="flex flex-col items-center justify-center p-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl transition-all group">
                          <MessageCircle className="h-6 w-6 text-green-500 mb-1" />
                          <span className="text-[10px] font-bold text-green-600 uppercase">WhatsApp</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-all group">
                          <Mail className="h-6 w-6 text-blue-500 mb-1" />
                          <span className="text-[10px] font-bold text-blue-600 uppercase">E-mail</span>
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
    </div>
  );
}
