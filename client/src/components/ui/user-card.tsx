import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin } from "lucide-react";

// User interface matching the one used in ConnectPage
interface User {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  profileType?: string;
  gender?: string | null;
  sexualOrientation?: string | null;
  bio?: string | null;
  profileImage?: string | null;
  profileImages?: string[];
  location?: string | null;
  birthLocation?: string | null;
  nextLocation?: string | null;
  interests?: string[] | null;
  currentMoods?: string[] | string | null;
  profession?: string | null;
  age?: number | null;
  createdAt?: Date | string | null;
  tags?: string[];
}

interface UserCardProps {
  user: User;
  onClick?: () => void;
  className?: string;
}

export function UserCard({ user, onClick, className = "" }: UserCardProps) {
  const displayName = user.fullName || user.username;
  const initials = displayName
    ?.split(' ')
    .map((word: string) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  return (
    <div 
      className={`flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-white/5 transition-colors cursor-pointer ${className}`}
      onClick={onClick}
      data-testid={`user-card-${user.id}`}
    >
      {/* Profile Image */}
      <Avatar className="h-12 w-12 border-2 border-white/10">
        <AvatarImage 
          src={user.profileImage || undefined} 
          alt={displayName}
        />
        <AvatarFallback className="bg-gray-700 text-white text-sm font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold text-base leading-tight">
          {displayName}
        </h3>
        {user.location && (
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3 text-gray-400" />
            <span className="text-gray-300 text-sm truncate">
              {user.location}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}