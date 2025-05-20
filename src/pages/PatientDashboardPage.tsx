
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const PatientDashboardPage = () => {
  // Mock data
  const upcomingAppointments = [
    { id: 1, doctor: "Dr. Konaté", specialty: "Cardiologie", date: "15 Mai 2025", time: "10:00" },
    { id: 2, doctor: "Dr. Diallo", specialty: "Dentiste", date: "20 Mai 2025", time: "14:30" },
  ];

  const stats = [
    { title: "Rendez-vous à venir", value: "2", icon: Calendar, color: "bg-blue-100 text-blue-700" },
    { title: "Rendez-vous passés", value: "8", icon: Clock, color: "bg-purple-100 text-purple-700" },
    { title: "Médecins consultés", value: "4", icon: Users, color: "bg-amber-100 text-amber-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tableau de bord</h2>
        <p className="text-muted-foreground">
          Bienvenue sur votre espace personnel AlafiaSync.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
              Vos prochains rendez-vous médicaux planifiés.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <p className="text-muted-foreground">Aucun rendez-vous à venir.</p>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{appointment.doctor}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.specialty}
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
            )}
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
            <Link to="/app/appointments">
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Prendre un rendez-vous
              </Button>
            </Link>
            <Link to="/app/doctors">
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Rechercher un médecin
              </Button>
            </Link>
            <Link to="/app/profile">
              <Button className="w-full justify-start" variant="outline">
                <svg
                  className="mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Mettre à jour le profil
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conseils de santé</CardTitle>
          <CardDescription>
            Recommandations adaptées à votre profil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">Rappel de vaccination saisonnière</h4>
              <p className="text-sm text-muted-foreground mt-1">
                La période de vaccination contre la grippe saisonnière a commencé. Prenez rendez-vous avec votre médecin généraliste pour vous protéger.
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="font-semibold">Hydratation pendant la saison chaude</h4>
              <p className="text-sm text-muted-foreground mt-1">
                N'oubliez pas de boire au moins 2 litres d'eau par jour pendant cette période de chaleur pour éviter la déshydratation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientDashboardPage;
