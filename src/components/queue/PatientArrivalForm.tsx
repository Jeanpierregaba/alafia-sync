
import { useState, useEffect } from "react";
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

// Define a simpler schema without complex nested types
const formSchema = z.object({
  patientId: z.string().optional(),
  patientEmail: z.string().email().optional(),
  queueId: z.string(),
  practitionerId: z.string().optional(),
  appointmentId: z.string().optional(),
  registrationType: z.enum(["appointment", "search", "walkIn"]),
});

// Use type alias instead of direct type annotation
type FormValues = z.infer<typeof formSchema>;

type PatientArrivalFormProps = {
  centerId: string;
  onPatientRegistered?: () => void;
};

type Practitioner = {
  id: string;
  name: string;
};

type Appointment = {
  id: string;
  patientName: string;
  patientId: string;
  startTime: string;
};

type SearchResult = {
  id: string;
  email: string | null;
  fullName: string;
};

// Simple helper function to safely extract profile data
const extractProfileData = (profiles: any): { firstName: string, lastName: string } => {
  if (!profiles || typeof profiles !== 'object') {
    return { firstName: '', lastName: '' };
  }
  
  return {
    firstName: typeof profiles.first_name === 'string' ? profiles.first_name : '',
    lastName: typeof profiles.last_name === 'string' ? profiles.last_name : ''
  };
};

export function PatientArrivalForm({ centerId, onPatientRegistered }: PatientArrivalFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [queues, setQueues] = useState<Array<{ id: string; name: string }>>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Initialize form with explicit type to avoid deep instantiation
  const form = useForm<FormValues>({
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
  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const { data, error } = await supabase
          .from("waiting_queues")
          .select("id, name, status")
          .eq("center_id", centerId)
          .eq("status", "active");

        if (error) throw error;
        
        // Vérifier si data est défini et est un tableau
        if (!data || !Array.isArray(data)) {
          console.error('Unexpected data format from waiting_queues query:', data);
          setQueues([]);
          return;
        }
        
        // Formattons le correctement
        const formattedQueues = data.map(queue => {
          return {
            id: queue?.id || '',
            name: queue?.name || 'File sans nom'
          };
        });
        
        setQueues(formattedQueues);
        
        // Définir la première file comme valeur par défaut
        if (formattedQueues.length > 0) {
          form.setValue("queueId", formattedQueues[0].id);
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
        
        // Vérifier si data est défini et est un tableau
        if (!data || !Array.isArray(data)) {
          console.error('Unexpected data format from practitioner_centers query:', data);
          setPractitioners([]);
          return;
        }
        
        // Transformer les données pour obtenir le format souhaité
        const formattedPractitioners: Practitioner[] = [];

        for (const item of data) {
          if (item?.practitioners && typeof item.practitioners === 'object') {
            const practitioner = item.practitioners;
            if (!practitioner) continue;
            
            const profiles = practitioner.profiles;
            const { firstName, lastName } = extractProfileData(profiles);
            
            formattedPractitioners.push({
              id: practitioner.id || '',
              name: `${firstName} ${lastName}`.trim() || 'Praticien sans nom'
            });
          }
        }
        
        setPractitioners(formattedPractitioners);
      } catch (err) {
        console.error("Erreur lors du chargement des praticiens:", err);
      }
    };
    
    fetchQueues();
    fetchPractitioners();
  }, [centerId, form]);

  const searchPatient = async (query: string) => {
    if (query.length < 3) return;
    
    setIsSearching(true);
    try {
      // Recherche par nom
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .eq("user_type", "patient");

      if (error) throw error;
      
      // Vérifier si data est défini et est un tableau
      if (!data || !Array.isArray(data)) {
        console.error('Unexpected data format from profiles query:', data);
        setSearchResults([]);
        return;
      }
      
      // Transformer les données en SearchResults
      const results: SearchResult[] = [];
      
      for (const patient of data) {
        if (patient && typeof patient === 'object' && patient.id) {
          const firstName = patient.first_name || '';
          const lastName = patient.last_name || '';
          
          results.push({
            id: patient.id,
            email: null,
            fullName: `${firstName} ${lastName}`.trim() || 'Patient sans nom'
          });
        }
      }
      
      setSearchResults(results);
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
        .eq("status", "scheduled");

      if (error) throw error;
      
      // Vérifier si data est défini et est un tableau
      if (!data || !Array.isArray(data)) {
        console.error('Unexpected data format from appointments query:', data);
        setAppointments([]);
        return;
      }
      
      // Transformer les données en Appointments
      const formattedAppointments: Appointment[] = [];
      
      for (const apt of data) {
        if (!apt) continue;
        
        const profiles = apt.profiles;
        const { firstName, lastName } = extractProfileData(profiles);
        const patientName = `${firstName} ${lastName}`.trim() || 'Patient sans nom';
          
        formattedAppointments.push({
          id: apt.id || '',
          patientName,
          patientId: apt.patient_id || '',
          startTime: apt.start_time ? new Date(apt.start_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          }) : ''
        });
      }
      
      setAppointments(formattedAppointments);
    } catch (err) {
      console.error("Erreur lors du chargement des rendez-vous:", err);
      toast.error("Impossible de charger les rendez-vous");
    }
  };

  // Rechercher les rendez-vous du jour au chargement
  useEffect(() => {
    if (registrationType === "appointment") {
      searchAppointments();
    }
  }, [registrationType]);

  // Fixed form submission to avoid deep instantiation issues
  const onSubmit = form.handleSubmit((values) => {
    handlePatientRegistration(values);
  });

  // Separate function with clear typing to handle patient registration
  const handlePatientRegistration = async (formData: FormValues) => {
    setIsLoading(true);
    try {
      let patientId = formData.patientId;
      
      // Pour les patients qui arrivent sans rendez-vous
      if (formData.registrationType === "walkIn" && formData.patientEmail) {
        try {
          // Créer un compte patient temporaire si nécessaire
          const { data: existingUser, error: existingUserError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', formData.patientEmail)
            .maybeSingle();
          
          if (!existingUserError && existingUser) {
            patientId = existingUser.id;
          } else {
            // Créer un nouveau profil temporaire avec un cast pour éviter l'erreur TypeScript
            const { data: newUser, error: newUserError } = await supabase
              .from('profiles')
              .insert({
                id: crypto.randomUUID(),
                email: formData.patientEmail,
                first_name: "Patient",
                last_name: "Temporaire",
                user_type: "patient" as any // Cast pour éviter l'erreur TypeScript
              } as any)
              .select('id')
              .single();
              
            if (newUserError) throw newUserError;
            
            // Vérifier si newUser existe et a un id avant de l'assigner
            if (newUser && newUser.id) {
              patientId = newUser.id;
            } else {
              throw new Error("Failed to create patient profile");
            }
          }
        } catch (error) {
          console.error("Erreur lors de la création/recherche du profil temporaire:", error);
          toast.error("Impossible de créer un profil temporaire");
          return;
        }
      }
      
      if (!patientId || !formData.queueId) {
        toast.error("Information patient ou file d'attente manquante");
        return;
      }
      
      // Enregistrer dans la file d'attente
      const { data: queueEntry, error: queueError } = await supabase
        .from("queue_entries")
        .insert({
          queue_id: formData.queueId,
          patient_id: patientId,
          practitioner_id: formData.practitionerId || null,
          appointment_id: formData.appointmentId || null,
          arrival_time: new Date().toISOString(),
          status: "waiting",
        } as any)
        .select();

      if (queueError) throw queueError;
      
      // Si un rendez-vous est associé, mettre à jour son statut
      if (formData.appointmentId) {
        const { error: appointmentError } = await supabase
          .from("appointments")
          .update({ status: "in_progress" as any })
          .eq("id", formData.appointmentId);

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
          <form onSubmit={onSubmit} className="space-y-4">
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
