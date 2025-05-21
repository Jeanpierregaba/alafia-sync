import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQueueNotifications } from "@/hooks/useQueueNotifications";
import { QueueEntry } from "@/hooks/useWaitingQueue";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Clock, Users, AlertTriangle, CheckCircle, Info, Clock4 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Type étendu pour inclure les informations de la file d'attente
type QueueEntryWithQueue = QueueEntry & {
  waiting_queues?: {
    name: string;
    description?: string | null;
    average_wait_time: number;
  };
};

const PatientQueuePage = () => {
  const { user } = useAuth();
  const [myQueueEntries, setMyQueueEntries] = useState<QueueEntryWithQueue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [delayNotes, setDelayNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const { requestDelay, isSending } = useQueueNotifications();

  useEffect(() => {
    if (!user) return;

    const fetchMyQueueEntries = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("queue_entries")
          .select(`
            *,
            waiting_queues:queue_id (
              name, 
              description,
              average_wait_time
            )
          `)
          .eq("patient_id", user.id)
          .in("status", ["waiting", "in_progress", "delayed"])
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        // Type cast pour s'assurer que le statut correspond au type attendu
        const typedData = (data || []).map(entry => ({
          ...entry,
          status: entry.status as 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'delayed'
        }));
        
        setMyQueueEntries(typedData);
      } catch (err: any) {
        console.error("Erreur lors du chargement des files d'attente:", err);
        toast.error("Impossible de charger vos files d'attente");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyQueueEntries();

    // Configurer les mises à jour en temps réel
    const channel = supabase
      .channel("my-queue-status")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `patient_id=eq.${user.id}`
        },
        (payload) => {
          console.log("Mise à jour de la file d'attente:", payload);
          fetchMyQueueEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleDelayRequest = async () => {
    if (!selectedEntryId) return;
    
    const success = await requestDelay(selectedEntryId, delayNotes);
    
    if (success) {
      setDialogOpen(false);
      setDelayNotes("");
    }
  };

  const getEstimatedTime = (entry: QueueEntryWithQueue) => {
    if (entry.estimated_wait_time) return entry.estimated_wait_time;
    
    // Estimation basée sur la position et le temps moyen
    const averageWaitTime = entry.waiting_queues?.average_wait_time || 15;
    const position = entry.position || 1;
    
    return position * averageWaitTime;
  };

  const getQueueStatusInfo = (entry: QueueEntry) => {
    switch(entry.status) {
      case 'waiting':
        return {
          title: "En attente",
          description: "Vous êtes dans la file d'attente",
          icon: Clock,
          color: "text-blue-500",
          bgColor: "bg-blue-100"
        };
      case 'in_progress':
        return {
          title: "En cours",
          description: "C'est à votre tour !",
          icon: CheckCircle,
          color: "text-green-500",
          bgColor: "bg-green-100"
        };
      case 'delayed':
        return {
          title: "Retardé",
          description: "Vous avez signalé un retard",
          icon: AlertTriangle,
          color: "text-amber-500",
          bgColor: "bg-amber-100"
        };
      default:
        return {
          title: "Inconnu",
          description: "Statut indéterminé",
          icon: Info,
          color: "text-gray-500",
          bgColor: "bg-gray-100"
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement de vos files d'attente...</p>
        </div>
      </div>
    );
  }

  if (!myQueueEntries.length) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mes files d'attente</h2>
          <p className="text-muted-foreground">
            Consultez et gérez vos files d'attente.
          </p>
        </div>

        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Vous n'êtes dans aucune file d'attente</h3>
            <p className="text-muted-foreground mb-6">
              Vous n'avez pas de rendez-vous ou de consultation en attente actuellement.
            </p>
            <Button variant="outline" className="mx-auto">
              Prendre rendez-vous
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mes files d'attente</h2>
        <p className="text-muted-foreground">
          Consultez et gérez vos files d'attente actives.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {myQueueEntries.map((entry) => {
          const statusInfo = getQueueStatusInfo(entry);
          const estimatedMinutes = getEstimatedTime(entry);
          const queueName = entry.waiting_queues?.name || "File d'attente";
          const progress = entry.position && entry.position > 0 
            ? Math.max(0, 100 - (entry.position * 20)) 
            : entry.status === 'in_progress' ? 90 : 0;

          return (
            <Card key={entry.id} className="overflow-hidden">
              <CardHeader className={`${statusInfo.bgColor} border-b`}>
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className={`${statusInfo.color} border-none bg-white bg-opacity-80`}>
                    {statusInfo.title}
                  </Badge>
                  <statusInfo.icon className={`h-5 w-5 ${statusInfo.color}`} />
                </div>
                <CardTitle>{queueName}</CardTitle>
                <CardDescription className="text-black text-opacity-70">
                  {statusInfo.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progression</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground mb-1">Position</p>
                    <p className="text-2xl font-bold">
                      {entry.status === 'in_progress' 
                        ? 'C\'est à vous!' 
                        : entry.position || '-'}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground mb-1">Temps estimé</p>
                    <div className="flex items-center justify-center gap-1">
                      <Clock4 className="h-4 w-4" />
                      <p className="text-2xl font-bold">{estimatedMinutes} min</p>
                    </div>
                  </div>
                </div>

                {entry.status === 'delayed' && entry.delay_notes && (
                  <div className="rounded-lg border p-3 bg-amber-50">
                    <p className="text-xs font-medium mb-1">Note de retard:</p>
                    <p className="text-sm">{entry.delay_notes}</p>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="border-t pt-4">
                {entry.status === 'waiting' && (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => setSelectedEntryId(entry.id)}
                      >
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Je serai en retard
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Signaler un retard</DialogTitle>
                        <DialogDescription>
                          Veuillez indiquer la raison de votre retard et une heure d'arrivée estimée.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-4">
                        <Textarea 
                          placeholder="Expliquez la raison de votre retard..." 
                          className="min-h-[120px]"
                          value={delayNotes}
                          onChange={(e) => setDelayNotes(e.target.value)}
                        />
                      </div>
                      
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setDialogOpen(false)}
                        >
                          Annuler
                        </Button>
                        <Button 
                          onClick={handleDelayRequest}
                          disabled={isSending || !delayNotes.trim()}
                        >
                          {isSending ? "Envoi..." : "Signaler mon retard"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
                
                {entry.status === 'delayed' && (
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={() => {
                      toast.error("Cette fonctionnalité n'est pas encore disponible");
                    }}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Je suis arrivé(e)
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PatientQueuePage;
