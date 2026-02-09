import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useNextClass } from "@/hooks/useNextClass";
import { doc, getDoc, updateDoc, collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { staggerContainerVariants, staggerItemVariants } from "@/components/PageTransition";
import { StudentLayout } from "@/components/student/StudentLayout";
import { BeltCard } from "@/components/student/BeltCard";
import { FinancialBadge } from "@/components/student/FinancialBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProductCarousel } from "@/components/student/ProductCarousel";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Detecta se está rodando como PWA instalado
const isInstalledPWA = () => {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
};

interface StudentInfo {
  nome?: string;
  faixa?: string;
  aulasAssistidas?: number;
}

const StudentDashboard = () => {
  const { currentUser, logout } = useAuth();
  const { requestPermission, isSupported } = usePushNotifications();
  const { proximaAula, isLoading: isLoadingAula } = useNextClass();
  const [tokenChecked, setTokenChecked] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);

  // Financial summary
  const [pendingCount, setPendingCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const [isLoadingFinancial, setIsLoadingFinancial] = useState(true);

  // Busca informações do aluno do Firestore
  useEffect(() => {
    const fetchStudentInfo = async () => {
      if (!currentUser?.uid || !db) return;
      
      try {
        const docRef = doc(db, "alunos", currentUser.uid, "infor", "infor");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStudentInfo({
            nome: data.nome,
            faixa: data.faixa,
            aulasAssistidas: data.aulasAssistidas || 0,
          });
        }
      } catch (error) {
        console.error("Erro ao buscar info do aluno:", error);
      } finally {
        setIsLoadingInfo(false);
      }
    };

    fetchStudentInfo();
  }, [currentUser?.uid]);

  // Busca resumo financeiro
  useEffect(() => {
    if (!currentUser?.uid || !db) {
      setIsLoadingFinancial(false);
      return;
    }

    const mensRef = collection(db, `alunos/${currentUser.uid}/mensalidades`);
    const unsubscribe = onSnapshot(mensRef, (snapshot) => {
      let pending = 0;
      let overdue = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const status = data.status;
        if (status === "Atrasada") overdue++;
        else if (!["Pago", "Pago com Desconto", "Pago com Atraso", "Convênio"].includes(status)) {
          pending++;
        }
      });

      setPendingCount(pending);
      setOverdueCount(overdue);
      setIsLoadingFinancial(false);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Atualiza o token FCM automaticamente
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
        const docRef = doc(db!, "alunos", currentUser.uid, "infor", "infor");
        const docSnap = await getDoc(docRef);
        const currentData = docSnap.exists() ? docSnap.data() : {};
        
        const savedMode = currentData.tokenMode;
        const currentMode = isPWA ? "pwa" : "browser";
        const modeChanged = savedMode && savedMode !== currentMode;

        if (modeChanged || isPWA || !currentData.token) {
          const newToken = await requestPermission();
          
          if (newToken && db) {
            await updateDoc(docRef, {
              token: newToken,
              tokenMode: currentMode,
              tokenUpdatedAt: new Date().toISOString(),
            });
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

  const studentName = studentInfo?.nome;

  return (
    <StudentLayout>
      <OnboardingModal isAdmin={false} />

      {/* Header with theme toggle */}
      <div className="flex items-center justify-end px-4 pt-4">
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        {/* Greeting */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5"
        >
          {isLoadingInfo ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-foreground">
                Olá, {studentName?.split(" ")[0] || currentUser?.email?.split("@")[0]}!
              </h2>
              <p className="text-muted-foreground">Bem-vindo à sua área do aluno</p>
            </>
          )}
        </motion.div>

        {/* Belt Card */}
        {isLoadingInfo ? (
          <Skeleton className="h-20 w-full rounded-lg mb-4" />
        ) : (
          <div className="mb-4">
            <BeltCard 
              currentBelt={studentInfo?.faixa} 
              aulasAssistidas={studentInfo?.aulasAssistidas} 
            />
          </div>
        )}

        {/* Próxima Aula */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoadingAula ? (
            <Skeleton className="h-24 w-full rounded-lg mb-4" />
          ) : proximaAula ? (
            <Card className="mb-4 border-primary/30 bg-primary/5">
              <CardHeader className="flex flex-row items-center gap-4 pb-2 p-4">
                <div className="p-3 rounded-lg bg-primary/20">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Próxima Aula</p>
                  <CardTitle className="text-base flex items-center gap-2">
                    {proximaAula.tipoAula}
                    {proximaAula.isFlexivel && (
                      <span className="text-[10px] px-2 py-0.5 bg-accent rounded-full text-accent-foreground font-normal">
                        Especial
                      </span>
                    )}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium text-foreground">
                    {proximaAula.data} às {proximaAula.horario}
                  </span>
                  <span className="text-muted-foreground">• {proximaAula.professor}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-4 border-muted bg-muted/20">
              <CardContent className="py-5 text-center">
                <p className="text-muted-foreground text-sm">Nenhuma aula agendada</p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Financial Summary Badge */}
        {isLoadingFinancial ? (
          <Skeleton className="h-16 w-full rounded-lg mb-4" />
        ) : (
          <div className="mb-4">
            <FinancialBadge 
              pendingCount={pendingCount} 
              overdueCount={overdueCount}
              isLoading={isLoadingFinancial}
            />
          </div>
        )}

        {/* Produtos da Loja */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-4"
        >
          <ProductCarousel />
        </motion.div>
      </main>
    </StudentLayout>
  );
};

export default StudentDashboard;
