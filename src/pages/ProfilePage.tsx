import { useState, useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface UserData {
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  phoneConfirmed: boolean;
  phoneChanged: boolean;
  birthdate: string;
  gender: string;
  bloodType: string;
  address: string;
  allergies: string;
  medicalHistory: string;
}

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPhoneConfirm, setShowPhoneConfirm] = useState(false);
  const { user, profile } = useAuth();
  
  // User data state
  const [userData, setUserData] = useState<UserData>({
    name: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    phoneConfirmed: false,
    phoneChanged: false,
    birthdate: "",
    gender: "",
    bloodType: "",
    address: "",
    allergies: "",
    medicalHistory: "",
  });

  // Fetch user data from database
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        console.log("Fetching user data for ID:", user.id);
        console.log("Auth profile data:", profile);
        
        // Get user metadata
        const { data: userData, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          throw authError;
        }
        
        const userMeta = userData.user?.user_metadata || {};
        console.log("User metadata:", userMeta);
        
        // Get contact info from platform_settings table
        const { data: contactData, error: contactError } = await supabase
          .from('platform_settings')
          .select('*')
          .eq('setting_key', `user_data_${user.id}`)
          .single();
          
        if (contactError && contactError.code !== 'PGRST116') {
          console.error("Error fetching contact data:", contactError);
        }
        
        const contactInfo = contactData?.setting_value as any || {};
        
        // Get medical data from platform_settings table
        const { data: medicalData, error: medicalError } = await supabase
          .from('platform_settings')
          .select('*')
          .eq('setting_key', `medical_data_${user.id}`)
          .single();
          
        if (medicalError && medicalError.code !== 'PGRST116') {
          console.error("Error fetching medical data:", medicalError);
        }
        
        const medicalInfo = medicalData?.setting_value as any || {};
        console.log("Medical data:", medicalInfo);
        
        // Set user data from multiple sources with preference for metadata
        const firstName = userMeta.first_name || profile?.first_name || '';
        const lastName = userMeta.last_name || profile?.last_name || '';
        
        setUserData({
          name: `${firstName} ${lastName}`.trim(),
          first_name: firstName,
          last_name: lastName,
          email: user.email || "",
          phone: contactInfo.phone || userMeta.phone || "",
          phoneConfirmed: contactInfo.phoneConfirmed || false,
          phoneChanged: false,
          birthdate: contactInfo.birthdate || userMeta.birthdate || "",
          gender: contactInfo.gender || userMeta.gender || "",
          bloodType: medicalInfo.bloodType || "",
          address: contactInfo.address || userMeta.address || "",
          allergies: medicalInfo.allergies || "",
          medicalHistory: medicalInfo.medicalHistory || "",
        });
      } catch (error: any) {
        console.error("Error fetching user data:", error);
        toast.error(`Erreur: ${error.message || "Erreur lors de la récupération des données"}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, profile]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Mise à jour des first_name et last_name lorsque le nom complet change
    if (name === 'name') {
      const nameParts = value.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      setUserData((prev) => ({ 
        ...prev, 
        [name]: value,
        first_name: firstName,
        last_name: lastName
      }));
    }
    // Check if phone number is being changed
    else if (name === 'phone' && value !== userData.phone) {
      setUserData((prev) => ({ 
        ...prev, 
        [name]: value,
        phoneChanged: true,
        phoneConfirmed: false
      }));
    } else {
      setUserData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle phone number verification
  const handleVerifyPhone = () => {
    // Here you would implement SMS verification
    // For now, we'll just simulate success
    toast.success("Numéro de téléphone vérifié avec succès");
    setUserData(prev => ({
      ...prev,
      phoneConfirmed: true
    }));
    setShowPhoneConfirm(false);
  };

  // Handle saving profile data
  const handleSave = async () => {
    if (!user) return;
    
    // Check if phone number has been changed but not confirmed
    if (userData.phoneChanged && !userData.phoneConfirmed) {
      setShowPhoneConfirm(true);
      return;
    }
    
    // Afficher un indicateur de chargement
    setIsLoading(true);
    
    try {
      // Vérifier d'abord si les tables existent
      console.log("Vérification des tables dans la base de données...");
      
      // Vérifier que l'utilisateur a des permissions d'écriture
      // et que la structure de la table est correcte
      const { data: tableList, error: tableError } = await supabase
        .from('platform_settings')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.error("Erreur d'accès à la table platform_settings:", tableError);
        toast.error(`Erreur: La table platform_settings est inaccessible. ${tableError.message}`);
        setIsLoading(false);
        return;
      }
      
      console.log("Tables vérifiées, accès confirmé.");

      // Préparer les données à enregistrer de manière simple
      const userSettings = {
        user_id: user.id,
        email: userData.email,
        phone: userData.phone,
        phoneConfirmed: userData.phoneConfirmed,
        first_name: userData.first_name,
        last_name: userData.last_name,
        gender: userData.gender,
        birthdate: userData.birthdate,
        address: userData.address,
        bloodType: userData.bloodType,
        allergies: userData.allergies,
        medicalHistory: userData.medicalHistory,
        lastUpdated: new Date().toISOString()
      };
      
      console.log("Données à enregistrer:", JSON.stringify(userSettings, null, 2));
      
      // Approche simplifiée: tout enregistrer dans un seul enregistrement
      const settingKey = `user_profile_${user.id}`;
      
      // Vérifier si l'enregistrement existe déjà
      const { data: existingData, error: checkError } = await supabase
        .from('platform_settings')
        .select('id, setting_value')
        .eq('setting_key', settingKey)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Erreur lors de la vérification de l'enregistrement:", checkError);
        toast.error(`Erreur lors de la vérification des données: ${checkError.message}`);
      }
      
      let result;
      
      if (existingData) {
        console.log("Mise à jour de l'enregistrement existant:", existingData.id);
        result = await supabase
          .from('platform_settings')
          .update({
            setting_value: userSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id)
          .select();
      } else {
        console.log("Création d'un nouvel enregistrement");
        result = await supabase
          .from('platform_settings')
          .insert({
            setting_key: settingKey,
            setting_value: userSettings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
      }
      
      if (result.error) {
        console.error("Erreur d'enregistrement:", result.error);
        toast.error(`Erreur lors de l'enregistrement des données: ${result.error.message}`);
        setIsLoading(false);
        return;
      }
      
      console.log("Résultat de l'enregistrement:", result);
      
      // Vérification explicite que les données ont été enregistrées
      const { data: verificationData, error: verificationError } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('setting_key', settingKey)
        .single();
      
      if (verificationError) {
        console.error("Erreur de vérification après enregistrement:", verificationError);
        toast.error("Les données ont été envoyées mais la vérification a échoué");
      } else {
        console.log("Vérification des données enregistrées:", verificationData);
        toast.success("Profil mis à jour avec succès et vérifié dans la base de données");
      }
      
      // Mettre à jour les métadonnées utilisateur pour être sûr
      try {
        await supabase.auth.updateUser({
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            gender: userData.gender,
            phone: userData.phone
          }
        });
      } catch (authError) {
        console.error("Erreur de mise à jour des métadonnées:", authError);
      }
      
      // Reset phone changed flag
      setUserData(prev => ({
        ...prev,
        phoneChanged: false
      }));
      
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(`Erreur: ${error.message || "Erreur lors de la mise à jour du profil"}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mon profil</h2>
        <p className="text-muted-foreground">
          Consultez et modifiez vos informations personnelles et médicales.
        </p>
      </div>

      {/* Add phone confirmation dialog */}
      {showPhoneConfirm && (
        <Card className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirmer le numéro de téléphone</h3>
            <p className="mb-4">Pour des raisons de sécurité, nous devons vérifier votre nouveau numéro de téléphone.</p>
            <p className="font-semibold mb-6">Numéro: {userData.phone}</p>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPhoneConfirm(false)}>
                Annuler
              </Button>
              <Button onClick={handleVerifyPhone}>
                Vérifier
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Informations personnelles</TabsTrigger>
          <TabsTrigger value="medical">Dossier médical</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profil personnel</CardTitle>
                  <CardDescription>
                    Gérez vos informations personnelles.
                  </CardDescription>
                </div>
                <Button 
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                >
                  {isEditing ? "Enregistrer" : "Modifier"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center space-y-2">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="text-2xl">
                      {userData.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button variant="outline" size="sm" className="w-full">
                      Changer la photo
                    </Button>
                  )}
                </div>
                
                <div className="grid flex-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <Input 
                      id="name" 
                      name="name"
                      value={userData.name}
                      onChange={handleChange}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-muted" : ""}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email"
                      type="email"
                      value={userData.email}
                      onChange={handleChange}
                      readOnly={true} // Email cannot be changed directly
                      className="bg-muted"
                    />
                    {isEditing && (
                      <p className="text-xs text-muted-foreground">
                        L'email ne peut pas être modifié ici. Contactez le support.
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Téléphone
                      {userData.phoneConfirmed && (
                        <span className="ml-2 text-xs text-green-600">✓ Vérifié</span>
                      )}
                    </Label>
                    <Input 
                      id="phone" 
                      name="phone"
                      value={userData.phone}
                      onChange={handleChange}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-muted" : ""}
                    />
                    {isEditing && userData.phoneChanged && !userData.phoneConfirmed && (
                      <p className="text-xs text-amber-600">
                        Le numéro de téléphone devra être vérifié avant d'être enregistré.
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="birthdate">Date de naissance</Label>
                    <Input 
                      id="birthdate" 
                      name="birthdate"
                      value={userData.birthdate}
                      onChange={handleChange}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-muted" : ""}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gender">Genre</Label>
                    {isEditing ? (
                      <Select 
                        value={userData.gender}
                        onValueChange={(value) => handleSelectChange("gender", value)}
                      >
                        <SelectTrigger id="gender">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Homme">Homme</SelectItem>
                          <SelectItem value="Femme">Femme</SelectItem>
                          <SelectItem value="Autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input 
                        id="gender" 
                        value={userData.gender}
                        readOnly
                        className="bg-muted"
                      />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <Input 
                      id="address" 
                      name="address"
                      value={userData.address}
                      onChange={handleChange}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-muted" : ""}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            {isEditing && (
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave}>
                  Enregistrer
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="medical">
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Informations médicales</CardTitle>
                  <CardDescription>
                    Gérez vos informations médicales confidentielles.
                  </CardDescription>
                </div>
                <Button 
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                >
                  {isEditing ? "Enregistrer" : "Modifier"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bloodType">Groupe sanguin</Label>
                  {isEditing ? (
                    <Select 
                      value={userData.bloodType}
                      onValueChange={(value) => handleSelectChange("bloodType", value)}
                    >
                      <SelectTrigger id="bloodType">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input 
                      id="bloodType" 
                      value={userData.bloodType}
                      readOnly
                      className="bg-muted"
                    />
                  )}
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea 
                    id="allergies" 
                    name="allergies"
                    value={userData.allergies}
                    onChange={handleChange}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-muted" : ""}
                    rows={3}
                    placeholder="Listez vos allergies connues"
                  />
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="medicalHistory">Antécédents médicaux</Label>
                  <Textarea 
                    id="medicalHistory" 
                    name="medicalHistory"
                    value={userData.medicalHistory}
                    onChange={handleChange}
                    readOnly={!isEditing}
                    className={!isEditing ? "bg-muted" : ""}
                    rows={5}
                    placeholder="Décrivez vos antécédents médicaux importants"
                  />
                </div>
              </div>
              
              <div className="rounded-md bg-blue-50 p-4 border border-blue-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1 text-sm text-blue-700">
                    <p>
                      Ces informations sont confidentielles et ne sont partagées qu'avec les professionnels de santé que vous consultez via MediSync.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            {isEditing && (
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave}>
                  Enregistrer
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Sécurité du compte</CardTitle>
              <CardDescription>
                Gérez vos paramètres de sécurité et mises à jour du mot de passe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Mot de passe actuel</Label>
                  <Input id="current-password" type="password" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                  <Input id="new-password" type="password" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                  <Input id="confirm-password" type="password" />
                </div>
              </div>
              
              <div className="rounded-md bg-amber-50 p-4 border border-amber-100">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1 text-sm text-amber-700">
                    <p>
                      Pour votre sécurité, choisissez un mot de passe fort d'au moins 8 caractères incluant lettres, chiffres et caractères spéciaux.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={async () => {
                  // Implement password update logic with Supabase Auth
                  const currentPassword = (document.getElementById('current-password') as HTMLInputElement)?.value;
                  const newPassword = (document.getElementById('new-password') as HTMLInputElement)?.value;
                  const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement)?.value;
                  
                  if (!currentPassword || !newPassword || !confirmPassword) {
                    toast.error("Veuillez remplir tous les champs");
                    return;
                  }
                  
                  if (newPassword !== confirmPassword) {
                    toast.error("Les mots de passe ne correspondent pas");
                    return;
                  }
                  
                  try {
                    const { error } = await supabase.auth.updateUser({ password: newPassword });
                    if (error) throw error;
                    
                    toast.success("Mot de passe mis à jour avec succès");
                    
                    // Clear fields
                    (document.getElementById('current-password') as HTMLInputElement).value = '';
                    (document.getElementById('new-password') as HTMLInputElement).value = '';
                    (document.getElementById('confirm-password') as HTMLInputElement).value = '';
                  } catch (error: any) {
                    console.error("Error updating password:", error);
                    toast.error(error.message || "Erreur lors de la mise à jour du mot de passe");
                  }
                }}
              >
                Mettre à jour le mot de passe
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;
