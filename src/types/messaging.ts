import { Database } from "@/integrations/supabase/types";

export type ConversationType = Database["public"]["Tables"]["conversations"]["Row"];
export type MessageType = Database["public"]["Tables"]["messages"]["Row"];
export type MessageAttachmentType = Database["public"]["Tables"]["message_attachments"]["Row"];
export type ConversationParticipantType = Database["public"]["Tables"]["conversation_participants"]["Row"];

export type UserType = 'patient' | 'practitioner' | 'health_center';

export type ConversationWithParticipants = ConversationType & {
  participants: Array<{
    id: string;
    user_id: string;
    user_type: UserType;
    first_name?: string;
    last_name?: string;
  }>;
  unread_count: number;
  last_message?: {
    content: string | null;
    created_at: string;
    sender_id: string;
    message_type: string;
  };
};

export type MessageWithAttachments = MessageType & {
  attachments?: MessageAttachmentType[];
  sender_details?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    user_type: UserType;
  };
};

export interface CreateConversationParams {
  title?: string;
  recipient_id: string;
  recipient_type: UserType;
  initiator_type: UserType;
  is_urgent?: boolean;
  first_message?: {
    content: string;
    attachments?: File[];
  };
}

export interface SendMessageParams {
  conversation_id: string;
  content?: string;
  files?: File[];
  message_type?: 'text' | 'image' | 'document' | 'voice' | 'system';
}

export interface AudioRecording {
  blob: Blob;
  url: string;
  duration: number;
}

export interface RecipientInfo {
  id: string;
  name: string;
  type: 'patient' | 'practitioner' | 'health_center';
}

export type RecipientType = 'practitioner' | 'health_center';

export interface ConversationFormData {
  recipientType: RecipientType;
  recipientId: string;
  title: string;
  message: string;
  isUrgent: boolean;
}
