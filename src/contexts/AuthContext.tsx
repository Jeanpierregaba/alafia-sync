
import { createContext } from "react";
import { User, Session } from "@supabase/supabase-js";

export type UserProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  user_type: 'patient' | 'doctor' | 'facility' | 'admin';
  created_at: string;
  updated_at: string;
};

export type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<void>;
  signIn: (email: string, password: string, isAdminLogin?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default AuthContext;
