
import { AppointmentStatus } from "@/types/appointments";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Fonction pour obtenir le libellé d'un statut de rendez-vous
export function getStatusLabel(status: AppointmentStatus): string {
  const statusLabels: Record<AppointmentStatus, string> = {
    scheduled: "Programmé",
    confirmed: "Confirmé",
    arrived: "Arrivé",
    in_progress: "En cours",
    completed: "Terminé",
    cancelled_by_patient: "Annulé (Patient)",
    cancelled_by_practitioner: "Annulé (Praticien)",
    no_show: "Non présenté"
  };
  
  return statusLabels[status] || status;
}

// Fonction pour obtenir la couleur d'un statut de rendez-vous
export function getStatusColor(status: AppointmentStatus): string {
  const statusColors: Record<AppointmentStatus, string> = {
    scheduled: "bg-blue-100 text-blue-800",
    confirmed: "bg-green-100 text-green-800",
    arrived: "bg-purple-100 text-purple-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    cancelled_by_patient: "bg-red-100 text-red-800",
    cancelled_by_practitioner: "bg-red-100 text-red-800",
    no_show: "bg-gray-100 text-gray-800"
  };
  
  return statusColors[status] || "bg-gray-100 text-gray-800";
}

// Formater une date pour l'affichage
export function formatDate(date: string | Date): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'PPP', { locale: fr });
}

// Formater une heure pour l'affichage
export function formatTime(date: string | Date): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'HH:mm');
}

// Générer des créneaux horaires à partir d'une heure de début et de fin
export function generateTimeSlots(startTime: string, endTime: string, interval: number = 30): string[] {
  const slots: string[] = [];
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  
  let current = new Date(start);
  while (current < end) {
    slots.push(format(current, 'HH:mm'));
    current.setMinutes(current.getMinutes() + interval);
  }
  
  return slots;
}

// Vérifier si un créneau est disponible
export function isTimeSlotAvailable(
  availableSlots: any[],
  slotDate: Date, 
  slotTime: string,
  practitionerId: string
): boolean {
  const dateString = format(slotDate, 'yyyy-MM-dd');
  
  return availableSlots.some(slot => 
    slot.practitioner_id === practitionerId &&
    format(new Date(slot.slot_date), 'yyyy-MM-dd') === dateString &&
    slot.slot_start <= slotTime && 
    slot.slot_end > slotTime &&
    slot.is_available === true
  );
}
