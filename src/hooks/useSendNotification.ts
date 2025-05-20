
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type NotificationType = 'reminder' | 'confirmation' | 'cancellation';

export function useSendNotification() {
  const [isSending, setIsSending] = useState(false);

  const sendNotification = async (
    appointmentId: string, 
    type: NotificationType
  ): Promise<boolean> => {
    try {
      setIsSending(true);
      
      // Récupérer l'ID de l'utilisateur connecté
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      
      if (!userId) {
        toast.error("Erreur: Utilisateur non connecté");
        return false;
      }
      
      // Récupérer les détails du rendez-vous pour vérification
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .select('patient_id, status')
        .eq('id', appointmentId)
        .single();
      
      if (appointmentError || !appointment) {
        toast.error("Erreur: Impossible de récupérer les détails du rendez-vous");
        console.error(appointmentError);
        return false;
      }
      
      // Vérifier que l'utilisateur est bien le patient du rendez-vous
      if (appointment.patient_id !== userId) {
        toast.error("Erreur: Vous n'êtes pas autorisé à envoyer des notifications pour ce rendez-vous");
        return false;
      }
      
      // Appeler l'edge function pour envoyer les notifications
      const { data, error } = await supabase.functions.invoke('notifications', {
        body: {
          appointmentId,
          userId,
          type
        }
      });
      
      if (error) {
        toast.error(`Erreur lors de l'envoi des notifications: ${error.message}`);
        console.error('Notification error:', error);
        return false;
      }
      
      if (!data.success) {
        toast.error(`Erreur: ${data.error || 'Une erreur est survenue'}`);
        return false;
      }
      
      // Mettre à jour le statut de notification dans la base de données
      const notificationStatus = appointment.status.notification_status || {};
      notificationStatus[type] = new Date().toISOString();
      
      await supabase
        .from('appointments')
        .update({
          notification_status: notificationStatus
        })
        .eq('id', appointmentId);
      
      toast.success('Notifications envoyées avec succès');
      return true;
    } catch (error) {
      console.error('Error in sendNotification:', error);
      toast.error('Erreur lors de l\'envoi des notifications');
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendNotification,
    isSending
  };
}
