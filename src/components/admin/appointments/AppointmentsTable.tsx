
import { useState } from "react";
import { 
  Table, 
  TableBody
} from "@/components/ui/table";
import { 
  Appointment, 
  AppointmentStatus
} from "@/types/appointments";
import { LoadingState } from "./LoadingState";
import { AppointmentsTableHeader } from "./AppointmentsTableHeader";
import { EmptyAppointmentsMessage } from "./EmptyAppointmentsMessage";
import { AppointmentRow } from "./AppointmentRow";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

interface AppointmentsTableProps {
  appointments: Appointment[];
  isLoading: boolean;
  onStatusChange: (id: string, newStatus: AppointmentStatus) => Promise<boolean>;
  onDeleteAppointment: (id: string) => Promise<boolean>;
}

export function AppointmentsTable({
  appointments,
  isLoading,
  onStatusChange,
  onDeleteAppointment
}: AppointmentsTableProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    appointmentId: string | null;
    action: 'delete' | null;
  }>({
    open: false,
    appointmentId: null,
    action: null,
  });
  
  const [processingAction, setProcessingAction] = useState<boolean>(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const handleStatusChange = async (id: string, newStatus: AppointmentStatus): Promise<boolean> => {
    setProcessingAction(true);
    setProcessingId(id);
    
    const success = await onStatusChange(id, newStatus);
    
    setProcessingAction(false);
    setProcessingId(null);
    
    if (success) {
      setConfirmDialog({
        open: false,
        appointmentId: null,
        action: null
      });
    }
    
    return success;
  };
  
  const handleDeleteConfirm = async () => {
    if (confirmDialog.appointmentId) {
      setProcessingAction(true);
      
      const success = await onDeleteAppointment(confirmDialog.appointmentId);
      
      setProcessingAction(false);
      
      if (success) {
        setConfirmDialog({
          open: false,
          appointmentId: null,
          action: null
        });
      }
    }
  };
  
  const confirmDelete = (appointmentId: string) => {
    setConfirmDialog({
      open: true,
      appointmentId,
      action: 'delete'
    });
  };
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  return (
    <>
      <div className="rounded-md border">
        <Table>
          <AppointmentsTableHeader />
          <TableBody>
            {appointments.length === 0 ? (
              <EmptyAppointmentsMessage />
            ) : (
              appointments.map((appointment) => (
                <AppointmentRow
                  key={appointment.id}
                  appointment={appointment}
                  onStatusChange={handleStatusChange}
                  onDeleteClick={confirmDelete}
                  processingId={processingId}
                  processingAction={processingAction}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <ConfirmDeleteDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        onConfirm={handleDeleteConfirm}
        isProcessing={processingAction}
      />
    </>
  );
}
