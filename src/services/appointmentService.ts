
import { supabase } from "@/integrations/supabase/client";
import { 
  Appointment, 
  AppointmentFilters, 
  AppointmentStatus, 
  AvailableSlot,
  PractitionerAvailability,
  AppointmentFormData,
  AppointmentDocument
} from "@/types/appointments";
import { toast } from "sonner";
import { format } from "date-fns";

export async function fetchAppointments(filters: AppointmentFilters): Promise<Appointment[]> {
  console.log("Fetching appointments with filters:", filters);
  
  try {
    let query = supabase
      .from('appointments_view')
      .select('*');
    
    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    if (filters.dateFrom) {
      query = query.gte('start_time', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('start_time', filters.dateTo);
    }
    
    if (filters.centerID) {
      query = query.eq('center_id', filters.centerID);
    }
    
    if (filters.practitionerID) {
      query = query.eq('practitioner_id', filters.practitionerID);
    }
    
    if (filters.patientName) {
      query = query.or(`patient_first_name.ilike.%${filters.patientName}%,patient_last_name.ilike.%${filters.patientName}%`);
    }
    
    // Get the data
    const { data, error } = await query
      .order('start_time', { ascending: false });
    
    if (error) {
      console.error('Error fetching appointments data:', error);
      throw error;
    }
    
    console.log("Appointments data retrieved:", data?.length || 0);
    return data as Appointment[];
  } catch (error) {
    console.error('Error in fetchAppointments:', error);
    toast.error('Erreur lors de la récupération des rendez-vous');
    return [];
  }
}

export async function getAppointmentsCount(filters: AppointmentFilters): Promise<number> {
  try {
    let query = supabase
      .from('appointments_view')
      .select('*', { count: 'exact', head: true });
    
    // Apply the same filters as in fetchAppointments
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    if (filters.dateFrom) {
      query = query.gte('start_time', filters.dateFrom);
    }
    
    if (filters.dateTo) {
      query = query.lte('start_time', filters.dateTo);
    }
    
    if (filters.centerID) {
      query = query.eq('center_id', filters.centerID);
    }
    
    if (filters.practitionerID) {
      query = query.eq('practitioner_id', filters.practitionerID);
    }
    
    if (filters.patientName) {
      query = query.or(`patient_first_name.ilike.%${filters.patientName}%,patient_last_name.ilike.%${filters.patientName}%`);
    }
    
    const { count, error } = await query;
    
    if (error) {
      console.error('Error getting count:', error);
      throw error;
    }
    
    console.log("Total appointments count:", count);
    return count || 0;
  } catch (error) {
    console.error('Error in getAppointmentsCount:', error);
    return 0;
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', appointmentId);
    
    if (error) {
      throw error;
    }
    
    toast.success('Statut du rendez-vous mis à jour');
    return true;
  } catch (error) {
    console.error('Error updating appointment status:', error);
    toast.error('Erreur lors de la mise à jour du statut');
    return false;
  }
}

export async function deleteAppointment(appointmentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);
    
    if (error) {
      throw error;
    }
    
    toast.success('Rendez-vous supprimé');
    return true;
  } catch (error) {
    console.error('Error deleting appointment:', error);
    toast.error('Erreur lors de la suppression du rendez-vous');
    return false;
  }
}

export async function fetchAvailableSlots(practitionerId: string, startDate: Date, endDate: Date): Promise<AvailableSlot[]> {
  try {
    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('available_slots')
      .select('*')
      .eq('practitioner_id', practitionerId)
      .gte('slot_date', formattedStartDate)
      .lte('slot_date', formattedEndDate)
      .eq('is_available', true);
    
    if (error) {
      console.error('Error fetching available slots:', error);
      throw error;
    }
    
    return data as AvailableSlot[];
  } catch (error) {
    console.error('Error in fetchAvailableSlots:', error);
    toast.error('Erreur lors de la récupération des disponibilités');
    return [];
  }
}

export async function createAppointment(appointmentData: AppointmentFormData, userId: string): Promise<string | null> {
  try {
    const { date, startTime, reason, practitionerId, centerId, symptoms, medicalHistory, isEmergency } = appointmentData;
    
    // Calculate end time (30 minutes after start time by default)
    const startDateTime = new Date(`${format(date, 'yyyy-MM-dd')}T${startTime}:00`);
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + 30);
    
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: userId,
        practitioner_id: practitionerId,
        center_id: centerId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        reason: reason,
        symptoms: symptoms || null,
        medical_history: medicalHistory || null,
        is_emergency: isEmergency || false,
        created_by: userId,
        status: 'scheduled'
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
    
    toast.success('Rendez-vous créé avec succès');
    return data.id;
  } catch (error) {
    console.error('Error in createAppointment:', error);
    toast.error('Erreur lors de la création du rendez-vous');
    return null;
  }
}

export async function uploadAppointmentDocuments(appointmentId: string, documents: File[], userId: string): Promise<boolean> {
  try {
    for (const file of documents) {
      // Upload file to storage
      const filePath = `${userId}/${appointmentId}/${file.name}`;
      const { error: storageError } = await supabase
        .storage
        .from('medical-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (storageError) {
        console.error('Error uploading document to storage:', storageError);
        throw storageError;
      }
      
      // Create document record in database
      const { error: dbError } = await supabase
        .from('appointment_documents')
        .insert({
          appointment_id: appointmentId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: userId
        });
      
      if (dbError) {
        console.error('Error recording document in database:', dbError);
        throw dbError;
      }
    }
    
    toast.success('Documents téléchargés avec succès');
    return true;
  } catch (error) {
    console.error('Error in uploadAppointmentDocuments:', error);
    toast.error('Erreur lors du téléchargement des documents');
    return false;
  }
}

export async function fetchAppointmentDocuments(appointmentId: string): Promise<AppointmentDocument[]> {
  try {
    const { data, error } = await supabase
      .from('appointment_documents')
      .select('*')
      .eq('appointment_id', appointmentId);
    
    if (error) {
      console.error('Error fetching appointment documents:', error);
      throw error;
    }
    
    return data as AppointmentDocument[];
  } catch (error) {
    console.error('Error in fetchAppointmentDocuments:', error);
    toast.error('Erreur lors de la récupération des documents');
    return [];
  }
}

export async function getDocumentDownloadUrl(filePath: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .storage
      .from('medical-documents')
      .createSignedUrl(filePath, 60);
    
    if (error) {
      console.error('Error getting download URL:', error);
      throw error;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error in getDocumentDownloadUrl:', error);
    toast.error('Erreur lors de la récupération du lien de téléchargement');
    return null;
  }
}
