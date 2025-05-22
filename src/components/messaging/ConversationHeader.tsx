
import React from 'react';
import { ConversationWithParticipants } from '@/types/messaging';
import { useMessaging } from '@/hooks/useMessaging';
import { AlertTriangle, ArrowLeft, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ConversationHeaderProps {
  conversation: ConversationWithParticipants;
  onBack: () => void;
  isMobile?: boolean;
}

export function ConversationHeader({
  conversation,
  onBack,
  isMobile = false
}: ConversationHeaderProps) {
  const { markConversationUrgent } = useMessaging();

  // Récupérer le nom du destinataire
  const getRecipientName = (): string => {
    if (conversation.title) {
      return conversation.title;
    }
    
    const participants = conversation.participants || [];
    const recipient = participants.find(p => p.user_type !== 'patient');
    
    if (recipient) {
      return `${recipient.first_name || ''} ${recipient.last_name || ''}`.trim();
    }
    
    return 'Sans nom';
  };
  
  // Récupérer le type de destinataire pour l'affichage
  const getRecipientType = (): string => {
    const type = conversation.recipient_type;
    
    if (type === 'practitioner') {
      return 'Médecin';
    } else if (type === 'health_center') {
      return 'Centre de santé';
    }
    
    return '';
  };
  
  // Gérer le changement de statut d'urgence
  const handleToggleUrgent = async () => {
    try {
      await markConversationUrgent(conversation.id, !conversation.is_urgent);
    } catch (error) {
      console.error('Error toggling urgent status:', error);
    }
  };
  
  return (
    <div className="border-b p-4 flex items-center justify-between">
      <div className="flex items-center">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        
        <Avatar className="h-10 w-10 mr-3">
          <div className="bg-primary text-primary-foreground h-full w-full flex items-center justify-center text-sm font-bold">
            {getRecipientName().charAt(0).toUpperCase()}
          </div>
        </Avatar>
        
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{getRecipientName()}</h3>
            {conversation.is_urgent && (
              <Badge variant="destructive" className="py-0">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Urgent
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {getRecipientType()}
          </p>
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Options de conversation</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleToggleUrgent}>
              {conversation.is_urgent ? (
                <>Supprimer le statut urgent</>
              ) : (
                <>Marquer comme urgent</>
              )}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
