
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export type UserProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  user_type: 'patient' | 'doctor' | 'facility' | 'admin';
  created_at: string;
  updated_at: string;
};

type AuthContextType = {
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    // First set up the auth state change listener to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state change:', event);
        
        // Update state with session data
        setSession(newSession);
        setUser(newSession?.user ?? null);

        // Handle different auth events
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (newSession?.user) {
            // Use setTimeout to avoid recursion with Supabase auth
            setTimeout(() => {
              fetchUserProfile(newSession.user!.id);
            }, 0);
          }
        } else if (event === 'SIGNED_OUT') {
          setProfile(null);
          setIsAdmin(false);
        }
      }
    );

    // Then check for existing session
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        // Get current session if it exists
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log("Current session:", currentSession);
        
        // Update state with session data
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user.id);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        toast.error("Erreur lors de l'initialisation de l'authentification");
      } finally {
        setIsLoading(false);
      }
    };

    // Initialize auth state
    initializeAuth();

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log("Fetching user profile for:", userId);
      
      // Check admin status via RPC function
      const { data: adminData, error: adminError } = await supabase.rpc('is_admin', { uid: userId });
      
      if (adminError) {
        console.error("Error checking admin status:", adminError);
      } else {
        console.log('Is admin check result:', adminData);
        setIsAdmin(Boolean(adminData));
      }

      // Fetch user metadata
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }
      
      if (userData.user) {
        const userMetadata = userData.user.user_metadata;
        console.log("User metadata:", userMetadata);
        
        // Also fetch profile data from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') {  // Not found is ok
          console.error("Error fetching profile from database:", profileError);
        }
        
        console.log("Profile data from DB:", profileData);
        
        // Combine metadata with profile data if available
        const userProfile = {
          id: userId,
          first_name: profileData?.first_name || userMetadata?.first_name || null,
          last_name: profileData?.last_name || userMetadata?.last_name || null,
          avatar_url: profileData?.avatar_url || userMetadata?.avatar_url || null,
          user_type: profileData?.user_type || userMetadata?.user_type || 'patient',
          created_at: profileData?.created_at || new Date().toISOString(),
          updated_at: profileData?.updated_at || new Date().toISOString()
        } as UserProfile;
        
        console.log('User profile created:', userProfile);
        setProfile(userProfile);
      }
    } catch (error) {
      console.error("Error in fetchUserProfile:", error);
      toast.error("Erreur lors de la récupération du profil utilisateur");
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.first_name || "",
            last_name: userData.last_name || "",
            user_type: userData.user_type || "patient",
          },
        },
      });

      if (error) {
        throw error;
      }

      toast.success("Compte créé avec succès! Vérifiez votre email.");
    } catch (error: any) {
      console.error("Erreur lors de l'inscription:", error);
      toast.error(error.message || "Erreur lors de l'inscription");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string, isAdminLogin: boolean = false) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success("Connexion réussie!");
    } catch (error: any) {
      console.error("Erreur lors de la connexion:", error);
      toast.error(error.message || "Erreur lors de la connexion");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
      toast.success("Déconnexion réussie!");
    } catch (error: any) {
      console.error("Erreur lors de la déconnexion:", error);
      toast.error(error.message || "Erreur lors de la déconnexion");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        signUp,
        signIn,
        signOut,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé avec AuthProvider");
  }
  return context;
};
