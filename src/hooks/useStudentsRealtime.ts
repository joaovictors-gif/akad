import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, Unsubscribe } from "firebase/firestore";

export interface StudentData {
  id: string;
  infor: {
    nome: string;
    responsavel?: string;
    telefone?: string;
    cidade?: string;
    status?: string;
    email?: string;
    data_nascimento?: string;
    faixa?: string;
    cpf?: string;
    religiao?: string;
    obs?: string;
    [key: string]: any;
  };
}

export const useStudentsRealtime = () => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inforUnsubscribesRef = useRef<Map<string, Unsubscribe>>(new Map());

  useEffect(() => {
    if (!db) {
      setError("Firebase não inicializado");
      setLoading(false);
      return;
    }

    const alunosRef = collection(db, "alunos");
    const studentsMap = new Map<string, StudentData>();

    // Função para atualizar o estado com os dados do Map
    const updateStudentsState = () => {
      const studentsArray = Array.from(studentsMap.values());
      setStudents(studentsArray);
    };

    // Função para criar listener de infor para um aluno específico
    const subscribeToInfor = (alunoId: string) => {
      // Limpa listener anterior se existir
      const existingUnsub = inforUnsubscribesRef.current.get(alunoId);
      if (existingUnsub) {
        existingUnsub();
      }

      const inforRef = collection(db, `alunos/${alunoId}/infor`);
      
      const unsubscribe = onSnapshot(
        inforRef,
        (inforSnapshot) => {
          const inforDoc = inforSnapshot.docs.find((d) => d.id === "infor");
          
          if (inforDoc) {
            studentsMap.set(alunoId, {
              id: alunoId,
              infor: inforDoc.data() as StudentData["infor"],
            });
          } else {
            studentsMap.delete(alunoId);
          }
          
          updateStudentsState();
          setLoading(false);
        },
        (err) => {
          console.error(`Erro no listener infor do aluno ${alunoId}:`, err);
        }
      );

      inforUnsubscribesRef.current.set(alunoId, unsubscribe);
    };

    // Listener principal da coleção de alunos
    const unsubscribeAlunos = onSnapshot(
      alunosRef,
      (snapshot) => {
        const currentAlunoIds = new Set(snapshot.docs.map((doc) => doc.id));
        
        // Remove listeners de alunos que não existem mais
        inforUnsubscribesRef.current.forEach((unsub, alunoId) => {
          if (!currentAlunoIds.has(alunoId)) {
            unsub();
            inforUnsubscribesRef.current.delete(alunoId);
            studentsMap.delete(alunoId);
          }
        });

        // Adiciona/atualiza listeners para cada aluno
        snapshot.docs.forEach((docSnap) => {
          subscribeToInfor(docSnap.id);
        });

        // Se não houver alunos, atualiza o estado
        if (snapshot.docs.length === 0) {
          setStudents([]);
          setLoading(false);
        }

        setError(null);
      },
      (err) => {
        console.error("Erro no listener de alunos:", err);
        setError("Erro de conexão com o banco");
        setLoading(false);
      }
    );

    return () => {
      unsubscribeAlunos();
      // Limpa todos os listeners de infor
      inforUnsubscribesRef.current.forEach((unsub) => unsub());
      inforUnsubscribesRef.current.clear();
    };
  }, []);

  return { students, loading, error, setStudents };
};
