
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { RecipientTypeSelector } from './RecipientTypeSelector';
import { RecipientSelector } from './RecipientSelector';

type RecipientType = 'practitioner' | 'health_center';

interface ConversationFormProps {
  onSubmit: (formData: {
    recipientType: RecipientType;
    recipientId: string;
    title: string;
    message: string;
    isUrgent: boolean;
  }) => void;
  isCreating: boolean;
  onCancel: () => void;
}

export function ConversationForm({ onSubmit, isCreating, onCancel }: ConversationFormProps) {
  const [recipientType, setRecipientType] = useState<RecipientType>('practitioner');
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  const handleSubmit = () => {
    if (!selectedRecipient || selectedRecipient === 'select-placeholder' || selectedRecipient === 'no-results-found' || message.trim() === '') return;

    onSubmit({
      recipientType,
      recipientId: selectedRecipient,
      title: title.trim(),
      message: message.trim(),
      isUrgent
    });
  };

  return (
    <div className="grid gap-4 py-4">
      <RecipientTypeSelector 
        value={recipientType} 
        onChange={(value) => {
          setRecipientType(value);
          setSelectedRecipient('');
        }} 
      />
      
      <RecipientSelector
        recipientType={recipientType}
        selectedRecipient={selectedRecipient}
        onSelectRecipient={setSelectedRecipient}
      />
      
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

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isCreating}>
          Annuler
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={
            !selectedRecipient || 
            selectedRecipient === 'select-placeholder' || 
            selectedRecipient === 'no-results-found' || 
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
      </div>
    </div>
  );
}
