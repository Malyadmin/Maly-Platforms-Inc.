import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, UserCheck, UserPlus, Users, Clock, ArrowLeft } from "lucide-react";
import { useTranslation } from "@/lib/translations";

interface ConnectionUser {
  id: number;
  username: string;
  fullName: string | null;
  profileImage: string | null;
  requestDate?: string;
  connectionDate?: string;
  connectionType?: string;
  status?: string;
}

export default function ConnectionsPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("connections");

  // Fetch connections (users who are connected with the current user)
  const {
    data: connections,
    isLoading: connectionsLoading,
    error: connectionsError
  } = useQuery<ConnectionUser[]>({
    queryKey: ["connections"],
    queryFn: async () => {
      const response = await fetch("/api/connections");
      if (!response.ok) throw new Error("Failed to fetch connections");
      return response.json();
    },
    enabled: !!currentUser,
  });

  // Fetch pending connection requests
  const {
    data: pendingRequests,
    isLoading: pendingRequestsLoading,
    error: pendingRequestsError
  } = useQuery<ConnectionUser[]>({
    queryKey: ["pending-connections"],
    queryFn: async () => {
      const response = await fetch("/api/connections/pending");
      if (!response.ok) throw new Error("Failed to fetch pending connection requests");
      return response.json();
    },
    enabled: !!currentUser,
  });

  // Respond to connection request mutation
  const respondToConnectionMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: number, status: "accepted" | "declined" }) => {
      const response = await fetch(`/api/connections/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${status} connection request`);
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.status === "accepted" ? "Connection accepted" : "Connection declined",
        description: variables.status === "accepted" 
          ? "You are now connected with this user." 
          : "You have declined this connection request.",
      });
      
      // Refresh both connections and pending requests
      queryClient.invalidateQueries({ queryKey: ["pending-connections"] });
      queryClient.invalidateQueries({ queryKey: ["connections"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // If not logged in, redirect to login
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[380px]">
          <CardContent className="pt-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold mb-2">Login Required</h2>
              <p className="text-muted-foreground mb-4">
                Please login to view your connections
              </p>
              <Button
                onClick={() => setLocation("/login")}
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-6">
          <BackButton fallbackPath="/discover" />
          <h1 className="text-2xl font-bold">{t('yourNetwork')}</h1>
        </div>
        
        <Tabs defaultValue="connections" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="connections" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span>{t('connections')}</span>
              {connections && connections.length > 0 && (
                <span className="ml-1 bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                  {connections.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>{t('incomingRequests')}</span>
              {pendingRequests && pendingRequests.length > 0 && (
                <span className="ml-1 bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="connections" className="space-y-6">
            {connectionsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(3).fill(0).map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : connectionsError ? (
              <div className="text-center text-destructive py-10">
                Error loading connections
              </div>
            ) : connections && connections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connections.map((connection) => (
                  <Card key={connection.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={connection.profileImage || undefined} alt={connection.username} />
                          <AvatarFallback>{connection.fullName?.[0] || connection.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-medium">{connection.fullName || connection.username}</h3>
                          <p className="text-sm text-muted-foreground">
                            {connection.connectionType === "following" ? "You follow" : "Follows you"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                // Create or find conversation between current user and connection
                                const response = await fetch('/api/conversations', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ otherUserId: connection.id }),
                                  credentials: 'include'
                                });
                                
                                if (response.ok) {
                                  const conversation = await response.json();
                                  setLocation(`/chat/conversation/${conversation.id}`);
                                } else {
                                  console.error('Failed to create conversation');
                                  // Fallback to legacy route if conversation creation fails
                                  setLocation(`/chat/${connection.id}`);
                                }
                              } catch (error) {
                                console.error('Error creating conversation:', error);
                                // Fallback to legacy route if there's an error
                                setLocation(`/chat/${connection.id}`);
                              }
                            }}
                          >
                            Message
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/profile/${connection.username}`)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="text-xl font-medium">No Connections Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Connect with other users to build your professional network. Visit the Connect page to discover potential connections.
                </p>
                <Button
                  onClick={() => setLocation("/connect")}
                  className="mt-4"
                >
                  Browse Users
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="requests" className="space-y-6">
            {pendingRequestsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(3).fill(0).map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pendingRequestsError ? (
              <div className="text-center text-destructive py-10">
                Error loading connection requests
              </div>
            ) : pendingRequests && pendingRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingRequests.map((request) => (
                  <Card key={request.id} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={request.profileImage || undefined} alt={request.username} />
                          <AvatarFallback>{request.fullName?.[0] || request.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-medium">{request.fullName || request.username}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(request.requestDate || "").toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          className="flex-1 gap-1"
                          onClick={() => respondToConnectionMutation.mutate({ 
                            userId: request.id, 
                            status: "accepted" 
                          })}
                          disabled={respondToConnectionMutation.isPending}
                        >
                          <Check className="h-4 w-4" />
                          Accept
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1 gap-1"
                          onClick={() => respondToConnectionMutation.mutate({ 
                            userId: request.id, 
                            status: "declined" 
                          })}
                          disabled={respondToConnectionMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <h3 className="text-xl font-medium">No Pending Requests</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  You don't have any pending connection requests at the moment.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}