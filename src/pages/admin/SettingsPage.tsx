
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Types pour les paramètres
type Setting = {
  id: string;
  setting_key: string;
  setting_value: any;
};

// Map des paramètres avec leurs valeurs par défaut
const defaultSettings = {
  platform_name: 'AlafiaSync',
  platform_description: 'Plateforme de gestion de rendez-vous médicaux',
  registration_enabled: true,
  max_appointments_per_day: 10,
  appointment_duration_minutes: 30,
  reminder_hours_before: 24,
  notification_enabled: true,
  maintenance_mode: false,
  contact_email: 'contact@alafiasync.com',
  contact_phone: '',
};

const SettingsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsMap, setSettingsMap] = useState<Record<string, any>>(defaultSettings);
  const [originalSettingsMap, setOriginalSettingsMap] = useState<Record<string, any>>({});

  // Charger les paramètres
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('platform_settings')
          .select('*');
        
        if (error) throw error;
        
        // Convertir les données en map
        const settingsData = (data || []).reduce((acc: Record<string, any>, setting: Setting) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {});
        
        // Fusionner avec les valeurs par défaut
        const mergedSettings = { ...defaultSettings, ...settingsData };
        
        setSettingsMap(mergedSettings);
        setOriginalSettingsMap(mergedSettings);
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Erreur lors du chargement des paramètres");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Mettre à jour les paramètres
  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // Créer une liste des paramètres à insérer/mettre à jour
      const settingsToUpsert = Object.entries(settingsMap).map(([key, value]) => ({
        setting_key: key,
        setting_value: value
      }));
      
      const { error } = await supabase
        .from('platform_settings')
        .upsert(settingsToUpsert, {
          onConflict: 'setting_key'
        });
      
      if (error) throw error;
      
      toast.success("Paramètres sauvegardés avec succès");
      setOriginalSettingsMap({ ...settingsMap });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error.message || "Erreur lors de la sauvegarde des paramètres");
    } finally {
      setIsSaving(false);
    }
  };

  // Gérer les changements
  const handleSettingChange = (key: string, value: any) => {
    setSettingsMap(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Vérifier si des modifications ont été apportées
  const hasChanges = () => {
    return Object.entries(settingsMap).some(([key, value]) => {
      return JSON.stringify(value) !== JSON.stringify(originalSettingsMap[key]);
    });
  };

  // Annuler les modifications
  const handleCancel = () => {
    setSettingsMap({ ...originalSettingsMap });
    toast.info("Modifications annulées");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Paramètres de la plateforme</h2>
        <p className="text-muted-foreground">
          Configurez les paramètres généraux de AlafiaSync.
        </p>
      </div>

      <div className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          onClick={handleCancel} 
          disabled={!hasChanges() || isSaving}
        >
          Annuler
        </Button>
        <Button 
          onClick={handleSaveSettings} 
          disabled={!hasChanges() || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="appointments">Rendez-vous</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres généraux</CardTitle>
              <CardDescription>
                Configuration de base de la plateforme AlafiaSync
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform_name">Nom de la plateforme</Label>
                <Input
                  id="platform_name"
                  value={settingsMap.platform_name}
                  onChange={(e) => handleSettingChange('platform_name', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="platform_description">Description</Label>
                <Textarea
                  id="platform_description"
                  value={settingsMap.platform_description}
                  onChange={(e) => handleSettingChange('platform_description', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email de contact</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settingsMap.contact_email}
                  onChange={(e) => handleSettingChange('contact_email', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Téléphone de contact</Label>
                <Input
                  id="contact_phone"
                  value={settingsMap.contact_phone}
                  onChange={(e) => handleSettingChange('contact_phone', e.target.value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="registration_enabled"
                  checked={settingsMap.registration_enabled}
                  onCheckedChange={(checked) => handleSettingChange('registration_enabled', checked)}
                />
                <Label htmlFor="registration_enabled">Activer les inscriptions</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="maintenance_mode"
                  checked={settingsMap.maintenance_mode}
                  onCheckedChange={(checked) => handleSettingChange('maintenance_mode', checked)}
                />
                <Label htmlFor="maintenance_mode">Mode maintenance</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres des rendez-vous</CardTitle>
              <CardDescription>
                Configurez le fonctionnement des rendez-vous
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max_appointments_per_day">Nombre maximum de rendez-vous par jour</Label>
                <Input
                  id="max_appointments_per_day"
                  type="number"
                  min="1"
                  value={settingsMap.max_appointments_per_day}
                  onChange={(e) => handleSettingChange('max_appointments_per_day', parseInt(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appointment_duration_minutes">Durée par défaut des rendez-vous (minutes)</Label>
                <Select
                  value={settingsMap.appointment_duration_minutes.toString()}
                  onValueChange={(value) => handleSettingChange('appointment_duration_minutes', parseInt(value))}
                >
                  <SelectTrigger id="appointment_duration_minutes">
                    <SelectValue placeholder="Sélectionnez la durée" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 heure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de notifications</CardTitle>
              <CardDescription>
                Configurez les notifications et rappels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="notification_enabled"
                  checked={settingsMap.notification_enabled}
                  onCheckedChange={(checked) => handleSettingChange('notification_enabled', checked)}
                />
                <Label htmlFor="notification_enabled">Activer les notifications</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reminder_hours_before">Rappel de rendez-vous (heures à l'avance)</Label>
                <Select
                  value={settingsMap.reminder_hours_before.toString()}
                  onValueChange={(value) => handleSettingChange('reminder_hours_before', parseInt(value))}
                  disabled={!settingsMap.notification_enabled}
                >
                  <SelectTrigger id="reminder_hours_before">
                    <SelectValue placeholder="Sélectionnez l'avance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 heure</SelectItem>
                    <SelectItem value="2">2 heures</SelectItem>
                    <SelectItem value="6">6 heures</SelectItem>
                    <SelectItem value="12">12 heures</SelectItem>
                    <SelectItem value="24">24 heures</SelectItem>
                    <SelectItem value="48">48 heures</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
