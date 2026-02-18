import { auth } from "@/lib/firebase";

/**
 * URLs base da API
 * Ambas apontam para o mesmo backend — usar a que já estava em cada contexto.
 */
export const API_BASE = "https://us-central1-akad-fbe7e.cloudfunctions.net/app";
export const API_BASE_RUN = "https://app-vaglvpp5la-uc.a.run.app";

/**
 * Retorna o ID Token do usuário autenticado no Firebase Auth.
 * Lança erro se não houver usuário logado.
 */
const getAuthToken = async (): Promise<string> => {
  const user = auth?.currentUser;
  if (!user) throw new Error("Usuário não autenticado");
  return user.getIdToken();
};

/**
 * Wrapper do fetch que injeta automaticamente o header Authorization
 * com o Bearer token do Firebase Auth.
 *
 * Uso: substitua `fetch(url, options)` por `fetchWithAuth(url, options)`.
 * A assinatura é idêntica ao fetch nativo.
 */
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const token = await getAuthToken();

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, { ...options, headers });
};
