import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";

interface StudentAccount {
  id: string;
  nome: string;
  faixa?: string;
  status?: string;
}

interface ActiveStudentContextType {
  accounts: StudentAccount[];
  activeAccount: StudentAccount | null;
  activeStudentId: string | null;
  isMultiAccount: boolean;
  isLoadingAccounts: boolean;
  switchAccount: (studentId: string) => void;
  showSelector: boolean;
  setShowSelector: (show: boolean) => void;
}

const ActiveStudentContext = createContext<ActiveStudentContextType | null>(null);

export const useActiveStudent = () => {
  const context = useContext(ActiveStudentContext);
  if (!context) {
    throw new Error("useActiveStudent must be used within an ActiveStudentProvider");
  }
  return context;
};

const STORAGE_KEY = "akad_active_student_id";

export const ActiveStudentProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [accounts, setAccounts] = useState<StudentAccount[]>([]);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [showSelector, setShowSelector] = useState(false);

  // Fetch all student accounts linked to this email
  useEffect(() => {
    if (!currentUser?.email || !db) {
      setAccounts([]);
      setIsLoadingAccounts(false);
      return;
    }

    const email = currentUser.email.toLowerCase();

    // First check the direct uid-based document
    const fetchAccounts = async () => {
      try {
        const alunosRef = collection(db, "alunos");
        const snapshot = await getDocs(alunosRef);
        
        const found: StudentAccount[] = [];

        // We need to check each student's infor subcollection for matching email
        const promises = snapshot.docs.map(async (docSnap) => {
          const inforRef = collection(db, `alunos/${docSnap.id}/infor`);
          const inforSnapshot = await getDocs(inforRef);
          const inforDoc = inforSnapshot.docs.find(d => d.id === "infor");
          
          if (inforDoc) {
            const data = inforDoc.data();
            if (data.email?.toLowerCase() === email) {
              found.push({
                id: docSnap.id,
                nome: data.nome || "",
                faixa: data.faixa,
                status: data.status,
              });
            }
          }
        });

        await Promise.all(promises);
        setAccounts(found);

        // If multiple accounts and no saved selection, show selector
        const savedId = localStorage.getItem(STORAGE_KEY);
        if (found.length > 1) {
          if (savedId && found.some(a => a.id === savedId)) {
            setActiveStudentId(savedId);
          } else {
            // Default to the first one, but show selector
            setActiveStudentId(found[0].id);
            setShowSelector(true);
          }
        } else if (found.length === 1) {
          setActiveStudentId(found[0].id);
        } else {
          // Fallback to uid
          setActiveStudentId(currentUser.uid);
        }
      } catch (error) {
        console.error("Erro ao buscar contas vinculadas:", error);
        setActiveStudentId(currentUser.uid);
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, [currentUser?.email, currentUser?.uid]);

  const switchAccount = useCallback((studentId: string) => {
    setActiveStudentId(studentId);
    localStorage.setItem(STORAGE_KEY, studentId);
    setShowSelector(false);
  }, []);

  const activeAccount = accounts.find(a => a.id === activeStudentId) || null;
  const isMultiAccount = accounts.length > 1;

  return (
    <ActiveStudentContext.Provider
      value={{
        accounts,
        activeAccount,
        activeStudentId,
        isMultiAccount,
        isLoadingAccounts,
        switchAccount,
        showSelector,
        setShowSelector,
      }}
    >
      {children}
    </ActiveStudentContext.Provider>
  );
};
