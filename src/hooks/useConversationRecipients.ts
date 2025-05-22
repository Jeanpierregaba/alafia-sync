
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
        if (!practitioner) return null;
        
        if (typeof practitioner !== 'object' || !practitioner.hasOwnProperty('id') || 
            !practitioner.hasOwnProperty('speciality') || !practitioner.hasOwnProperty('profiles')) {
          console.warn('Practitioner object missing required properties:', practitioner);
          return null;
        }
        
        const profiles = practitioner.profiles;
        
        if (!Array.isArray(profiles) || !profiles[0]) {
          return {
            id: String(practitioner.id || 'unknown-id'), // Ensure we never have an empty string
            name: `Unknown (${practitioner.speciality || 'Non spécifié'})`,
            type: 'practitioner' as const
          };
        }
        
        const profile = profiles[0];
        const firstName = profile?.first_name || '';
        const lastName = profile?.last_name || '';
        const speciality = practitioner.speciality || 'Non spécifié';
        
        return {
          id: String(practitioner.id || 'unknown-id'), // Ensure we never have an empty string
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
        
        if (typeof center !== 'object' || !center.hasOwnProperty('id') || !center.hasOwnProperty('name')) {
          console.warn('Health center object missing required properties:', center);
          return null;
        }
        
        return {
          id: String(center.id || 'unknown-id'), // Ensure we never have an empty string
          name: center.name || 'Centre sans nom',
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
