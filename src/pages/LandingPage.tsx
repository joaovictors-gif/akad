import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Users, Award, Clock, ChevronRight, Flame } from "lucide-react";
import logoAkad from "@/assets/logo-akad.png";
import dojoBg from "@/assets/dojo-bg.jpg";

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
    <div className="min-h-screen overflow-x-hidden bg-white text-gray-900">
      {/* HEADER - transparent over hero */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md shadow-sm" : ""}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoAkad} alt="AKAD Logo" className="h-10 w-10 rounded-xl shadow-md" />
            <span className={`text-xl font-extrabold tracking-[0.2em] drop-shadow-lg transition-colors duration-300 ${scrolled ? "text-gray-900 drop-shadow-none" : "text-white"}`}>AKAD</span>
          </div>
          <button
            onClick={() => navigate("/app/login")}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${scrolled ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-white/15 backdrop-blur-md text-white border border-white/25 hover:bg-white/25"}`}
          >
            Entrar
          </button>
        </div>
      </header>

      {/* HERO - Full screen immersive */}
      <section className="relative min-h-screen flex items-center">
        {/* Background image - full visibility */}
        <div className="absolute inset-0">
          <img src={dojoBg} alt="" className="w-full h-full object-cover" />
          {/* Dark cinematic overlay - subtle enough to see image */}
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
              <Flame className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold tracking-[0.3em] uppercase text-red-300">
                Adriano Karate-Do
              </span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-[1.05] mb-6 tracking-tight">
              A arte de se{" "}
              <span className="relative">
                superar
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-red-500 origin-left rounded-full"
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
                className="px-8 py-4 rounded-full bg-red-600 text-white font-bold text-sm tracking-wide hover:bg-red-500 transition-colors flex items-center justify-center gap-2 shadow-2xl shadow-red-600/30"
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
      <section id="sobre" className="py-24 md:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="text-xs font-bold tracking-[0.3em] uppercase text-red-500 mb-3 block">
              Nossos Pilares
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Por que treinar na AKAD?
            </h2>
            <p className="text-gray-500 max-w-md mx-auto text-lg">
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
                className="group relative p-8 rounded-3xl bg-white border border-gray-100 hover:border-red-200 hover:shadow-xl hover:shadow-red-500/5 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-5 group-hover:bg-red-100 transition-colors">
                  <feature.icon className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-[2rem] overflow-hidden"
          >
            {/* CTA background */}
            <div className="absolute inset-0">
              <img src={dojoBg} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-red-900/90 via-red-800/85 to-red-700/80" />
            </div>

            <div className="relative z-10 p-12 md:p-20 text-center">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
                Pronto para começar?
              </h2>
              <p className="text-white/70 mb-10 max-w-lg mx-auto text-lg">
                Acesse a plataforma para gerenciar aulas, mensalidades e acompanhar seu progresso.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/app/login")}
                className="px-10 py-4 rounded-full bg-white text-red-700 font-bold text-base hover:bg-gray-100 transition-colors shadow-2xl"
              >
                Entrar na Plataforma
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logoAkad} alt="AKAD" className="h-7 w-7 rounded-lg" />
            <span className="text-sm font-bold tracking-[0.15em] text-white">AKAD</span>
          </div>
          <p className="text-xs text-gray-500">
            © 2026 AKAD — Adriano Karate-Do. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
