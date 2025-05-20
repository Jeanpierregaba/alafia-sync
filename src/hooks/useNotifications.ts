
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NotificationPreference } from "@/types/appointments";
import { useQuery } from "@tanstack/react-query";

export function useNotifications() {
  const [userId, setUserId] = useState<string | null>(null);

  // Récupérer l'ID utilisateur au chargement
  useEffect(() => {
    const getUserId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data && data.user) {
        setUserId(data.user.id);
      }
    };
    
    getUserId();
  }, []);

  // Récupérer les préférences de notification
  const {
    data: preferences,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['notificationPreferences', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching notification preferences:', error);
        throw error;
      }
      
      return data as NotificationPreference;
    },
    enabled: !!userId
  });

  // Mettre à jour les préférences de notification
  const updatePreferences = async (newPreferences: Partial<NotificationPreference>): Promise<boolean> => {
    try {
      if (!userId) {
        toast.error('Utilisateur non connecté');
        return false;
      }
      
      const { error } = await supabase
        .from('notification_preferences')
        .update({
          ...newPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error updating notification preferences:', error);
        toast.error('Erreur lors de la mise à jour des préférences');
        return false;
      }
      
      toast.success('Préférences mises à jour');
      refetch();
      return true;
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      toast.error('Erreur lors de la mise à jour des préférences');
      return false;
    }
  };

  return {
    preferences,
    isLoading,
    error,
    updatePreferences
  };
}
