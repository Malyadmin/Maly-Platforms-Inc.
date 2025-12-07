import { Link } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { MessageSquare, Users } from 'lucide-react';
import { Conversation, getConversationDisplayName, getConversationDisplayImage, getConversationDisplayInitials } from '@/types/inbox';
import { useUser } from '@/hooks/use-user';

interface ConversationListItemProps {
  conversation: Conversation;
}

export function ConversationListItem({ conversation }: ConversationListItemProps) {
  const { user } = useUser();
  
  const formatMessageDate = (dateString: Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return format(date, 'h:mm a'); // Today: show time only
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return format(date, 'EEEE'); // Show day of week
    } else {
      return format(date, 'MMM d'); // Show month and day
    }
  };

  const displayName = getConversationDisplayName(conversation);
  const displayImage = getConversationDisplayImage(conversation);
  const displayInitials = getConversationDisplayInitials(conversation);
  
  const isGroupChat = conversation.type === 'group' || conversation.type === 'event';
  const lastMessageText = conversation.lastMessage?.content || 'No messages yet';
  const hasUnreadMessages = (conversation.unreadCount || 0) > 0;

  return (
    <Link 
      href={`/chat/conversation/${conversation.id}`}
      data-testid={`conversation-item-${conversation.id}`}
    >
      <div className="flex items-start p-3 hover:bg-muted rounded-md cursor-pointer transition-colors">
        <div className="relative">
          <Avatar className="h-12 w-12 mr-4 flex-shrink-0" data-testid={`avatar-conversation-${conversation.id}`}>
            <AvatarImage src={displayImage || undefined} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {displayInitials}
            </AvatarFallback>
          </Avatar>
          
          {/* Group chat indicator */}
          {isGroupChat && (
            <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
              <Users className="h-3 w-3 text-foreground" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium truncate text-foreground" data-testid={`name-conversation-${conversation.id}`}>
              {displayName}
              {isGroupChat && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({conversation.participantCount} members)
                </span>
              )}
            </h4>
            <div className="flex items-center gap-2 whitespace-nowrap ml-2">
              {conversation.lastMessage && (
                <span className="text-xs text-muted-foreground" data-testid={`time-conversation-${conversation.id}`}>
                  {formatMessageDate(conversation.lastMessage.createdAt)}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center flex-1 min-w-0">
              {/* Message preview */}
              <p className="text-sm text-muted-foreground truncate max-w-[220px] sm:max-w-[300px] md:max-w-[400px]" data-testid={`message-preview-${conversation.id}`}>
                {conversation.lastMessage && user?.id === conversation.lastMessage.sender_id && (
                  <span className="text-xs text-muted-foreground mr-1">You:</span>
                )}
                {lastMessageText}
              </p>
            </div>
            
            {/* Unread badge */}
            {hasUnreadMessages && (
              <Badge 
                className="ml-2 bg-primary text-primary-foreground" 
                variant="default"
                data-testid={`unread-badge-${conversation.id}`}
              >
                {conversation.unreadCount}
              </Badge>
            )}
            
            {/* No messages indicator */}
            {!conversation.lastMessage && (
              <div className="ml-2 flex items-center text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}