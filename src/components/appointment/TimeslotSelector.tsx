
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AvailableSlot } from "@/types/appointments";
import { format } from "date-fns";

interface TimeslotSelectorProps {
  availableSlots: AvailableSlot[];
  selectedDate: Date | undefined;
  practitionerId: string;
  onTimeSelect: (time: string) => void;
  selectedTime?: string;
}

export function TimeslotSelector({
  availableSlots,
  selectedDate,
  practitionerId,
  onTimeSelect,
  selectedTime
}: TimeslotSelectorProps) {
  const [timeSlots, setTimeSlots] = useState<string[]>([]);

  // Générer les créneaux horaires disponibles pour la date sélectionnée
  useEffect(() => {
    if (!selectedDate || !practitionerId) {
      setTimeSlots([]);
      return;
    }

    const dateString = format(selectedDate, 'yyyy-MM-dd');
    
    // Filtrer les créneaux pour la date et le praticien sélectionnés
    const slotsForDate = availableSlots.filter(
      slot => 
        slot.practitioner_id === practitionerId &&
        format(new Date(slot.slot_date), 'yyyy-MM-dd') === dateString &&
        slot.is_available
    );
    
    // Extraire les heures de début uniques
    const times = slotsForDate.map(slot => slot.slot_start);
    times.sort();
    
    setTimeSlots(times);
  }, [selectedDate, practitionerId, availableSlots]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Créneaux disponibles</h3>
      {timeSlots.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {selectedDate 
            ? "Aucun créneau disponible pour cette date" 
            : "Veuillez sélectionner une date"}
        </p>
      ) : (
        <ScrollArea className="h-56 rounded-md border">
          <div className="grid grid-cols-2 gap-2 p-3">
            {timeSlots.map((time) => (
              <Button
                key={time}
                variant={selectedTime === time ? "default" : "outline"}
                size="sm"
                className={cn(
                  "justify-center",
                  selectedTime === time ? "bg-primary text-primary-foreground" : ""
                )}
                onClick={() => onTimeSelect(time)}
              >
                {time}
              </Button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
