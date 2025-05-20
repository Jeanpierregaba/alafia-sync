
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { fr } from "date-fns/locale";
import { startOfMonth, endOfMonth, addMonths } from "date-fns";
import { AvailableSlot } from "@/types/appointments";
import { useAppointments } from "@/hooks/useAppointments";

interface InteractiveCalendarProps {
  practitionerId?: string;
  onDateSelect: (date: Date | undefined) => void;
  initialDate?: Date;
  className?: string;
}

export function InteractiveCalendar({ 
  practitionerId, 
  onDateSelect, 
  initialDate, 
  className 
}: InteractiveCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  const { getAvailableSlots } = useAppointments();

  // Récupérer les dates disponibles pour le mois en cours
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!practitionerId) {
        setAvailableDates([]);
        return;
      }

      const start = startOfMonth(currentMonth);
      const end = endOfMonth(addMonths(currentMonth, 1)); // Récupérer les données pour ce mois et le suivant
      
      try {
        const slots = await getAvailableSlots(practitionerId, start);
        
        // Extraire les dates disponibles uniques
        const availableDateSet = new Set(
          slots.map(slot => new Date(slot.slot_date).toISOString().split('T')[0])
        );
        
        const dates = Array.from(availableDateSet).map(dateStr => new Date(dateStr));
        setAvailableDates(dates);
      } catch (error) {
        console.error("Error fetching available dates:", error);
        setAvailableDates([]);
      }
    };

    fetchAvailability();
  }, [practitionerId, currentMonth, getAvailableSlots]);

  // Gérer la sélection de date
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    onDateSelect(date);
  };

  // Gérer le changement de mois
  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
  };

  // Déterminer si une date est disponible
  const isDayAvailable = (date: Date) => {
    return availableDates.some(availableDate => 
      availableDate.toISOString().split('T')[0] === date.toISOString().split('T')[0]
    );
  };

  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={handleDateSelect}
      onMonthChange={handleMonthChange}
      locale={fr}
      className={cn("border rounded-md p-4 pointer-events-auto", className)}
      classNames={{
        day: (date) =>
          cn(
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
            isDayAvailable(date) && !selectedDate?.toDateString() === date.toDateString()
              ? "bg-primary/20 text-primary-foreground/80 hover:bg-primary/30 hover:text-primary-foreground"
              : "",
            date < new Date() && "text-muted-foreground opacity-50" // Dates passées grisées
          ),
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
      }}
      disabled={(date) => {
        return date < new Date() || !isDayAvailable(date);
      }}
    />
  );
}
