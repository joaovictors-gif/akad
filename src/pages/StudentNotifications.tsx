import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle2, AlertCircle, Smartphone, Apple, Download } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Importações do Firebase
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

const StudentNotifications = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { token, isSupported, isPermissionGranted, isLoading, requestPermission } = usePushNotifications();

  // Estado para forçar visualização de teste
  const [forceShowInstall, setForceShowInstall] = useState(false);

  useEffect(() => {
    if (isPermissionGranted && token) {
      navigate("/aluno", { replace: true });
    }
  }, [isPermissionGranted, token, navigate]);

  const handleEnableNotifications = async () => {
    const fcmToken = await requestPermission();

    if (fcmToken && currentUser) {
      try {
        const docRef = doc(db, "alunos", currentUser.uid, "infor", "infor");
        await setDoc(
          docRef,
          {
            token: fcmToken,
            updatedAt: new Date(),
          },
          { merge: true },
        );

        toast.success("Notificações ativadas com sucesso!");
        navigate("/aluno", { replace: true });
      } catch (err) {
        console.error("Erro ao salvar token no Firestore:", err);
        toast.error("Erro ao salvar configurações de notificação");
      }
    }
  };

  // TESTE: Para ver a tela de instalação, mude para: true
  // Para ver a tela normal de ativação, mude para: false
  const showInstallScreen = forceShowInstall || !isSupported;

  if (showInstallScreen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10 w-fit">
              <Smartphone className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Instale o App para Notificações</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground">
              Para receber notificações, você precisa instalar o aplicativo AKAD no seu dispositivo.
            </p>

            {/* BOTÕES DE TESTE - VISÍVEIS APENAS EM DESENVOLVIMENTO */}
            {process.env.NODE_ENV === "development" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Modo Desenvolvimento</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setForceShowInstall(false)} className="flex-1">
                    Ver Tela Normal
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setForceShowInstall(true)}
                    className="flex-1 bg-yellow-100"
                  >
                    Forçar Instalação
                  </Button>
                </div>
                <p className="text-xs text-yellow-600 mt-2">isSupported: {isSupported ? "true" : "false"}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Apple className="h-5 w-5" />
                  <h3 className="font-semibold">Para iPhone (iOS):</h3>
                </div>
                <ol className="text-sm text-left space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="font-medium">1.</span>
                    <span>
                      Toque no ícone <strong>Compartilhar</strong> <span className="inline-block">⎋</span> na parte
                      inferior do Safari
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">2.</span>
                    <span>
                      Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">3.</span>
                    <span>
                      Toque em <strong>"Adicionar"</strong> no canto superior direito
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">4.</span>
                    <span>Abra o app AKAD da tela de início e ative as notificações</span>
                  </li>
                </ol>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Download className="h-5 w-5" />
                  <h3 className="font-semibold">Para Android:</h3>
                </div>
                <ol className="text-sm text-left space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="font-medium">1.</span>
                    <span>
                      Toque no menu <strong>⋮</strong> (três pontos) no canto superior direito do Chrome
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">2.</span>
                    <span>
                      Selecione <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">3.</span>
                    <span>
                      Toque em <strong>"Instalar"</strong> ou <strong>"Adicionar"</strong> na janela de confirmação
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">4.</span>
                    <span>Abra o app AKAD instalado e ative as notificações</span>
                  </li>
                </ol>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-3">
                Após instalar, volte aqui e atualize a página para ativar as notificações.
              </p>
              <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                Atualizar Página
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Ativar Notificações</CardTitle>

          {/* BOTÕES DE TESTE - VISÍVEIS APENAS EM DESENVOLVIMENTO */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={() => setForceShowInstall(true)} className="w-full">
                Testar Tela de Instalação
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Modo desenvolvimento: isSupported = {isSupported ? "true" : "false"}
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            Para uma melhor experiência, ative as notificações e fique por dentro de:
          </p>

          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm">Lembretes de aulas e treinos</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm">Avisos sobre mensalidades</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-sm">Comunicados importantes da academia</span>
            </li>
          </ul>

          <Button onClick={handleEnableNotifications} className="w-full" disabled={isLoading}>
            {isLoading ? (
              "Ativando..."
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Ativar Notificações
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Ao ativar, você concorda em receber notificações do AKAD.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentNotifications;
