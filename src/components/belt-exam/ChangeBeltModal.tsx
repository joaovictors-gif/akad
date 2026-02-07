import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Belt images
import BeltBranca from "@/assets/belts/Branca.png";
import BeltAmarela from "@/assets/belts/Amarela.png";
import BeltLaranja from "@/assets/belts/Laranja.png";
import BeltVerde from "@/assets/belts/Verde.png";
import BeltRoxa from "@/assets/belts/Roxa.png";
import BeltMarrom from "@/assets/belts/Marrom.png";
import BeltPreta from "@/assets/belts/Preta.png";
import BeltVermelha from "@/assets/belts/Vermelha.png";

const API_BASE_URL = "https://us-central1-akad-fbe7e.cloudfunctions.net/app";

const BELT_OPTIONS = [
  { value: "Branca", label: "Branca", image: BeltBranca, color: "#e5e5e5", achievementId: null },
  { value: "Amarela", label: "Amarela", image: BeltAmarela, color: "#facc15", achievementId: "yellow-belt" },
  { value: "Vermelha", label: "Vermelha", image: BeltVermelha, color: "#ef4444", achievementId: null },
  { value: "Laranja", label: "Laranja", image: BeltLaranja, color: "#f97316", achievementId: "orange-belt" },
  { value: "Verde", label: "Verde", image: BeltVerde, color: "#22c55e", achievementId: "green-belt" },
  { value: "Roxa", label: "Roxa", image: BeltRoxa, color: "#a855f7", achievementId: "purple-belt" },
  { value: "Marrom", label: "Marrom", image: BeltMarrom, color: "#a16207", achievementId: "brown-belt" },
  { value: "Preta", label: "Preta", image: BeltPreta, color: "#171717", achievementId: "black-belt" },
];

const BELT_ORDER = ["Branca", "Amarela","Vermelha", "Laranja", "Verde", "Roxa", "Marrom", "Preta", ];

interface Student {
  id: string;
  infor: {
    nome: string;
    faixa?: string;
    [key: string]: any;
  };
}

interface ChangeBeltModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  onConfirm: (studentId: string, newBelt: string) => Promise<void>;
}

export function ChangeBeltModal({
  open,
  onOpenChange,
  student,
  onConfirm,
}: ChangeBeltModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  // Find current belt index when modal opens
  const initializeIndex = () => {
    if (student?.infor?.faixa) {
      const index = BELT_OPTIONS.findIndex(
        (b) => b.value.toLowerCase() === (student.infor.faixa || "").toLowerCase()
      );
      if (index >= 0) {
        setCurrentIndex(index);
      }
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : BELT_OPTIONS.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < BELT_OPTIONS.length - 1 ? prev + 1 : 0));
  };

  const enviarNotificacaoFaixa = async (studentId: string, newBelt: typeof BELT_OPTIONS[0], oldBelt: string) => {
    // Só envia notificação se for uma promoção (nova faixa > faixa antiga)
    const newIndex = BELT_ORDER.indexOf(newBelt.value);
    const oldIndex = BELT_ORDER.indexOf(oldBelt);
    
    if (newIndex <= oldIndex || !newBelt.achievementId) return;
    
    try {
      await fetch(`${API_BASE_URL}/messaging/aviso`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: studentId,
          mensagem: {
            title: `🥋 Parabéns pela Faixa ${newBelt.value}!`,
            body: `Você conquistou a faixa ${newBelt.value}! Toque para ver sua conquista.`,
            link: `https://akad-fbe7e.web.app/aluno/perfil?conquista=${newBelt.achievementId}`,
          },
        }),
      });
    } catch (error) {
      console.error("Erro ao enviar notificação de faixa:", error);
    }
  };

  const handleConfirm = async () => {
    if (!student) return;
    
    const oldBelt = student.infor.faixa || "";
    const newBelt = BELT_OPTIONS[currentIndex];
    
    setIsUpdating(true);
    try {
      await onConfirm(student.id, newBelt.value);
      
      // Envia notificação push se for promoção de faixa
      await enviarNotificacaoFaixa(student.id, newBelt, oldBelt);
      
      onOpenChange(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentBelt = BELT_OPTIONS[currentIndex];

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (isOpen) {
          initializeIndex();
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Faixa</DialogTitle>
          <DialogDescription>
            {student?.infor?.nome || "Aluno"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 sm:py-6">
          {/* Carousel */}
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrev}
              disabled={isUpdating}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>

            <div className="flex flex-col items-center gap-3 sm:gap-4 min-w-0">
              <div
                className="relative p-4 sm:p-6 rounded-2xl transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${currentBelt.color}20 0%, ${currentBelt.color}10 100%)`,
                  boxShadow: `0 0 40px ${currentBelt.color}30`,
                }}
              >
                <img
                  src={currentBelt.image}
                  alt={currentBelt.label}
                  className="h-24 w-24 sm:h-32 sm:w-32 object-contain transition-transform duration-300"
                />
              </div>
              <div className="text-center">
                <h3
                  className="text-lg sm:text-xl font-bold"
                  style={{ color: currentBelt.color === "#e5e5e5" ? "#666" : currentBelt.color }}
                >
                  {currentBelt.label}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {currentIndex + 1} de {BELT_OPTIONS.length}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              disabled={isUpdating}
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>

          {/* Belt indicators */}
          <div className="flex justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6 flex-wrap">
            {BELT_OPTIONS.map((belt, index) => (
              <button
                key={belt.value}
                onClick={() => setCurrentIndex(index)}
                disabled={isUpdating}
                className={`h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full transition-all duration-200 ${
                  index === currentIndex ? "scale-125" : "opacity-50 hover:opacity-75"
                }`}
                style={{ backgroundColor: belt.color }}
                title={belt.label}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleConfirm}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Confirmar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
