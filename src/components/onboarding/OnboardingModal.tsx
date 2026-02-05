import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Calendar, 
  CreditCard, 
  Bell, 
  Trophy,
  ChevronRight,
  ChevronLeft,
  X
} from "lucide-react";
import akadLogo from "@/assets/logo-akad.png";

interface OnboardingStep {
  icon: React.ElementType | null;
  title: string;
  description: string;
  color: string;
  isLogo?: boolean;
}

const studentSteps: OnboardingStep[] = [
  {
    icon: null as any, // Logo will be rendered separately
    title: "Bem-vindo à AKAD!",
    description: "Vamos fazer um tour rápido pelas funcionalidades do app. Leva menos de 1 minuto!",
    color: "from-primary to-primary-dark",
    isLogo: true,
  },
  {
    icon: User,
    title: "Seu Perfil",
    description: "Acesse seu perfil para ver sua faixa atual, conquistas desbloqueadas e atualizar sua foto.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Calendar,
    title: "Agenda de Aulas",
    description: "Confira os horários das aulas, veja sua frequência e acompanhe aulas especiais.",
    color: "from-green-500 to-green-600",
  },
  {
    icon: CreditCard,
    title: "Mensalidades",
    description: "Acompanhe suas mensalidades, faça pagamentos via PIX e baixe comprovantes.",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: Bell,
    title: "Notificações",
    description: "Ative as notificações para receber avisos de aulas, promoções de faixa e lembretes.",
    color: "from-orange-500 to-orange-600",
  },
  {
    icon: Trophy,
    title: "Conquistas",
    description: "Desbloqueie conquistas conforme avança! Cada treino conta para seu progresso.",
    color: "from-yellow-500 to-yellow-600",
  },
];

const adminSteps: OnboardingStep[] = [
  {
    icon: null as any, // Logo will be rendered separately
    title: "Bem-vindo, Admin!",
    description: "Conheça as ferramentas de gestão da AKAD. Vamos ao tour!",
    color: "from-primary to-primary-dark",
    isLogo: true,
  },
  {
    icon: User,
    title: "Gestão de Alunos",
    description: "Cadastre, edite e gerencie todos os alunos da academia com facilidade.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Calendar,
    title: "Horários e Frequência",
    description: "Configure aulas fixas, flexíveis e registre a presença dos alunos.",
    color: "from-green-500 to-green-600",
  },
  {
    icon: CreditCard,
    title: "Mensalidades",
    description: "Controle pagamentos, envie cobranças e acompanhe a inadimplência.",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: Trophy,
    title: "Exames de Faixa",
    description: "Promova alunos e acompanhe a evolução de cada um.",
    color: "from-yellow-500 to-yellow-600",
  },
];

interface OnboardingModalProps {
  isAdmin?: boolean;
}

const STORAGE_KEY_STUDENT = "akad_onboarding_student_completed";
const STORAGE_KEY_ADMIN = "akad_onboarding_admin_completed";

export const OnboardingModal = ({ isAdmin = false }: OnboardingModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = isAdmin ? adminSteps : studentSteps;
  const storageKey = isAdmin ? STORAGE_KEY_ADMIN : STORAGE_KEY_STUDENT;

  useEffect(() => {
    const hasCompleted = localStorage.getItem(storageKey);
    if (!hasCompleted) {
      // Small delay to let the page load first
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, "true");
    setIsOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem(storageKey, "true");
    setIsOpen(false);
  };

  const CurrentIcon = steps[currentStep].icon;
  const isLogoStep = steps[currentStep].isLogo;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card border-border">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 z-10 p-1.5 rounded-full hover:bg-muted/80 transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Icon header with gradient */}
        <div className={`relative h-40 bg-gradient-to-br ${steps[currentStep].color} flex items-center justify-center overflow-hidden`}>
          {/* Background circles */}
          <div className="absolute inset-0">
            <div className="absolute top-4 left-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
            <div className="absolute bottom-4 right-4 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative z-10"
            >
              {isLogoStep ? (
                <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                  <img src={akadLogo} alt="AKAD Logo" className="h-14 w-14 object-contain" />
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-white/20 backdrop-blur-sm">
                  {CurrentIcon && <CurrentIcon className="h-12 w-12 text-white" />}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="p-6 pt-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-xl font-bold text-foreground mb-2">
                {steps[currentStep].title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {steps[currentStep].description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 my-6">
            {steps.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep 
                    ? "w-6 bg-primary" 
                    : "w-2 bg-muted hover:bg-muted-foreground/30"
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrev}
                className="flex-1"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={`flex-1 ${currentStep === 0 ? "w-full" : ""}`}
            >
              {currentStep === steps.length - 1 ? (
                "Começar!"
              ) : (
                <>
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          {currentStep === 0 && (
            <button
              onClick={handleSkip}
              className="w-full text-center text-sm text-muted-foreground mt-4 hover:text-foreground transition-colors"
            >
              Pular tutorial
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
