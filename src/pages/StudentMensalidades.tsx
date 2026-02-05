import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, QrCode, Copy, Check, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import {
  createPixPayment,
  createCardPayment,
  checkPaymentStatus,
  type PixPaymentResponse,
} from "@/services/paymentApi";

interface Mensalidade {
  id: string;
  mes: string;
  valor: number;
  status: "pago" | "pendente" | "atrasado";
  dataPagamento?: string;
  dataVencimento?: string;
  tipoPagamento?: string;
}

const StudentMensalidades = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedMensalidade, setSelectedMensalidade] = useState<Mensalidade | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");

  // Estados do PIX
  const [showPixCode, setShowPixCode] = useState(false);
  const [pixData, setPixData] = useState<PixPaymentResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Estados do Cartão
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  // Polling para verificar status do pagamento
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Busca email do aluno
  useEffect(() => {
    const fetchUserEmail = async () => {
      if (!currentUser?.uid) return;
      try {
        const inforRef = doc(db, `alunos/${currentUser.uid}/infor/infor`);
        const inforSnap = await getDoc(inforRef);
        if (inforSnap.exists()) {
          const data = inforSnap.data();
          setUserEmail(data.email || currentUser.email || "");
        }
      } catch (error) {
        console.error("Erro ao buscar email:", error);
        setUserEmail(currentUser.email || "");
      }
    };
    fetchUserEmail();
  }, [currentUser]);

  // Busca mensalidades reais do Firebase
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const mensRef = collection(db, `alunos/${currentUser.uid}/mensalidades`);

    const unsubscribe = onSnapshot(mensRef, (snapshot) => {
      const fetchedMensalidades: Mensalidade[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        let dataFormatada = undefined;
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

        const mesReferencia = doc.id.replace("-", "/20");

        let dataVencimento = undefined;
        if (statusTraduzido !== "pago") {
          const [mesNome, ano] = doc.id.split("-");
          const mesesMap: Record<string, number> = {
            Janeiro: 1, Fevereiro: 2, Março: 3, Abril: 4,
            Maio: 5, Junho: 6, Julho: 7, Agosto: 8,
            Setembro: 9, Outubro: 10, Novembro: 11, Dezembro: 12,
          };
          const mesNum = mesesMap[mesNome];
          if (mesNum && ano) {
            dataVencimento = `10/${String(mesNum).padStart(2, "0")}/20${ano}`;
          }
        }

        fetchedMensalidades.push({
          id: doc.id,
          mes: mesReferencia,
          valor: data.valor || 0,
          status: statusTraduzido,
          dataPagamento: dataFormatada,
          dataVencimento,
          tipoPagamento: data.tipo_pagamento || data.tipoPagamento,
        });
      });

      fetchedMensalidades.sort((a, b) => {
        const getDate = (mes: string) => {
          const [mesNome, ano] = mes.split("/");
          const mesesMap: Record<string, number> = {
            Janeiro: 0, Fevereiro: 1, Março: 2, Abril: 3,
            Maio: 4, Junho: 5, Julho: 6, Agosto: 7,
            Setembro: 8, Outubro: 9, Novembro: 10, Dezembro: 11,
          };
          return new Date(parseInt(ano), mesesMap[mesNome] || 0);
        };
        return getDate(b.mes).getTime() - getDate(a.mes).getTime();
      });

      setMensalidades(fetchedMensalidades);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Lógica para abrir o modal via notificação
  useEffect(() => {
    const shouldOpenPay = searchParams.get("pay") === "true";
    const mesAlvo = searchParams.get("mes");

    if (shouldOpenPay && mesAlvo && mensalidades.length > 0) {
      const mensalidadeEncontrada = mensalidades.find((m) => m.mes === mesAlvo && m.status !== "pago");

      if (mensalidadeEncontrada) {
        setSelectedMensalidade(mensalidadeEncontrada);
        setIsPaymentModalOpen(true);
      }

      const newParams = new URLSearchParams(searchParams);
      newParams.delete("pay");
      newParams.delete("mes");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, mensalidades]);

  // Limpa polling ao desmontar
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Pago</Badge>;
      case "pendente":
        return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Pendente</Badge>;
      case "atrasado":
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Atrasado</Badge>;
      default:
        return null;
    }
  };

  const handlePayClick = (mensalidade: Mensalidade) => {
    setSelectedMensalidade(mensalidade);
    setShowPixCode(false);
    setPixData(null);
    setCopied(false);
    setIsPaymentModalOpen(true);
  };

  // Verifica status do pagamento PIX
  const handleCheckPaymentStatus = useCallback(async () => {
    if (!pixData?.id) {
      toast.info("Verificação automática não disponível. Verifique no seu banco.");
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
        handleCloseModal();
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
    }, 10000); // Verifica a cada 10 segundos
  }, [handleCheckPaymentStatus]);

  // Gera código PIX real
  const handlePixPayment = async () => {
    if (!selectedMensalidade || !currentUser?.uid) return;

    setIsGeneratingPix(true);
    try {
      const response = await createPixPayment(currentUser.uid, selectedMensalidade.id);

      // Verifica se já está pago
      if (response.mensagem) {
        toast.info(response.mensagem);
        return;
      }

      setPixData(response);
      setShowPixCode(true);
      if (response.id) {
        startPolling();
      }
      toast.success("Código PIX gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PIX:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar código PIX");
    } finally {
      setIsGeneratingPix(false);
    }
  };

  // Pagamento com cartão
  const handleCreditCardPayment = async () => {
    if (!selectedMensalidade || !currentUser?.uid) return;

    setIsGeneratingCard(true);
    try {
      const response = await createCardPayment(currentUser.uid, selectedMensalidade.id);

      // Verifica se já está pago
      if (response.mensagem) {
        toast.info(response.mensagem);
        return;
      }

      // Abre o checkout do Mercado Pago em nova aba
      window.open(response.link, "_blank");
      toast.success("Redirecionando para o checkout...");
    } catch (error) {
      console.error("Erro ao criar pagamento:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao processar pagamento");
    } finally {
      setIsGeneratingCard(false);
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

  const handleCloseModal = () => {
    setIsPaymentModalOpen(false);
    setShowPixCode(false);
    setPixData(null);
    setCopied(false);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/aluno")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-bold text-foreground">AKAD</h1>
              <p className="text-xs text-muted-foreground">Mensalidades</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Minhas Mensalidades</h2>
          <p className="text-muted-foreground">Acompanhe e pague suas mensalidades</p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : mensalidades.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Nenhuma mensalidade encontrada</p>
            </CardContent>
          </Card>
        ) : (
          /* Lista de Mensalidades */
          <div className="space-y-4">
            {mensalidades.map((mensalidade) => (
              <Card key={mensalidade.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-foreground">{mensalidade.mes}</h3>
                        {getStatusBadge(mensalidade.status)}
                      </div>
                      <p className="text-lg font-bold text-primary">{formatCurrency(mensalidade.valor)}</p>
                      {mensalidade.dataPagamento && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Pago em: {mensalidade.dataPagamento}
                          {mensalidade.tipoPagamento && ` (${mensalidade.tipoPagamento})`}
                        </p>
                      )}
                      {mensalidade.status !== "pago" && mensalidade.dataVencimento && (
                        <p className="text-sm text-muted-foreground mt-1">Vencimento: {mensalidade.dataVencimento}</p>
                      )}
                    </div>

                    {mensalidade.status !== "pago" && (
                      <Button onClick={() => handlePayClick(mensalidade)} className="w-full sm:w-auto">
                        Pagar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Pagamento */}
      <Dialog open={isPaymentModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{showPixCode ? "Código PIX" : "Escolha a forma de pagamento"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="text-center mb-6">
              <p className="text-muted-foreground">{selectedMensalidade?.mes}</p>
              <p className="text-2xl font-bold text-primary">
                {selectedMensalidade && formatCurrency(selectedMensalidade.valor)}
              </p>
            </div>

            {showPixCode && pixData ? (
              /* Exibe código PIX gerado */
              <div className="space-y-4">
                {/* QR Code Visual */}
                {pixData.qr_code_base64 && (
                  <div className="flex justify-center">
                    <img
                      src={`data:image/png;base64,${pixData.qr_code_base64}`}
                      alt="QR Code PIX"
                      className="w-48 h-48 rounded-lg border border-border"
                    />
                  </div>
                )}

              {/* Código Copia e Cola */}
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

                {/* Botão verificar status */}
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
                  Abra o app do seu banco, escolha pagar com PIX e escaneie o QR Code ou cole o código.
                </p>

                <Button variant="outline" onClick={() => setShowPixCode(false)} className="w-full">
                  Voltar
                </Button>
              </div>
            ) : (
              /* Opções de pagamento */
              <>
                <Button
                  variant="outline"
                  className="w-full h-16 justify-start gap-4"
                  onClick={handlePixPayment}
                  disabled={isGeneratingPix}
                >
                  {isGeneratingPix ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <div className="p-2 rounded-lg bg-primary/10">
                      <QrCode className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-semibold">PIX</p>
                    <p className="text-sm text-muted-foreground">
                      {isGeneratingPix ? "Gerando código..." : "Gerar código PIX"}
                    </p>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-16 justify-start gap-4"
                  onClick={handleCreditCardPayment}
                  disabled={isGeneratingCard}
                >
                  {isGeneratingCard ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-semibold">Cartão de Crédito</p>
                    <p className="text-sm text-muted-foreground">
                      {isGeneratingCard ? "Redirecionando..." : "Pagar com cartão"}
                    </p>
                  </div>
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentMensalidades;
