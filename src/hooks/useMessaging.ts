
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  ConversationWithParticipants,
  MessageWithAttachments,
  CreateConversationParams,
  SendMessageParams,
  UserType
} from '@/types/messaging';

export function useMessaging() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);

  // Récupérer l'ID utilisateur et son type au chargement
  useEffect(() => {
    const getUserData = async () => {
      const { data } = await supabase.auth.getUser();
      if (data && data.user) {
        setUserId(data.user.id);
        
        // Récupérer le type d'utilisateur depuis les profils
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', data.user.id)
          .single();
        
        if (profileData) {
          setUserType(profileData.user_type as UserType);
        }
      }
    };
    
    getUserData();

    // Écouter les changements en temps réel pour les nouveaux messages
    const conversationsChannel = supabase
      .channel('conversations-channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          // Actualiser les conversations et les messages
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ 
            queryKey: ['messages', payload.new.conversation_id]
          });
          
          // Notification pour les nouveaux messages 
          if (payload.new.sender_id !== userId) {
            toast({
              title: "Nouveau message",
              description: "Vous avez reçu un nouveau message",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
    };
  }, [queryClient]);

  // Récupérer toutes les conversations de l'utilisateur
  const { data: conversations, isLoading: loadingConversations, error: conversationsError } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (!userId) return [];
      
      // Récupérer les conversations où l'utilisateur est initiateur, destinataire ou participant
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants(
            id, user_id, user_type,
            profiles:user_id(first_name, last_name)
          )
        `)
        .order('last_message_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching conversations:', error);
        throw error;
      }

      // Pour chaque conversation, récupérer le nombre de messages non lus
      const conversationsWithUnread = await Promise.all(conversationsData.map(async (conversation) => {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .eq('is_read', false)
          .neq('sender_id', userId);
        
        // Récupérer le dernier message
        const { data: lastMessageData } = await supabase
          .from('messages')
          .select('content, created_at, sender_id, message_type')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        return {
          ...conversation,
          unread_count: count || 0,
          last_message: lastMessageData
        };
      }));
      
      return conversationsWithUnread as ConversationWithParticipants[];
    },
    enabled: !!userId
  });

  // Fonction pour récupérer les messages d'une conversation spécifique
  const getMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) return [];
    
    // Marquer les messages comme lus
    await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId);
    
    // Récupérer les messages avec leurs pièces jointes
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        attachments:message_attachments(*),
        sender_details:sender_id(
          first_name:profiles!profiles_id_fkey(first_name),
          last_name:profiles!profiles_id_fkey(last_name),
          avatar_url:profiles!profiles_id_fkey(avatar_url),
          user_type:profiles!profiles_id_fkey(user_type)
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
    
    // Invalider la requête des conversations pour mettre à jour le nombre de messages non lus
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    
    return messages as MessageWithAttachments[];
  }, [userId, queryClient]);

  // Hook pour récupérer les messages d'une conversation
  const useConversationMessages = (conversationId: string | undefined) => {
    return useQuery({
      queryKey: ['messages', conversationId],
      queryFn: () => getMessages(conversationId!),
      enabled: !!conversationId && !!userId
    });
  };

  // Mutation pour créer une nouvelle conversation
  const createConversation = useMutation({
    mutationFn: async (params: CreateConversationParams) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Insérer la nouvelle conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          title: params.title,
          initiator_id: userId,
          initiator_type: params.initiator_type,
          recipient_id: params.recipient_id,
          recipient_type: params.recipient_type,
          is_urgent: params.is_urgent || false
        })
        .select()
        .single();
      
      if (conversationError) {
        console.error('Error creating conversation:', conversationError);
        throw conversationError;
      }
      
      // Si un premier message est fourni, l'envoyer
      if (params.first_message) {
        const messageResult = await sendMessage({
          conversation_id: conversationData.id,
          content: params.first_message.content,
          files: params.first_message.attachments,
          message_type: 'text'
        });
        
        return {
          conversation: conversationData,
          message: messageResult
        };
      }
      
      return { conversation: conversationData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: "Conversation créée",
        description: "Votre conversation a été créée avec succès",
      });
    },
    onError: (error) => {
      console.error('Error in createConversation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la conversation",
        variant: "destructive"
      });
    }
  });

  // Fonction pour télécharger des fichiers
  const uploadFiles = async (files: File[], conversationId: string, messageId: string): Promise<MessageAttachmentType[]> => {
    const attachments: MessageAttachmentType[] = [];
    
    for (const file of files) {
      // Créer un chemin unique pour le fichier
      const filePath = `${userId}/${conversationId}/${messageId}/${file.name}`;
      
      // Télécharger le fichier dans le bucket
      const { data: fileData, error: uploadError } = await supabase
        .storage
        .from('message_attachments')
        .upload(filePath, file);
        
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
      }
      
      // Créer l'entrée de la pièce jointe
      const { data: attachmentData, error: attachmentError } = await supabase
        .from('message_attachments')
        .insert({
          message_id: messageId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size
        })
        .select()
        .single();
        
      if (attachmentError) {
        console.error('Error creating attachment:', attachmentError);
        throw attachmentError;
      }
      
      attachments.push(attachmentData);
    }
    
    return attachments;
  };

  // Fonction pour envoyer un message
  const sendMessage = async (params: SendMessageParams) => {
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    // Déterminer le type de message
    let messageType = params.message_type || 'text';
    if (!params.content && params.files && params.files.length > 0) {
      const fileType = params.files[0].type;
      if (fileType.startsWith('image/')) {
        messageType = 'image';
      } else if (fileType.startsWith('audio/')) {
        messageType = 'voice';
      } else {
        messageType = 'document';
      }
    }
    
    // Insérer le message
    const { data: messageData, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: params.conversation_id,
        sender_id: userId,
        sender_type: userType!,
        content: params.content,
        message_type: messageType
      })
      .select()
      .single();
      
    if (messageError) {
      console.error('Error sending message:', messageError);
      throw messageError;
    }
    
    // Si des fichiers sont fournis, les télécharger
    if (params.files && params.files.length > 0) {
      await uploadFiles(params.files, params.conversation_id, messageData.id);
    }
    
    return messageData;
  };

  // Mutation pour envoyer un message
  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversation_id] });
    },
    onError: (error) => {
      console.error('Error in sendMessage:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
    }
  });

  // Fonction pour marquer une conversation comme urgente
  const markConversationUrgent = async (conversationId: string, isUrgent: boolean) => {
    const { error } = await supabase
      .from('conversations')
      .update({ is_urgent: isUrgent })
      .eq('id', conversationId);
      
    if (error) {
      console.error('Error updating conversation urgency:', error);
      throw error;
    }
    
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    
    return true;
  };

  // Fonction pour récupérer l'URL de téléchargement d'un fichier
  const getFileUrl = async (filePath: string) => {
    const { data } = await supabase
      .storage
      .from('message_attachments')
      .createSignedUrl(filePath, 3600); // URL valide pendant 1 heure
      
    return data?.signedUrl;
  };

  return {
    userId,
    userType,
    conversations,
    loadingConversations,
    conversationsError,
    useConversationMessages,
    createConversation,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    markConversationUrgent,
    getFileUrl
  };
}
