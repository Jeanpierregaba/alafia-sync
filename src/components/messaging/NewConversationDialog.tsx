
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMessaging } from '@/hooks/useMessaging';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversationId: string) => void;
}

type RecipientInfo = {
  id: string;
  name: string;
  type: 'patient' | 'practitioner' | 'health_center';
};

export function NewConversationDialog({
  open,
  onOpenChange,
  onConversationCreated
}: NewConversationDialogProps) {
  const { userType, createConversation } = useMessaging();
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [recipientType, setRecipientType] = useState<'practitioner' | 'health_center'>('practitioner');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Réinitialiser le formulaire lorsqu'il est fermé
  useEffect(() => {
    if (!open) {
      setTitle('');
      setMessage('');
      setIsUrgent(false);
      setRecipientType('practitioner');
      setSelectedRecipient('');
    }
  }, [open]);
  
  // Récupérer les médecins
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
      
      // Corrigé: Ajout d'une vérification pour s'assurer que data est un tableau
      return (Array.isArray(data) ? data : []).map(practitioner => {
        // Vérifier si practitioner et ses propriétés sont définis
        if (!practitioner) return null;
        
        const profiles = practitioner.profiles || {};
        const firstName = profiles.first_name || '';
        const lastName = profiles.last_name || '';
        const speciality = practitioner.speciality || 'Non spécifié';
        
        return {
          id: practitioner.id || '',
          name: `${firstName} ${lastName} (${speciality})`.trim(),
          type: 'practitioner' as const
        };
      }).filter(Boolean) as RecipientInfo[];
    }
  });
  
  // Récupérer les centres de santé
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
      
      // Corrigé: Ajout d'une vérification pour s'assurer que data est un tableau
      return (Array.isArray(data) ? data : []).map(center => {
        // Vérifier si center et ses propriétés sont définis
        if (!center) return null;
        
        return {
          id: center.id || '',
          name: center.name || 'Centre sans nom',
          type: 'health_center' as const
        };
      }).filter(Boolean) as RecipientInfo[];
    }
  });
  
  // Filtrer les destinataires en fonction du type sélectionné
  const recipients: RecipientInfo[] = [
    ...(recipientType === 'practitioner' && practitioners ? practitioners : []),
    ...(recipientType === 'health_center' && healthCenters ? healthCenters : [])
  ];
  
  // Créer une nouvelle conversation
  const handleCreateConversation = async () => {
    if (!selectedRecipient || !message.trim()) return;
    
    setIsCreating(true);
    
    try {
      const recipient = recipients.find(r => r.id === selectedRecipient);
      if (!recipient) throw new Error('Recipient not found');
      
      const result = await createConversation.mutateAsync({
        title: title.trim() || undefined,
        recipient_id: recipient.id,
        recipient_type: recipient.type,
        initiator_type: userType || 'patient',
        is_urgent: isUrgent,
        first_message: {
          content: message.trim()
        }
      });
      
      if (result && result.conversation && result.conversation.id) {
        onConversationCreated(result.conversation.id);
        onOpenChange(false);
      } else {
        throw new Error("Failed to create conversation");
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle conversation</DialogTitle>
          <DialogDescription>
            Créez une nouvelle conversation avec un médecin ou un centre de santé.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <RadioGroup
            value={recipientType}
            onValueChange={(value) => {
              setRecipientType(value as 'practitioner' | 'health_center');
              setSelectedRecipient('');
            }}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem
                value="practitioner"
                id="practitioner"
                className="peer sr-only"
              />
              <Label
                htmlFor="practitioner"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Médecin
              </Label>
            </div>
            <div>
              <RadioGroupItem
                value="health_center"
                id="health_center"
                className="peer sr-only"
              />
              <Label
                htmlFor="health_center"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                Centre de santé
              </Label>
            </div>
          </RadioGroup>
          
          <div>
            <Label htmlFor="recipient" className="mb-2 block">
              {recipientType === 'practitioner' ? 'Médecin' : 'Centre de santé'}
            </Label>
            <Select
              value={selectedRecipient}
              onValueChange={setSelectedRecipient}
              disabled={
                (recipientType === 'practitioner' && loadingPractitioners) || 
                (recipientType === 'health_center' && loadingCenters)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  (recipientType === 'practitioner' && loadingPractitioners) || 
                  (recipientType === 'health_center' && loadingCenters)
                    ? 'Chargement...'
                    : `Sélectionner un ${recipientType === 'practitioner' ? 'médecin' : 'centre'}`
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>
                    {recipientType === 'practitioner' ? 'Médecins' : 'Centres de santé'}
                  </SelectLabel>
                  {recipients.map(recipient => (
                    <SelectItem key={recipient.id} value={recipient.id}>
                      {recipient.name}
                    </SelectItem>
                  ))}
                  {recipients.length === 0 && !loadingPractitioners && !loadingCenters && (
                    <SelectItem value="none" disabled>
                      Aucun résultat trouvé
                    </SelectItem>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="title" className="mb-2 block">
              Titre (optionnel)
            </Label>
            <Input
              id="title"
              placeholder="Titre de la conversation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="message" className="mb-2 block">
              Premier message
            </Label>
            <Textarea
              id="message"
              placeholder="Écrivez votre message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="urgent"
              checked={isUrgent}
              onCheckedChange={setIsUrgent}
            />
            <Label htmlFor="urgent">
              Marquer comme urgent
            </Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleCreateConversation}
            disabled={
              !selectedRecipient || 
              message.trim() === '' || 
              isCreating
            }
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              'Créer la conversation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
