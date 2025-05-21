
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSendNotification } from "@/hooks/useSendNotification";

type QueueNotificationType = 'soon' | 'now' | 'delay';

export function useQueueNotifications() {
  const [isSending, setIsSending] = useState(false);
  const { sendNotification: sendAppointmentNotification } = useSendNotification();

  const sendQueueNotification = async (
    entryId: string,
    type: QueueNotificationType,
    appointmentId?: string
  ): Promise<boolean> => {
    try {
      setIsSending(true);
      
      // Récupérer les infos de l'entrée
      const { data: entry, error: entryError } = await supabase
        .from('queue_entries')
        .select(`
          *,
          patient:patient_id (id),
          waiting_queues:queue_id (
            name
          )
        `)
        .eq('id', entryId)
        .single();
      
      if (entryError || !entry) {
        toast.error("Erreur: Impossible de récupérer les détails de l'entrée");
        console.error(entryError);
        return false;
      }
      
      // Si un rendez-vous est associé, utiliser le système de notification existant
      if (appointmentId && type !== 'delay') {
        // Le type 'soon' correspond à un rappel, 'now' à une confirmation
        const notifType = type === 'soon' ? 'reminder' : 'confirmation';
        return await sendAppointmentNotification(appointmentId, notifType);
      }
      
      // Récupérer l'email du patient depuis les profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', entry.patient_id)
        .single();
      
      if (profileError || !profileData) {
        toast.error("Erreur: Impossible de récupérer les données du patient");
        console.error(profileError);
        return false;
      }
      
      // Get email from auth.users table via a Supabase edge function or use another approach
      // For now, we'll simulate having an email
      const patientEmail = `patient-${entry.patient_id}@example.com`;
      
      if (!patientEmail) {
        toast.error("Erreur: Email du patient non trouvé");
        return false;
      }
      
      // Sinon, enregistrer une notification directement
      const { error: notifError } = await supabase
        .from('notification_logs')
        .insert({
          appointment_id: appointmentId || null,
          notification_type: `queue_${type}`,
          status: 'sent',
          recipient: patientEmail,
          content: generateNotificationContent(type, entry)
        });
      
      if (notifError) {
        console.error("Erreur lors de l'enregistrement de la notification:", notifError);
        return false;
      }
      
      // Mettre à jour le statut de notification
      const { error: updateError } = await supabase
        .from('queue_entries')
        .update({
          notified_at: new Date().toISOString()
        })
        .eq('id', entryId);
      
      if (updateError) {
        console.error("Erreur lors de la mise à jour du statut de notification:", updateError);
      }
      
      toast.success('Notification envoyée avec succès');
      return true;
    } catch (error) {
      console.error('Error in sendQueueNotification:', error);
      toast.error('Erreur lors de l\'envoi des notifications');
      return false;
    } finally {
      setIsSending(false);
    }
  };

  // Génère le contenu de la notification en fonction du type
  const generateNotificationContent = (type: QueueNotificationType, entry: any): string => {
    const queueName = entry.waiting_queues?.name || "la file d'attente";
    
    switch (type) {
      case 'soon':
        return `Votre tour approche dans ${entry.waiting_queues?.name}. Veuillez vous préparer.`;
      case 'now':
        return `C'est à votre tour! Veuillez vous présenter pour votre consultation dans ${queueName}.`;
      case 'delay':
        return `Un patient a signalé un retard dans ${queueName}. Cela pourrait affecter le temps d'attente.`;
      default:
        return `Notification concernant votre place dans ${queueName}.`;
    }
  };

  const requestDelay = async (
    entryId: string,
    delayNotes: string
  ): Promise<boolean> => {
    try {
      setIsSending(true);
      
      // Mettre à jour le statut de l'entrée
      const { error: updateError } = await supabase
        .from('queue_entries')
        .update({
          status: 'delayed',
          delay_request_at: new Date().toISOString(),
          delay_notes: delayNotes
        })
        .eq('id', entryId);
      
      if (updateError) {
        console.error("Erreur lors de la demande de délai:", updateError);
        toast.error("Erreur lors du signalement de retard");
        return false;
      }
      
      toast.success('Retard signalé avec succès');
      return true;
    } catch (error) {
      console.error('Error in requestDelay:', error);
      toast.error('Erreur lors du signalement de retard');
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendQueueNotification,
    requestDelay,
    isSending
  };
}
