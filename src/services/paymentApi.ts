// Serviço de API para pagamentos via Mercado Pago

const API_BASE_URL = "https://app-vaglvpp5la-uc.a.run.app";

export interface PixPaymentResponse {
  pixCopiaECola: string;
  qr_code_base64: string;
  id?: string; // ID do pagamento para verificação de status
  // Caso já esteja pago
  mensagem?: string;
  status?: string;
}

export interface CardPaymentResponse {
  link: string;
  // Caso já esteja pago
  mensagem?: string;
  status?: string;
}

export interface PaymentStatusResponse {
  status: "approved" | "pending" | "rejected" | "cancelled" | "in_process";
  txid: string;
  status_detail?: string;
  date_approved?: string;
  payment_method?: string;
}

/**
 * Cria um pagamento PIX
 */
export async function createPixPayment(
  uid: string,
  mes: string
): Promise<PixPaymentResponse> {
  if (!uid) {
    throw new Error("UID do aluno é obrigatório");
  }
  if (!mes) {
    throw new Error("Mês da mensalidade é obrigatório");
  }

  const response = await fetch(`${API_BASE_URL}/cob/pix`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, mes }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao gerar código PIX");
  }

  return response.json();
}

/**
 * Cria um pagamento via cartão (redireciona para checkout do Mercado Pago)
 */
export async function createCardPayment(
  uid: string,
  mes: string
): Promise<CardPaymentResponse> {
  if (!uid) {
    throw new Error("UID do aluno é obrigatório");
  }
  if (!mes) {
    throw new Error("Mês da mensalidade é obrigatório");
  }

  const response = await fetch(`${API_BASE_URL}/cob/card`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, mes }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Erro ao criar pagamento com cartão");
  }

  return response.json();
}

/**
 * Verifica o status de um pagamento
 */
export async function checkPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
  if (!paymentId) {
    throw new Error("ID do pagamento é obrigatório");
  }

  const response = await fetch(`${API_BASE_URL}/cob/status/${paymentId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Erro ao verificar status do pagamento");
  }

  return response.json();
}
