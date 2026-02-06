import { useState, useEffect, useRef } from "react";
import { Lock, Trophy, Award, Star, Target, Flame, Medal, Crown, Zap, PartyPopper } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";
import { toast } from "sonner";

// Belt images
import BrancaImg from "@/assets/belts/Branca.png";
import AmarelaImg from "@/assets/belts/Amarela.png";
import LaranjaImg from "@/assets/belts/Laranja.png";
import VerdeImg from "@/assets/belts/Verde.png";
import AzulImg from "@/assets/belts/Azul.png";
import RoxaImg from "@/assets/belts/Roxa.png";
import MarromImg from "@/assets/belts/Marrom.png";
import PretaImg from "@/assets/belts/Preta.png";

interface Achievement {
  id: string;
  name: string;
  description: string;
  howToUnlock: string;
  icon: "trophy" | "award" | "star" | "target" | "flame" | "medal" | "crown" | "zap";
  unlocked: boolean;
  unlockedAt?: string;
  relatedBelt?: string;
}

interface AchievementsSectionProps {
  studentBelt?: string;
  studentData?: {
    tempoTreino?: number;
    aulasAssistidas?: number;
    examePrimeiraVez?: boolean;
  };
  celebrateAchievementId?: string | null;
  onCelebrationComplete?: () => void;
}

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

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-class",
    name: "Primeira Aula",
    description: "Participou da primeira aula",
    howToUnlock: "Compareça à sua primeira aula de karatê na academia. Este é o primeiro passo na sua jornada nas artes marciais!",
    icon: "star",
    unlocked: false,
  },
  {
    id: "yellow-belt",
    name: "Faixa Amarela",
    description: "Conquistou a faixa amarela",
    howToUnlock: "Complete o treinamento básico e passe no exame de faixa amarela. Você precisará dominar as técnicas básicas de postura, socos e bloqueios.",
    icon: "award",
    unlocked: false,
    relatedBelt: "Amarela",
  },
  {
    id: "orange-belt",
    name: "Faixa Laranja",
    description: "Conquistou a faixa laranja",
    howToUnlock: "Após conquistar a faixa amarela, continue treinando e passe no exame de faixa laranja. Demonstre evolução nas técnicas e katas.",
    icon: "award",
    unlocked: false,
    relatedBelt: "Laranja",
  },
  {
    id: "green-belt",
    name: "Faixa Verde",
    description: "Conquistou a faixa verde",
    howToUnlock: "Evolua suas habilidades e passe no exame de faixa verde. Você precisará demonstrar fluência nos katas intermediários.",
    icon: "award",
    unlocked: false,
    relatedBelt: "Verde",
  },
  {
    id: "blue-belt",
    name: "Faixa Azul",
    description: "Conquistou a faixa azul",
    howToUnlock: "Continue sua evolução e passe no exame de faixa azul. Demonstre domínio das técnicas e kumite básico.",
    icon: "award",
    unlocked: false,
    relatedBelt: "Azul",
  },
  {
    id: "purple-belt",
    name: "Faixa Roxa",
    description: "Conquistou a faixa roxa",
    howToUnlock: "Alcance o nível avançado passando no exame de faixa roxa. Você precisará demonstrar katas avançados e técnicas refinadas.",
    icon: "award",
    unlocked: false,
    relatedBelt: "Roxa",
  },
  {
    id: "brown-belt",
    name: "Faixa Marrom",
    description: "Conquistou a faixa marrom",
    howToUnlock: "Passe no exame de faixa marrom, demonstrando excelência técnica e conhecimento profundo das artes marciais.",
    icon: "medal",
    unlocked: false,
    relatedBelt: "Marrom",
  },
  {
    id: "black-belt",
    name: "Faixa Preta",
    description: "Conquistou a faixa preta",
    howToUnlock: "O ápice da jornada! Passe no exame de faixa preta demonstrando maestria completa em todas as técnicas, katas e filosofia do karatê.",
    icon: "crown",
    unlocked: false,
    relatedBelt: "Preta",
  },
  {
    id: "10-classes",
    name: "Dedicação",
    description: "Completou 10 aulas",
    howToUnlock: "Participe de 10 aulas na academia. Continue frequentando regularmente para desbloquear esta conquista!",
    icon: "target",
    unlocked: false,
  },
  {
    id: "50-classes",
    name: "Comprometido",
    description: "Completou 50 aulas",
    howToUnlock: "Participe de 50 aulas na academia. Sua dedicação e constância serão recompensadas!",
    icon: "flame",
    unlocked: false,
  },
  {
    id: "100-classes",
    name: "Guerreiro",
    description: "Completou 100 aulas",
    howToUnlock: "Participe de 100 aulas na academia. Você se tornará um verdadeiro guerreiro do karatê!",
    icon: "trophy",
    unlocked: false,
  },
  {
    id: "first-exam",
    name: "Primeiro Exame",
    description: "Passou no primeiro exame de faixa",
    howToUnlock: "Participe e seja aprovado no seu primeiro exame de graduação de faixa. Prepare-se bem e demonstre suas habilidades!",
    icon: "zap",
    unlocked: false,
  },
];

const BELT_ORDER = ["Branca", "Amarela", "Laranja", "Verde", "Azul", "Roxa", "Marrom", "Preta"];

const BELT_TO_ACHIEVEMENT: Record<string, string> = {
  Amarela: "yellow-belt",
  Laranja: "orange-belt",
  Verde: "green-belt",
  Azul: "blue-belt",
  Roxa: "purple-belt",
  Marrom: "brown-belt",
  Preta: "black-belt",
};

// Class milestones for progress calculation
const CLASS_MILESTONES: Record<string, number> = {
  "first-class": 1,
  "10-classes": 10,
  "50-classes": 50,
  "100-classes": 100,
};

const IconComponent = ({ icon, className }: { icon: Achievement["icon"]; className?: string }) => {
  const icons = {
    trophy: Trophy,
    award: Award,
    star: Star,
    target: Target,
    flame: Flame,
    medal: Medal,
    crown: Crown,
    zap: Zap,
  };
  const Icon = icons[icon];
  return <Icon className={className} />;
};

export function AchievementsSection({ studentBelt, studentData, celebrateAchievementId, onCelebrationComplete }: AchievementsSectionProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [celebratingAchievement, setCelebratingAchievement] = useState<Achievement | null>(null);
  const previousUnlockedRef = useRef<Set<string>>(new Set());
  const hasInitializedRef = useRef(false);
  const hasCelebratedFromUrlRef = useRef(false);

  const getUnlockedAchievements = (): Achievement[] => {
    const beltIndex = studentBelt ? BELT_ORDER.indexOf(studentBelt) : -1;

    return ACHIEVEMENTS.map((achievement) => {
      let unlocked = false;

      if (BELT_TO_ACHIEVEMENT[studentBelt || ""] === achievement.id) {
        unlocked = true;
      }

      const achievementBelt = Object.entries(BELT_TO_ACHIEVEMENT).find(
        ([, id]) => id === achievement.id
      )?.[0];

      if (achievementBelt && beltIndex > BELT_ORDER.indexOf(achievementBelt)) {
        unlocked = true;
      }

      const classes = studentData?.aulasAssistidas || 0;
      
      // First class unlocked when aulasAssistidas >= 1
      if (achievement.id === "first-class" && classes >= 1) {
        unlocked = true;
      }

      if (achievement.id === "10-classes" && classes >= 10) unlocked = true;
      if (achievement.id === "50-classes" && classes >= 50) unlocked = true;
      if (achievement.id === "100-classes" && classes >= 100) unlocked = true;

      if (achievement.id === "first-exam" && beltIndex > 0) {
        unlocked = true;
      }

      return { ...achievement, unlocked };
    });
  };

  const achievements = getUnlockedAchievements();
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // Trigger celebration for newly unlocked achievements
  const triggerCelebration = (achievement: Achievement) => {
    setCelebratingAchievement(achievement);
    
    // Fire confetti
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const colors = ["#FFD700", "#FFA500", "#FF6347", "#32CD32", "#1E90FF", "#9370DB"];

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.9),
          y: Math.random() - 0.2,
        },
        colors,
        ticks: 60,
        gravity: 1.2,
        scalar: 1.2,
        shapes: ["star", "circle"],
      });
    }, 250);

    // Show toast notification
    toast.success(`🏆 Parabéns! Você desbloqueou: ${achievement.name}`, {
      description: achievement.description,
      duration: 5000,
    });

    // Close celebration modal after animation
    setTimeout(() => {
      setCelebratingAchievement(null);
      onCelebrationComplete?.();
    }, 4000);
  };

  // Trigger celebration from URL parameter
  useEffect(() => {
    if (celebrateAchievementId && !hasCelebratedFromUrlRef.current) {
      const achievement = achievements.find((a) => a.id === celebrateAchievementId);
      if (achievement && achievement.unlocked) {
        hasCelebratedFromUrlRef.current = true;
        // Small delay to ensure component is mounted
        setTimeout(() => {
          triggerCelebration(achievement);
        }, 500);
      }
    }
  }, [celebrateAchievementId, achievements]);

  // Check for newly unlocked achievements
  useEffect(() => {
    const currentUnlocked = new Set(
      achievements.filter((a) => a.unlocked).map((a) => a.id)
    );

    if (hasInitializedRef.current) {
      // Find newly unlocked achievements
      currentUnlocked.forEach((id) => {
        if (!previousUnlockedRef.current.has(id)) {
          const newAchievement = achievements.find((a) => a.id === id);
          if (newAchievement) {
            triggerCelebration(newAchievement);
          }
        }
      });
    } else {
      hasInitializedRef.current = true;
    }

    previousUnlockedRef.current = currentUnlocked;
  }, [achievements]);

  return (
    <>
      <Card>
        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Conquistas
            <span className="text-xs sm:text-sm font-normal text-muted-foreground ml-auto">
              {unlockedCount}/{achievements.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5 sm:gap-3">
            {achievements.map((achievement) => (
              <button
                key={achievement.id}
                onClick={() => setSelectedAchievement(achievement)}
                className={cn(
                  "relative flex flex-col items-center p-1.5 sm:p-3 rounded-lg sm:rounded-xl transition-all cursor-pointer hover:scale-105",
                  achievement.unlocked
                    ? "bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30"
                    : "bg-muted/30 border border-border/50 opacity-60 hover:opacity-80"
                )}
              >
                <div
                  className={cn(
                    "relative h-7 w-7 sm:h-10 sm:w-10 rounded-full flex items-center justify-center mb-1 sm:mb-2",
                    achievement.unlocked
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <IconComponent icon={achievement.icon} className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                  {!achievement.unlocked && (
                    <div className="absolute inset-0 bg-background/60 rounded-full flex items-center justify-center">
                      <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p
                  className={cn(
                    "text-[10px] sm:text-xs text-center font-medium leading-tight line-clamp-2",
                    achievement.unlocked ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {achievement.name}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Detail Modal */}
      <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedAchievement && (
                <>
                  <div
                    className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center",
                      selectedAchievement.unlocked
                        ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <IconComponent icon={selectedAchievement.icon} className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block">{selectedAchievement.name}</span>
                    <span
                      className={cn(
                        "text-sm font-normal",
                        selectedAchievement.unlocked ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {selectedAchievement.unlocked ? "✓ Conquistada" : "🔒 Bloqueada"}
                    </span>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedAchievement && (
            <div className="space-y-4 pt-2">
              {/* Belt Image */}
              {selectedAchievement.relatedBelt && BELT_IMAGES[selectedAchievement.relatedBelt] && (
                <div className="flex justify-center">
                  <div className="relative">
                    <img
                      src={BELT_IMAGES[selectedAchievement.relatedBelt]}
                      alt={`Faixa ${selectedAchievement.relatedBelt}`}
                      className={cn(
                        "h-24 w-auto object-contain",
                        !selectedAchievement.unlocked && "grayscale opacity-50"
                      )}
                    />
                    {!selectedAchievement.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description - only show if unlocked */}
              {selectedAchievement.unlocked && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                  <p className="text-foreground">{selectedAchievement.description}</p>
                </div>
              )}

              {/* How to unlock - only show if NOT unlocked */}
              {!selectedAchievement.unlocked && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">Como conquistar</p>
                  <p className="text-foreground">{selectedAchievement.howToUnlock}</p>
                </div>
              )}

              {/* Progress for class-based achievements */}
              {CLASS_MILESTONES[selectedAchievement.id] !== undefined && (
                (() => {
                  const targetClasses = CLASS_MILESTONES[selectedAchievement.id];
                  const currentClasses = studentData?.aulasAssistidas || 0;
                  const progress = Math.min((currentClasses / targetClasses) * 100, 100);
                  const remaining = Math.max(targetClasses - currentClasses, 0);

                  return (
                    <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">Progresso</p>
                        <p className="text-sm font-semibold text-foreground">
                          {currentClasses}/{targetClasses} aulas ({Math.round(progress)}%)
                        </p>
                      </div>
                      <Progress value={progress} className="h-2" />
                      {!selectedAchievement.unlocked && remaining > 0 && (
                        <p className="text-xs text-muted-foreground text-center">
                          Faltam <span className="font-semibold text-primary">{remaining}</span> aula{remaining !== 1 ? 's' : ''} para desbloquear
                        </p>
                      )}
                    </div>
                  );
                })()
              )}

              {/* Current student belt */}
              {studentBelt && (
                <div className="flex items-center justify-center gap-3 pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">Sua faixa atual:</p>
                  <div className="flex items-center gap-2">
                    {BELT_IMAGES[studentBelt] && (
                      <img
                        src={BELT_IMAGES[studentBelt]}
                        alt={`Faixa ${studentBelt}`}
                        className="h-8 w-auto object-contain"
                      />
                    )}
                    <span className="font-medium text-foreground">{studentBelt}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Celebration Modal */}
      <Dialog open={!!celebratingAchievement} onOpenChange={() => setCelebratingAchievement(null)}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="flex flex-col items-center py-6 space-y-6 animate-scale-in">
            {/* Celebration Icon */}
            <div className="relative">
              <div className="absolute inset-0 animate-ping bg-primary/30 rounded-full" />
              <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/40">
                <PartyPopper className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground animate-fade-in">
                🎉 Parabéns! 🎉
              </h2>
              <p className="text-lg text-primary font-semibold">
                Você conquistou uma nova conquista!
              </p>
            </div>

            {/* Achievement Info */}
            {celebratingAchievement && (
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-2xl p-6 w-full animate-fade-in">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
                    <IconComponent icon={celebratingAchievement.icon} className="h-8 w-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-foreground mb-1">
                      {celebratingAchievement.name}
                    </h3>
                    <p className="text-muted-foreground">
                      {celebratingAchievement.description}
                    </p>
                  </div>
                  
                  {/* Belt image if applicable */}
                  {celebratingAchievement.relatedBelt && BELT_IMAGES[celebratingAchievement.relatedBelt] && (
                    <img
                      src={BELT_IMAGES[celebratingAchievement.relatedBelt]}
                      alt={`Faixa ${celebratingAchievement.relatedBelt}`}
                      className="h-16 w-auto object-contain mt-2"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
