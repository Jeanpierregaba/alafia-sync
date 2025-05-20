import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock, Search } from "lucide-react";
import { toast } from "sonner";

const AppointmentsPage = () => {
  // Mock data for upcoming appointments
  const upcomingAppointments = [
    { 
      id: 1, 
      doctor: "Dr. Konaté", 
      specialty: "Cardiologie", 
      facility: "Hôpital Central", 
      date: "15 Mai 2025", 
      time: "10:00",
      status: "confirmed"
    },
    { 
      id: 2, 
      doctor: "Dr. Diallo", 
      specialty: "Dentiste", 
      facility: "Clinique Dentaire du Centre", 
      date: "20 Mai 2025", 
      time: "14:30",
      status: "confirmed"
    }
  ];

  // Mock data for past appointments
  const pastAppointments = [
    { 
      id: 3, 
      doctor: "Dr. Ouattara", 
      specialty: "Médecine Générale", 
      facility: "Centre Médical Région Sud", 
      date: "10 Avril 2025", 
      time: "09:15",
      status: "completed"
    },
    { 
      id: 4, 
      doctor: "Dr. Sanogo", 
      specialty: "Ophtalmologie", 
      facility: "Clinique Visuelle", 
      date: "2 Mars 2025", 
      time: "11:30",
      status: "completed"
    },
    { 
      id: 5, 
      doctor: "Dr. Touré", 
      specialty: "Dermatologie", 
      facility: "Centre Dermatologique", 
      date: "15 Février 2025", 
      time: "16:00",
      status: "cancelled"
    },
  ];

  // State for new appointment form
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [specialty, setSpecialty] = useState("");
  const [doctor, setDoctor] = useState("");
  const [time, setTime] = useState("");

  // Mock time slots
  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00",
    "10:30", "11:00", "11:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  // Mock specialties
  const specialties = [
    "Cardiologie", "Dermatologie", "Médecine Générale", 
    "Ophtalmologie", "Dentiste", "Gynécologie",
    "Orthopédie", "Pédiatrie", "Psychiatrie"
  ];

  // Mock doctors by specialty
  const doctorsBySpecialty: Record<string, string[]> = {
    "Cardiologie": ["Dr. Konaté", "Dr. Bamba"],
    "Dermatologie": ["Dr. Touré", "Dr. Fofana"],
    "Médecine Générale": ["Dr. Ouattara", "Dr. Coulibaly"],
    "Ophtalmologie": ["Dr. Sanogo", "Dr. Kone"],
    "Dentiste": ["Dr. Diallo", "Dr. Keita"],
    "Gynécologie": ["Dr. Dao", "Dr. Traore"],
    "Orthopédie": ["Dr. Sylla", "Dr. Camara"],
    "Pédiatrie": ["Dr. Bah", "Dr. Conde"],
    "Psychiatrie": ["Dr. Soumah", "Dr. Diakite"]
  };

  // Handle booking appointment
  const handleBookAppointment = () => {
    if (!date || !specialty || !doctor || !time) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    toast.success("Rendez-vous programmé avec succès", {
      description: `${format(date, "d MMMM yyyy", { locale: fr })} à ${time}`
    });

    // Reset form
    setDate(undefined);
    setSpecialty("");
    setDoctor("");
    setTime("");
  };

  const handleCancel = (id: number) => {
    toast.success("Rendez-vous annulé");
  };

  const handleReschedule = (id: number) => {
    toast.info("Fonctionnalité de reprogrammation à venir");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Rendez-vous</h2>
        <p className="text-muted-foreground">
          Consultez, programmez et gérez vos rendez-vous médicaux.
        </p>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">À venir</TabsTrigger>
          <TabsTrigger value="past">Passés</TabsTrigger>
          <TabsTrigger value="new">Nouveau rendez-vous</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Aucun rendez-vous à venir</CardTitle>
                <CardDescription>
                  Vous n'avez aucun rendez-vous programmé pour le moment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => {
                  // Fix: Find the element and use an explicit cast to HTMLElement
                  const newTabTrigger = document.querySelector('[data-value="new"]');
                  if (newTabTrigger && newTabTrigger instanceof HTMLElement) {
                    newTabTrigger.click();
                  }
                }}>
                  Prendre un rendez-vous
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcomingAppointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardHeader className="pb-2">
                    <CardTitle>{appointment.doctor}</CardTitle>
                    <CardDescription>{appointment.specialty}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{appointment.date}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{appointment.time}</span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {appointment.facility}
                      </div>
                      <div className="flex justify-end space-x-2 mt-2">
                        <Button variant="outline" size="sm" onClick={() => handleReschedule(appointment.id)}>
                          Reprogrammer
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleCancel(appointment.id)}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastAppointments.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Aucun historique</CardTitle>
                <CardDescription>
                  Vous n'avez aucun historique de rendez-vous.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pastAppointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{appointment.doctor}</CardTitle>
                        <CardDescription>{appointment.specialty}</CardDescription>
                      </div>
                      <div>
                        {appointment.status === "completed" ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Terminé
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                            Annulé
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{appointment.date}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{appointment.time}</span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {appointment.facility}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>Prendre un nouveau rendez-vous</CardTitle>
              <CardDescription>
                Remplissez le formulaire ci-dessous pour planifier un rendez-vous avec un spécialiste.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="specialty">Spécialité</Label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une spécialité" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="doctor">Médecin</Label>
                <Select 
                  value={doctor} 
                  onValueChange={setDoctor}
                  disabled={!specialty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un médecin" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialty && doctorsBySpecialty[specialty]?.map((doc) => (
                      <SelectItem key={doc} value={doc}>{doc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                      disabled={!doctor}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "d MMMM yyyy", { locale: fr }) : <span>Sélectionner une date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => {
                        const now = new Date();
                        return date < now || date > new Date(now.setMonth(now.getMonth() + 3));
                      }}
                      initialFocus
                      locale={fr}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">Heure</Label>
                <Select 
                  value={time} 
                  onValueChange={setTime}
                  disabled={!date}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une heure" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full"
                onClick={handleBookAppointment}
                disabled={!date || !specialty || !doctor || !time}
              >
                Prendre rendez-vous
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AppointmentsPage;
