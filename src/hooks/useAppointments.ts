
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  AppointmentFilters, 
  AppointmentStatus, 
  DEFAULT_FILTERS,
  Appointment
} from "@/types/appointments";
import { 
  fetchAppointments, 
  getAppointmentsCount, 
  updateAppointmentStatus,
  deleteAppointment as deleteAppointmentService
} from "@/services/appointmentService";

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
  
  return {
    appointments,
    isLoading,
    isError,
    refetch,
    totalAppointments,
    updateAppointmentStatus: handleUpdateAppointmentStatus,
    deleteAppointment: handleDeleteAppointment
  };
}
