
export type AppointmentStatus = 
  | 'scheduled'
  | 'confirmed'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled_by_patient'
  | 'cancelled_by_practitioner'
  | 'no_show';

export interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  notes: string | null;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
  patient_id: string;
  patient_first_name: string | null;
  patient_last_name: string | null;
  practitioner_id: string;
  practitioner_speciality: string | null;
  practitioner_first_name: string | null;
  practitioner_last_name: string | null;
  center_id: string;
  center_name: string | null;
  center_city: string | null;
  symptoms?: string | null;
  medical_history?: string | null;
  is_emergency?: boolean | null;
}

export interface AppointmentFilters {
  status?: AppointmentStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
  centerID?: string;
  practitionerID?: string;
  patientName?: string;
}

export interface AppointmentFormData {
  practitionerId: string;
  centerId: string;
  date: Date;
  startTime: string;
  reason: string;
  symptoms?: string;
  medicalHistory?: string;
  isEmergency?: boolean;
  documents?: File[];
}

export interface PractitionerAvailability {
  id: string;
  practitioner_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start?: string | null;
  break_end?: string | null;
  is_available: boolean;
}

export interface AvailableSlot {
  practitioner_id: string;
  slot_date: string;
  slot_start: string;
  slot_end: string;
  day_of_week: number;
  is_available: boolean;
}

export interface AppointmentDocument {
  id: string;
  appointment_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: string;
  description: string | null;
}

export interface NotificationPreference {
  id: string;
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  whatsapp_enabled: boolean;
  reminder_24h: boolean;
  reminder_same_day: boolean;
  phone_number: string | null;
}

export const DEFAULT_FILTERS: AppointmentFilters = {
  status: 'all',
  dateFrom: undefined,
  dateTo: undefined,
  centerID: undefined,
  practitionerID: undefined,
  patientName: undefined
};
