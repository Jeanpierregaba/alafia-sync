
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Building, ArrowRight, Activity, Stethoscope, Map, UserCheck, Clock4 } from "lucide-react";
import { Link } from "react-router-dom";
import { useWaitingQueue } from "@/hooks/useWaitingQueue";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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

  // Utiliser notre hook de gestion des files d'attente
  const { queues, entries, isLoading, activeQueueId, setActiveQueueId, updateEntryStatus, sendNotification } = useWaitingQueue();
  const [selectedTab, setSelectedTab] = useState<string>("overview");
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-green-100 text-green-700';
      case 'delayed': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting': return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">En attente</Badge>;
      case 'in_progress': return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">En cours</Badge>;
      case 'delayed': return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">Retardé</Badge>;
      default: return <Badge variant="outline" className="bg-gray-100 text-gray-700">Inconnu</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tableau de bord Centre de Santé</h2>
        <p className="text-muted-foreground">
          Bienvenue sur votre espace de gestion AlafiaSync.
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Vue Générale</TabsTrigger>
          <TabsTrigger value="waiting-room">Salle d'Attente</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
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

          <div className="grid gap-4 md:grid-cols-2 mt-4">
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
                <Button className="w-full justify-start" variant="outline" onClick={() => setSelectedTab("waiting-room")}>
                  <Users className="mr-2 h-4 w-4" />
                  Gérer la salle d'attente
                </Button>
              </CardContent>
            </Card>
          </div>
        
          <Card className="mt-4">
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
        </TabsContent>
        
        <TabsContent value="waiting-room">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Salle d'attente</CardTitle>
                      <CardDescription>Patients en attente de consultation</CardDescription>
                    </div>
                    <Button size="sm">Enregistrer un patient</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="py-8 text-center text-muted-foreground">Chargement des données...</div>
                  ) : entries.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">Aucun patient en attente</div>
                  ) : (
                    <div className="space-y-4">
                      {entries.map((entry) => (
                        <div 
                          key={entry.id} 
                          className="flex items-center justify-between border p-4 rounded-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(entry.status)}`}>
                              {entry.position || "-"}
                            </div>
                            <div>
                              <p className="font-medium">
                                {entry.patient?.first_name} {entry.patient?.last_name}
                              </p>
                              <div className="flex items-center text-sm text-muted-foreground gap-2">
                                <Clock4 className="h-3 w-3" />
                                <span>{entry.estimated_wait_time || "~15"} min</span>
                                {getStatusBadge(entry.status)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {entry.status === 'waiting' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => sendNotification(entry.id)}
                                  disabled={entry.notified_at !== null}
                                >
                                  Notifier
                                </Button>
                                <Button 
                                  size="sm" 
                                  onClick={() => updateEntryStatus(entry.id, 'in_progress')}
                                >
                                  Débuter
                                </Button>
                              </>
                            )}
                            
                            {entry.status === 'in_progress' && (
                              <Button 
                                size="sm" 
                                onClick={() => updateEntryStatus(entry.id, 'completed')}
                              >
                                Terminer
                              </Button>
                            )}
                            
                            {entry.status === 'delayed' && (
                              <Button 
                                size="sm" 
                                onClick={() => updateEntryStatus(entry.id, 'waiting')}
                              >
                                Remettre en file
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques de la journée</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <UserCheck className="h-4 w-4 mr-2 text-green-600" />
                        <span>Patients vus</span>
                      </div>
                      <span className="font-semibold">{entries.filter(e => e.status === 'completed').length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-blue-600" />
                        <span>En attente</span>
                      </div>
                      <span className="font-semibold">{entries.filter(e => e.status === 'waiting').length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Activity className="h-4 w-4 mr-2 text-amber-600" />
                        <span>Délai moyen</span>
                      </div>
                      <span className="font-semibold">14 min</span>
                    </div>
                    
                    <div className="h-px bg-gray-200 my-4" />
                    
                    <Button className="w-full" variant="outline">
                      Voir rapports détaillés
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FacilityDashboardPage;
