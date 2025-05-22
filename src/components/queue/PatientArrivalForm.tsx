
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

  // Load available queues for the center
  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const { data, error } = await supabase
          .from("waiting_queues")
          .select("id, name, status")
          .eq("center_id", centerId as any)  // Type assertion to handle string parameter
          .eq("status", "active" as any);    // Type assertion to handle string parameter

        if (error) throw error;
        
        // Check if data is defined and is an array
        if (!data || !Array.isArray(data)) {
          console.error('Unexpected data format from waiting_queues query:', data);
          setQueues([]);
          return;
        }
        
        // Format the data correctly
        const formattedQueues = data.map(queue => {
          if (!queue || typeof queue !== 'object' || !('id' in queue) || !('name' in queue)) {
            return { id: '', name: 'Unknown queue' };
          }
          return {
            id: queue.id?.toString() || '',
            name: queue.name?.toString() || 'File sans nom'
          };
        });
        
        setQueues(formattedQueues);
        
        // Set the first queue as default value
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
          .eq("center_id", centerId as any);  // Type assertion to handle string parameter

        if (error) throw error;
        
        // Check if data is defined and is an array
        if (!data || !Array.isArray(data)) {
          console.error('Unexpected data format from practitioner_centers query:', data);
          setPractitioners([]);
          return;
        }
        
        // Transform data to get the desired format
        const formattedPractitioners: Practitioner[] = [];

        for (const item of data) {
          // Type check the item before accessing properties
          if (!item || typeof item !== 'object' || !('practitioners' in item)) {
            continue;
          }
          
          const practitioner = item.practitioners;
          if (!practitioner || typeof practitioner !== 'object') continue;
          
          // Safety check for profiles
          if (!('profiles' in practitioner) || !Array.isArray(practitioner.profiles)) {
            if ('id' in practitioner) {
              formattedPractitioners.push({
                id: String(practitioner.id || ''),
                name: 'Praticien sans nom' 
              });
            }
            continue;
          }
          
          const profiles = practitioner.profiles && Array.isArray(practitioner.profiles) 
            ? practitioner.profiles[0] 
            : null;
          
          const { firstName, lastName } = extractProfileData(profiles);
          
          if ('id' in practitioner) {
            formattedPractitioners.push({
              id: String(practitioner.id || ''),
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
      // Search by name
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .eq("user_type", "patient" as any); // Type assertion to handle string parameter

      if (error) throw error;
      
      // Check if data is defined and is an array
      if (!data || !Array.isArray(data)) {
        console.error('Unexpected data format from profiles query:', data);
        setSearchResults([]);
        return;
      }
      
      // Transform data to SearchResults
      const results: SearchResult[] = [];
      
      for (const patient of data) {
        if (!patient || typeof patient !== 'object') continue;
        
        if ('id' in patient) {
          const firstName = patient.first_name || '';
          const lastName = patient.last_name || '';
          
          results.push({
            id: String(patient.id || ''),
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
        .eq("center_id", centerId as any)  // Type assertion to handle string parameter
        .gte("start_time", `${date}T00:00:00`)
        .lte("start_time", `${date}T23:59:59`)
        .eq("status", "scheduled" as any);  // Type assertion to handle string parameter

      if (error) throw error;
      
      // Check if data is defined and is an array
      if (!data || !Array.isArray(data)) {
        console.error('Unexpected data format from appointments query:', data);
        setAppointments([]);
        return;
      }
      
      // Transform data to Appointments with type safety
      const formattedAppointments: Appointment[] = [];
      
      for (const apt of data) {
        if (!apt || typeof apt !== 'object') continue;
        
        // First check if required properties exist
        if (!('id' in apt) || !('patient_id' in apt) || !('start_time' in apt)) {
          continue;
        }
        
        // Safely access profiles
        const profiles = 'profiles' in apt && apt.profiles ? apt.profiles : null;
        const { firstName, lastName } = extractProfileData(profiles);
        const patientName = `${firstName} ${lastName}`.trim() || 'Patient sans nom';
          
        formattedAppointments.push({
          id: String(apt.id || ''),
          patientName,
          patientId: String(apt.patient_id || ''),
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

  // Search for appointments when registration type changes to "appointment"
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
      
      // For walk-in patients
      if (formData.registrationType === "walkIn" && formData.patientEmail) {
        try {
          // Create temporary patient account if needed
          const { data: existingUser, error: existingUserError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', formData.patientEmail)
            .maybeSingle();
          
          if (!existingUserError && existingUser && existingUser.id) {
            patientId = String(existingUser.id);
          } else {
            // Create a new temporary profile with a type assertion for TypeScript
            const newUserData = {
              id: crypto.randomUUID(),
              email: formData.patientEmail,
              first_name: "Patient",
              last_name: "Temporaire",
              user_type: "patient" 
            };

            const { data: newUser, error: newUserError } = await supabase
              .from('profiles')
              .insert(newUserData as any) // Use type assertion to avoid TypeScript errors
              .select('id')
              .single();
              
            if (newUserError) throw newUserError;
            
            // Check if newUser exists and has an id before assigning
            if (newUser && typeof newUser === 'object' && 'id' in newUser) {
              patientId = String(newUser.id);
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
      
      // Register in queue
      const queueEntryData = {
        queue_id: formData.queueId,
        patient_id: patientId,
        practitioner_id: formData.practitionerId || null,
        appointment_id: formData.appointmentId || null,
        arrival_time: new Date().toISOString(),
        status: "waiting",
      };
      
      const { data: queueEntry, error: queueError } = await supabase
        .from("queue_entries")
        .insert(queueEntryData as any) // Use type assertion to avoid TypeScript errors
        .select();

      if (queueError) throw queueError;
      
      // Update appointment status if associated
      if (formData.appointmentId) {
        const appointmentUpdate = { 
          status: "in_progress" 
        };
        
        const { error: appointmentError } = await supabase
          .from("appointments")
          .update(appointmentUpdate as any) // Use type assertion to avoid TypeScript errors
          .eq("id", formData.appointmentId as any); // Type assertion to handle string parameter

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
