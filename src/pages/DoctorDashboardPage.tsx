
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Activity, ArrowRight, CalendarClock, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";

const DoctorDashboardPage = () => {
  // Mock data pour les statistiques et les rendez-vous
  const upcomingAppointments = [
    { id: 1, patient: "Amadou Diallo", reason: "Consultation de routine", date: "15 Mai 2025", time: "10:00" },
    { id: 2, patient: "Fatou Sy", reason: "Suivi traitement", date: "15 Mai 2025", time: "11:30" },
    { id: 3, patient: "Ousmane Ndiaye", reason: "Examen annuel", date: "16 Mai 2025", time: "09:15" },
  ];

  const stats = [
    { title: "Patients aujourd'hui", value: "8", icon: Users, color: "bg-blue-100 text-blue-700" },
    { title: "Consultations à venir", value: "14", icon: Calendar, color: "bg-purple-100 text-purple-700" },
    { title: "Heures de consultation", value: "6", icon: Clock, color: "bg-amber-100 text-amber-700" },
    { title: "Taux d'occupation", value: "87%", icon: Activity, color: "bg-green-100 text-green-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tableau de bord Praticien</h2>
        <p className="text-muted-foreground">
          Bienvenue sur votre espace professionnel AlafiaSync.
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
            <CardTitle>Prochains rendez-vous</CardTitle>
            <CardDescription>
              Vos consultations planifiées pour aujourd'hui et demain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{appointment.patient}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.reason}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{appointment.date}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.time}
                    </p>
                  </div>
                </div>
              ))}
              <Link to="/app/appointments">
                <Button variant="ghost" className="w-full mt-2 gap-2">
                  Voir tous les rendez-vous
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>
              Accès rapide aux fonctionnalités principales.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button className="w-full justify-start" variant="outline">
              <ClipboardList className="mr-2 h-4 w-4" />
              Consulter mon agenda de la semaine
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <CalendarClock className="mr-2 h-4 w-4" />
              Définir mes disponibilités
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Gérer ma liste de patients
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Récapitulatif des consultations</CardTitle>
          <CardDescription>
            Statistiques sur vos dernières consultations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Durée moyenne</h4>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2">22 min</p>
              <p className="text-xs text-muted-foreground mt-1">
                +5% par rapport au mois dernier
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Nouveaux patients</h4>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2">18</p>
              <p className="text-xs text-muted-foreground mt-1">
                Ce mois-ci
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Consultations</h4>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2">42</p>
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

export default DoctorDashboardPage;
