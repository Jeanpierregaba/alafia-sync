
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, FileText, AlertCircle } from "lucide-react";
import { Appointment, AppointmentStatus } from "@/types/appointments";
import { formatDate, formatTime, getStatusLabel, getStatusColor } from "@/utils/appointmentUtils";
import { useAppointments } from "@/hooks/useAppointments";
import { cn } from "@/lib/utils";

interface AppointmentsListProps {
  appointments: Appointment[];
  showPast?: boolean;
  onCancelAppointment?: (id: string) => void;
  onRescheduleAppointment?: (appointment: Appointment) => void;
}

export function AppointmentsList({ 
  appointments, 
  showPast = false,
  onCancelAppointment,
  onRescheduleAppointment 
}: AppointmentsListProps) {
  const [detailsOpen, setDetailsOpen] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  
  const { getAppointmentDocuments, getDownloadUrl, updateAppointmentStatus } = useAppointments();
  const [documents, setDocuments] = useState<any[]>([]);

  // Trier les rendez-vous par date
  const sortedAppointments = [...appointments].sort((a, b) => {
    if (showPast) {
      // Pour les RDV passés, trier par date décroissante (du plus récent au plus ancien)
      return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
    } else {
      // Pour les RDV à venir, trier par date croissante (du plus proche au plus lointain)
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    }
  });

  // Filtrer les rendez-vous par statut
  const filteredAppointments = sortedAppointments.filter(appointment => {
    const isPastStatus = ['completed', 'cancelled_by_patient', 'cancelled_by_practitioner', 'no_show'].includes(appointment.status);
    return showPast ? isPastStatus : !isPastStatus;
  });

  // Charger les documents d'un rendez-vous
  const loadDocuments = async (appointmentId: string) => {
    const docs = await getAppointmentDocuments(appointmentId);
    setDocuments(docs);
    return docs;
  };

  // Télécharger un document
  const downloadDocument = async (filePath: string, fileName: string) => {
    const url = await getDownloadUrl(filePath);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Gérer l'annulation d'un rendez-vous
  const handleCancel = async (id: string) => {
    const success = await updateAppointmentStatus(id, 'cancelled_by_patient');
    if (success && onCancelAppointment) {
      onCancelAppointment(id);
    }
    setConfirmCancelId(null);
  };

  // Vérifier si un rendez-vous peut être annulé
  const canBeCancelled = (appointment: Appointment): boolean => {
    return ['scheduled', 'confirmed'].includes(appointment.status);
  };

  // Vérifier si c'est une urgence
  const isEmergency = (appointment: Appointment): boolean => {
    return appointment.is_emergency === true;
  };

  if (filteredAppointments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {showPast ? "Aucun historique de rendez-vous" : "Aucun rendez-vous à venir"}
          </CardTitle>
          <CardDescription className="text-center">
            {showPast 
              ? "Vous n'avez pas encore de rendez-vous passés ou annulés." 
              : "Vous n'avez pas de rendez-vous programmés."
            }
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredAppointments.map((appointment) => (
        <Card key={appointment.id} className={cn(
          "transition-all",
          isEmergency(appointment) && "border-red-500"
        )}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {appointment.practitioner_first_name} {appointment.practitioner_last_name}
                  {isEmergency(appointment) && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </CardTitle>
                <CardDescription>{appointment.practitioner_speciality}</CardDescription>
              </div>
              <Badge className={getStatusColor(appointment.status as AppointmentStatus)}>
                {getStatusLabel(appointment.status as AppointmentStatus)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(appointment.start_time)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{appointment.center_name}, {appointment.center_city}</span>
              </div>
              {appointment.reason && (
                <div className="mt-2 text-sm">
                  <span className="font-medium">Motif: </span>
                  {appointment.reason}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-0">
            <Dialog open={detailsOpen === appointment.id} onOpenChange={(open) => setDetailsOpen(open ? appointment.id : null)}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => loadDocuments(appointment.id)}
                >
                  Plus de détails
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Détails du rendez-vous</DialogTitle>
                  <DialogDescription>
                    {formatDate(appointment.start_time)} à {formatTime(appointment.start_time)}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium mb-1">Médecin</h3>
                      <p>{appointment.practitioner_first_name} {appointment.practitioner_last_name}</p>
                      <p className="text-sm text-muted-foreground">{appointment.practitioner_speciality}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Centre médical</h3>
                      <p>{appointment.center_name}</p>
                      <p className="text-sm text-muted-foreground">{appointment.center_city}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-1">Motif du rendez-vous</h3>
                    <p>{appointment.reason}</p>
                  </div>
                  
                  {appointment.symptoms && (
                    <div>
                      <h3 className="font-medium mb-1">Symptômes</h3>
                      <p>{appointment.symptoms}</p>
                    </div>
                  )}
                  
                  {appointment.medical_history && (
                    <div>
                      <h3 className="font-medium mb-1">Antécédents médicaux</h3>
                      <p>{appointment.medical_history}</p>
                    </div>
                  )}
                  
                  {appointment.notes && (
                    <div>
                      <h3 className="font-medium mb-1">Notes</h3>
                      <p>{appointment.notes}</p>
                    </div>
                  )}
                  
                  {documents.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-1">Documents ({documents.length})</h3>
                      <div className="border rounded-md divide-y">
                        {documents.map((doc) => (
                          <div 
                            key={doc.id}
                            className="flex items-center justify-between p-3"
                          >
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-blue-500" />
                              <div>
                                <p className="text-sm font-medium">{doc.file_name}</p>
                                {doc.description && (
                                  <p className="text-xs text-muted-foreground">{doc.description}</p>
                                )}
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => downloadDocument(doc.file_path, doc.file_name)}
                            >
                              Télécharger
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDetailsOpen(null)}>
                    Fermer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <div className="space-x-2">
              {!showPast && canBeCancelled(appointment) && onRescheduleAppointment && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onRescheduleAppointment(appointment)}
                >
                  Reprogrammer
                </Button>
              )}
              
              {!showPast && canBeCancelled(appointment) && (
                <Dialog open={confirmCancelId === appointment.id} onOpenChange={(open) => setConfirmCancelId(open ? appointment.id : null)}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      Annuler
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmer l'annulation</DialogTitle>
                      <DialogDescription>
                        Êtes-vous sûr de vouloir annuler ce rendez-vous ? Cette action ne peut pas être annulée.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setConfirmCancelId(null)}>
                        Non, garder le rendez-vous
                      </Button>
                      <Button variant="destructive" onClick={() => handleCancel(appointment.id)}>
                        Oui, annuler le rendez-vous
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
