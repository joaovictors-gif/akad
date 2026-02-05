import { useAuth } from "@/contexts/AuthContext";

export const useUserRole = () => {
  const { currentUser } = useAuth();

  const isAdmin = (): boolean => {
    if (!currentUser?.email) return false;
    // Check if email domain starts with "admin"
    const domain = currentUser.email.toLowerCase().split("@")[1];
    return domain?.startsWith("admin") ?? false;
  };

  const isStudent = (): boolean => {
    if (!currentUser?.email) return false;
    // Any email with domain not starting with "admin" is a student
    const domain = currentUser.email.toLowerCase().split("@")[1];
    return !(domain?.startsWith("admin") ?? false);
  };

  return {
    isAdmin: isAdmin(),
    isStudent: isStudent(),
    userEmail: currentUser?.email || null,
  };
};
