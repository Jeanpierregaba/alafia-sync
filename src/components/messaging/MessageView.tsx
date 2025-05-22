
import React, { useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMessaging } from '@/hooks/useMessaging';
import { MessageWithAttachments } from '@/types/messaging';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Image,
  Mic,
  AlertCircle,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MessageViewProps {
  conversationId: string;
  isUrgent: boolean;
}

export function MessageView({ conversationId, isUrgent }: MessageViewProps) {
  const { userId, useConversationMessages, getFileUrl } = useMessaging();
  const { data: messages, isLoading } = useConversationMessages(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Défiler vers le bas lorsque de nouveaux messages sont chargés
  useEffect(() => {
    if (messages?.length && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Afficher le type de pièce jointe approprié
  const renderAttachment = (message: MessageWithAttachments) => {
    const attachment = message.attachments?.[0];
    if (!attachment) return null;
    
    // Pour les images
    if (message.message_type === 'image') {
      return (
        <div className="mt-2 relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 bg-background/80 rounded-full p-1 h-auto"
            onClick={() => handleDownload(attachment.file_path, attachment.file_name)}
          >
            <Download className="h-4 w-4" />
          </Button>
          <img
            src={`https://mxihevuorcjnswbzildj.supabase.co/storage/v1/object/public/message_attachments/${attachment.file_path}`}
            alt="Image jointe"
            className="max-w-full max-h-64 rounded-md object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      );
    }
    
    // Pour les documents
    if (message.message_type === 'document') {
      return (
        <div 
          className="mt-2 p-3 bg-accent rounded-md flex items-center cursor-pointer"
          onClick={() => handleDownload(attachment.file_path, attachment.file_name)}
        >
          <FileText className="h-5 w-5 mr-2" />
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{attachment.file_name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(attachment.file_size)}
            </p>
          </div>
          <Download className="h-4 w-4 ml-2" />
        </div>
      );
    }
    
    // Pour les enregistrements vocaux
    if (message.message_type === 'voice') {
      return (
        <div className="mt-2">
          <div className="flex items-center gap-2 p-2 bg-accent rounded-md">
            <Mic className="h-5 w-5" />
            <audio controls className="max-w-full">
              <source 
                src={`https://mxihevuorcjnswbzildj.supabase.co/storage/v1/object/public/message_attachments/${attachment.file_path}`} 
                type={attachment.file_type}
              />
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  // Télécharger un fichier
  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const url = await getFileUrl(filePath);
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };
  
  // Formater la taille des fichiers
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    const kb = bytes / 1024;
    if (kb < 1024) return kb.toFixed(1) + ' KB';
    const mb = kb / 1024;
    return mb.toFixed(1) + ' MB';
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {isUrgent && (
        <div className="bg-destructive/10 p-2 flex items-center justify-center text-destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">
            Cette conversation est marquée comme urgente
          </span>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          // État de chargement
          Array.from({ length: 5 }).map((_, i) => (
            <div 
              key={i} 
              className={`flex mb-4 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
            >
              {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full mr-2" />}
              <div>
                <Skeleton className={`h-4 w-32 mb-1 ${i % 2 === 0 ? 'ml-0' : 'ml-auto'}`} />
                <Skeleton className={`h-16 w-64 ${i % 2 === 0 ? 'ml-0' : 'ml-auto'}`} />
              </div>
            </div>
          ))
        ) : messages && messages.length > 0 ? (
          // Liste des messages
          messages.map(message => {
            const isCurrentUser = message.sender_id === userId;
            const senderName = message.sender_details ? 
              `${message.sender_details.first_name || ''} ${message.sender_details.last_name || ''}`.trim() : 
              'Utilisateur';
            
            return (
              <div
                key={message.id}
                className={cn(
                  "flex mb-4",
                  isCurrentUser ? "flex-row-reverse" : "flex-row"
                )}
              >
                {!isCurrentUser && (
                  <Avatar className="h-8 w-8 mr-2">
                    <div className="bg-primary text-primary-foreground h-full w-full flex items-center justify-center text-xs font-bold">
                      {senderName.charAt(0).toUpperCase()}
                    </div>
                  </Avatar>
                )}
                <div className={cn(
                  "max-w-[80%]",
                  isCurrentUser ? "mr-2" : "ml-2"
                )}>
                  <div className="flex items-baseline mb-1">
                    {!isCurrentUser && (
                      <span className="text-sm font-medium">{senderName}</span>
                    )}
                    <span className={cn(
                      "text-xs text-muted-foreground",
                      isCurrentUser ? "mr-1" : "ml-1"
                    )}>
                      {formatDistanceToNow(new Date(message.created_at), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </span>
                  </div>
                  <div className={cn(
                    "rounded-lg p-3",
                    isCurrentUser 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-accent rounded-tl-none"
                  )}>
                    {message.content && (
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                    {renderAttachment(message)}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          // Pas de messages
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              Aucun message dans cette conversation.<br />
              Envoyez un premier message pour démarrer la discussion.
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
