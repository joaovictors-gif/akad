import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

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

const BELT_ORDER = ["Branca", "Amarela", "Laranja", "Verde", "Azul", "Roxa", "Marrom", "Preta"];

interface BeltCardProps {
  currentBelt?: string;
  aulasAssistidas?: number;
}

export function BeltCard({ currentBelt, aulasAssistidas = 0 }: BeltCardProps) {
  if (!currentBelt) return null;

  const beltIndex = BELT_ORDER.indexOf(currentBelt);
  const nextBelt = beltIndex < BELT_ORDER.length - 1 ? BELT_ORDER[beltIndex + 1] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <Card className="border-primary/20 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Belt image */}
            <motion.div
              className="relative shrink-0"
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.5 }}
            >
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center p-1.5">
                {BELT_IMAGES[currentBelt] && (
                  <img
                    src={BELT_IMAGES[currentBelt]}
                    alt={`Faixa ${currentBelt}`}
                    className="h-full w-auto object-contain drop-shadow-md"
                  />
                )}
              </div>
            </motion.div>

            {/* Belt info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Faixa Atual</p>
              <p className="text-base font-bold text-foreground">{currentBelt}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {aulasAssistidas} aula{aulasAssistidas !== 1 ? "s" : ""} concluída{aulasAssistidas !== 1 ? "s" : ""}
                </span>
                {nextBelt && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-primary font-medium">
                      Próxima: {nextBelt}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
