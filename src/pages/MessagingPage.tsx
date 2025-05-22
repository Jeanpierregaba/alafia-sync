
import React, { useState, useEffect } from 'react';
import { ConversationWithParticipants } from '@/types/messaging';
import { ConversationList } from '@/components/messaging/ConversationList';
import { MessageView } from '@/components/messaging/MessageView';
import { MessageInput } from '@/components/messaging/MessageInput';
import { ConversationHeader } from '@/components/messaging/ConversationHeader';
import { NewConversationDialog } from '@/components/messaging/NewConversationDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useMobile } from '@/hooks/use-mobile';
import { MessageSquare } from 'lucide-react';

export default function MessagingPage() {
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithParticipants | null>(null);
  const [newConversationDialogOpen, setNewConversationDialogOpen] = useState(false);
  const isMobile = useMobile();
  const [showConversationList, setShowConversationList] = useState(!isMobile);
  const [showConversationView, setShowConversationView] = useState(false);
  
  // Gérer le changement de taille d'écran
  useEffect(() => {
    setShowConversationList(!isMobile || (isMobile && !selectedConversation));
    setShowConversationView(!isMobile || (isMobile && !!selectedConversation));
  }, [isMobile, selectedConversation]);
  
  // Gérer la sélection d'une conversation
  const handleSelectConversation = (conversation: ConversationWithParticipants) => {
    setSelectedConversation(conversation);
    if (isMobile) {
      setShowConversationList(false);
      setShowConversationView(true);
    }
  };
  
  // Revenir à la liste des conversations sur mobile
  const handleBackToList = () => {
    if (isMobile) {
      setShowConversationList(true);
      setShowConversationView(false);
      setSelectedConversation(null);
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Messagerie</h1>
      
      <div className="flex-1 overflow-hidden border rounded-md bg-background flex">
        {/* Liste des conversations */}
        {showConversationList && (
          <div className={`${isMobile ? 'w-full' : 'w-1/3 min-w-[300px]'}`}>
            <ConversationList
              selectedConversationId={selectedConversation?.id}
              onSelectConversation={handleSelectConversation}
              onNewConversation={() => setNewConversationDialogOpen(true)}
            />
          </div>
        )}
        
        {/* Vue de la conversation sélectionnée */}
        {showConversationView && (
          <div className={`flex flex-col ${isMobile ? 'w-full' : 'flex-1'}`}>
            {selectedConversation ? (
              <>
                <ConversationHeader
                  conversation={selectedConversation}
                  onBack={handleBackToList}
                  isMobile={isMobile}
                />
                <MessageView
                  conversationId={selectedConversation.id}
                  isUrgent={selectedConversation.is_urgent}
                />
                <MessageInput conversationId={selectedConversation.id} />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col p-6">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium">Aucune conversation sélectionnée</h3>
                <p className="text-muted-foreground text-center mt-2">
                  Sélectionnez une conversation ou créez-en une nouvelle pour commencer à discuter.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <NewConversationDialog
        open={newConversationDialogOpen}
        onOpenChange={setNewConversationDialogOpen}
        onConversationCreated={(conversationId) => {
          // Une fois la conversation créée, on l'ouvre automatiquement
          // La liste des conversations sera mise à jour par la requête
        }}
      />
    </div>
  );
}
