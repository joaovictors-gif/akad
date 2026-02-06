import { AlertTriangle, Phone, Mail, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ContaBloqueada() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const telefoneAcademia = "5589999826221";
  const emailAcademia = "contato@akad.com.br";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full card-elevated rounded-2xl border-destructive/30">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">
            Conta Suspensa
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">
              Sua matrícula foi suspensa devido a <span className="font-semibold text-foreground">2 ou mais mensalidades em atraso</span>.
            </p>
            <p className="text-muted-foreground">
              Para regularizar sua situação e voltar a treinar, entre em contato com a academia.
            </p>
          </div>

          <div className="space-y-3">
            <a
              href={`https://wa.me/${telefoneAcademia}?text=${encodeURIComponent("Olá! Gostaria de regularizar minha matrícula.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                <Phone className="h-4 w-4 mr-2" />
                Falar via WhatsApp
              </Button>
            </a>

            <a
              href={`mailto:${emailAcademia}?subject=${encodeURIComponent("Regularização de Matrícula")}&body=${encodeURIComponent("Olá! Gostaria de regularizar minha matrícula.")}`}
              className="w-full"
            >
              <Button variant="outline" className="w-full rounded-xl">
                <Mail className="h-4 w-4 mr-2" />
                Enviar E-mail
              </Button>
            </a>
          </div>

          <div className="pt-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full text-muted-foreground hover:text-foreground rounded-xl"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair da conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
