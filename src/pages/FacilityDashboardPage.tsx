
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Building, ArrowRight, Activity, Stethoscope, Map } from "lucide-react";
import { Link } from "react-router-dom";

const FacilityDashboardPage = () => {
  // Mock data
  const practitioners = [
    { id: 1, name: "Dr. Konaté", specialty: "Cardiologie", appointments: 8 },
    { id: 2, name: "Dr. Diallo", specialty: "Dentiste", appointments: 6 },
    { id: 3, name: "Dr. Sow", specialty: "Pédiatrie", appointments: 10 },
  ];

  const stats = [
    { title: "Total praticiens", value: "14", icon: Stethoscope, color: "bg-blue-100 text-blue-700" },
    { title: "RDV aujourd'hui", value: "32", icon: Calendar, color: "bg-purple-100 text-purple-700" },
    { title: "Taux d'occupation", value: "78%", icon: Activity, color: "bg-amber-100 text-amber-700" },
    { title: "Patients enregistrés", value: "1,240", icon: Users, color: "bg-green-100 text-green-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tableau de bord Centre de Santé</h2>
        <p className="text-muted-foreground">
          Bienvenue sur votre espace de gestion AlafiaSync.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activité des praticiens</CardTitle>
            <CardDescription>
              Aperçu des rendez-vous par praticien aujourd'hui.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {practitioners.map((practitioner) => (
                <div
                  key={practitioner.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{practitioner.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {practitioner.specialty}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{practitioner.appointments}</p>
                    <p className="text-sm text-muted-foreground">
                      Rendez-vous
                    </p>
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full mt-2 gap-2">
                Voir tous les praticiens
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>
              Accédez rapidement aux fonctionnalités principales.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Planning des consultations
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Stethoscope className="mr-2 h-4 w-4" />
              Gérer les praticiens
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Map className="mr-2 h-4 w-4" />
              Informations du centre
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statistiques du centre</CardTitle>
          <CardDescription>
            Performance globale et indicateurs clés.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Taux de remplissage</h4>
                <Building className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2">78%</p>
              <p className="text-xs text-muted-foreground mt-1">
                +12% par rapport au mois dernier
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Temps d'attente</h4>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2">18 min</p>
              <p className="text-xs text-muted-foreground mt-1">
                Moyenne ce mois-ci
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Nouveaux patients</h4>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2">124</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ce mois-ci
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacilityDashboardPage;
