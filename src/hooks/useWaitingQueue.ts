
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export type WaitingQueue = {
  id: string;
  name: string;
  center_id: string;
  description: string | null;
  average_wait_time: number;
  status: 'active' | 'inactive' | 'paused';
  created_at: string;
  updated_at: string;
};

export type QueueEntry = {
  id: string;
  queue_id: string;
  patient_id: string;
  practitioner_id: string | null;
  appointment_id: string | null;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'delayed';
  position: number | null;
  estimated_wait_time: number | null;
  arrival_time: string | null;
  start_time: string | null;
  end_time: string | null;
  delay_request_at: string | null;
  delay_notes: string | null;
  created_at: string;
  updated_at: string;
  notified_at: string | null;
  patient?: {
    first_name: string | null;
    last_name: string | null;
  };
};

export const useWaitingQueue = (centerId?: string) => {
  const { user } = useAuth();
  const [queues, setQueues] = useState<WaitingQueue[]>([]);
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchQueues = async () => {
      try {
        setIsLoading(true);
        const query = supabase.from('waiting_queues').select('*');
        
        if (centerId) {
          query.eq('center_id', centerId);
        }
        
        const { data, error } = await query.order('created_at', { ascending: true });
        
        if (error) throw error;
        
        // Type cast pour s'assurer que le statut correspond au type attendu
        const typedData = (data || []).map(q => ({
          ...q,
          status: q.status as 'active' | 'inactive' | 'paused'
        }));
        
        setQueues(typedData);
        
        // Set the first queue as active by default if available
        if (data && data.length > 0 && !activeQueueId) {
          setActiveQueueId(data[0].id);
        }
      } catch (err: any) {
        console.error('Error fetching waiting queues:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQueues();
  }, [user, centerId, activeQueueId]);

  useEffect(() => {
    if (!activeQueueId || !user) return;
    
    const fetchQueueEntries = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('queue_entries')
          .select(`
            *,
            profiles:patient_id (
              first_name,
              last_name
            )
          `)
          .eq('queue_id', activeQueueId)
          .in('status', ['waiting', 'in_progress', 'delayed']);
        
        if (error) throw error;
        
        if (!data) {
          setEntries([]);
          return;
        }
        
        // Type cast pour s'assurer que le statut correspond au type attendu
        const typedData = data.map(entry => {
          // Gérer les cas où les profiles est soit un objet, soit une erreur (dans ce cas, on fournit des valeurs par défaut)
          const patient = typeof entry.profiles === 'object' && entry.profiles !== null 
            ? {
                first_name: entry.profiles.first_name,
                last_name: entry.profiles.last_name
              } 
            : { first_name: null, last_name: null };
            
          return {
            ...entry,
            status: entry.status as 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'delayed',
            patient
          };
        });
        
        setEntries(typedData);
      } catch (err: any) {
        console.error('Error fetching queue entries:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchQueueEntries();
    
    // Configure real-time updates for the active queue
    const channel = supabase
      .channel('queue-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'queue_entries',
        filter: `queue_id=eq.${activeQueueId}`
      }, (payload) => {
        // Refresh the entries list when changes occur
        fetchQueueEntries();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeQueueId, user]);

  const registerPatientArrival = async (
    queueId: string, 
    patientId: string, 
    appointmentId?: string,
    practitionerId?: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('queue_entries')
        .insert({
          queue_id: queueId,
          patient_id: patientId,
          appointment_id: appointmentId || null,
          practitioner_id: practitionerId || null,
          arrival_time: new Date().toISOString(),
          status: 'waiting'
        })
        .select();
      
      if (error) throw error;
      
      toast.success("Patient ajouté à la file d'attente");
      return data?.[0] || null;
    } catch (err: any) {
      toast.error(`Erreur lors de l'enregistrement du patient: ${err.message}`);
      throw err;
    }
  };

  const updateEntryStatus = async (entryId: string, status: QueueEntry['status'], notes?: string) => {
    try {
      const updates: any = { status };
      
      // Add additional fields based on status
      if (status === 'in_progress') {
        updates.start_time = new Date().toISOString();
      } else if (status === 'completed') {
        updates.end_time = new Date().toISOString();
      } else if (status === 'delayed') {
        updates.delay_request_at = new Date().toISOString();
        if (notes) updates.delay_notes = notes;
      }
      
      const { error } = await supabase
        .from('queue_entries')
        .update(updates)
        .eq('id', entryId);
      
      if (error) throw error;
      
      toast.success("Statut mis à jour avec succès");
      return true;
    } catch (err: any) {
      toast.error(`Erreur lors de la mise à jour du statut: ${err.message}`);
      return false;
    }
  };

  const sendNotification = async (entryId: string) => {
    try {
      const { data, error } = await supabase
        .from('queue_entries')
        .update({
          notified_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .select();
      
      if (error) throw error;
      
      toast.success("Notification envoyée au patient");
      return data?.[0] || null;
    } catch (err: any) {
      toast.error(`Erreur lors de l'envoi de la notification: ${err.message}`);
      return null;
    }
  };

  return {
    queues,
    entries,
    isLoading,
    error,
    activeQueueId,
    setActiveQueueId,
    registerPatientArrival,
    updateEntryStatus,
    sendNotification
  };
};
