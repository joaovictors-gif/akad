import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query } from "firebase/firestore";

const PROFESSOR = "Adriano Santos";

interface AulaFixa {
  id: string;
  diaSemana: number;
  horarioInicio: string;
  duracao: number;
  tipoAula: string;
}

interface AulaFlexivel {
  id: string;
  data: string;
  horarioInicio: string;
  duracao: number;
  tipoAula: string;
}

interface AulaCancelada {
  id: string;
  data: string;
}

interface ProximaAula {
  data: string;
  horario: string;
  tipoAula: string;
  professor: string;
  isFlexivel?: boolean;
}

export function useNextClass() {
  const { currentUser } = useAuth();
  const [proximaAula, setProximaAula] = useState<ProximaAula | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cidadeAluno, setCidadeAluno] = useState<string>("");

  useEffect(() => {
    const fetchNextClass = async () => {
      if (!currentUser?.uid || !db) {
        setIsLoading(false);
        return;
      }

      try {
        // Buscar cidade do aluno
        let cidade = "";
        
        // Primeiro tenta pelo UID direto
        const infoRefDirect = doc(db, `alunos/${currentUser.uid}/infor/infor`);
        const infoSnapDirect = await getDoc(infoRefDirect);
        
        if (infoSnapDirect.exists()) {
          cidade = infoSnapDirect.data().cidade || "";
        } else {
          // Se não encontrar, busca pelo email
          const alunosRef = collection(db, "alunos");
          const q = query(alunosRef);
          const alunosSnap = await getDocs(q);
          
          for (const alunoDoc of alunosSnap.docs) {
            const infoRef = doc(db, `alunos/${alunoDoc.id}/infor/infor`);
            const infoSnap = await getDoc(infoRef);
            if (infoSnap.exists()) {
              const data = infoSnap.data();
              if (data.email?.toLowerCase() === currentUser.email?.toLowerCase()) {
                cidade = data.cidade || "";
                break;
              }
            }
          }
        }

        if (!cidade) {
          setIsLoading(false);
          return;
        }

        setCidadeAluno(cidade);

        // Buscar aulas
        const aulasFixasRef = collection(db, `horarios/${cidade}/aulas`);
        const aulasFixasSnap = await getDocs(aulasFixasRef);
        const aulasFixas: AulaFixa[] = aulasFixasSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as AulaFixa));

        const aulasFlexiveisRef = collection(db, `horarios/${cidade}/aulasFlexiveis`);
        const aulasFlexiveisSnap = await getDocs(aulasFlexiveisRef);
        const aulasFlexiveis: AulaFlexivel[] = aulasFlexiveisSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as AulaFlexivel));

        const aulasCanceladasRef = collection(db, `horarios/${cidade}/aulasCanceladas`);
        const aulasCanceladasSnap = await getDocs(aulasCanceladasRef);
        const aulasCanceladas: AulaCancelada[] = aulasCanceladasSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as AulaCancelada));

        const diasCancelados = new Set(aulasCanceladas.map(c => c.data));

        // Encontrar próxima aula
        const hoje = new Date();
        const hojeISO = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
        const horaAtual = `${String(hoje.getHours()).padStart(2, "0")}:${String(hoje.getMinutes()).padStart(2, "0")}`;

        interface AulaComData {
          data: Date;
          dataISO: string;
          horario: string;
          tipoAula: string;
          isFlexivel: boolean;
        }

        const todasAulas: AulaComData[] = [];

        // Gerar próximos 60 dias de aulas fixas
        for (let i = 0; i < 60; i++) {
          const data = new Date(hoje);
          data.setDate(hoje.getDate() + i);
          const diaSemana = data.getDay();
          const dataISO = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;

          if (diasCancelados.has(dataISO)) continue;

          aulasFixas
            .filter(aula => aula.diaSemana === diaSemana)
            .forEach(aula => {
              // Se for hoje, só inclui se o horário ainda não passou
              if (dataISO === hojeISO && aula.horarioInicio < horaAtual) return;

              todasAulas.push({
                data,
                dataISO,
                horario: aula.horarioInicio,
                tipoAula: aula.tipoAula,
                isFlexivel: false,
              });
            });
        }

        // Adicionar aulas flexíveis futuras
        aulasFlexiveis.forEach(aula => {
          if (diasCancelados.has(aula.data)) return;
          
          const [ano, mes, dia] = aula.data.split("-").map(Number);
          const dataAula = new Date(ano, mes - 1, dia);
          
          // Comparar apenas a data (sem hora) para aulas futuras
          const dataAulaISO = aula.data;
          const isFutureDate = dataAulaISO > hojeISO;
          const isTodayFutureTime = dataAulaISO === hojeISO && aula.horarioInicio >= horaAtual;
          
          if (isFutureDate || isTodayFutureTime) {
            todasAulas.push({
              data: dataAula,
              dataISO: aula.data,
              horario: aula.horarioInicio,
              tipoAula: aula.tipoAula,
              isFlexivel: true,
            });
          }
        });

        // Ordenar por data e horário
        todasAulas.sort((a, b) => {
          if (a.dataISO === b.dataISO) {
            return a.horario.localeCompare(b.horario);
          }
          return a.dataISO.localeCompare(b.dataISO);
        });

        if (todasAulas.length > 0) {
          const proxima = todasAulas[0];
          const meses = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
          ];
          
          setProximaAula({
            data: `${proxima.data.getDate()} de ${meses[proxima.data.getMonth()]}`,
            horario: proxima.horario,
            tipoAula: proxima.tipoAula,
            professor: PROFESSOR,
            isFlexivel: proxima.isFlexivel,
          });
        }

      } catch (error) {
        console.error("Erro ao buscar próxima aula:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNextClass();
  }, [currentUser]);

  return { proximaAula, isLoading, cidadeAluno };
}
