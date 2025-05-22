
import React, { useState, useRef } from 'react';
import { useMessaging } from '@/hooks/useMessaging';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  Mic,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  conversationId: string;
}

export function MessageInput({ conversationId }: MessageInputProps) {
  const { sendMessage, isSending } = useMessaging();
  const {
    isRecording,
    recordingDuration,
    formattedDuration,
    audioRecording,
    startRecording,
    stopRecording,
    cancelRecording
  } = useAudioRecorder();
  
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Gérer l'envoi de message
  const handleSendMessage = () => {
    const hasContent = message.trim().length > 0;
    const hasFiles = selectedFiles.length > 0 || audioRecording;
    
    if (!hasContent && !hasFiles) return;
    
    const filesToSend: File[] = [...selectedFiles];
    
    // Convertir l'enregistrement audio en fichier si disponible
    if (audioRecording) {
      const audioFile = new File(
        [audioRecording.blob],
        `audio-${Date.now()}.webm`,
        { type: 'audio/webm' }
      );
      filesToSend.push(audioFile);
    }
    
    // Envoyer le message
    sendMessage({
      conversation_id: conversationId,
      content: message.trim(),
      files: filesToSend.length > 0 ? filesToSend : undefined,
      message_type: audioRecording ? 'voice' : undefined
    });
    
    // Réinitialiser l'état
    setMessage('');
    setSelectedFiles([]);
    setPreviews([]);
  };
  
  // Gérer la sélection de fichiers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'document' | 'image') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newFiles: File[] = [];
    const newPreviews: string[] = [];
    
    Array.from(files).forEach(file => {
      newFiles.push(file);
      
      if (type === 'image' && file.type.startsWith('image/')) {
        newPreviews.push(URL.createObjectURL(file));
      } else {
        newPreviews.push('');
      }
    });
    
    setSelectedFiles(prev => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
    
    // Réinitialiser l'input
    e.target.value = '';
  };
  
  // Supprimer un fichier
  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...previews];
    
    // Révoquer l'URL si c'est une image
    if (newPreviews[index]) {
      URL.revokeObjectURL(newPreviews[index]);
    }
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };
  
  return (
    <div className="border-t p-4">
      {/* Prévisualisations des fichiers */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedFiles.map((file, index) => (
            <div 
              key={index}
              className="relative group bg-accent rounded-md overflow-hidden"
            >
              {previews[index] ? (
                <img 
                  src={previews[index]}
                  alt="Preview"
                  className="h-20 w-20 object-cover"
                />
              ) : (
                <div className="h-20 w-20 flex items-center justify-center">
                  <div className="text-center p-2">
                    <div className="text-xs truncate w-16">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
              )}
              <Button
                variant="destructive"
                size="icon"
                className="h-5 w-5 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFile(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {/* Enregistrement audio */}
      {isRecording && (
        <div className="flex items-center justify-between bg-accent p-2 rounded-md mb-3">
          <div className="flex items-center">
            <div className="h-2 w-2 bg-destructive rounded-full animate-pulse mr-2"></div>
            <span className="text-sm font-medium">Enregistrement {formattedDuration}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={cancelRecording}>
              Annuler
            </Button>
            <Button size="sm" onClick={stopRecording}>
              Terminer
            </Button>
          </div>
        </div>
      )}
      
      {/* Audio enregistré */}
      {audioRecording && !isRecording && (
        <div className="flex items-center justify-between bg-accent p-2 rounded-md mb-3">
          <div className="flex items-center">
            <Mic className="h-4 w-4 mr-2" />
            <audio controls className="h-8">
              <source src={audioRecording.url} type="audio/webm" />
            </audio>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              URL.revokeObjectURL(audioRecording.url);
              cancelRecording();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Entrée de message */}
      <div className="flex items-end gap-2">
        <Textarea
          placeholder="Écrivez votre message..."
          className="flex-1 min-h-[60px] max-h-36 resize-none"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isRecording || isSending}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        
        <div className="flex flex-col gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => handleFileChange(e, 'document')}
            multiple
          />
          <input
            type="file"
            accept="image/*"
            ref={imageInputRef}
            className="hidden"
            onChange={(e) => handleFileChange(e, 'image')}
            multiple
          />
          
          <Button
            variant="outline"
            size="icon"
            type="button"
            disabled={isRecording || isSending}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            type="button"
            disabled={isRecording || isSending}
            onClick={() => imageInputRef.current?.click()}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            type="button"
            disabled={isRecording || audioRecording !== null || isSending}
            className={cn(isRecording && "bg-destructive text-destructive-foreground")}
            onClick={isRecording ? stopRecording : startRecording}
          >
            <Mic className="h-4 w-4" />
          </Button>
          
          <Button
            variant="default"
            size="icon"
            type="button"
            disabled={
              (message.trim() === '' && selectedFiles.length === 0 && !audioRecording) || 
              isRecording || 
              isSending
            }
            onClick={handleSendMessage}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
