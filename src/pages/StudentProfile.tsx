import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ProfilePhotoUpload } from "@/components/profile/ProfilePhotoUpload";
import { AchievementsSection } from "@/components/profile/AchievementsSection";
import { StudentLayout } from "@/components/student/StudentLayout";
import { Skeleton } from "@/components/ui/skeleton";

// Belt images
import BrancaImg from "@/assets/belts/Branca.png";
import AmarelaImg from "@/assets/belts/Amarela.png";
import LaranjaImg from "@/assets/belts/Laranja.png";
import VerdeImg from "@/assets/belts/Verde.png";
import AzulImg from "@/assets/belts/Azul.png";
import RoxaImg from "@/assets/belts/Roxa.png";
import MarromImg from "@/assets/belts/Marrom.png";
import PretaImg from "@/assets/belts/Preta.png";

const BELT_IMAGES: Record<string, string> = {
  Branca: BrancaImg,
  Amarela: AmarelaImg,
  Laranja: LaranjaImg,
  Verde: VerdeImg,
  Azul: AzulImg,
  Roxa: RoxaImg,
  Marrom: MarromImg,
  Preta: PretaImg,
};

const BELT_COLORS: Record<string, string> = {
  Branca: "border-gray-300",
  Amarela: "border-yellow-400",
  Laranja: "border-orange-500",
  Verde: "border-green-500",
  Azul: "border-blue-500",
  Roxa: "border-purple-500",
  Marrom: "border-amber-800",
  Preta: "border-gray-900 dark:border-gray-100",
};

interface StudentData {
  nome: string;
  email: string;
  faixa: string;
  status: string;
  fotoUrl?: string;
  aulasAssistidas?: number;
}

const StudentProfile = () => {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const conquistaId = searchParams.get("conquista");

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!currentUser?.uid) return;

      try {
        const docRef = doc(db, "alunos", currentUser.uid, "infor", "infor");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setStudentData(docSnap.data() as StudentData);
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [currentUser]);

  const getStatusVariant = (status: string) => {
    return status === "Matriculado" || status === "Ativo" ? "default" : "destructive";
  };

  const handlePhotoUpdated = (newUrl: string) => {
    setStudentData((prev) => prev ? { ...prev, fotoUrl: newUrl } : null);
  };

  const beltBorderClass = studentData?.faixa ? BELT_COLORS[studentData.faixa] || "border-primary/20" : "border-primary/20";

  if (loading) {
    return (
      <StudentLayout>
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </main>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {/* Card de Perfil */}
          <Card>
            <CardContent className="pt-4 sm:pt-8 pb-4 sm:pb-6 px-3 sm:px-6">
              {/* Avatar with belt border */}
              <div className="flex flex-col items-center mb-4 sm:mb-8">
                {currentUser?.uid && (
                  <div className="scale-75 sm:scale-100 origin-center">
                    <div className={`rounded-full p-1 border-4 ${beltBorderClass} transition-colors`}>
                      <ProfilePhotoUpload
                        userId={currentUser.uid}
                        currentPhotoUrl={studentData?.fotoUrl}
                        userName={studentData?.nome || ""}
                        onPhotoUpdated={handlePhotoUpdated}
                      />
                    </div>
                  </div>
                )}
                <div className="text-center mt-2 sm:mt-4">
                  <p className="text-lg sm:text-xl font-semibold text-foreground">{studentData?.nome}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{studentData?.email}</p>
                </div>
              </div>

              {/* Faixa e Status */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Faixa com imagem */}
                <div className="relative bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-3 sm:p-4 border border-primary/20 overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <p className="text-xs text-muted-foreground mb-2 sm:mb-3 relative z-10">Faixa Atual</p>
                  <div className="flex flex-col items-center gap-2 relative z-10">
                    {studentData?.faixa && BELT_IMAGES[studentData.faixa] ? (
                      <div className="relative group">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-75 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <img
                          src={BELT_IMAGES[studentData.faixa]}
                          alt={`Faixa ${studentData.faixa}`}
                          className="h-12 sm:h-16 w-auto object-contain drop-shadow-lg relative z-10 transition-transform hover:scale-105"
                        />
                      </div>
                    ) : null}
                    <span className="text-xs sm:text-sm font-semibold text-foreground">
                      {studentData?.faixa}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="relative bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl p-3 sm:p-4 border border-border/50 overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-muted/30 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <p className="text-xs text-muted-foreground mb-2 sm:mb-3 relative z-10">Status</p>
                  <div className="flex flex-col items-center justify-center h-12 sm:h-16 relative z-10">
                    <Badge 
                      variant={getStatusVariant(studentData?.status || "")} 
                      className="text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 shadow-sm"
                    >
                      {studentData?.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements Section */}
          <AchievementsSection
            studentBelt={studentData?.faixa}
            studentData={{
              aulasAssistidas: studentData?.aulasAssistidas || 0,
            }}
            celebrateAchievementId={conquistaId}
            onCelebrationComplete={() => {
              setSearchParams({});
            }}
          />
        </div>
      </main>
    </StudentLayout>
  );
};

export default StudentProfile;
