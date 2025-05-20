import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { LockKeyhole } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const adminLoginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { signIn, isLoading } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: AdminLoginFormValues) => {
    setLoginError(null);
    try {
      await signIn(values.email, values.password, true);
      
      // Récupérer l'utilisateur après la connexion
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }
      
      // Vérifier directement avec la fonction RPC is_admin
      if (user) {
        const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin', { 
          uid: user.id 
        });
        
        if (adminError) {
          console.error("Erreur lors de la vérification du statut admin:", adminError);
          throw adminError;
        }
        
        if (isAdmin) {
          toast.success("Bienvenue dans l'administration");
          navigate("/app/admin/dashboard");
        } else {
          toast.error("Vous n'avez pas les droits d'administrateur");
          // Déconnexion si l'utilisateur n'est pas admin
          await supabase.auth.signOut();
          setLoginError("Ce compte ne dispose pas des privilèges administrateur");
        }
      }
    } catch (error: any) {
      console.error("Erreur de connexion admin:", error);
      toast.error(error.message || "Erreur lors de la connexion");
      setLoginError("Identifiants incorrects ou problème de connexion");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 4C5.79 4 4 5.79 4 8C4 10.21 5.79 12 8 12C10.21 12 12 10.21 12 8C12 5.79 10.21 4 8 4ZM8.5 10H7.5V8.5H6V7.5H7.5V6H8.5V7.5H10V8.5H8.5V10Z" fill="white"/>
              </svg>
            </div>
            <span className="text-xl font-semibold">ALAFIA SYNC</span>
          </Link>
        </div>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <LockKeyhole className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-center">Administration</CardTitle>
            <CardDescription className="text-center">
              Accès réservé aux administrateurs
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                {loginError && (
                  <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
                    {loginError}
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email administrateur</FormLabel>
                      <FormControl>
                        <Input placeholder="admin@alafiasync.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Connexion en cours..." : "Accéder au tableau de bord"}
                </Button>
                <div className="text-center">
                  <Link to="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Retour à la connexion utilisateur
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default AdminLoginPage;
