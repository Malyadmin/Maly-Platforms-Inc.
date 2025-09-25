import { useState } from "react";
import { MapPin, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface LargeProfileViewProps {
  user: User;
  onConnect?: () => void;
  onClick?: () => void;
  className?: string;
}

export function LargeProfileView({ user, onConnect, onClick, className = "" }: LargeProfileViewProps) {
  const displayName = user.fullName || user.username;
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  
  // Handle multiple profile images
  const images = user.profileImages && user.profileImages.length > 0 
    ? user.profileImages 
    : user.profileImage 
      ? [user.profileImage] 
      : [];
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasMultipleImages = images.length > 1;
  const currentImage = images[currentImageIndex];

  const handlePreviousImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleConnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onConnect?.();
  };

  const toggleMoreInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMoreInfo(!showMoreInfo);
  };

  const formatInterests = (interests: string[] | null) => {
    if (!interests || interests.length === 0) return "No interests listed";
    return interests.join(", ");
  };

  const formatMoods = (moods: string[] | string | null) => {
    if (!moods) return "No moods listed";
    if (typeof moods === "string") return moods;
    if (Array.isArray(moods)) return moods.join(", ");
    return "No moods listed";
  };

  return (
    <div 
      className={`relative bg-gray-900 overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      data-testid={`large-profile-view-${user.id}`}
      style={{ height: 'calc(50vh - 2rem)' }}
    >
      {/* Main Image */}
      <div className="relative w-full h-full">
        {currentImage ? (
          <img 
            src={currentImage} 
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
            <div className="text-6xl font-bold text-gray-400">
              {displayName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </div>
        )}

        {/* Image Navigation */}
        {hasMultipleImages && (
          <>
            <button
              onClick={handlePreviousImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              data-testid={`large-prev-image-${user.id}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              data-testid={`large-next-image-${user.id}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            {/* Image indicator dots */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Profile Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{displayName}</h2>
              {user.age && (
                <p className="text-lg text-white/90 mb-2">{user.age} years old</p>
              )}
              {user.location && (
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-white/80" />
                  <span className="text-white/90">{user.location}</span>
                </div>
              )}
              {user.profession && (
                <p className="text-white/80 mb-3">{user.profession}</p>
              )}
            </div>

            {/* Connect Button */}
            <Button
              onClick={handleConnect}
              className="bg-white text-black hover:bg-gray-200 font-semibold px-6 py-2 rounded-full"
              data-testid={`connect-button-${user.id}`}
            >
              <Heart className="w-4 h-4 mr-2" />
              Connect
            </Button>
          </div>

          {/* More Info Toggle */}
          <button
            onClick={toggleMoreInfo}
            className="flex items-center gap-2 mt-4 text-white/80 hover:text-white transition-colors"
            data-testid={`more-info-toggle-${user.id}`}
          >
            <span>More info</span>
            {showMoreInfo ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable More Info Section */}
      {showMoreInfo && (
        <div 
          className="absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-sm p-6 transform transition-transform duration-300 ease-out"
          style={{ transform: 'translateY(0)' }}
          data-testid={`more-info-section-${user.id}`}
        >
          <div className="space-y-4 text-white">
            {user.bio && (
              <div>
                <h4 className="font-semibold mb-2">About</h4>
                <p className="text-white/90 text-sm leading-relaxed">{user.bio}</p>
              </div>
            )}
            
            {user.interests && user.interests.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Interests</h4>
                <p className="text-white/90 text-sm">{formatInterests(user.interests)}</p>
              </div>
            )}

            {user.currentMoods && (
              <div>
                <h4 className="font-semibold mb-2">Current Vibes</h4>
                <p className="text-white/90 text-sm">{formatMoods(user.currentMoods)}</p>
              </div>
            )}

            {(user.birthLocation || user.nextLocation) && (
              <div className="grid grid-cols-1 gap-3">
                {user.birthLocation && (
                  <div>
                    <h4 className="font-semibold mb-1">From</h4>
                    <p className="text-white/90 text-sm">{user.birthLocation}</p>
                  </div>
                )}
                {user.nextLocation && (
                  <div>
                    <h4 className="font-semibold mb-1">Next destination</h4>
                    <p className="text-white/90 text-sm">{user.nextLocation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}