import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Award, Clock, ChevronRight, Flame } from "lucide-react";
import logoAkad from "@/assets/logo-akad.png";
import dojoBg from "@/assets/dojo-bg.jpg";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import GallerySection from "@/components/landing/GallerySection";

const features = [
  {
    icon: Shield,
    title: "Disciplina",
    description: "Autocontrole e foco através das artes marciais tradicionais.",
  },
  {
    icon: Users,
    title: "Comunidade",
    description: "Uma família de praticantes comprometidos com a evolução.",
  },
  {
    icon: Award,
    title: "Graduações",
    description: "Exames regulares de faixa para medir seu progresso real.",
  },
  {
    icon: Clock,
    title: "Horários Flexíveis",
    description: "Turmas em diversos horários que se encaixam na sua rotina.",
  },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.85);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-card/90 backdrop-blur-md shadow-sm" : ""}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoAkad} alt="AKAD Logo" className="h-10 w-10 rounded-xl shadow-md" />
            <span className={`text-xl font-extrabold tracking-[0.2em] drop-shadow-lg transition-colors duration-300 ${scrolled ? "text-foreground drop-shadow-none" : "text-white"}`}>AKAD</span>
          </div>
          <button
            onClick={() => navigate("/app/login")}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${scrolled ? "bg-foreground text-background hover:opacity-90" : "bg-white/15 backdrop-blur-md text-white border border-white/25 hover:bg-white/25"}`}
          >
            Entrar
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0">
          <img src={dojoBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-xl"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center gap-2 mb-6"
            >
              <Flame className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold tracking-[0.3em] uppercase text-primary/80">
                Adriano Karate-Do
              </span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
              A arte de se{" "}
              <span className="relative inline-block">
                superar
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="absolute -bottom-1 left-0 right-0 h-1 bg-primary origin-left rounded-full"
                />
              </span>{" "}
              todos os dias.
            </h1>

            <p className="text-lg text-white/70 leading-relaxed mb-10 max-w-md">
              Transforme corpo e mente com a disciplina milenar do karatê.
              Aulas para todas as idades.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/app/login")}
                className="px-8 py-4 rounded-full bg-primary text-primary-foreground font-bold text-sm tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-2xl shadow-primary/30"
              >
                Acessar Plataforma
                <ChevronRight className="w-5 h-5" />
              </motion.button>
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href="#sobre"
                className="px-8 py-4 rounded-full bg-white/10 backdrop-blur-sm text-white font-semibold text-sm border border-white/20 hover:bg-white/20 transition-colors text-center"
              >
                Saiba Mais
              </motion.a>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-3 mt-8">
              <a href="https://www.instagram.com/adrianokaratedo/" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm text-white border border-white/20 transition-all hover:bg-white/30 hover:scale-110" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href="https://www.facebook.com/adrianosilva.santos.16?locale=pt_BR" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm text-white border border-white/20 transition-all hover:bg-white/30 hover:scale-110" aria-label="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://wa.me/5589999826221" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm text-white border border-white/20 transition-all hover:bg-white/30 hover:scale-110" aria-label="WhatsApp">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1.5"
          >
            <div className="w-1.5 h-2.5 bg-white/60 rounded-full" />
          </motion.div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section id="sobre" className="py-24 md:py-32 bg-muted/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-3 block">
              Nossos Pilares
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
              Por que treinar na AKAD?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto text-lg">
              Mais do que uma academia, somos uma escola de vida.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group relative p-8 rounded-3xl bg-card border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <TestimonialsSection />

      {/* GALLERY */}
      <GallerySection />

      {/* CTA */}
      <section className="py-24 md:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-[2rem] overflow-hidden"
          >
            <div className="absolute inset-0">
              <img src={dojoBg} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/85 to-primary/80" />
            </div>

            <div className="relative z-10 p-12 md:p-20 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold text-primary-foreground mb-5 tracking-tight">
                Pronto para começar?
              </h2>
              <p className="text-primary-foreground/70 mb-10 max-w-lg mx-auto text-lg">
                Acesse a plataforma para gerenciar aulas, mensalidades e acompanhar seu progresso.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/app/login")}
                className="px-10 py-4 rounded-full bg-background text-primary font-bold text-base hover:opacity-90 transition-opacity shadow-2xl"
              >
                Entrar na Plataforma
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-foreground py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logoAkad} alt="AKAD" className="h-7 w-7 rounded-lg" />
            <span className="text-sm font-bold tracking-[0.15em] text-background">AKAD</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://www.instagram.com/adrianokaratedo/" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 text-background/60 transition-colors hover:bg-background/20 hover:text-background" aria-label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
            <a href="https://www.facebook.com/adrianosilva.santos.16?locale=pt_BR" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full bg-background/10 text-background/60 transition-colors hover:bg-background/20 hover:text-background" aria-label="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
          </div>
          <p className="text-xs text-background/40">
            © 2026 AKAD — Adriano Karate-Do. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/5589999826221"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110"
        aria-label="Fale conosco no WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
};

export default LandingPage;
