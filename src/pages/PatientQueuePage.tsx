
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { QueueEntry } from "@/hooks/useWaitingQueue";
import { useQueueNotifications } from "@/hooks/useQueueNotifications";
import { toast } from "sonner";

type QueueEntryWithWaitingQueue = QueueEntry & {
  waiting_queues?: {
    name: string;
    description: string | null;
    average_wait_time: number;
  };
};

const PatientQueuePage = () => {
  const { user } = useAuth();
  const [userQueueEntries, setUserQueueEntries] = useState<QueueEntryWithWaitingQueue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { requestDelay } = useQueueNotifications();
  const [delayReason, setDelayReason] = useState("");
  const [showDelayForm, setShowDelayForm] = useState<string | false>(false);
  const [processingDelayRequest, setProcessingDelayRequest] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchUserQueueEntries = async () => {
      setIsLoading(true);
      try {
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
          .in("status", ["waiting", "delayed", "in_progress"]);

        if (error) throw error;

        // Process data to match QueueEntry type with waiting_queues
        const processedData: QueueEntryWithWaitingQueue[] = (data || []).map(entry => ({
          ...entry,
          status: entry.status as QueueEntry['status'],
          patient: { 
            first_name: user?.user_metadata?.first_name || null,
            last_name: user?.user_metadata?.last_name || null
          }
        }));

        setUserQueueEntries(processedData);
      } catch (err) {
        console.error("Error fetching user queue entries:", err);
        toast.error("Impossible de récupérer vos files d'attente actuelles");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserQueueEntries();

    // Setup realtime subscription for queue updates
    const channel = supabase
      .channel("queue-updates-for-patient")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queue_entries",
          filter: `patient_id=eq.${user.id}`
        },
        (payload) => {
          fetchUserQueueEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleDelayRequest = async (entryId: string) => {
    setProcessingDelayRequest(true);
    try {
      const success = await requestDelay(entryId, delayReason);
      if (success) {
        toast.success("Demande de délai envoyée");
        setShowDelayForm(false);
      } else {
        toast.error("Erreur lors de la demande de délai");
      }
    } finally {
      setProcessingDelayRequest(false);
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
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Mes files d'attente</h1>
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="text-center">
              <p className="text-muted-foreground">Chargement des données...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Mes files d'attente</h1>
      {userQueueEntries.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <div className="text-center">
              <p className="text-muted-foreground">Vous n'êtes dans aucune file d'attente pour le moment.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {userQueueEntries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <CardTitle>
                  {entry.waiting_queues?.name || "File d'attente inconnue"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Statut: {getStatusBadge(entry.status)}
                    </p>
                    {entry.status === "waiting" && (
                      <p className="text-sm text-muted-foreground">
                        Temps d'attente estimé: {entry.estimated_wait_time || "~15"} minutes
                      </p>
                    )}
                    {entry.status === "delayed" && (
                      <p className="text-sm text-muted-foreground">
                        Vous avez signalé un retard.
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.status === "waiting" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDelayForm(entry.id)}
                        disabled={showDelayForm === entry.id}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Signaler un retard
                      </Button>
                    )}
                    {entry.status === "in_progress" && (
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">En consultation</Badge>
                    )}
                  </div>
                </div>

                {showDelayForm === entry.id && (
                  <div className="mt-4">
                    <textarea
                      className="w-full border rounded-md p-2 text-sm"
                      placeholder="Raison du retard (optionnel)"
                      value={delayReason}
                      onChange={(e) => setDelayReason(e.target.value)}
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setShowDelayForm(false)}
                        disabled={processingDelayRequest}
                      >
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        className="ml-2"
                        onClick={() => handleDelayRequest(entry.id)}
                        disabled={processingDelayRequest}
                      >
                        {processingDelayRequest ? "Envoi..." : "Envoyer"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientQueuePage;
