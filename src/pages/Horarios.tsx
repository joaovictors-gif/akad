import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Loader2, Clock, Calendar, X, CalendarPlus, Pencil, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";

const API_BASE = "https://us-central1-akad-fbe7e.cloudfunctions.net/app";

// Função para enviar notificação para alunos da cidade
const enviarNotificacaoCidade = async (cidade: string, titulo: string, corpo: string) => {
  try {
    await fetch(`${API_BASE}/messaging/aviso-cidade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cidade,
        mensagem: { title: titulo, body: corpo },
      }),
    });
    console.log("Notificação enviada para:", cidade);
  } catch (error) {
    console.error("Erro ao enviar notificação:", error);
  }
};

// Professor fixo
const PROFESSOR = "Adriano Santos";

// Tipos de aula pré-definidos
const TIPOS_AULA_PADRAO = ["Aula Normal", "Exame de Faixa"];

interface City {
  id: string;
  nome: string;
}

interface AulaFixa {
  id: string;
  diaSemana: number; // 0-6 (Dom-Sáb)
  horarioInicio: string;
  duracao: number; // minutos
  tipoAula: string;
}

interface AulaFlexivel {
  id: string;
  data: string; // YYYY-MM-DD
  horarioInicio: string;
  duracao: number;
  tipoAula: string;
}

interface AulaCancelada {
  id: string;
  data: string; // YYYY-MM-DD
  motivo?: string;
}

interface TipoAulaCustom {
  id: string;
  nome: string;
}

const diasSemana = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

const duracoes = [
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1h30" },
  { value: 120, label: "2 horas" },
];

export default function Horarios() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [aulasFixas, setAulasFixas] = useState<AulaFixa[]>([]);
  const [aulasFlexiveis, setAulasFlexiveis] = useState<AulaFlexivel[]>([]);
  const [aulasCanceladas, setAulasCanceladas] = useState<AulaCancelada[]>([]);
  const [tiposAulaCustom, setTiposAulaCustom] = useState<TipoAulaCustom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAulas, setIsLoadingAulas] = useState(false);
  const [modalFixaOpen, setModalFixaOpen] = useState(false);
  const [modalEditarFixaOpen, setModalEditarFixaOpen] = useState(false);
  const [aulaFixaEditando, setAulaFixaEditando] = useState<AulaFixa | null>(null);
  const [modalFlexivelOpen, setModalFlexivelOpen] = useState(false);
  const [modalCancelarOpen, setModalCancelarOpen] = useState(false);
  const [modalTipoAulaOpen, setModalTipoAulaOpen] = useState(false);
  const [modalDayOptionsOpen, setModalDayOptionsOpen] = useState(false);
  const [selectedDayData, setSelectedDayData] = useState<{ dataISO: string; diaSemana: number; status: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [aulaToDelete, setAulaToDelete] = useState<{ id: string; tipo: "fixa" | "flexivel" | "cancelada" } | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state para edição
  const [formEditFixa, setFormEditFixa] = useState({
    diaSemana: 1,
    horarioInicio: "18:00",
    duracao: 60,
    tipoAula: "Aula Normal",
  });

  // Form states
  const [formFixa, setFormFixa] = useState({
    diaSemana: 1,
    horarioInicio: "18:00",
    duracao: 60,
    tipoAula: "Aula Normal",
  });

  const [formFlexivel, setFormFlexivel] = useState({
    data: "",
    horarioInicio: "18:00",
    duracao: 60,
    tipoAula: "Aula Normal",
  });

  const [formCancelar, setFormCancelar] = useState({
    data: "",
    motivo: "",
  });

  const [novoTipoAula, setNovoTipoAula] = useState("");

  // Mes atual para visualização
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());

  // Data mínima para agendamento (hoje)
  const getDataMinima = () => {
    const hojeData = new Date();
    return hojeData.toISOString().split("T")[0];
  };

  // Todos os tipos de aula disponíveis
  const tiposAulaDisponiveis = [...TIPOS_AULA_PADRAO, ...tiposAulaCustom.map((t) => t.nome)];

  const getNomeMes = (mes: number) => {
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    return meses[mes];
  };

  // Fetch cities
  useEffect(() => {
    const fetchCities = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/cidades`);
        if (!response.ok) throw new Error("Erro ao carregar cidades");
        const data = await response.json();
        const transformed: City[] = data.map((item: any) => ({
          id: item.id || item.nome,
          nome: item.nome,
        }));
        setCities(transformed);
        if (transformed.length > 0) {
          setSelectedCity(transformed[0].nome);
        }
      } catch (error) {
        console.error("Erro ao carregar cidades:", error);
        toast.error("Erro ao carregar cidades");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCities();
  }, []);

  // Fetch all data when city changes
  useEffect(() => {
    if (!selectedCity || !db) return;

    const fetchAllData = async () => {
      setIsLoadingAulas(true);
      try {
        // Fetch aulas fixas
        const aulasFixasRef = collection(db, `horarios/${selectedCity}/aulas`);
        const aulasFixasSnap = await getDocs(aulasFixasRef);
        const aulasFixasData: AulaFixa[] = aulasFixasSnap.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as AulaFixa,
        );
        setAulasFixas(
          aulasFixasData.sort((a, b) => a.diaSemana - b.diaSemana || a.horarioInicio.localeCompare(b.horarioInicio)),
        );

        // Fetch aulas flexíveis
        const aulasFlexiveisRef = collection(db, `horarios/${selectedCity}/aulasFlexiveis`);
        const aulasFlexiveisSnap = await getDocs(aulasFlexiveisRef);
        const aulasFlexiveisData: AulaFlexivel[] = aulasFlexiveisSnap.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as AulaFlexivel,
        );
        setAulasFlexiveis(aulasFlexiveisData.sort((a, b) => a.data.localeCompare(b.data)));

        // Fetch aulas canceladas
        const aulasCanceladasRef = collection(db, `horarios/${selectedCity}/aulasCanceladas`);
        const aulasCanceladasSnap = await getDocs(aulasCanceladasRef);
        const aulasCanceladasData: AulaCancelada[] = aulasCanceladasSnap.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as AulaCancelada,
        );
        setAulasCanceladas(aulasCanceladasData.sort((a, b) => a.data.localeCompare(b.data)));

        // Fetch tipos de aula customizados
        const tiposAulaRef = collection(db, `horarios/${selectedCity}/tiposAula`);
        const tiposAulaSnap = await getDocs(tiposAulaRef);
        const tiposAulaData: TipoAulaCustom[] = tiposAulaSnap.docs.map((doc) => ({
          id: doc.id,
          nome: doc.data().nome,
        }));
        setTiposAulaCustom(tiposAulaData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        setAulasFixas([]);
        setAulasFlexiveis([]);
        setAulasCanceladas([]);
        setTiposAulaCustom([]);
      } finally {
        setIsLoadingAulas(false);
      }
    };
    fetchAllData();
  }, [selectedCity]);

  // Verificar conflito de horário para aula fixa (excluindo uma aula específica para edição)
  const verificarConflitoFixa = (diaSemana: number, horarioInicio: string, duracao: number, excludeId?: string): boolean => {
    const [h, m] = horarioInicio.split(":").map(Number);
    const inicioNovo = h * 60 + m;
    const fimNovo = inicioNovo + duracao;

    return aulasFixas.some((aula) => {
      if (excludeId && aula.id === excludeId) return false;
      if (aula.diaSemana !== diaSemana) return false;
      const [hAula, mAula] = aula.horarioInicio.split(":").map(Number);
      const inicioExistente = hAula * 60 + mAula;
      const fimExistente = inicioExistente + aula.duracao;

      // Verifica sobreposição
      return inicioNovo < fimExistente && fimNovo > inicioExistente;
    });
  };

  // Verificar conflito de horário para aula flexível
  const verificarConflitoFlexivel = (data: string, horarioInicio: string, duracao: number): boolean => {
    const [h, m] = horarioInicio.split(":").map(Number);
    const inicioNovo = h * 60 + m;
    const fimNovo = inicioNovo + duracao;

    // Verificar contra outras aulas flexíveis no mesmo dia
    const conflitoFlexivel = aulasFlexiveis.some((aula) => {
      if (aula.data !== data) return false;
      const [hAula, mAula] = aula.horarioInicio.split(":").map(Number);
      const inicioExistente = hAula * 60 + mAula;
      const fimExistente = inicioExistente + aula.duracao;
      return inicioNovo < fimExistente && fimNovo > inicioExistente;
    });

    if (conflitoFlexivel) return true;

    // Verificar contra aulas fixas no mesmo dia da semana
    const [ano, mes, dia] = data.split("-").map(Number);
    const dataObj = new Date(ano, mes - 1, dia);
    const diaSemana = dataObj.getDay();

    return aulasFixas.some((aula) => {
      if (aula.diaSemana !== diaSemana) return false;
      const [hAula, mAula] = aula.horarioInicio.split(":").map(Number);
      const inicioExistente = hAula * 60 + mAula;
      const fimExistente = inicioExistente + aula.duracao;
      return inicioNovo < fimExistente && fimNovo > inicioExistente;
    });
  };

  // Verificar se existe aula no dia para poder cancelar
  const verificarAulaExisteNoDia = (data: string): boolean => {
    // Verificar aulas flexíveis
    if (aulasFlexiveis.some((aula) => aula.data === data)) return true;

    // Verificar aulas fixas pelo dia da semana
    const [ano, mes, dia] = data.split("-").map(Number);
    const dataObj = new Date(ano, mes - 1, dia);
    const diaSemana = dataObj.getDay();

    return aulasFixas.some((aula) => aula.diaSemana === diaSemana);
  };

  const handleAddAulaFixa = async () => {
    // Validar conflito de horário
    if (verificarConflitoFixa(formFixa.diaSemana, formFixa.horarioInicio, formFixa.duracao)) {
      toast.error("Já existe uma aula neste horário!");
      return;
    }

    setIsSubmitting(true);
    try {
      const aulaId = `${formFixa.diaSemana}-${formFixa.horarioInicio.replace(":", "")}-${Date.now()}`;
      const aulaRef = doc(db, `horarios/${selectedCity}/aulas/${aulaId}`);

      const novaAula: Omit<AulaFixa, "id"> = {
        diaSemana: formFixa.diaSemana,
        horarioInicio: formFixa.horarioInicio,
        duracao: formFixa.duracao,
        tipoAula: formFixa.tipoAula,
      };

      await setDoc(aulaRef, novaAula);

      setAulasFixas((prev) =>
        [...prev, { id: aulaId, ...novaAula }].sort(
          (a, b) => a.diaSemana - b.diaSemana || a.horarioInicio.localeCompare(b.horarioInicio),
        ),
      );

      // Enviar notificação
      const diaNome = diasSemana.find((d) => d.value === formFixa.diaSemana)?.label || "";
      enviarNotificacaoCidade(
        selectedCity,
        "Nova Aula Cadastrada",
        `${formFixa.tipoAula} às ${formFixa.horarioInicio} toda ${diaNome}`,
      );

      toast.success("Aula fixa adicionada!");
      setModalFixaOpen(false);
      setFormFixa({ diaSemana: 1, horarioInicio: "18:00", duracao: 60, tipoAula: "Aula Normal" });
    } catch (error) {
      console.error("Erro ao adicionar aula:", error);
      toast.error("Erro ao adicionar aula");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir modal de edição
  const handleEditClick = (aula: AulaFixa) => {
    setAulaFixaEditando(aula);
    setFormEditFixa({
      diaSemana: aula.diaSemana,
      horarioInicio: aula.horarioInicio,
      duracao: aula.duracao,
      tipoAula: aula.tipoAula,
    });
    setModalEditarFixaOpen(true);
  };

  // Salvar edição de aula fixa
  const handleEditAulaFixa = async () => {
    if (!aulaFixaEditando) return;

    // Validar conflito de horário (excluindo a aula que está sendo editada)
    if (verificarConflitoFixa(formEditFixa.diaSemana, formEditFixa.horarioInicio, formEditFixa.duracao, aulaFixaEditando.id)) {
      toast.error("Já existe uma aula neste horário!");
      return;
    }

    setIsSubmitting(true);
    try {
      const aulaRef = doc(db, `horarios/${selectedCity}/aulas/${aulaFixaEditando.id}`);

      const aulaAtualizada: Omit<AulaFixa, "id"> = {
        diaSemana: formEditFixa.diaSemana,
        horarioInicio: formEditFixa.horarioInicio,
        duracao: formEditFixa.duracao,
        tipoAula: formEditFixa.tipoAula,
      };

      await setDoc(aulaRef, aulaAtualizada);

      setAulasFixas((prev) =>
        prev
          .map((a) => (a.id === aulaFixaEditando.id ? { id: aulaFixaEditando.id, ...aulaAtualizada } : a))
          .sort((a, b) => a.diaSemana - b.diaSemana || a.horarioInicio.localeCompare(b.horarioInicio)),
      );

      // Enviar notificação
      const diaNome = diasSemana.find((d) => d.value === formEditFixa.diaSemana)?.label || "";
      enviarNotificacaoCidade(
        selectedCity,
        "Horário de Aula Alterado",
        `${formEditFixa.tipoAula} agora é às ${formEditFixa.horarioInicio} toda ${diaNome}`,
      );

      toast.success("Aula atualizada com sucesso!");
      setModalEditarFixaOpen(false);
      setAulaFixaEditando(null);
    } catch (error) {
      console.error("Erro ao atualizar aula:", error);
      toast.error("Erro ao atualizar aula");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAulaFlexivel = async () => {
    if (!formFlexivel.data) {
      toast.error("Selecione uma data");
      return;
    }

    // Validar data passada
    if (formFlexivel.data < getDataMinima()) {
      toast.error("Não é possível agendar aulas em datas passadas");
      return;
    }

    // Validar conflito de horário
    if (verificarConflitoFlexivel(formFlexivel.data, formFlexivel.horarioInicio, formFlexivel.duracao)) {
      toast.error("Já existe uma aula neste horário!");
      return;
    }

    setIsSubmitting(true);
    try {
      const aulaId = `${formFlexivel.data}-${formFlexivel.horarioInicio.replace(":", "")}-${Date.now()}`;
      const aulaRef = doc(db, `horarios/${selectedCity}/aulasFlexiveis/${aulaId}`);

      const novaAula: Omit<AulaFlexivel, "id"> = {
        data: formFlexivel.data,
        horarioInicio: formFlexivel.horarioInicio,
        duracao: formFlexivel.duracao,
        tipoAula: formFlexivel.tipoAula,
      };

      await setDoc(aulaRef, novaAula);

      setAulasFlexiveis((prev) => [...prev, { id: aulaId, ...novaAula }].sort((a, b) => a.data.localeCompare(b.data)));

      // Enviar notificação
      enviarNotificacaoCidade(
        selectedCity,
        "Aula Especial Agendada",
        `${formFlexivel.tipoAula} em ${formatDataBR(formFlexivel.data)} às ${formFlexivel.horarioInicio}`,
      );

      toast.success("Aula flexível adicionada!");
      setModalFlexivelOpen(false);
      setFormFlexivel({ data: "", horarioInicio: "18:00", duracao: 60, tipoAula: "Aula Normal" });
    } catch (error) {
      console.error("Erro ao adicionar aula flexível:", error);
      toast.error("Erro ao adicionar aula");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelarAula = async () => {
    if (!formCancelar.data) {
      toast.error("Selecione uma data");
      return;
    }

    // Validar data passada
    if (formCancelar.data < getDataMinima()) {
      toast.error("Não é possível cancelar aulas em datas passadas");
      return;
    }

    // Verificar se existe aula no dia
    if (!verificarAulaExisteNoDia(formCancelar.data)) {
      toast.error("Não há aula agendada para este dia!");
      return;
    }

    // Verificar se já está cancelada
    if (aulasCanceladas.some((c) => c.data === formCancelar.data)) {
      toast.error("Esta data já está cancelada!");
      return;
    }

    setIsSubmitting(true);
    try {
      const cancelamentoId = `${formCancelar.data}-${Date.now()}`;
      const cancelamentoRef = doc(db, `horarios/${selectedCity}/aulasCanceladas/${cancelamentoId}`);

      const novoCancelamento: Omit<AulaCancelada, "id"> = {
        data: formCancelar.data,
        motivo: formCancelar.motivo || undefined,
      };

      await setDoc(cancelamentoRef, novoCancelamento);

      setAulasCanceladas((prev) =>
        [...prev, { id: cancelamentoId, ...novoCancelamento }].sort((a, b) => a.data.localeCompare(b.data)),
      );

      // Enviar notificação
      const motivoTexto = formCancelar.motivo ? ` - ${formCancelar.motivo}` : "";
      enviarNotificacaoCidade(
        selectedCity,
        "Aula Cancelada",
        `Aula do dia ${formatDataBR(formCancelar.data)} foi cancelada${motivoTexto}`,
      );

      toast.success("Aula cancelada!");
      setModalCancelarOpen(false);
      setFormCancelar({ data: "", motivo: "" });
    } catch (error) {
      console.error("Erro ao cancelar aula:", error);
      toast.error("Erro ao cancelar aula");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTipoAula = async () => {
    if (!novoTipoAula.trim()) {
      toast.error("Digite o nome do tipo de aula");
      return;
    }

    if (tiposAulaDisponiveis.includes(novoTipoAula.trim())) {
      toast.error("Este tipo de aula já existe");
      return;
    }

    setIsSubmitting(true);
    try {
      const tipoId = `${Date.now()}`;
      const tipoRef = doc(db, `horarios/${selectedCity}/tiposAula/${tipoId}`);

      await setDoc(tipoRef, { nome: novoTipoAula.trim() });

      setTiposAulaCustom((prev) => [...prev, { id: tipoId, nome: novoTipoAula.trim() }]);

      toast.success("Tipo de aula adicionado!");
      setModalTipoAulaOpen(false);
      setNovoTipoAula("");
    } catch (error) {
      console.error("Erro ao adicionar tipo de aula:", error);
      toast.error("Erro ao adicionar tipo de aula");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string, tipo: "fixa" | "flexivel" | "cancelada") => {
    setAulaToDelete({ id, tipo });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!aulaToDelete) return;

    setIsSubmitting(true);
    try {
      let path = "";
      let notificacao = { titulo: "", corpo: "" };

      if (aulaToDelete.tipo === "fixa") {
        const aula = aulasFixas.find((a) => a.id === aulaToDelete.id);
        path = `horarios/${selectedCity}/aulas/${aulaToDelete.id}`;
        setAulasFixas((prev) => prev.filter((a) => a.id !== aulaToDelete.id));
        if (aula) {
          const diaNome = diasSemana.find((d) => d.value === aula.diaSemana)?.label || "";
          notificacao = {
            titulo: "Aula Removida",
            corpo: `Aula de ${diaNome} às ${aula.horarioInicio} foi removida`,
          };
        }
      } else if (aulaToDelete.tipo === "flexivel") {
        const aula = aulasFlexiveis.find((a) => a.id === aulaToDelete.id);
        path = `horarios/${selectedCity}/aulasFlexiveis/${aulaToDelete.id}`;
        setAulasFlexiveis((prev) => prev.filter((a) => a.id !== aulaToDelete.id));
        if (aula) {
          notificacao = {
            titulo: "Aula Especial Removida",
            corpo: `Aula do dia ${formatDataBR(aula.data)} às ${aula.horarioInicio} foi removida`,
          };
        }
      } else {
        const cancelamento = aulasCanceladas.find((c) => c.id === aulaToDelete.id);
        path = `horarios/${selectedCity}/aulasCanceladas/${aulaToDelete.id}`;
        setAulasCanceladas((prev) => prev.filter((a) => a.id !== aulaToDelete.id));
        if (cancelamento) {
          notificacao = {
            titulo: "Aula Restabelecida",
            corpo: `Aula do dia ${formatDataBR(cancelamento.data)} foi restabelecida`,
          };
        }
      }

      await deleteDoc(doc(db, path));

      // Enviar notificação
      if (notificacao.titulo) {
        enviarNotificacaoCidade(selectedCity, notificacao.titulo, notificacao.corpo);
      }

      toast.success("Removido com sucesso!");
    } catch (error) {
      console.error("Erro ao remover:", error);
      toast.error("Erro ao remover");
    } finally {
      setAulaToDelete(null);
      setDeleteDialogOpen(false);
      setIsSubmitting(false);
    }
  };

  const formatHorario = (inicio: string, duracao: number) => {
    const [h, m] = inicio.split(":").map(Number);
    const totalMinutos = h * 60 + m + duracao;
    const hFim = Math.floor(totalMinutos / 60) % 24;
    const mFim = totalMinutos % 60;
    return `${inicio} - ${String(hFim).padStart(2, "0")}:${String(mFim).padStart(2, "0")}`;
  };

  const formatDataBR = (dataISO: string) => {
    const [ano, mes, dia] = dataISO.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  // Gerar dias do mês para preview
  const getDiasDoMes = () => {
    const primeiroDia = new Date(anoAtual, mesAtual, 1);
    const ultimoDia = new Date(anoAtual, mesAtual + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay();

    const dias: { dia: number | null; diaSemana: number; dataISO: string }[] = [];

    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push({ dia: null, diaSemana: i, dataISO: "" });
    }

    for (let i = 1; i <= diasNoMes; i++) {
      const data = new Date(anoAtual, mesAtual, i);
      const dataISO = `${anoAtual}-${String(mesAtual + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      dias.push({ dia: i, diaSemana: data.getDay(), dataISO });
    }

    return dias;
  };

  const getStatusDia = (diaSemana: number, dataISO: string) => {
    const isCancelado = aulasCanceladas.some((c) => c.data === dataISO);
    const temAulaFixa = aulasFixas.some((a) => a.diaSemana === diaSemana);
    const temAulaFlexivel = aulasFlexiveis.some((a) => a.data === dataISO);

    if (isCancelado) return "cancelado";
    if (temAulaFlexivel) return "flexivel";
    if (temAulaFixa) return "fixa";
    return "sem-aula";
  };

  const handleDayClick = (dataISO: string, diaSemana: number) => {
    if (!dataISO || !selectedCity) return;
    const status = getStatusDia(diaSemana, dataISO);
    
    if (status === "sem-aula") {
      setFormFlexivel((prev) => ({ ...prev, data: dataISO }));
      setModalFlexivelOpen(true);
    } else if (status === "cancelado") {
      setSelectedDayData({ dataISO, diaSemana, status });
      setModalDayOptionsOpen(true);
    } else {
      // Show options modal (cancel or edit)
      setSelectedDayData({ dataISO, diaSemana, status });
      setModalDayOptionsOpen(true);
    }
  };

  const handleDayOptionCancel = () => {
    if (!selectedDayData) return;
    setFormCancelar((prev) => ({ ...prev, data: selectedDayData.dataISO }));
    setModalDayOptionsOpen(false);
    setModalCancelarOpen(true);
  };

  const handleDayOptionEdit = () => {
    if (!selectedDayData) return;
    // Find the relevant fixed class for this day of week
    const aulaFixa = aulasFixas.find((a) => a.diaSemana === selectedDayData.diaSemana);
    if (aulaFixa) {
      handleEditClick(aulaFixa);
    }
    setModalDayOptionsOpen(false);
  };

  const diasDoMes = getDiasDoMes();
  const diasSemanaLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 h-screen overflow-y-auto">
        <AdminPageHeader
          title="Horários de Karatê"
          subtitle="Gerencie aulas e calendário"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="p-4 md:p-6 lg:p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* City Selector */}
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium text-muted-foreground">Cidade:</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-[200px] bg-muted/50 border-border/50 rounded-xl h-11">
                    <SelectValue placeholder="Selecione a cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.nome}>
                        {city.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left Column: Calendar + Quick Actions */}
              <div className="xl:col-span-1 space-y-4">
                {/* Calendar Card */}
                <Card className="card-elevated rounded-2xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          if (mesAtual === 0) {
                            setMesAtual(11);
                            setAnoAtual((prev) => prev - 1);
                          } else {
                            setMesAtual((prev) => prev - 1);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-muted/80 transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                        {getNomeMes(mesAtual)} {anoAtual}
                      </CardTitle>
                      <button
                        onClick={() => {
                          if (mesAtual === 11) {
                            setMesAtual(0);
                            setAnoAtual((prev) => prev + 1);
                          } else {
                            setMesAtual((prev) => prev + 1);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-muted/80 transition-colors"
                      >
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {/* Days of week header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {diasSemanaLabels.map((dia) => (
                        <div key={dia} className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider py-1.5">
                          {dia}
                        </div>
                      ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {diasDoMes.map((item, index) => {
                        const status = item.dia ? getStatusDia(item.diaSemana, item.dataISO) : "sem-aula";
                        const ehHoje = item.dia === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear();

                        return (
                          <button
                            key={index}
                            onClick={() => item.dia ? handleDayClick(item.dataISO, item.diaSemana) : undefined}
                            disabled={!item.dia}
                            className={`
                              relative h-10 w-full flex flex-col items-center justify-center rounded-lg text-sm transition-all
                              ${item.dia ? "cursor-pointer hover:scale-105" : "cursor-default"}
                              ${ehHoje ? "ring-2 ring-offset-1 ring-offset-background shadow-md" : ""}
                              ${ehHoje && status === "fixa" ? "ring-primary bg-primary text-primary-foreground font-bold" : ""}
                              ${ehHoje && status === "flexivel" ? "ring-amber-500 bg-amber-500 text-white font-bold" : ""}
                              ${ehHoje && status === "cancelado" ? "ring-destructive bg-destructive/30" : ""}
                              ${ehHoje && status === "sem-aula" ? "ring-primary bg-primary/10 font-bold" : ""}
                              ${!ehHoje && status === "fixa" ? "bg-primary/15 hover:bg-primary/25 border border-primary/30" : ""}
                              ${!ehHoje && status === "flexivel" ? "bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30" : ""}
                              ${!ehHoje && status === "cancelado" ? "bg-destructive/15 hover:bg-destructive/25 border border-destructive/40" : ""}
                              ${status === "sem-aula" && item.dia && !ehHoje ? "hover:bg-muted/60 border border-transparent hover:border-border/50" : ""}
                            `}
                          >
                            {item.dia && (
                              <>
                                <span
                                  className={`
                                    text-xs leading-none
                                    ${ehHoje && (status === "fixa" || status === "flexivel") ? "text-white" : ""}
                                    ${ehHoje && status === "sem-aula" ? "text-primary" : ""}
                                    ${!ehHoje && status === "fixa" ? "text-primary font-semibold" : ""}
                                    ${!ehHoje && status === "flexivel" ? "text-amber-600 dark:text-amber-400 font-semibold" : ""}
                                    ${status === "cancelado" ? "text-destructive line-through" : ""}
                                    ${status === "sem-aula" && !ehHoje ? "text-muted-foreground" : ""}
                                  `}
                                >
                                  {item.dia}
                                </span>
                                {/* Status dot */}
                                {status !== "sem-aula" && (
                                  <span className={`
                                    w-1 h-1 rounded-full mt-0.5
                                    ${status === "fixa" && !ehHoje ? "bg-primary" : ""}
                                    ${status === "flexivel" && !ehHoje ? "bg-amber-500" : ""}
                                    ${status === "cancelado" ? "bg-destructive" : ""}
                                    ${ehHoje && (status === "fixa" || status === "flexivel") ? "bg-white" : ""}
                                  `} />
                                )}
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm" />
                        <span className="text-[10px] font-medium text-muted-foreground">Fixa</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
                        <span className="text-[10px] font-medium text-muted-foreground">Flexível</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-destructive shadow-sm" />
                        <span className="text-[10px] font-medium text-muted-foreground">Cancelada</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-2.5 rounded-full ring-2 ring-primary ring-offset-1 ring-offset-background" />
                        <span className="text-[10px] font-medium text-muted-foreground">Hoje</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions Card */}
                <Card className="card-elevated rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => setModalFixaOpen(true)}
                      disabled={!selectedCity}
                      className="h-auto py-3 flex flex-col items-center gap-1.5 bg-primary hover:bg-primary/90 rounded-xl"
                    >
                      <Plus className="h-5 w-5" />
                      <span className="text-xs">Aula Fixa</span>
                    </Button>
                    <Button
                      onClick={() => setModalFlexivelOpen(true)}
                      disabled={!selectedCity}
                      variant="outline"
                      className="h-auto py-3 flex flex-col items-center gap-1.5 rounded-xl"
                    >
                      <CalendarPlus className="h-5 w-5" />
                      <span className="text-xs">Aula Flexível</span>
                    </Button>
                  </CardContent>
                </Card>

                {/* Custom Types */}
                <Button
                  onClick={() => setModalTipoAulaOpen(true)}
                  disabled={!selectedCity}
                  variant="ghost"
                  className="w-full justify-start rounded-xl text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Tipo de Aula
                </Button>
              </div>

              {/* Right Column: Class Lists */}
              <div className="xl:col-span-2">
                <Tabs defaultValue="fixas" className="space-y-4">
                  <TabsList className="bg-muted/50 w-full grid grid-cols-2">
                    <TabsTrigger value="fixas" className="text-sm">
                      <Clock className="h-4 w-4 mr-2 hidden sm:inline" />
                      Fixas ({aulasFixas.length})
                    </TabsTrigger>
                    <TabsTrigger value="flexiveis" className="text-sm">
                      <CalendarPlus className="h-4 w-4 mr-2 hidden sm:inline" />
                      Flexíveis ({aulasFlexiveis.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="fixas">
                    <Card className="card-elevated rounded-2xl">
                      <CardContent className="p-4">
                        {isLoadingAulas ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : aulasFixas.length === 0 ? (
                          <div className="text-center py-12">
                            <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                            <p className="text-muted-foreground">Nenhuma aula fixa cadastrada</p>
                            <Button
                              onClick={() => setModalFixaOpen(true)}
                              variant="link"
                              className="mt-2"
                            >
                              Adicionar primeira aula
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {aulasFixas.map((aula) => (
                              <div
                                key={aula.id}
                                className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl border border-border/30 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex-shrink-0 w-24 text-center">
                                  <span className="px-3 py-1.5 bg-primary/20 text-primary text-xs font-semibold rounded-lg block">
                                    {diasSemana.find((d) => d.value === aula.diaSemana)?.label?.slice(0, 3)}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-sm">{formatHorario(aula.horarioInicio, aula.duracao)}</span>
                                    <span className="text-xs text-muted-foreground">•</span>
                                    <span className="text-xs text-muted-foreground">{aula.tipoAula}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-0.5">{PROFESSOR}</p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditClick(aula)}
                                    className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteClick(aula.id, "fixa")}
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="flexiveis">
                    <Card className="card-elevated rounded-2xl">
                      <CardContent className="p-4">
                        {isLoadingAulas ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : (() => {
                          const now = new Date();
                          const prefixoMesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
                          const flexiveisMesAtual = aulasFlexiveis.filter((a) => a.data.startsWith(prefixoMesAtual));

                          if (flexiveisMesAtual.length === 0) {
                            return (
                              <div className="text-center py-12">
                                <CalendarPlus className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                                <p className="text-muted-foreground">Nenhuma aula flexível neste mês</p>
                                <Button
                                  onClick={() => setModalFlexivelOpen(true)}
                                  variant="link"
                                  className="mt-2"
                                >
                                  Adicionar aula especial
                                </Button>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-2">
                              {flexiveisMesAtual.map((aula) => (
                                <div
                                  key={aula.id}
                                  className="flex items-center gap-4 p-3 bg-accent/20 rounded-xl border border-accent/30 hover:bg-accent/30 transition-colors"
                                >
                                  <div className="flex-shrink-0 w-24 text-center">
                                    <span className="px-3 py-1.5 bg-accent text-accent-foreground text-xs font-semibold rounded-lg block">
                                      {formatDataBR(aula.data)}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-medium text-sm">{formatHorario(aula.horarioInicio, aula.duracao)}</span>
                                      <span className="text-xs text-muted-foreground">•</span>
                                      <span className="text-xs text-muted-foreground">{aula.tipoAula}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">{PROFESSOR}</p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteClick(aula.id, "flexivel")}
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Adicionar Aula Fixa */}
      <Dialog open={modalFixaOpen} onOpenChange={setModalFixaOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Aula Fixa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Dia da Semana</Label>
              <Select
                value={String(formFixa.diaSemana)}
                onValueChange={(v) => setFormFixa((prev) => ({ ...prev, diaSemana: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {diasSemana.map((dia) => (
                    <SelectItem key={dia.value} value={String(dia.value)}>
                      {dia.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Horário de Início</Label>
              <Input
                type="time"
                value={formFixa.horarioInicio}
                onChange={(e) => setFormFixa((prev) => ({ ...prev, horarioInicio: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Duração</Label>
              <Select
                value={String(formFixa.duracao)}
                onValueChange={(v) => setFormFixa((prev) => ({ ...prev, duracao: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {duracoes.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Aula</Label>
              <Select
                value={formFixa.tipoAula}
                onValueChange={(v) => setFormFixa((prev) => ({ ...prev, tipoAula: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposAulaDisponiveis.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Professor:</span> {PROFESSOR}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalFixaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddAulaFixa} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Aula Fixa */}
      <Dialog open={modalEditarFixaOpen} onOpenChange={setModalEditarFixaOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Aula Fixa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Dia da Semana</Label>
              <Select
                value={String(formEditFixa.diaSemana)}
                onValueChange={(v) => setFormEditFixa((prev) => ({ ...prev, diaSemana: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {diasSemana.map((dia) => (
                    <SelectItem key={dia.value} value={String(dia.value)}>
                      {dia.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Horário de Início</Label>
              <Input
                type="time"
                value={formEditFixa.horarioInicio}
                onChange={(e) => setFormEditFixa((prev) => ({ ...prev, horarioInicio: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Duração</Label>
              <Select
                value={String(formEditFixa.duracao)}
                onValueChange={(v) => setFormEditFixa((prev) => ({ ...prev, duracao: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {duracoes.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Aula</Label>
              <Select
                value={formEditFixa.tipoAula}
                onValueChange={(v) => setFormEditFixa((prev) => ({ ...prev, tipoAula: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposAulaDisponiveis.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Professor:</span> {PROFESSOR}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalEditarFixaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditAulaFixa} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Adicionar Aula Flexível */}
      <Dialog open={modalFlexivelOpen} onOpenChange={setModalFlexivelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Aula Flexível</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                min={getDataMinima()}
                value={formFlexivel.data}
                onChange={(e) => setFormFlexivel((prev) => ({ ...prev, data: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Horário de Início</Label>
              <Input
                type="time"
                value={formFlexivel.horarioInicio}
                onChange={(e) => setFormFlexivel((prev) => ({ ...prev, horarioInicio: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Duração</Label>
              <Select
                value={String(formFlexivel.duracao)}
                onValueChange={(v) => setFormFlexivel((prev) => ({ ...prev, duracao: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {duracoes.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Aula</Label>
              <Select
                value={formFlexivel.tipoAula}
                onValueChange={(v) => setFormFlexivel((prev) => ({ ...prev, tipoAula: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposAulaDisponiveis.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Professor:</span> {PROFESSOR}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalFlexivelOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddAulaFlexivel} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Cancelar Aula */}
      <Dialog open={modalCancelarOpen} onOpenChange={setModalCancelarOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Cancelar Aula</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Data do Cancelamento</Label>
              <Input
                type="date"
                min={getDataMinima()}
                value={formCancelar.data}
                onChange={(e) => setFormCancelar((prev) => ({ ...prev, data: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Input
                placeholder="Ex: Feriado, evento..."
                value={formCancelar.motivo}
                onChange={(e) => setFormCancelar((prev) => ({ ...prev, motivo: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCancelarOpen(false)}>
              Voltar
            </Button>
            <Button onClick={handleCancelarAula} disabled={isSubmitting} variant="destructive">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancelar Aula"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Novo Tipo de Aula */}
      <Dialog open={modalTipoAulaOpen} onOpenChange={setModalTipoAulaOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Tipo de Aula</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Tipo de Aula</Label>
              <Input
                placeholder="Ex: Treino Intensivo"
                value={novoTipoAula}
                onChange={(e) => setNovoTipoAula(e.target.value)}
              />
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Tipos existentes:</p>
              <div className="flex flex-wrap gap-2">
                {tiposAulaDisponiveis.map((tipo) => (
                  <span key={tipo} className="px-2 py-1 bg-background rounded text-xs">
                    {tipo}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalTipoAulaOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddTipoAula} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal: Day Options (Cancel or Edit) */}
      <Dialog open={modalDayOptionsOpen} onOpenChange={setModalDayOptionsOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center">
              {selectedDayData ? formatDataBR(selectedDayData.dataISO) : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {selectedDayData?.status === "cancelado" ? (
              <>
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-center">
                  <X className="h-6 w-6 text-destructive mx-auto mb-2" />
                  <p className="text-sm font-medium text-destructive">Aula cancelada neste dia</p>
                </div>
                <Button
                  onClick={async () => {
                    if (!selectedDayData || !selectedCity) return;
                    const cancelamento = aulasCanceladas.find((c) => c.data === selectedDayData.dataISO);
                    if (!cancelamento) return;
                    try {
                      const path = `horarios/${selectedCity}/aulasCanceladas/${cancelamento.id}`;
                      await deleteDoc(doc(db, path));
                      setAulasCanceladas((prev) => prev.filter((a) => a.id !== cancelamento.id));
                      enviarNotificacaoCidade(selectedCity, "Aula Restabelecida", `Aula do dia ${formatDataBR(cancelamento.data)} foi restabelecida`);
                      toast.success("Aula restabelecida com sucesso!");
                    } catch (error) {
                      console.error("Erro ao restabelecer:", error);
                      toast.error("Erro ao restabelecer aula");
                    }
                    setModalDayOptionsOpen(false);
                  }}
                  variant="outline"
                  className="w-full h-12 rounded-xl gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restabelecer Aula
                </Button>
                <Button
                  onClick={() => {
                    if (!selectedDayData) return;
                    setFormFlexivel((prev) => ({ ...prev, data: selectedDayData.dataISO }));
                    setModalDayOptionsOpen(false);
                    setModalFlexivelOpen(true);
                  }}
                  className="w-full h-12 rounded-xl gap-2"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Adicionar Aula Flexível
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleDayOptionEdit}
                  variant="outline"
                  className="w-full h-12 rounded-xl gap-2"
                  disabled={!aulasFixas.some((a) => a.diaSemana === selectedDayData?.diaSemana)}
                >
                  <Pencil className="h-4 w-4" />
                  Editar Horário
                </Button>
                <Button
                  onClick={handleDayOptionCancel}
                  variant="outline"
                  className="w-full h-12 rounded-xl gap-2 text-destructive border-destructive/50 hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                  Cancelar Aula
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
