import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/use-user';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { BottomNav } from '@/components/ui/bottom-nav';
import { HamburgerMenu } from '@/components/ui/hamburger-menu';
import { IOSEventCard } from '@/components/ui/ios-event-card';
import { Eye, Users } from 'lucide-react';

interface ParticipantUser {
  id: number;
  username: string;
  fullName: string;
  profileImage: string | null;
  email: string;
}

interface DashboardEvent {
  id: number;
  title: string;
  image?: string;
  date: string;
  location: string;
  price: string;
  ticketType: string;
  interestedUsers: ParticipantUser[];
  attendingUsers: ParticipantUser[];
  interestedCount: number;
  attendingCount: number;
  totalViews: number;
}

export default function CreatorDashboardPage() {
  const { user } = useUser();
  const [activeFilter, setActiveFilter] = useState<'events' | 'analytics'>('events');

  // Fetch dashboard data
  const { data, isLoading, error } = useQuery<{
    events: DashboardEvent[];
    totalEvents: number;
  }>({
    queryKey: ['/api/creator/dashboard'],
    enabled: !!user?.id,
  });

  // Render user list for analytics
  const renderUserList = (users: ParticipantUser[] | undefined, title: string) => {
    if (!users || users.length === 0) return null;
    
    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-400 mb-2 px-2">{title} ({users.length})</h4>
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-2 bg-gray-900/30 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.profileImage || undefined} />
                <AvatarFallback>{user.fullName?.charAt(0) || user.username?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{user.fullName || user.username || 'User'}</p>
                <p className="text-gray-400 text-xs">{user.email || 'No email'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!user) {
    return <div className="h-screen bg-black text-white flex items-center justify-center">Please log in</div>;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-black text-white">
      {/* Header - Fixed at top */}
      <header className="bg-black text-white shrink-0 z-50">
        {/* Top bar with MÁLY logo and hamburger menu */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto"
          />
          <HamburgerMenu />
        </div>
        
        {/* Dashboard title with gradient */}
        <div className="px-5 pb-3">
          <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>
            Creator Dashboard
          </h2>
        </div>

        {/* Filter Bar */}
        <div className="bg-black border-b border-gray-800">
          <div className="px-5 py-3 flex items-center gap-8">
            <button
              onClick={() => setActiveFilter('events')}
              className={`text-sm transition-colors whitespace-nowrap ${
                activeFilter === 'events' 
                  ? 'text-purple-400 font-medium' 
                  : 'text-white hover:text-purple-400'
              }`}
              data-testid="filter-events"
            >
              My Events
            </button>
            <button
              onClick={() => setActiveFilter('analytics')}
              className={`text-sm transition-colors whitespace-nowrap ${
                activeFilter === 'analytics' 
                  ? 'text-purple-400 font-medium' 
                  : 'text-white hover:text-purple-400'
              }`}
              data-testid="filter-analytics"
            >
              Analytics
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4 p-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full bg-gray-700 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4">
            <p className="text-red-400">Failed to load dashboard data</p>
            <p className="text-gray-400 text-sm mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        ) : (
          <div className="pb-20 px-4">
            {/* My Events Section */}
            {activeFilter === 'events' && (
              <div>
                {!data?.events || data.events.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-400 text-sm">No events created yet</p>
                  </div>
                ) : (
                  <div className="space-y-4 mt-4">
                    {data.events.map((event) => (
                      <IOSEventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Section */}
            {activeFilter === 'analytics' && (
              <div>
                {!data?.events || data.events.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-400 text-sm">No analytics available</p>
                  </div>
                ) : (
                  <div className="space-y-6 mt-4">
                    {data.events.map((event) => (
                      <div key={event.id} className="bg-gray-900/30 rounded-lg p-4">
                        {/* Event Card */}
                        <IOSEventCard event={event} />
                        
                        {/* Views Count */}
                        <div className="mt-4 flex items-center gap-2 px-2">
                          <Eye className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-400">Views:</span>
                          <span className="text-white font-medium">{event.totalViews}</span>
                        </div>

                        {/* Interested Users List */}
                        {renderUserList(event.interestedUsers || [], 'Interested')}

                        {/* Attending Users List */}
                        {renderUserList(event.attendingUsers || [], 'Attending')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
