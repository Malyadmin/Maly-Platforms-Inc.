import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";

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
  variant?: 'horizontal' | 'grid';
}

export function UserCard({ user, onClick, className = "", variant = 'horizontal' }: UserCardProps) {
  const displayName = user.fullName || user.username;
  const initials = displayName
    ?.split(' ')
    .map((word: string) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  // Handle multiple profile images
  const images = user.profileImages && user.profileImages.length > 0 
    ? user.profileImages 
    : user.profileImage 
      ? [user.profileImage] 
      : [];
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasMultipleImages = images.length > 1;

  const handlePreviousImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const currentImage = images[currentImageIndex];

  if (variant === 'grid') {
    return (
      <div 
        className={`relative w-full h-full cursor-pointer transition-transform hover:scale-105 ${className}`}
        onClick={onClick}
        data-testid={`user-card-${user.id}`}
      >
        {/* Square Profile Image */}
        <div className="relative w-full h-full">
          {currentImage ? (
            <img 
              src={currentImage} 
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-purple-900/80 via-blue-900/80 to-black/90 flex items-center justify-center">
              <div className="text-4xl font-bold text-white/40">
                {initials}
              </div>
            </div>
          )}
          
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          {/* User Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <h3 className="text-white font-semibold text-sm leading-tight truncate">
              {displayName}
            </h3>
            {user.location && (
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="h-2.5 w-2.5 text-gray-300" />
                <span className="text-gray-300 text-xs truncate">
                  {user.location}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default horizontal layout
  return (
    <div 
      className={`flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-white/5 transition-colors cursor-pointer ${className}`}
      onClick={onClick}
      data-testid={`user-card-${user.id}`}
    >
      {/* Profile Image with Navigation */}
      <div className="relative">
        <Avatar className="h-12 w-12 border-2 border-white/10">
          <AvatarImage 
            src={currentImage || undefined} 
            alt={displayName}
          />
          <AvatarFallback className="bg-gray-700 text-white text-sm font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Navigation arrows - only show if multiple images */}
        {hasMultipleImages && (
          <>
            <button
              onClick={handlePreviousImage}
              className="absolute -left-2 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors"
              data-testid={`prev-image-${user.id}`}
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute -right-2 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full w-6 h-6 flex items-center justify-center transition-colors"
              data-testid={`next-image-${user.id}`}
            >
              <ChevronRight className="w-3 h-3" />
            </button>
            
            {/* Image indicator dots */}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

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