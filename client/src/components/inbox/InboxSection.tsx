import { Conversation } from '@/types/inbox';
import { ConversationListItem } from './ConversationListItem';
import { Separator } from '@/components/ui/separator';

interface InboxSectionProps {
  title: string;
  conversations: Conversation[];
  showSeparator?: boolean;
}

export function InboxSection({ title, conversations, showSeparator = true }: InboxSectionProps) {
  if (conversations.length === 0) {
    return null; // Don't render empty sections
  }

  return (
    <div className="mb-6" data-testid={`inbox-section-${title.toLowerCase().replace(' ', '-')}`}>
      <div className="flex items-center justify-between mb-3 px-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        <span className="text-sm text-muted-foreground">
          {conversations.length}
        </span>
      </div>
      
      <div className="space-y-1">
        {conversations.map((conversation, index) => (
          <div key={conversation.id}>
            <ConversationListItem conversation={conversation} />
            {index < conversations.length - 1 && showSeparator && (
              <Separator className="mx-3" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}