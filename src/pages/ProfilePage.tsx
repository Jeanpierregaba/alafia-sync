import { useState } from "react";
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

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Mock user data
  const [userData, setUserData] = useState({
    name: "Patient Test",
    email: "patient@example.com",
    phone: "+225 01 02 03 04 05",
    birthdate: "15/05/1985",
    gender: "Homme",
    bloodType: "O+",
    address: "123 Rue Principale, Abidjan",
    allergies: "Aspirine, Pénicilline",
    medicalHistory: "Hypertension, Diabète type 2",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsEditing(false);
    toast.success("Profil mis à jour avec succès");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mon profil</h2>
        <p className="text-muted-foreground">
          Consultez et modifiez vos informations personnelles et médicales.
        </p>
      </div>

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
                    <AvatarFallback className="text-2xl">PT</AvatarFallback>
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
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-muted" : ""}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input 
                      id="phone" 
                      name="phone"
                      value={userData.phone}
                      onChange={handleChange}
                      readOnly={!isEditing}
                      className={!isEditing ? "bg-muted" : ""}
                    />
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
                onClick={() => {
                  toast.success("Mot de passe mis à jour avec succès");
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
