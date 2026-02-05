import { Bell, BellRing, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ReactNode } from "react";

interface NotificationGateProps {
  children: ReactNode;
}

export const NotificationGate = ({ children }: NotificationGateProps) => {
  const { token, isSupported, isPermissionGranted, isLoading, requestPermission } = usePushNotifications();
  const { currentUser } = useAuth();

  const handleEnableNotifications = async () => {
    const fcmToken = await requestPermission();
    if (fcmToken && currentUser) {
      try {
        // Save token to the student's infor subcollection via API
        const response = await fetch(
          `https://us-central1-akad-fbe7e.cloudfunctions.net/app/alunos/${currentUser.uid}/infor/infor`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: fcmToken }),
          }
        );

        if (response.ok) {
          toast.success("Notificações ativadas com sucesso!");
        } else {
          throw new Error("Failed to save token");
        }
      } catch (error) {
        console.error("Erro ao salvar token:", error);
        toast.error("Erro ao salvar configuração");
      }
    }
  };

  // If notifications are granted and we have a token, show the children
  if (isPermissionGranted && token) {
    return <>{children}</>;
  }

  // If not supported, show error but allow access
  if (!isSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-xl">Notificações não suportadas</CardTitle>
            <CardDescription>
              Seu navegador não suporta notificações push. Por favor, utilize um navegador compatível.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show notification request screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md animate-fade-in-up">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <BellRing className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Ative as Notificações</CardTitle>
          <CardDescription className="text-base mt-2">
            Para utilizar o aplicativo, você precisa ativar as notificações push. 
            Isso nos permite enviar avisos importantes sobre suas aulas, pagamentos e comunicados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">Você receberá:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Lembretes de aulas
              </li>
              <li className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Avisos de mensalidades
              </li>
              <li className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Comunicados importantes
              </li>
            </ul>
          </div>


          <Button 
            onClick={handleEnableNotifications} 
            disabled={isLoading}
            className="w-full h-12 text-base gap-2"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Ativando...
              </>
            ) : (
              <>
                <Bell className="h-5 w-5" />
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
