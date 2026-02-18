import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

import photo1 from "@/assets/gallery/adrianokaratedo_118694099_347221562986496_1595558521210263348_n.jpg";
import photo2 from "@/assets/gallery/adrianokaratedo_275520587_1236012626805365_8471278095124785741_n.webp";
import photo3 from "@/assets/gallery/adrianokaratedo_277772201_567559054796184_8917639258339937449_n.webp";
import photo4 from "@/assets/gallery/adrianokaratedo_280647874_699199164695547_5318613793309718013_n.webp";
import photo5 from "@/assets/gallery/adrianokaratedo_280683068_540368114431062_7266698552032274139_n.webp";
import photo6 from "@/assets/gallery/adrianokaratedo_298520995_593400102399949_2312384329211915130_n.webp";
import photo7 from "@/assets/gallery/adrianokaratedo_301413162_757490438893469_553513303226050566_n.webp";
import photo8 from "@/assets/gallery/adrianokaratedo_301432079_122167100575688_8360907192239455214_n.webp";
import photo9 from "@/assets/gallery/adrianokaratedo_306916878_1130123661271111_8523488964708988298_n.webp";
import photo10 from "@/assets/gallery/adrianokaratedo_306921025_196830946128107_3089903200453597723_n.webp";

import video1 from "@/assets/gallery/adrianokaratedo_AQPQucqN0pY0XZQyxda6bSczsm1YfQleJD43Innj6KA9XeR-cpjuG0W4n91qK-jLrx9vmbxI1SRL2gfgpJSyz6YPbj9uVcwRr2y4iTI.mp4";
import video2 from "@/assets/gallery/adrianokaratedo_AQPRL_z9RG17ebUXjLCoMeRIx_m20wDtVdZq7LCl2nQ0COUptLWsvY4mFJwR0Eirv1FI0QtmNyWsKpuhl4nEez2ufYp87lqjrIjXX_Q.mp4";

type MediaItem = {
  type: "photo" | "video";
  src: string;
  alt: string;
  label: string;
};

const mediaItems: MediaItem[] = [
  { type: "photo", src: photo1, alt: "Treino AKAD", label: "Treino" },
  { type: "photo", src: photo2, alt: "Campeonato", label: "Campeonato" },
  { type: "video", src: video1, alt: "Vídeo treino", label: "Treino" },
  { type: "photo", src: photo3, alt: "Graduação", label: "Graduação" },
  { type: "photo", src: photo4, alt: "Treino kumite", label: "Kumite" },
  { type: "photo", src: photo5, alt: "Turma AKAD", label: "Turma" },
  { type: "video", src: video2, alt: "Vídeo kata", label: "Kata" },
  { type: "photo", src: photo6, alt: "Cerimônia", label: "Cerimônia" },
  { type: "photo", src: photo7, alt: "Treino", label: "Treino" },
  { type: "photo", src: photo8, alt: "Evento AKAD", label: "Evento" },
  { type: "photo", src: photo9, alt: "Campeonato", label: "Campeonato" },
  { type: "photo", src: photo10, alt: "Treino", label: "Treino" },
];

const GallerySection = () => {
  const [selected, setSelected] = useState<number | null>(null);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const navigateLightbox = (dir: 1 | -1) => {
    if (selected === null) return;
    setSelected((selected + dir + mediaItems.length) % mediaItems.length);
  };

  return (
    <section className="py-24 md:py-32 bg-muted/50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-3 block">
            Galeria
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
            Momentos na AKAD
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-lg">
            Treinos, campeonatos, graduações e a energia do nosso dojo.
          </p>
        </motion.div>

        <div className="relative">
          <div ref={emblaRef} className="overflow-hidden rounded-2xl">
            <div className="flex gap-3 md:gap-4">
              {mediaItems.map((item, i) => (
                <div
                  key={`${item.alt}-${i}`}
                  className="flex-[0_0_48%] md:flex-[0_0_32%] min-w-0"
                >
                  <button
                    onClick={() => setSelected(i)}
                    className="group relative aspect-[4/3] w-full rounded-2xl overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {item.type === "video" ? (
                      <>
                        <video
                          src={item.src}
                          muted
                          playsInline
                          preload="none"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm group-hover:bg-primary/80 transition-colors">
                            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <img
                        src={item.src}
                        alt={item.alt}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="absolute bottom-3 left-3 text-sm font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {item.label}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={scrollPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors shadow-lg"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors shadow-lg"
            aria-label="Próximo"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setSelected(null)}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10"
              aria-label="Fechar"
            >
              <X className="w-8 h-8" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
              className="absolute left-4 text-white/70 hover:text-white transition-colors z-10"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
              className="absolute right-4 text-white/70 hover:text-white transition-colors z-10"
              aria-label="Próximo"
            >
              <ChevronRight className="w-10 h-10" />
            </button>

            {mediaItems[selected].type === "video" ? (
              <motion.video
                key={selected}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                src={mediaItems[selected].src}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] rounded-xl"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <motion.img
                key={selected}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                src={mediaItems[selected].src}
                alt={mediaItems[selected].alt}
                className="max-w-full max-h-[85vh] rounded-xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default GallerySection;
