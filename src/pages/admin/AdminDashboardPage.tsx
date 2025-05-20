
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Users, Building, UserCog, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

// Interface pour les statistiques de l'activité
interface ActivityData {
  name: string;
  value: number;
}

const AdminDashboardPage = () => {
  const { isAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalPractitioners: 0,
    totalCenters: 0
  });
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fonction pour rafraîchir les données
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
    toast.info("Actualisation des données en cours...");
  };

  // Récupérer les statistiques de la base de données
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching admin statistics...");

        // Récupérer le nombre total de patients (profiles avec user_type = 'patient')
        const { data: patientData, error: patientError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_type', 'patient');
        
        if (patientError) {
          console.error("Error fetching patients:", patientError);
          throw patientError;
        }
        
        const patientCount = patientData ? patientData.length : 0;
        console.log("Found patients:", patientCount, patientData);

        // Récupérer le nombre total de praticiens
        const { data: practitionerData, error: practitionerError } = await supabase
          .from('practitioners')
          .select('id');
        
        if (practitionerError) {
          console.error("Error fetching practitioners:", practitionerError);
          throw practitionerError;
        }

        const practitionerCount = practitionerData ? practitionerData.length : 0;
        console.log("Found practitioners:", practitionerCount, practitionerData);

        // Récupérer le nombre total de centres de santé
        const { data: centerData, error: centerError } = await supabase
          .from('health_centers')
          .select('id');
        
        if (centerError) {
          console.error("Error fetching health centers:", centerError);
          throw centerError;
        }

        const centerCount = centerData ? centerData.length : 0;
        console.log("Found centers:", centerCount, centerData);

        setStats({
          totalPatients: patientCount,
          totalPractitioners: practitionerCount,
          totalCenters: centerCount
        });

        // Récupérer les données d'activité récentes (7 derniers jours)
        fetchActivityData();

      } catch (error) {
        console.error("Error fetching admin stats:", error);
        toast.error("Erreur lors de la récupération des statistiques");
      } finally {
        setIsLoading(false);
      }
    };

    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin, refreshTrigger]);

  // Récupérer les données d'activité pour les 7 derniers jours
  const fetchActivityData = async () => {
    try {
      // Pour cette version, nous allons simuler les données d'activité
      // Dans une version future, on pourrait compter les connexions ou actions par jour
      const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
      const today = new Date();
      const last7Days = Array(7)
        .fill(null)
        .map((_, index) => {
          const date = new Date();
          date.setDate(today.getDate() - (6 - index));
          return {
            name: days[date.getDay()],
            value: Math.floor(Math.random() * 30) + 5 // Données simulées pour l'instant
          };
        });
      
      setActivityData(last7Days);
    } catch (error) {
      console.error("Error fetching activity data:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Administrateur</h2>
          <p className="text-muted-foreground">
            Gérez l'ensemble des données et paramètres de la plateforme AlafiaSync.
          </p>
        </div>
        <button 
          onClick={refreshData}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          Actualiser
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/app/admin/patients">
          <Card className="hover:bg-secondary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total des Patients
              </CardTitle>
              <div className="rounded-full p-2 bg-blue-100 text-blue-700">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPatients}</div>
              <p className="text-xs text-muted-foreground">
                Cliquez pour gérer les patients
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/admin/practitioners">
          <Card className="hover:bg-secondary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total des Praticiens
              </CardTitle>
              <div className="rounded-full p-2 bg-purple-100 text-purple-700">
                <UserCog className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPractitioners}</div>
              <p className="text-xs text-muted-foreground">
                Cliquez pour gérer les praticiens
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/admin/centers">
          <Card className="hover:bg-secondary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Centres de santé
              </CardTitle>
              <div className="rounded-full p-2 bg-amber-100 text-amber-700">
                <Building className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCenters}</div>
              <p className="text-xs text-muted-foreground">
                Cliquez pour gérer les centres
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Activité de la plateforme</CardTitle>
          <div className="text-sm text-muted-foreground">Derniers 7 jours</div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={activityData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/app/admin/settings">
          <Card className="hover:bg-secondary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Paramètres de la plateforme
              </CardTitle>
              <div className="rounded-full p-2 bg-green-100 text-green-700">
                <Settings className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configurer les paramètres généraux de AlafiaSync
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
