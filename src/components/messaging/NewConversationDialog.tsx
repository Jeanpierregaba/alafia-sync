
import React, { useState } from 'react';
import { useMessaging } from '@/hooks/useMessaging';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { ConversationForm } from './ConversationForm';

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversationId: string) => void;
}

type RecipientType = 'practitioner' | 'health_center';

export function NewConversationDialog({
  open,
  onOpenChange,
  onConversationCreated
}: NewConversationDialogProps) {
  const { userType, createConversation } = useMessaging();
  const [isCreating, setIsCreating] = useState(false);
  
  // Handle form submission
  const handleCreateConversation = async ({
    recipientType,
    recipientId,
    title,
    message,
    isUrgent
  }: {
    recipientType: RecipientType;
    recipientId: string;
    title: string;
    message: string;
    isUrgent: boolean;
  }) => {
    // Don't proceed if recipient ID is invalid
    if (!recipientId || recipientId === 'select-placeholder' || recipientId === 'no-recipients') {
      toast.error("Veuillez sélectionner un destinataire valide");
      return;
    }
    
    setIsCreating(true);
    
    try {
      const result = await createConversation.mutateAsync({
        title: title || undefined,
        recipient_id: recipientId,
        recipient_type: recipientType,
        initiator_type: userType || 'patient',
        is_urgent: isUrgent,
        first_message: {
          content: message
        }
      });
      
      // Safely check if we have a valid conversation ID
      if (result?.conversation && 
          typeof result.conversation === 'object' && 
          'id' in result.conversation && 
          result.conversation.id) {
        onConversationCreated(result.conversation.id.toString());
        onOpenChange(false);
      } else {
        throw new Error("Failed to create conversation");
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error("Impossible de créer la conversation");
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
        
        <ConversationForm 
          onSubmit={handleCreateConversation}
          isCreating={isCreating}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
