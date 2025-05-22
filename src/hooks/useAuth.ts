
import { useContext } from "react";
import AuthContext from "@/contexts/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé avec AuthProvider");
  }
  return context;
};

export type { UserProfile } from "@/contexts/AuthContext";
