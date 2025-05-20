
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  AppointmentFilters, 
  AppointmentStatus, 
  DEFAULT_FILTERS,
  Appointment,
  AppointmentFormData
} from "@/types/appointments";
import { 
  fetchAppointments, 
  getAppointmentsCount, 
  updateAppointmentStatus,
  deleteAppointment as deleteAppointmentService,
  createAppointment,
  uploadAppointmentDocuments,
  fetchAvailableSlots,
  fetchAppointmentDocuments,
  getDocumentDownloadUrl
} from "@/services/appointmentService";
import { supabase } from "@/integrations/supabase/client";
import { addDays } from "date-fns";

// Re-export types and constants for backward compatibility
export type { Appointment, AppointmentFilters, AppointmentStatus };
export { DEFAULT_FILTERS };

// Re-export utility functions from appointmentUtils
export { getStatusLabel, getStatusColor } from "@/utils/appointmentUtils";

export function useAppointments(filters: AppointmentFilters = DEFAULT_FILTERS) {
  const [totalAppointments, setTotalAppointments] = useState<number>(0);
  
  // Get total count
  useQuery({
    queryKey: ['appointmentsCount', filters],
    queryFn: async () => {
      const count = await getAppointmentsCount(filters);
      setTotalAppointments(count);
      return count;
    }
  });
  
  const {
    data: appointments = [],
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => fetchAppointments(filters)
  });
  
  const handleUpdateAppointmentStatus = async (appointmentId: string, status: AppointmentStatus): Promise<boolean> => {
    const success = await updateAppointmentStatus(appointmentId, status);
    if (success) {
      refetch();
    }
    return success;
  };
  
  const handleDeleteAppointment = async (appointmentId: string) => {
    const success = await deleteAppointmentService(appointmentId);
    if (success) {
      refetch();
    }
    return success;
  };

  const handleCreateAppointment = async (appointmentData: AppointmentFormData): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non connecté");
      
      const appointmentId = await createAppointment(appointmentData, user.id);
      
      if (appointmentId && appointmentData.documents && appointmentData.documents.length > 0) {
        await uploadAppointmentDocuments(appointmentId, appointmentData.documents, user.id);
      }
      
      refetch();
      return appointmentId;
    } catch (error) {
      console.error("Error creating appointment:", error);
      return null;
    }
  };

  const getAvailableSlots = async (practitionerId: string, date?: Date) => {
    const startDate = date || new Date();
    const endDate = addDays(startDate, 30);
    return await fetchAvailableSlots(practitionerId, startDate, endDate);
  };

  const getAppointmentDocuments = async (appointmentId: string) => {
    return await fetchAppointmentDocuments(appointmentId);
  };

  const getDownloadUrl = async (filePath: string) => {
    return await getDocumentDownloadUrl(filePath);
  };
  
  return {
    appointments,
    isLoading,
    isError,
    refetch,
    totalAppointments,
    updateAppointmentStatus: handleUpdateAppointmentStatus,
    deleteAppointment: handleDeleteAppointment,
    createAppointment: handleCreateAppointment,
    getAvailableSlots,
    getAppointmentDocuments,
    getDownloadUrl
  };
}
