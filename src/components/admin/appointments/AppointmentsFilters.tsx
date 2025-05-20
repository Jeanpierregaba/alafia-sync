
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { AppointmentFilters } from "@/types/appointments";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AppointmentsFiltersProps {
  filters: AppointmentFilters;
  onFiltersChange: (filters: AppointmentFilters) => void;
}

export function AppointmentsFilters({ filters, onFiltersChange }: AppointmentsFiltersProps) {
  const [localFilters, setLocalFilters] = useState<AppointmentFilters>(filters);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    filters.dateFrom ? new Date(filters.dateFrom) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    filters.dateTo ? new Date(filters.dateTo) : undefined
  );
  
  // Fetch health centers
  const { data: healthCenters = [] } = useQuery({
    queryKey: ['healthCenters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_centers')
        .select('id, name')
        .order('name');
        
      if (error) throw error;
      return data;
    }
  });
  
  // Fetch practitioners
  const { data: practitioners = [] } = useQuery({
    queryKey: ['practitioners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practitioners')
        .select(`
          id,
          speciality,
          profile:user_id (
            first_name,
            last_name
          )
        `)
        .order('speciality');
        
      if (error) throw error;
      return data;
    }
  });
  
  // Status options
  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'scheduled', label: 'Planifié' },
    { value: 'confirmed', label: 'Confirmé' },
    { value: 'arrived', label: 'Patient arrivé' },
    { value: 'in_progress', label: 'En consultation' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled_by_patient', label: 'Annulé par le patient' },
    { value: 'cancelled_by_practitioner', label: 'Annulé par le praticien' },
    { value: 'no_show', label: 'Patient absent' }
  ];
  
  const handleFilterChange = (key: keyof AppointmentFilters, value: any) => {
    setLocalFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      return newFilters;
    });
  };
  
  const handleApplyFilters = () => {
    const formattedFilters = { ...localFilters };
    
    // Format dates to ISO string if they exist
    if (dateFrom) {
      formattedFilters.dateFrom = format(dateFrom, 'yyyy-MM-dd');
    } else {
      formattedFilters.dateFrom = undefined;
    }
    
    if (dateTo) {
      // Set time to end of day for dateTo
      const dateToEndDay = new Date(dateTo);
      dateToEndDay.setHours(23, 59, 59, 999);
      formattedFilters.dateTo = format(dateToEndDay, 'yyyy-MM-dd');
    } else {
      formattedFilters.dateTo = undefined;
    }
    
    onFiltersChange(formattedFilters);
  };
  
  const handleReset = () => {
    setLocalFilters({
      status: 'all',
      dateFrom: undefined,
      dateTo: undefined,
      centerID: undefined,
      practitionerID: undefined,
      patientName: undefined
    });
    setDateFrom(undefined);
    setDateTo(undefined);
    
    onFiltersChange({
      status: 'all',
      dateFrom: undefined,
      dateTo: undefined,
      centerID: undefined,
      practitionerID: undefined,
      patientName: undefined
    });
  };
  
  return (
    <div className="bg-white p-4 rounded-md border space-y-4">
      <h3 className="font-medium text-lg">Filtres</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Status filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <Select
            value={localFilters.status || 'all'}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Date from filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Du
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, 'PPP', { locale: fr }) : <span>Sélectionner une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Date to filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Au
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, 'PPP', { locale: fr }) : <span>Sélectionner une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Health Center filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Centre de santé
          </label>
          <Select
            value={localFilters.centerID || ''}
            onValueChange={(value) => handleFilterChange('centerID', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les centres" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all-centers" value="all">Tous les centres</SelectItem>
              {healthCenters.map((center: any) => (
                <SelectItem key={center.id} value={center.id}>
                  {center.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Practitioner filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Praticien
          </label>
          <Select
            value={localFilters.practitionerID || ''}
            onValueChange={(value) => handleFilterChange('practitionerID', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tous les praticiens" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all-practitioners" value="all">Tous les praticiens</SelectItem>
              {practitioners.map((practitioner: any) => (
                <SelectItem key={practitioner.id} value={practitioner.id}>
                  {practitioner.profile?.first_name} {practitioner.profile?.last_name} - {practitioner.speciality}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Patient name search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recherche patient
          </label>
          <div className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="Nom du patient"
              value={localFilters.patientName || ''}
              onChange={(e) => handleFilterChange('patientName', e.target.value || undefined)}
              className="flex-1"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <Button variant="outline" onClick={handleReset}>
          Réinitialiser
        </Button>
        <Button onClick={handleApplyFilters}>
          <Search className="h-4 w-4 mr-2" />
          Appliquer les filtres
        </Button>
      </div>
    </div>
  );
}
