
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, Users, UserCheck, AlertTriangle, Bell } from "lucide-react";
import { useWaitingQueue, QueueEntry, WaitingQueue } from "@/hooks/useWaitingQueue";
import { useQueueNotifications } from "@/hooks/useQueueNotifications";
import { toast } from "sonner";
import { PatientArrivalForm } from "./PatientArrivalForm";

type WaitingQueueDisplayProps = {
  centerId: string;
  showPatientRegistration?: boolean;
  defaultQueueId?: string;
  className?: string;
};

export function WaitingQueueDisplay({
  centerId,
  showPatientRegistration = false,
  defaultQueueId,
  className = "",
}: WaitingQueueDisplayProps) {
  const [queueDialogOpen, setQueueDialogOpen] = useState(false);
  const { queues, entries, isLoading, activeQueueId, setActiveQueueId, updateEntryStatus } = useWaitingQueue(centerId);
  const { sendQueueNotification, isSending } = useQueueNotifications();
  const [waitingCount, setWaitingCount] = useState(0);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    // Si un ID de file par défaut est fourni, l'utiliser
    if (defaultQueueId) {
      setActiveQueueId(defaultQueueId);
    }
  }, [defaultQueueId]);

  useEffect(() => {
    if (entries) {
      setWaitingCount(entries.filter((e) => e.status === "waiting").length);
      setInProgressCount(entries.filter((e) => e.status === "in_progress").length);
      
      // Pour les statistiques, récupérer aussi les entrées complétées d'aujourd'hui
      const fetchCompletedToday = async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data, error } = await fetch("/api/queue-stats", {
          method: "POST",
          body: JSON.stringify({
            center_id: centerId,
            date: today.toISOString(),
          }),
        }).then(res => res.json());
        
        if (!error && data) {
          setCompletedCount(data.completed || 0);
        }
      };
      
      // Simulation de l'appel API (à implémenter plus tard)
      setCompletedCount(Math.floor(Math.random() * 10) + waitingCount);
    }
  }, [entries, centerId]);

  const getActiveQueue = () => {
    return queues.find((q) => q.id === activeQueueId);
  };

  const handleTabChange = (queue: WaitingQueue) => {
    setActiveQueueId(queue.id);
  };

  const handleNotifyPatient = async (entry: QueueEntry) => {
    const success = await sendQueueNotification(entry.id, "now", entry.appointment_id || undefined);
    if (success) {
      toast.success(`Notification envoyée à ${entry.patient?.first_name} ${entry.patient?.last_name}`);
    }
  };

  const handleStatusChange = async (entry: QueueEntry, newStatus: "in_progress" | "completed" | "no_show") => {
    const success = await updateEntryStatus(entry.id, newStatus);
    if (success) {
      if (newStatus === "in_progress") {
        toast.success(`${entry.patient?.first_name} ${entry.patient?.last_name} est maintenant en consultation`);
      } else if (newStatus === "completed") {
        toast.success(`Consultation avec ${entry.patient?.first_name} ${entry.patient?.last_name} terminée`);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "waiting":
        return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">En attente</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">En cours</Badge>;
      case "delayed":
        return <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">Retardé</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-700">Inconnu</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Salle d'attente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">Chargement des données...</div>
        </CardContent>
      </Card>
    );
  }

  if (!queues.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Salle d'attente</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>Aucune file d'attente trouvée</AlertTitle>
            <AlertDescription>
              Ce centre n'a pas encore configuré de files d'attente.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center">
          <CardTitle>Salle d'attente</CardTitle>
          {showPatientRegistration && (
            <Dialog open={queueDialogOpen} onOpenChange={setQueueDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Enregistrer un patient</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Enregistrer l'arrivée d'un patient</DialogTitle>
                </DialogHeader>
                <PatientArrivalForm 
                  centerId={centerId} 
                  onPatientRegistered={() => setQueueDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Afficher les statistiques de la journée */}
        <div className="grid grid-cols-3 gap-2 my-4">
          <div className="flex flex-col items-center justify-center rounded-md border p-2">
            <Users className="h-5 w-5 text-blue-500 mb-1" />
            <span className="text-xl font-bold">{waitingCount}</span>
            <span className="text-xs text-muted-foreground">En attente</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-md border p-2">
            <Clock className="h-5 w-5 text-green-500 mb-1" />
            <span className="text-xl font-bold">{inProgressCount}</span>
            <span className="text-xs text-muted-foreground">En consultation</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-md border p-2">
            <UserCheck className="h-5 w-5 text-purple-500 mb-1" />
            <span className="text-xl font-bold">{completedCount}</span>
            <span className="text-xs text-muted-foreground">Terminés</span>
          </div>
        </div>

        {/* Onglets pour les différentes files d'attente */}
        {queues.length > 1 && (
          <Tabs value={activeQueueId} className="mt-2">
            <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${queues.length}, 1fr)` }}>
              {queues.map((queue) => (
                <TabsTrigger
                  key={queue.id}
                  value={queue.id}
                  onClick={() => handleTabChange(queue)}
                >
                  {queue.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p>Aucun patient en attente pour {getActiveQueue()?.name || 'cette file'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between border p-3 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    {entry.position || "-"}
                  </div>
                  <div>
                    <p className="font-medium">
                      {entry.patient?.first_name} {entry.patient?.last_name}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3 w-3" />
                      <span>{entry.estimated_wait_time || "~15"} min</span>
                      {getStatusBadge(entry.status)}
                      {entry.delay_request_at && (
                        <span className="inline-flex items-center">
                          <AlertTriangle className="h-3 w-3 text-amber-500 mr-1" />
                          <span className="text-xs">A signalé un retard</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {entry.status === 'waiting' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => handleNotifyPatient(entry)}
                        disabled={isSending || entry.notified_at !== null}
                      >
                        <Bell className="h-3 w-3" />
                        {entry.notified_at ? "Notifié" : "Notifier"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(entry, "in_progress")}
                      >
                        Débuter
                      </Button>
                    </>
                  )}

                  {entry.status === 'in_progress' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(entry, "completed")}
                    >
                      Terminer
                    </Button>
                  )}

                  {entry.status === 'delayed' && (
                    <Button
                      size="sm"
                      onClick={() => updateEntryStatus(entry.id, "waiting")}
                    >
                      Remettre en file
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
