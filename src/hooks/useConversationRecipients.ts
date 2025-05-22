
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type RecipientInfo = {
  id: string;
  name: string;
  type: 'patient' | 'practitioner' | 'health_center';
};

type RecipientType = 'practitioner' | 'health_center';

export function useConversationRecipients(recipientType: RecipientType) {
  // Fetch practitioners
  const { data: practitioners, isLoading: loadingPractitioners } = useQuery({
    queryKey: ['practitioners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practitioners')
        .select(`
          id,
          speciality,
          profiles:user_id (
            id,
            first_name,
            last_name
          )
        `);
        
      if (error) {
        console.error('Error fetching practitioners:', error);
        throw error;
      }
      
      if (!data || !Array.isArray(data)) {
        console.error('Unexpected data format from practitioners query:', data);
        return [];
      }
      
      return data.map(practitioner => {
        // Defensive checking
        if (!practitioner) return null;
        
        // Type-safe property checking
        const practId = 'id' in practitioner ? String(practitioner.id || 'unknown-id') : 'unknown-id';
        const speciality = 'speciality' in practitioner ? (practitioner.speciality as string || 'Non spécifié') : 'Non spécifié';
        const practProfiles = 'profiles' in practitioner ? practitioner.profiles : null;
        
        // Handle the profiles data safely
        let firstName = '';
        let lastName = '';
        
        if (Array.isArray(practProfiles) && practProfiles.length > 0 && practProfiles[0]) {
          const profile = practProfiles[0];
          firstName = 'first_name' in profile ? (profile.first_name as string || '') : '';
          lastName = 'last_name' in profile ? (profile.last_name as string || '') : '';
        }
        
        return {
          id: practId, // Ensure we never have an empty string
          name: `${firstName} ${lastName} (${speciality})`.trim() || 'Unknown Name',
          type: 'practitioner' as const
        };
      }).filter(Boolean) as RecipientInfo[];
    },
    enabled: recipientType === 'practitioner'
  });
  
  // Fetch health centers
  const { data: healthCenters, isLoading: loadingCenters } = useQuery({
    queryKey: ['healthCenters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_centers')
        .select('id, name');
        
      if (error) {
        console.error('Error fetching health centers:', error);
        throw error;
      }
      
      if (!data || !Array.isArray(data)) {
        console.error('Unexpected data format from health centers query:', data);
        return [];
      }
      
      return data.map(center => {
        if (!center) return null;
        
        // Type-safe property checking
        const centerId = 'id' in center ? String(center.id || 'unknown-id') : 'unknown-id';
        const centerName = 'name' in center ? (center.name as string || 'Centre sans nom') : 'Centre sans nom';
        
        return {
          id: centerId, // Ensure we never have an empty string
          name: centerName,
          type: 'health_center' as const
        };
      }).filter(Boolean) as RecipientInfo[];
    },
    enabled: recipientType === 'health_center'
  });

  // Filter recipients based on the selected type
  const recipients: RecipientInfo[] = [
    ...(recipientType === 'practitioner' && practitioners ? practitioners : []),
    ...(recipientType === 'health_center' && healthCenters ? healthCenters : [])
  ];

  return {
    recipients,
    isLoading: recipientType === 'practitioner' ? loadingPractitioners : loadingCenters
  };
}
