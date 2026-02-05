import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, User, Calendar, CreditCard, Clock, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useNextClass } from "@/hooks/useNextClass";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { staggerContainerVariants, staggerItemVariants, cardHoverVariants } from "@/components/PageTransition";

// Detecta se está rodando como PWA instalado
const isInstalledPWA = () => {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
};

const StudentDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { requestPermission, isSupported } = usePushNotifications();
  const { proximaAula, isLoading: isLoadingAula } = useNextClass();
  const [tokenChecked, setTokenChecked] = useState(false);
  const [studentName, setStudentName] = useState<string | null>(null);

  // Busca o nome do aluno do Firestore
  useEffect(() => {
    const fetchStudentName = async () => {
      if (!currentUser?.uid || !db) return;
      
      try {
        const docRef = doc(db, "alunos", currentUser.uid, "infor", "infor");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setStudentName(docSnap.data().nome || null);
        }
      } catch (error) {
        console.error("Erro ao buscar nome do aluno:", error);
      }
    };

    fetchStudentName();
  }, [currentUser?.uid]);

  // Atualiza o token FCM automaticamente quando o aluno entra no dashboard
  // Especialmente importante quando o usuário instala o PWA após ativar notificações no browser
  useEffect(() => {
    const updateToken = async () => {
      if (!currentUser?.uid || !isSupported || tokenChecked) return;

      const isPWA = isInstalledPWA();
      const hasNotificationPermission = Notification.permission === "granted";

      if (!hasNotificationPermission) {
        setTokenChecked(true);
        return;
      }

      try {
        // Busca o token atual no Firestore
        const docRef = doc(db!, "alunos", currentUser.uid, "infor", "infor");
        const docSnap = await getDoc(docRef);
        const currentData = docSnap.exists() ? docSnap.data() : {};
        
        // Verifica se o modo de execução mudou (browser → PWA ou vice-versa)
        const savedMode = currentData.tokenMode;
        const currentMode = isPWA ? "pwa" : "browser";
        const modeChanged = savedMode && savedMode !== currentMode;

        // Sempre gera um novo token se:
        // 1. O modo mudou (browser → PWA)
        // 2. Está rodando como PWA instalado
        // 3. Não tem token salvo
        if (modeChanged || isPWA || !currentData.token) {
          console.log("[Dashboard] Gerando novo token FCM:", { 
            modeChanged, 
            isPWA, 
            savedMode, 
            currentMode 
          });

          const newToken = await requestPermission();
          
          if (newToken && db) {
            await updateDoc(docRef, {
              token: newToken,
              tokenMode: currentMode,
              tokenUpdatedAt: new Date().toISOString(),
            });
            console.log("[Dashboard] Token FCM atualizado para modo:", currentMode);
          }
        }
      } catch (error) {
        console.error("[Dashboard] Erro ao atualizar token:", error);
      } finally {
        setTokenChecked(true);
      }
    };

    updateToken();
  }, [currentUser?.uid, isSupported, tokenChecked, requestPermission]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <OnboardingModal isAdmin={false} />
      
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="border-b border-border bg-card sticky top-0 z-50 pt-[env(safe-area-inset-top)]"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-bold text-foreground">AKAD</h1>
              <p className="text-xs text-muted-foreground">Área do Aluno</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {studentName || currentUser?.email}
            </span>
            <ThemeToggle />
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-foreground">
            Olá, {studentName?.split(" ")[0] || currentUser?.email?.split("@")[0]}!
          </h2>
          <p className="text-muted-foreground">Bem-vindo à sua área do aluno</p>
        </motion.div>

        {/* Próxima Aula - Destaque */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoadingAula ? (
            <Card className="mb-6 border-primary/30 bg-primary/5">
              <CardContent className="py-6 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : proximaAula ? (
            <Card className="mb-6 border-primary/30 bg-primary/5">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-3 rounded-lg bg-primary/20">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Próxima Aula</p>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {proximaAula.tipoAula}
                    {proximaAula.isFlexivel && (
                      <span className="text-xs px-2 py-0.5 bg-accent rounded-full text-accent-foreground font-normal">
                        Especial
                      </span>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium text-foreground">
                    {proximaAula.data} às {proximaAula.horario}
                  </span>
                  <span className="text-muted-foreground">• {proximaAula.professor}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6 border-muted bg-muted/20">
              <CardContent className="py-6 text-center">
                <p className="text-muted-foreground">Nenhuma aula agendada</p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainerVariants}
          initial="initial"
          animate="animate"
        >
          {/* Perfil */}
          <motion.div variants={staggerItemVariants}>
            <motion.div
              variants={cardHoverVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <Card
                className="hover:border-primary/50 transition-colors cursor-pointer h-full"
                onClick={() => navigate("/aluno/perfil")}
              >
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Meu Perfil</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Visualize e atualize suas informações pessoais
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Agenda */}
          <motion.div variants={staggerItemVariants}>
            <motion.div
              variants={cardHoverVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <Card 
                className="hover:border-primary/50 transition-colors cursor-pointer h-full"
                onClick={() => navigate("/aluno/aulas")}
              >
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Agenda de Aulas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Confira seus horários e aulas programadas
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Mensalidades */}
          <motion.div variants={staggerItemVariants}>
            <motion.div
              variants={cardHoverVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
            >
              <Card
                className="hover:border-primary/50 transition-colors cursor-pointer h-full"
                onClick={() => navigate("/aluno/mensalidades")}
              >
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Mensalidades</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe suas mensalidades e pagamentos
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default StudentDashboard;

