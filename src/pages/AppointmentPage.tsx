
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentForm } from "@/components/appointment/AppointmentForm";
import { AppointmentsList } from "@/components/appointment/AppointmentsList";
import { NotificationPreferences } from "@/components/appointment/NotificationPreferences";
import { useAppointments } from "@/hooks/useAppointments";
import { endOfDay, startOfDay, subMonths, addMonths } from "date-fns";
import { toast } from "sonner";

export default function AppointmentPage() {
  const [activeTab, setActiveTab] = useState("upcoming");
  
  // Filtres pour les rendez-vous à venir
  const upcomingFilters = {
    dateFrom: startOfDay(new Date()).toISOString(),
    dateTo: endOfDay(addMonths(new Date(), 6)).toISOString(),
    status: 'all'
  };
  
  // Filtres pour les rendez-vous passés
  const pastFilters = {
    dateFrom: startOfDay(subMonths(new Date(), 12)).toISOString(),
    dateTo: endOfDay(new Date()).toISOString(),
    status: 'all'
  };
  
  // Utiliser le hook pour charger les rendez-vous
  const {
    appointments: upcomingAppointments,
    isLoading: isLoadingUpcoming,
    refetch: refetchUpcoming
  } = useAppointments(upcomingFilters);
  
  const {
    appointments: pastAppointments,
    isLoading: isLoadingPast,
    refetch: refetchPast
  } = useAppointments(pastFilters);
  
  // Rafraîchir tous les rendez-vous
  const refreshAppointments = () => {
    refetchUpcoming();
    refetchPast();
  };
  
  // Gérer l'annulation d'un rendez-vous
  const handleCancelAppointment = (id: string) => {
    toast.success("Le rendez-vous a été annulé.");
    refreshAppointments();
  };
  
  // Gérer la reprogrammation d'un rendez-vous (non implémenté pour l'instant)
  const handleRescheduleAppointment = () => {
    toast.info("La fonctionnalité de reprogrammation n'est pas encore disponible.");
  };
  
  // Gérer la création d'un nouveau rendez-vous
  const handleAppointmentCreated = () => {
    refreshAppointments();
    setActiveTab("upcoming");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestion des rendez-vous</h2>
        <p className="text-muted-foreground">
          Programmez, consultez et gérez vos rendez-vous médicaux.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs 
            defaultValue="upcoming" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList>
              <TabsTrigger value="upcoming">À venir</TabsTrigger>
              <TabsTrigger value="past">Historique</TabsTrigger>
              <TabsTrigger value="new">Nouveau rendez-vous</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {isLoadingUpcoming ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Chargement des rendez-vous...</CardTitle>
                  </CardHeader>
                </Card>
              ) : (
                <AppointmentsList
                  appointments={upcomingAppointments}
                  onCancelAppointment={handleCancelAppointment}
                  onRescheduleAppointment={handleRescheduleAppointment}
                />
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {isLoadingPast ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Chargement de l'historique...</CardTitle>
                  </CardHeader>
                </Card>
              ) : (
                <AppointmentsList
                  appointments={pastAppointments}
                  showPast={true}
                />
              )}
            </TabsContent>

            <TabsContent value="new">
              <AppointmentForm onAppointmentCreated={handleAppointmentCreated} />
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <NotificationPreferences />
        </div>
      </div>
    </div>
  );
}
