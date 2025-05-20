
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, MessageSquare, Phone } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";

export function NotificationPreferences() {
  const { preferences, isLoading, updatePreferences } = useNotifications();

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneNumber = e.target.value;
    if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
      return;
    }
  };

  const handleToggle = async (field: string, value: boolean) => {
    if (field === 'sms_enabled' && value && !preferences?.phone_number) {
      toast.warning("Veuillez d'abord ajouter un numéro de téléphone");
      return;
    }
    
    if (field === 'whatsapp_enabled' && value && !preferences?.phone_number) {
      toast.warning("Veuillez d'abord ajouter un numéro de téléphone");
      return;
    }
    
    await updatePreferences({ [field]: value });
  };

  const handleSavePhoneNumber = async () => {
    if (preferences?.phone_number && !isValidPhoneNumber(preferences.phone_number)) {
      toast.error("Numéro de téléphone invalide");
      return;
    }
    
    await updatePreferences({ phone_number: preferences?.phone_number || null });
  };

  const isValidPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phone);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Préférences de notification</CardTitle>
          <CardDescription>Chargement des préférences...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <CardTitle>Préférences de notification</CardTitle>
        </div>
        <CardDescription>
          Configurez comment vous souhaitez être notifié pour vos rendez-vous
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="email-toggle">Notifications par email</Label>
            </div>
            <Switch
              id="email-toggle"
              checked={preferences?.email_enabled || false}
              onCheckedChange={(checked) => handleToggle('email_enabled', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="sms-toggle">Notifications par SMS</Label>
            </div>
            <Switch
              id="sms-toggle"
              checked={preferences?.sms_enabled || false}
              onCheckedChange={(checked) => handleToggle('sms_enabled', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="whatsapp-toggle">Notifications WhatsApp</Label>
            </div>
            <Switch
              id="whatsapp-toggle"
              checked={preferences?.whatsapp_enabled || false}
              onCheckedChange={(checked) => handleToggle('whatsapp_enabled', checked)}
            />
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <Label htmlFor="phone-number">Numéro de téléphone pour SMS/WhatsApp</Label>
          <div className="flex gap-2">
            <Input
              id="phone-number"
              placeholder="+33612345678"
              value={preferences?.phone_number || ''}
              onChange={(e) => updatePreferences({ phone_number: e.target.value })}
            />
            <Button 
              variant="outline" 
              onClick={handleSavePhoneNumber}
            >
              Enregistrer
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Format international requis (ex: +33612345678)
          </p>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <h3 className="font-medium">Rappels</h3>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="reminder-24h">Rappel 24h avant le rendez-vous</Label>
            <Switch
              id="reminder-24h"
              checked={preferences?.reminder_24h || false}
              onCheckedChange={(checked) => handleToggle('reminder_24h', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="reminder-same-day">Rappel le jour même</Label>
            <Switch
              id="reminder-same-day"
              checked={preferences?.reminder_same_day || false}
              onCheckedChange={(checked) => handleToggle('reminder_same_day', checked)}
            />
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground italic mt-2">
          Les rappels seront envoyés selon les méthodes de notification activées ci-dessus.
        </p>
      </CardContent>
    </Card>
  );
}
