import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ProfilePhotoUpload } from "@/components/profile/ProfilePhotoUpload";
import { AchievementsSection } from "@/components/profile/AchievementsSection";

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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Get achievement ID from URL to trigger celebration
  const conquistaId = searchParams.get("conquista");

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!currentUser?.uid) return;

      try {
        const docRef = doc(db, "alunos", currentUser.uid, "infor", "infor");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setStudentData(docSnap.data() as StudentData);
        } else {
          console.error("Documento não encontrado!");
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [currentUser]);

  const getBeltColor = (belt: string) => {
    const colors: Record<string, string> = {
      Branca: "bg-white text-black border border-border",
      Amarela: "bg-yellow-400 text-black",
      Laranja: "bg-orange-500 text-white",
      Verde: "bg-green-600 text-white",
      Azul: "bg-blue-600 text-white",
      Roxa: "bg-purple-600 text-white",
      Marrom: "bg-amber-800 text-white",
      Preta: "bg-black text-white",
    };
    return colors[belt] || "bg-muted text-muted-foreground";
  };

  const getStatusVariant = (status: string) => {
    return status === "Matriculado" || status === "Ativo" ? "default" : "destructive";
  };

  const handlePhotoUpdated = (newUrl: string) => {
    setStudentData((prev) => prev ? { ...prev, fotoUrl: newUrl } : null);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/aluno")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Meu Perfil</h1>
            <p className="text-xs text-muted-foreground">Área do Aluno</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col items-center mb-8">
              {currentUser?.uid && (
                <ProfilePhotoUpload
                  userId={currentUser.uid}
                  currentPhotoUrl={studentData?.fotoUrl}
                  userName={studentData?.nome || ""}
                  onPhotoUpdated={handlePhotoUpdated}
                />
              )}
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Nome</p>
                <p className="text-xl font-semibold text-foreground">{studentData?.nome}</p>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">E-mail</p>
                <p className="text-base text-foreground">{studentData?.email}</p>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Faixa Atual</p>
                <div className="flex justify-center">
                  <span className={`px-6 py-2 rounded-full font-medium ${getBeltColor(studentData?.faixa || "")}`}>
                    {studentData?.faixa}
                  </span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Status do aluno</p>
                <div className="flex justify-center">
                  <Badge variant={getStatusVariant(studentData?.status || "")} className="text-sm px-4 py-1">
                    {studentData?.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements Section */}
        <div className="max-w-md mx-auto">
          <AchievementsSection
            studentBelt={studentData?.faixa}
            studentData={{
              aulasAssistidas: studentData?.aulasAssistidas || 0,
            }}
            celebrateAchievementId={conquistaId}
            onCelebrationComplete={() => {
              // Remove the query parameter after celebration
              setSearchParams({});
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default StudentProfile;
