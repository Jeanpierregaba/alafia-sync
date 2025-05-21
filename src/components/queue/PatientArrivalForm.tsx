
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  patientId: z.string().optional(),
  patientEmail: z.string().email().optional(),
  queueId: z.string(),
  practitionerId: z.string().optional(),
  appointmentId: z.string().optional(),
  registrationType: z.enum(["appointment", "search", "walkIn"]),
});

type PatientArrivalFormProps = {
  centerId: string;
  onPatientRegistered?: () => void;
};

export function PatientArrivalForm({ centerId, onPatientRegistered }: PatientArrivalFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [queues, setQueues] = useState<Array<{ id: string; name: string }>>([]);
  const [practitioners, setPractitioners] = useState<Array<{ id: string; name: string }>>([]);
  const [appointments, setAppointments] = useState<Array<{ id: string; patientName: string }>>([]);
  const [searchResults, setSearchResults] = useState<Array<{ id: string; email: string; fullName: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      registrationType: "appointment",
      queueId: "",
      patientId: "",
      patientEmail: "",
      practitionerId: "",
      appointmentId: "",
    },
  });

  const registrationType = form.watch("registrationType");

  // Chargement des files d'attente disponibles pour le centre
  useState(() => {
    const fetchQueues = async () => {
      try {
        const { data, error } = await supabase
          .from("waiting_queues")
          .select("id, name, status")
          .eq("center_id", centerId)
          .eq("status", "active");

        if (error) throw error;
        setQueues(data || []);
        
        // Définir la première file comme valeur par défaut
        if (data && data.length > 0) {
          form.setValue("queueId", data[0].id);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des files d'attente:", err);
        toast.error("Impossible de charger les files d'attente");
      }
    };
    
    const fetchPractitioners = async () => {
      try {
        const { data, error } = await supabase
          .from("practitioner_centers")
          .select(`
            practitioners:practitioner_id (
              id,
              user_id,
              profiles:user_id (
                first_name,
                last_name
              )
            )
          `)
          .eq("center_id", centerId);

        if (error) throw error;
        
        const formattedPractitioners = (data || []).map((item) => ({
          id: item.practitioners.id,
          name: `${item.practitioners.profiles.first_name} ${item.practitioners.profiles.last_name}`,
        }));
        
        setPractitioners(formattedPractitioners);
      } catch (err) {
        console.error("Erreur lors du chargement des praticiens:", err);
      }
    };
    
    fetchQueues();
    fetchPractitioners();
  }, [centerId]);

  const searchPatient = async (query: string) => {
    if (query.length < 3) return;
    
    setIsSearching(true);
    try {
      // Recherche par email
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .eq("user_type", "patient")
        .limit(5);

      if (error) throw error;
      
      setSearchResults(
        (data || []).map((patient) => ({
          id: patient.id,
          email: patient.email || "",
          fullName: `${patient.first_name} ${patient.last_name}`,
        }))
      );
    } catch (err) {
      console.error("Erreur lors de la recherche du patient:", err);
      toast.error("Erreur lors de la recherche");
    } finally {
      setIsSearching(false);
    }
  };

  const searchAppointments = async (date: string = new Date().toISOString().split('T')[0]) => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          start_time,
          end_time,
          status,
          patient_id,
          profiles:patient_id (
            first_name,
            last_name
          )
        `)
        .eq("center_id", centerId)
        .gte("start_time", `${date}T00:00:00`)
        .lte("start_time", `${date}T23:59:59`)
        .eq("status", "scheduled")
        .order("start_time", { ascending: true });

      if (error) throw error;
      
      setAppointments(
        (data || []).map((appointment) => ({
          id: appointment.id,
          patientName: `${appointment.profiles.first_name} ${appointment.profiles.last_name}`,
          patientId: appointment.patient_id,
          startTime: new Date(appointment.start_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }))
      );
    } catch (err) {
      console.error("Erreur lors du chargement des rendez-vous:", err);
      toast.error("Impossible de charger les rendez-vous");
    }
  };

  // Rechercher les rendez-vous du jour au chargement
  useState(() => {
    if (registrationType === "appointment") {
      searchAppointments();
    }
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      let patientId = values.patientId;
      
      // Pour les patients qui arrivent sans rendez-vous
      if (values.registrationType === "walkIn" && values.patientEmail) {
        // Créer un compte patient temporaire si nécessaire
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
          email: values.patientEmail,
          password: Math.random().toString(36).slice(-8), // Mot de passe aléatoire
          email_confirm: true,
          user_metadata: {
            first_name: "Patient",
            last_name: "Temporaire",
            user_type: "patient",
          },
        });

        if (userError) throw userError;
        patientId = userData.user.id;
      }
      
      if (!patientId || !values.queueId) {
        toast.error("Information patient ou file d'attente manquante");
        return;
      }
      
      // Enregistrer dans la file d'attente
      const { data: queueEntry, error: queueError } = await supabase
        .from("queue_entries")
        .insert({
          queue_id: values.queueId,
          patient_id: patientId,
          practitioner_id: values.practitionerId || null,
          appointment_id: values.appointmentId || null,
          arrival_time: new Date().toISOString(),
          status: "waiting",
        })
        .select();

      if (queueError) throw queueError;
      
      // Si un rendez-vous est associé, mettre à jour son statut
      if (values.appointmentId) {
        const { error: appointmentError } = await supabase
          .from("appointments")
          .update({ status: "in_progress" })
          .eq("id", values.appointmentId);

        if (appointmentError) {
          console.error("Erreur lors de la mise à jour du statut du rendez-vous:", appointmentError);
        }
      }
      
      toast.success("Patient enregistré avec succès dans la file d'attente");
      form.reset();
      if (onPatientRegistered) onPatientRegistered();
    } catch (err: any) {
      console.error("Erreur lors de l'enregistrement du patient:", err);
      toast.error(`Erreur: ${err.message || "Impossible d'enregistrer le patient"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enregistrer un patient</CardTitle>
        <CardDescription>
          Ajoutez un patient à la file d'attente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="queueId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File d'attente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une file d'attente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {queues.map((queue) => (
                        <SelectItem key={queue.id} value={queue.id}>
                          {queue.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="registrationType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Type d'enregistrement</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="appointment" />
                        </FormControl>
                        <FormLabel className="font-normal">Rendez-vous</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="search" />
                        </FormControl>
                        <FormLabel className="font-normal">Rechercher un patient</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="walkIn" />
                        </FormControl>
                        <FormLabel className="font-normal">Sans rendez-vous</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {registrationType === "appointment" && (
              <FormField
                control={form.control}
                name="appointmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rendez-vous</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      const appointment = appointments.find(a => a.id === value);
                      if (appointment) {
                        form.setValue("patientId", appointment.patientId);
                      }
                    }}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un rendez-vous" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {appointments.map((appointment) => (
                          <SelectItem key={appointment.id} value={appointment.id}>
                            {appointment.patientName} - {appointment.startTime}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Sélectionnez un rendez-vous planifié pour aujourd'hui
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {registrationType === "search" && (
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Rechercher un patient</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Input
                          placeholder="Rechercher par nom, prénom ou email"
                          onChange={(e) => searchPatient(e.target.value)}
                        />
                        {isSearching && (
                          <div className="flex items-center justify-center py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="ml-2 text-sm text-muted-foreground">Recherche en cours...</span>
                          </div>
                        )}
                        {searchResults.length > 0 && (
                          <Card>
                            <CardContent className="p-1">
                              {searchResults.map((patient) => (
                                <Button
                                  key={patient.id}
                                  type="button"
                                  variant="ghost"
                                  className="w-full justify-start text-left p-2 h-auto"
                                  onClick={() => {
                                    field.onChange(patient.id);
                                    setSearchResults([]);
                                  }}
                                >
                                  <div>
                                    <div className="font-medium">{patient.fullName}</div>
                                    <div className="text-xs text-muted-foreground">{patient.email}</div>
                                  </div>
                                </Button>
                              ))}
                            </CardContent>
                          </Card>
                        )}
                        {field.value && (
                          <div className="rounded border p-2 bg-muted/50 text-sm">
                            Patient sélectionné: {searchResults.find(p => p.id === field.value)?.fullName || field.value}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {registrationType === "walkIn" && (
              <FormField
                control={form.control}
                name="patientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email du patient</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemple.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Pour les patients sans rendez-vous
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="practitionerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Praticien</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un praticien (optionnel)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {practitioners.map((practitioner) => (
                        <SelectItem key={practitioner.id} value={practitioner.id}>
                          {practitioner.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Optionnel: Associer le patient à un praticien spécifique
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="px-0 pt-4">
              <Button type="submit" className="ml-auto" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer l'arrivée
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
