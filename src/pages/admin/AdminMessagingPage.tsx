
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  AlertTriangle,
  Clock,
  MessageSquare,
  Search,
  UserCheck,
  Users
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserType } from '@/types/messaging';

export default function AdminMessagingPage() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('all');
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  
  // Statistiques des conversations
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['conversation-stats'],
    queryFn: async () => {
      // Total des conversations
      const { count: totalCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true });
      
      // Conversations urgentes
      const { count: urgentCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('is_urgent', true)
        .eq('status', 'active');
      
      // Conversations sans réponse
      const { data: noResponseData } = await supabase.rpc('get_unanswered_conversations_count');
      const noResponseCount = noResponseData || 0;
      
      // Temps de réponse moyen (en minutes)
      const { data: avgResponseTimeData } = await supabase.rpc('get_avg_response_time_minutes');
      const avgResponseTime = avgResponseTimeData || 0;
      
      return {
        total: totalCount || 0,
        urgent: urgentCount || 0,
        noResponse: noResponseCount,
        avgResponseTime: avgResponseTime
      };
    }
  });
  
  // Récupérer les centres de santé
  const { data: healthCenters } = useQuery({
    queryKey: ['health-centers-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_centers')
        .select('id, name');
      
      if (error) throw error;
      return data || [];
    }
  });
  
  // Récupérer les conversations
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['admin-conversations', filter, assignedFilter, selectedCenter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('conversations')
        .select(`
          *,
          initiator:initiator_id(
            profiles:profiles!profiles_id_fkey(first_name, last_name, user_type)
          ),
          recipient:recipient_id(
            profiles:profiles!profiles_id_fkey(first_name, last_name, user_type)
          ),
          messages:messages(id)
        `)
        .order('last_message_at', { ascending: false });
      
      // Filtrer par statut
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      // Filtrer par centre de santé
      if (selectedCenter) {
        query = query.or(`recipient_id.eq.${selectedCenter},initiator_id.eq.${selectedCenter}`);
      }
      
      // Exécuter la requête
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filtrer par recherche
      let filteredData = data || [];
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        filteredData = filteredData.filter(conversation => {
          const initiatorName = `${conversation.initiator?.profiles?.first_name || ''} ${conversation.initiator?.profiles?.last_name || ''}`.toLowerCase();
          const recipientName = `${conversation.recipient?.profiles?.first_name || ''} ${conversation.recipient?.profiles?.last_name || ''}`.toLowerCase();
          const title = (conversation.title || '').toLowerCase();
          
          return (
            initiatorName.includes(searchLower) ||
            recipientName.includes(searchLower) ||
            title.includes(searchLower)
          );
        });
      }
      
      return filteredData;
    }
  });
  
  // Obtenir le nom d'un utilisateur
  const getUserName = (conversation: any, type: 'initiator' | 'recipient'): string => {
    const user = conversation[type];
    if (!user || !user.profiles) return 'Utilisateur inconnu';
    
    const firstName = user.profiles.first_name || '';
    const lastName = user.profiles.last_name || '';
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    
    return 'Utilisateur sans nom';
  };
  
  // Obtenir le type d'utilisateur
  const getUserType = (conversation: any, type: 'initiator' | 'recipient'): UserType => {
    const user = conversation[type];
    return user?.profiles?.user_type || 'patient';
  };
  
  // Formater le type d'utilisateur pour l'affichage
  const formatUserType = (type: UserType): string => {
    switch (type) {
      case 'patient':
        return 'Patient';
      case 'practitioner':
        return 'Médecin';
      case 'health_center':
        return 'Centre de santé';
      default:
        return type;
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administration des messages</h1>
        <p className="text-muted-foreground">
          Gérez les conversations entre patients, médecins et centres de santé.
        </p>
      </div>
      
      {/* Statistiques des conversations */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total des conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <MessageSquare className="h-4 w-4 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">
                {loadingStats ? '...' : stats?.total}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Conversations urgentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-destructive mr-2" />
              <div className="text-2xl font-bold">
                {loadingStats ? '...' : stats?.urgent}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sans réponse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <UserCheck className="h-4 w-4 text-yellow-500 mr-2" />
              <div className="text-2xl font-bold">
                {loadingStats ? '...' : stats?.noResponse}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Temps de réponse moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">
                {loadingStats ? '...' : `${Math.round(stats?.avgResponseTime || 0)} min`}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filtres et tableau des conversations */}
      <Tabs defaultValue="all">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="active">Actives</TabsTrigger>
            <TabsTrigger value="urgent">Urgentes</TabsTrigger>
            <TabsTrigger value="archived">Archivées</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="w-[200px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select value={selectedCenter || ''} onValueChange={setSelectedCenter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tous les centres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les centres</SelectItem>
                {healthCenters?.map(center => (
                  <SelectItem key={center.id} value={center.id}>
                    {center.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <TabsContent value="all" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Initiateur</TableHead>
                  <TableHead>Destinataire</TableHead>
                  <TableHead>Dernier message</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : conversations && conversations.length > 0 ? (
                  conversations.map(conversation => (
                    <TableRow key={conversation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{getUserName(conversation, 'initiator')}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatUserType(getUserType(conversation, 'initiator'))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{getUserName(conversation, 'recipient')}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatUserType(getUserType(conversation, 'recipient'))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(conversation.last_message_at), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {conversation.is_urgent && (
                            <Badge variant="destructive">Urgent</Badge>
                          )}
                          <Badge variant={conversation.status === 'active' ? 'default' : 'secondary'}>
                            {conversation.status === 'active' ? 'Active' : 'Archivée'}
                          </Badge>
                          <Badge variant="outline">
                            {conversation.messages?.length || 0} messages
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Aucune conversation trouvée.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        {/* Contenu similaire pour les autres onglets */}
        {['active', 'urgent', 'archived'].map(tabValue => (
          <TabsContent key={tabValue} value={tabValue} className="mt-4">
            <div className="rounded-md border">
              <Table>
                {/* Même structure de table que l'onglet "all" */}
                <TableHeader>
                  <TableRow>
                    <TableHead>Initiateur</TableHead>
                    <TableHead>Destinataire</TableHead>
                    <TableHead>Dernier message</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Chargement de l'onglet {tabValue}...
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
