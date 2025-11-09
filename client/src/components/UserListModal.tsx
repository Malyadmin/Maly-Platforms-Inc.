import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, Eye } from 'lucide-react';

interface Participant {
  userId: number;
  fullName: string;
  username: string;
  profileImage: string | null;
  status: string;
}

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
  type: 'attending' | 'interested' | 'views';
  count: number;
}

export function UserListModal({ isOpen, onClose, eventId, type, count }: UserListModalProps) {
  const { data, isLoading } = useQuery<{ participants: Participant[] }>({
    queryKey: [`/api/events/${eventId}/participants/${type}`],
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/participants/${type}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch participants');
      }
      
      return response.json();
    },
    enabled: isOpen && type !== 'views',
  });

  const getTitle = () => {
    switch (type) {
      case 'attending':
        return `Attending (${count})`;
      case 'interested':
        return `Interested (${count})`;
      case 'views':
        return `Views (${count})`;
      default:
        return 'Users';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'attending':
        return <UserCheck className="h-5 w-5 text-green-400" />;
      case 'interested':
        return <Users className="h-5 w-5 text-purple-400" />;
      case 'views':
        return <Eye className="h-5 w-5 text-blue-400" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {type === 'views' ? (
            <div className="text-center py-8 text-gray-400">
              <Eye className="h-12 w-12 mx-auto mb-3 text-blue-400/50" />
              <p>View tracking shows total event page views.</p>
              <p className="text-sm mt-2">Individual viewer details are not stored for privacy.</p>
            </div>
          ) : isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full bg-gray-700" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2 bg-gray-700" />
                  <Skeleton className="h-3 w-24 bg-gray-700" />
                </div>
              </div>
            ))
          ) : data?.participants && data.participants.length > 0 ? (
            data.participants.map((participant) => (
              <div
                key={participant.userId}
                className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
                data-testid={`participant-${participant.userId}`}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={participant.profileImage || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    {participant.fullName?.charAt(0)?.toUpperCase() || participant.username?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{participant.fullName || participant.username}</p>
                  <p className="text-gray-400 text-xs">@{participant.username}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-600" />
              <p>No {type} users yet</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
