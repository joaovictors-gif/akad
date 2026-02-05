import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

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

  useEffect(() => {
    if (!db) {
      setError("Firebase não inicializado");
      setLoading(false);
      return;
    }

    const alunosRef = collection(db, "alunos");

    const unsubscribe = onSnapshot(
      alunosRef,
      async (snapshot) => {
        try {
          const studentsData: StudentData[] = [];

          for (const docSnap of snapshot.docs) {
            const inforRef = collection(db, `alunos/${docSnap.id}/infor`);
            
            // Get the infor subcollection
            const inforSnapshot = await new Promise<any>((resolve) => {
              const unsub = onSnapshot(inforRef, (snap) => {
                unsub();
                resolve(snap);
              });
            });

            const inforDoc = inforSnapshot.docs.find((d: any) => d.id === "infor");
            
            if (inforDoc) {
              studentsData.push({
                id: docSnap.id,
                infor: inforDoc.data(),
              });
            }
          }

          setStudents(studentsData);
          setError(null);
        } catch (err) {
          console.error("Erro ao processar dados:", err);
          setError("Erro ao carregar alunos");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Erro no listener:", err);
        setError("Erro de conexão com o banco");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { students, loading, error, setStudents };
};
