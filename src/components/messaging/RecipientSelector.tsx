
import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useConversationRecipients } from '@/hooks/useConversationRecipients';

type RecipientType = 'practitioner' | 'health_center';

interface RecipientSelectorProps {
  recipientType: RecipientType;
  selectedRecipient: string;
  onSelectRecipient: (recipientId: string) => void;
}

export function RecipientSelector({ 
  recipientType, 
  selectedRecipient, 
  onSelectRecipient 
}: RecipientSelectorProps) {
  const { recipients, isLoading } = useConversationRecipients(recipientType);

  return (
    <div>
      <Label htmlFor="recipient" className="mb-2 block">
        {recipientType === 'practitioner' ? 'Médecin' : 'Centre de santé'}
      </Label>
      <Select
        value={selectedRecipient}
        onValueChange={onSelectRecipient}
        disabled={isLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder={
            isLoading
              ? 'Chargement...'
              : `Sélectionner un ${recipientType === 'practitioner' ? 'médecin' : 'centre'}`
          } />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>
              {recipientType === 'practitioner' ? 'Médecins' : 'Centres de santé'}
            </SelectLabel>
            {recipients && recipients.length > 0 ? (
              recipients.map(recipient => (
                <SelectItem 
                  key={recipient.id} 
                  value={recipient.id || "placeholder-value"} // Ensure value is never empty
                >
                  {recipient.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-results-found" disabled>
                Aucun résultat trouvé
              </SelectItem>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
