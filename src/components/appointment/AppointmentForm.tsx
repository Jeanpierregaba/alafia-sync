
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { InteractiveCalendar } from "./InteractiveCalendar";
import { TimeslotSelector } from "./TimeslotSelector";
import { DocumentUploader } from "./DocumentUploader";
import { useAppointments } from "@/hooks/useAppointments";
import { useState as useHookState } from "@/hooks/use-state";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AppointmentFormData, AvailableSlot } from "@/types/appointments";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AppointmentFormProps {
  onAppointmentCreated?: () => void;
}

export function AppointmentForm({ onAppointmentCreated }: AppointmentFormProps) {
  // États pour les données du formulaire
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedPractitioner, setSelectedPractitioner] = useState<string>("");
  const [selectedCenter, setSelectedCenter] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [symptoms, setSymptoms] = useState<string>("");
  const [medicalHistory, setMedicalHistory] = useState<string>("");
  const [isEmergency, setIsEmergency] = useState<boolean>(false);
  const [documents, setDocuments] = useState<File[]>([]);
  
  // États pour les données à récupérer
  const [practitioners, setPractitioners] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const { createAppointment, getAvailableSlots } = useAppointments();

  // Récupérer les médecins et centres au chargement
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Récupérer les praticiens
        const { data: practData, error: practError } = await supabase
          .from('practitioners')
          .select(`
            id,
            speciality,
            user_id,
            profiles:user_id (
              first_name,
              last_name
            )
          `);
        
        if (practError) throw practError;
        setPractitioners(practData || []);
        
        // Récupérer les centres
        const { data: centerData, error: centerError } = await supabase
          .from('health_centers')
          .select('*');
        
        if (centerError) throw centerError;
        setCenters(centerData || []);
        
      } catch (error) {
        console.error('Error fetching form data:', error);
        toast.error('Erreur lors du chargement des données');
      }
    };
    
    fetchData();
  }, []);

  // Récupérer les créneaux disponibles lorsque le praticien change
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedPractitioner) {
        setAvailableSlots([]);
        return;
      }
      
      try {
        const slots = await getAvailableSlots(selectedPractitioner);
        setAvailableSlots(slots);
      } catch (error) {
        console.error('Error fetching available slots:', error);
        toast.error('Erreur lors du chargement des disponibilités');
        setAvailableSlots([]);
      }
    };
    
    fetchSlots();
  }, [selectedPractitioner, getAvailableSlots]);

  // Gérer la sélection de date
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(""); // Réinitialiser l'heure sélectionnée
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const appointmentData: AppointmentFormData = {
        practitionerId: selectedPractitioner,
        centerId: selectedCenter,
        date: selectedDate!,
        startTime: selectedTime,
        reason,
        symptoms,
        medicalHistory,
        isEmergency,
        documents
      };
      
      const appointmentId = await createAppointment(appointmentData);
      
      if (appointmentId) {
        toast.success('Rendez-vous créé avec succès', {
          description: `Le ${format(selectedDate!, 'PPP', { locale: fr })} à ${selectedTime}`
        });
        
        // Réinitialiser le formulaire
        resetForm();
        
        // Callback après création
        if (onAppointmentCreated) {
          onAppointmentCreated();
        }
      } else {
        toast.error('Erreur lors de la création du rendez-vous');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Erreur lors de la création du rendez-vous');
    } finally {
      setIsLoading(false);
    }
  };

  // Valider le formulaire
  const validateForm = (): boolean => {
    if (!selectedPractitioner) {
      toast.error('Veuillez sélectionner un médecin');
      return false;
    }
    
    if (!selectedCenter) {
      toast.error('Veuillez sélectionner un centre médical');
      return false;
    }
    
    if (!selectedDate) {
      toast.error('Veuillez sélectionner une date');
      return false;
    }
    
    if (!selectedTime) {
      toast.error('Veuillez sélectionner une heure');
      return false;
    }
    
    if (!reason.trim()) {
      toast.error('Veuillez indiquer le motif du rendez-vous');
      return false;
    }
    
    return true;
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedPractitioner("");
    setSelectedCenter("");
    setReason("");
    setSymptoms("");
    setMedicalHistory("");
    setIsEmergency(false);
    setDocuments([]);
  };

  // Obtenir le nom complet du praticien
  const getPractitionerName = (id: string): string => {
    const practitioner = practitioners.find(p => p.id === id);
    if (!practitioner || !practitioner.profiles) return "";
    
    return `${practitioner.profiles.first_name || ''} ${practitioner.profiles.last_name || ''} - ${practitioner.speciality || ''}`;
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Prendre un rendez-vous</CardTitle>
          <CardDescription>
            Remplissez le formulaire ci-dessous pour planifier un rendez-vous médical
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="step1" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="step1">Médecin et centre</TabsTrigger>
              <TabsTrigger value="step2" disabled={!selectedPractitioner || !selectedCenter}>Date et heure</TabsTrigger>
              <TabsTrigger value="step3" disabled={!selectedDate || !selectedTime}>Informations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="step1" className="space-y-4 p-2">
              <div className="space-y-2">
                <Label htmlFor="practitioner">Médecin</Label>
                <Select
                  value={selectedPractitioner}
                  onValueChange={setSelectedPractitioner}
                >
                  <SelectTrigger id="practitioner">
                    <SelectValue placeholder="Sélectionner un médecin" />
                  </SelectTrigger>
                  <SelectContent>
                    {practitioners.map((practitioner) => (
                      <SelectItem key={practitioner.id} value={practitioner.id}>
                        {practitioner.profiles?.first_name || ''} {practitioner.profiles?.last_name || ''} - {practitioner.speciality || ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="center">Centre médical</Label>
                <Select
                  value={selectedCenter}
                  onValueChange={setSelectedCenter}
                >
                  <SelectTrigger id="center">
                    <SelectValue placeholder="Sélectionner un centre médical" />
                  </SelectTrigger>
                  <SelectContent>
                    {centers.map((center) => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.name} - {center.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                type="button" 
                className="w-full mt-4"
                disabled={!selectedPractitioner || !selectedCenter}
                onClick={() => {
                  const stepTwoTrigger = document.querySelector('[data-value="step2"]');
                  if (stepTwoTrigger && stepTwoTrigger instanceof HTMLElement) {
                    stepTwoTrigger.click();
                  }
                }}
              >
                Continuer
              </Button>
            </TabsContent>
            
            <TabsContent value="step2" className="space-y-4 p-2">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="mb-2 block">Sélectionnez une date</Label>
                  <InteractiveCalendar
                    practitionerId={selectedPractitioner}
                    onDateSelect={handleDateSelect}
                    initialDate={selectedDate}
                  />
                </div>
                
                <div>
                  <TimeslotSelector
                    availableSlots={availableSlots}
                    selectedDate={selectedDate}
                    practitionerId={selectedPractitioner}
                    onTimeSelect={setSelectedTime}
                    selectedTime={selectedTime}
                  />
                </div>
              </div>
              
              <div className="flex justify-between mt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    const stepOneTrigger = document.querySelector('[data-value="step1"]');
                    if (stepOneTrigger && stepOneTrigger instanceof HTMLElement) {
                      stepOneTrigger.click();
                    }
                  }}
                >
                  Précédent
                </Button>
                
                <Button 
                  type="button"
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => {
                    const stepThreeTrigger = document.querySelector('[data-value="step3"]');
                    if (stepThreeTrigger && stepThreeTrigger instanceof HTMLElement) {
                      stepThreeTrigger.click();
                    }
                  }}
                >
                  Continuer
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="step3" className="space-y-4 p-2">
              <div className="space-y-2">
                <Label htmlFor="reason">Motif du rendez-vous</Label>
                <Textarea
                  id="reason"
                  placeholder="Décrivez brièvement le motif de votre consultation"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptômes actuels (optionnel)</Label>
                <Textarea
                  id="symptoms"
                  placeholder="Décrivez vos symptômes actuels"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="medicalHistory">Antécédents médicaux (optionnel)</Label>
                <Textarea
                  id="medicalHistory"
                  placeholder="Informations sur vos antécédents médicaux pertinents"
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emergency"
                  checked={isEmergency}
                  onCheckedChange={(checked) => setIsEmergency(checked === true)}
                />
                <Label htmlFor="emergency" className="font-medium text-red-500">
                  Il s'agit d'une urgence médicale
                </Label>
              </div>
              
              <div className="space-y-2">
                <Label>Documents médicaux (optionnel)</Label>
                <DocumentUploader onDocumentsChange={setDocuments} />
              </div>
              
              <div className="flex justify-between mt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    const stepTwoTrigger = document.querySelector('[data-value="step2"]');
                    if (stepTwoTrigger && stepTwoTrigger instanceof HTMLElement) {
                      stepTwoTrigger.click();
                    }
                  }}
                >
                  Précédent
                </Button>
                
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Création en cours..." : "Confirmer le rendez-vous"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 bg-muted/50">
          <div className="flex flex-col space-y-2 w-full">
            {selectedPractitioner && (
              <div className="text-sm">
                <span className="font-medium">Médecin:</span> {getPractitionerName(selectedPractitioner)}
              </div>
            )}
            {selectedCenter && (
              <div className="text-sm">
                <span className="font-medium">Centre:</span> {centers.find(c => c.id === selectedCenter)?.name || ''}
              </div>
            )}
            {selectedDate && selectedTime && (
              <div className="text-sm">
                <span className="font-medium">Date et heure:</span> {format(selectedDate, 'PPP', { locale: fr })} à {selectedTime}
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
