
import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMessaging } from '@/hooks/useMessaging';
import { ConversationWithParticipants } from '@/types/messaging';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  MessageSquarePlus,
  AlertCircle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ConversationListProps {
  selectedConversationId: string | undefined;
  onSelectConversation: (conversation: ConversationWithParticipants) => void;
  onNewConversation: () => void;
}

export function ConversationList({
  selectedConversationId,
  onSelectConversation,
  onNewConversation
}: ConversationListProps) {
  const { conversations, loadingConversations } = useMessaging();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtrer les conversations en fonction de la recherche
  const filteredConversations = conversations?.filter(conversation => {
    const title = conversation.title || '';
    const participantNames = conversation.participants
      ?.map(p => `${p.first_name || ''} ${p.last_name || ''}`)
      .join(' ');
    const lastMessage = conversation.last_message?.content || '';
    
    const searchLower = searchQuery.toLowerCase();
    
    return (
      title.toLowerCase().includes(searchLower) ||
      participantNames.toLowerCase().includes(searchLower) ||
      lastMessage.toLowerCase().includes(searchLower)
    );
  });
  
  // Formater la date du dernier message
  const formatMessageDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (diff < oneDay && date.getDate() === now.getDate()) {
      return format(date, 'HH:mm');
    } else if (diff < 7 * oneDay) {
      return format(date, 'EEEE', { locale: fr });
    } else {
      return format(date, 'dd/MM/yyyy');
    }
  };

  // Récupérer le nom du destinataire
  const getRecipientName = (conversation: ConversationWithParticipants): string => {
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
  
  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <Button size="sm" variant="outline" onClick={onNewConversation}>
            <MessageSquarePlus className="h-4 w-4 mr-1" />
            Nouveau
          </Button>
        </div>
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {loadingConversations ? (
          // État de chargement
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 border-b">
              <div className="flex justify-between items-start mb-1">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-4 w-3/4 mt-2" />
            </div>
          ))
        ) : filteredConversations && filteredConversations.length > 0 ? (
          // Liste des conversations
          filteredConversations.map(conversation => (
            <div
              key={conversation.id}
              className={cn(
                "p-4 border-b cursor-pointer hover:bg-accent/50 transition-colors",
                conversation.id === selectedConversationId && "bg-accent"
              )}
              onClick={() => onSelectConversation(conversation)}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center">
                  <span className="font-medium truncate">
                    {getRecipientName(conversation)}
                  </span>
                  {conversation.is_urgent && (
                    <Badge variant="destructive" className="ml-2 py-0">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Urgent
                    </Badge>
                  )}
                  {conversation.unread_count > 0 && (
                    <Badge className="ml-2" variant="secondary">
                      {conversation.unread_count}
                    </Badge>
                  )}
                </div>
                {conversation.last_message && (
                  <span className="text-xs text-muted-foreground">
                    {formatMessageDate(conversation.last_message.created_at)}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {conversation.last_message?.content || "Pas de message"}
              </p>
            </div>
          ))
        ) : (
          // Pas de conversations
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Aucune conversation trouvée</p>
            <Button 
              variant="link" 
              className="mt-2" 
              onClick={onNewConversation}
            >
              Démarrer une nouvelle conversation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
