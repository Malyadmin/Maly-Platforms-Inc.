import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Loader2, X, Check, ChevronRight, ChevronLeft } from "lucide-react";
import { VIBE_AND_MOOD_TAGS } from "@/lib/constants";
import { BottomNav } from "@/components/ui/bottom-nav";
import { HamburgerMenu } from "@/components/ui/hamburger-menu";

const moodStyles = {
  "Party & Nightlife": "bg-purple-500/20 text-purple-500 hover:bg-purple-500/30 border-purple-500/30",
  "Fashion & Style": "bg-pink-500/20 text-pink-500 hover:bg-pink-500/30 border-pink-500/30",
  "Networking & Business": "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 border-blue-500/30",
  "Dining & Drinks": "bg-green-500/20 text-green-500 hover:bg-green-500/30 border-green-500/30",
  "Outdoor & Nature": "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border-emerald-500/30",
  "Wellness & Fitness": "bg-teal-500/20 text-teal-500 hover:bg-teal-500/30 border-teal-500/30",
  "Creative & Artsy": "bg-violet-500/20 text-violet-500 hover:bg-violet-500/30 border-violet-500/30",
  "Single & Social": "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 border-rose-500/30",
  "Chill & Recharge": "bg-cyan-500/20 text-cyan-500 hover:bg-cyan-500/30 border-cyan-500/30",
  "Adventure & Exploring": "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 border-orange-500/30",
  "Spiritual & Intentional": "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border-amber-500/30",
} as const;

interface ProfileData {
  fullName: string;
  location: string;
  profession: string;
  bio: string;
  currentMoods: string[];
  birthLocation: string;
  livedLocation: string;
  nextLocation: string;
  age: number | null;
  profileImage: string | null;
  profileImages?: string[];
}

export default function EditProfilePage() {
  const [, setLocation] = useLocation();
  const { user, updateProfile, refreshUser } = useUser();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: "",
    location: "",
    profession: "",
    bio: "",
    currentMoods: [],
    birthLocation: "",
    livedLocation: "",
    nextLocation: "",
    age: null,
    profileImage: null,
  });
  
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<any>("");
  const [tempMoods, setTempMoods] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [hasNewImages, setHasNewImages] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || "",
        location: user.location || "",
        profession: user.profession || "",
        bio: user.bio || "",
        currentMoods: user.currentMoods || [],
        birthLocation: user.birthLocation || "",
        livedLocation: user.livedLocation || "",
        nextLocation: user.nextLocation || "",
        age: user.age,
        profileImage: user.profileImage || null,
        profileImages: user.profileImages || [],
      });
      
      const images = user.profileImages && user.profileImages.length > 0 
        ? user.profileImages 
        : user.profileImage 
        ? [user.profileImage] 
        : [];
      
      setImagePreviews(images);
      setCurrentImageIndex(0);
      setHasNewImages(false);
    }
  }, [user]);

  const handleEditClick = (field: string, currentValue: any) => {
    setEditingField(field);
    if (field === "currentMoods") {
      setTempMoods(currentValue || []);
    } else {
      setTempValue(currentValue || "");
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setTempValue("");
    setTempMoods([]);
  };

  const handleSaveField = async (field: string) => {
    const updatedValue = field === "currentMoods" ? tempMoods : tempValue;
    const updatedData = {
      ...profileData,
      [field]: updatedValue,
    };
    
    setProfileData(updatedData);
    setIsSaving(true);
    
    try {
      localStorage.removeItem('maly_user_data');
      localStorage.removeItem('maly_user_verified_at');
      
      await updateProfile(updatedData);

      toast({
        title: "Profile Updated",
        description: `Your ${field} has been successfully updated.`,
      });

      await refreshUser();
      setEditingField(null);
      setTempValue("");
      setTempMoods([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsSaving(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('images', file);
      });
      
      const response = await fetch('/api/upload-profile-images', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload images');
      }
      
      const data = await response.json();
      
      if (data.success && data.profileImages) {
        setImagePreviews(prev => [...prev, ...data.profileImages]);
        setCurrentImageIndex(imagePreviews.length);
        setHasNewImages(true);
        
        toast({
          title: "Images Uploaded",
          description: `${data.profileImages.length} image(s) uploaded successfully.`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleRemoveImage = (indexToRemove: number) => {
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    
    if (currentImageIndex >= imagePreviews.length - 1) {
      setCurrentImageIndex(Math.max(0, imagePreviews.length - 2));
    }
    
    if (imagePreviews.length <= 1) {
      setHasNewImages(false);
    }
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : imagePreviews.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < imagePreviews.length - 1 ? prev + 1 : 0));
  };

  const handleSaveImages = async () => {
    setIsSaving(true);
    try {
      const updatedData = {
        ...profileData,
        profileImage: imagePreviews[0] ?? null,
        profileImages: imagePreviews.slice(),
      };
      
      localStorage.removeItem('maly_user_data');
      localStorage.removeItem('maly_user_verified_at');
      
      await updateProfile(updatedData);

      toast({
        title: "Profile Images Updated",
        description: `${imagePreviews.length} image(s) saved successfully.`,
      });

      await refreshUser();
      setProfileData(updatedData);
      setHasNewImages(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      await refreshUser();
      setLocation(`/profile/${user?.username}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMood = (mood: string) => {
    setTempMoods(prev =>
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    );
  };

  const renderEditableField = (
    label: string,
    field: keyof ProfileData,
    multiline: boolean = false
  ) => {
    const value = profileData[field];
    const isEditing = editingField === field;

    return (
      <div>
        <div className="flex items-center justify-between">
          <p className="text-foreground/60 text-sm">{label}</p>
          {!isEditing && (
            <button
              onClick={() => handleEditClick(field, value)}
              className="text-purple-400 hover:text-purple-300 transition-colors"
              data-testid={`button-edit-${field}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div className="mt-2 space-y-2">
            {multiline ? (
              <Textarea
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="bg-gray-900/50 border-purple-500/30 text-foreground min-h-[100px]"
                autoFocus
                data-testid={`input-${field}`}
              />
            ) : (
              <Input
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                className="bg-gray-900/50 border-purple-500/30 text-foreground"
                autoFocus
                data-testid={`input-${field}`}
              />
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleSaveField(field)}
                className="bg-green-600 hover:bg-green-700"
                data-testid={`button-save-${field}`}
              >
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                className="border-gray-600"
                data-testid={`button-cancel-${field}`}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-foreground text-base mt-1">
            {value || <span className="text-gray-500">Not set</span>}
          </p>
        )}
      </div>
    );
  };

  const renderVibeField = () => {
    const isEditing = editingField === "currentMoods";

    return (
      <div>
        <div className="flex items-center justify-between">
          <p className="text-foreground/60 text-sm">Vibe</p>
          {!isEditing && (
            <button
              onClick={() => handleEditClick("currentMoods", profileData.currentMoods)}
              className="text-purple-400 hover:text-purple-300 transition-colors"
              data-testid="button-edit-currentMoods"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {VIBE_AND_MOOD_TAGS.map((mood) => (
                <button
                  key={mood}
                  onClick={() => toggleMood(mood)}
                  className={`py-2 px-3 rounded-lg text-sm transition-all border ${
                    tempMoods.includes(mood)
                      ? "bg-transparent border-white/50 text-foreground hover:border-white/70"
                      : "bg-transparent text-muted-foreground border-gray-500/40 hover:bg-white/10"
                  }`}
                  data-testid={`vibe-option-${mood}`}
                >
                  {mood}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleSaveField("currentMoods")}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-save-currentMoods"
              >
                <Check className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                className="border-gray-600"
                data-testid="button-cancel-currentMoods"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-foreground text-base mt-1">
            {profileData.currentMoods.length > 0 ? (
              <span>{profileData.currentMoods.join(", ")}</span>
            ) : (
              <span className="text-gray-500">No vibes selected</span>
            )}
          </p>
        )}
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="bg-background text-foreground shrink-0 z-50">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto"
          />
          <HamburgerMenu />
        </div>
        
        <div className="px-5 pb-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation(`/profile/${user?.username}`)}
              className="text-foreground/80 hover:text-foreground transition-colors text-sm"
              data-testid="button-back-to-profile"
            >
              Back
            </button>
            <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>
              Edit Profile
            </h2>
          </div>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-24" style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
        {/* Profile Image Section */}
        <div className="relative w-full h-[50vh] mb-6">
          {imagePreviews.length > 0 ? (
            <div className="absolute inset-0">
              <img 
                src={imagePreviews[currentImageIndex]}
                alt="Profile"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/80 via-blue-900/80 to-black/90 flex items-center justify-center">
              <div className="text-9xl font-bold text-foreground/20">
                {user.username[0].toUpperCase()}
              </div>
            </div>
          )}
          
          {/* Remove image button */}
          {imagePreviews.length > 0 && (
            <button
              onClick={() => handleRemoveImage(currentImageIndex)}
              className="absolute top-4 right-4 p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors shadow-lg z-10"
              data-testid="button-remove-image"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
          )}
          
          {/* Navigation buttons for multiple images */}
          {imagePreviews.length > 1 && (
            <>
              <button
                onClick={handlePreviousImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/50 hover:bg-background/70 rounded-full transition-colors"
                data-testid="button-previous-image"
              >
                <ChevronLeft className="h-6 w-6 text-foreground" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/50 hover:bg-background/70 rounded-full transition-colors"
                data-testid="button-next-image"
              >
                <ChevronRight className="h-6 w-6 text-foreground" />
              </button>
              {/* Image counter */}
              <div className="absolute top-4 left-4 px-3 py-1 bg-background/60 rounded-full text-foreground text-sm">
                {currentImageIndex + 1} / {imagePreviews.length}
              </div>
            </>
          )}

          {/* Name overlay */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                  {profileData.fullName || user.username}
                </h1>
                <label className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full cursor-pointer transition-colors shadow-lg">
                  <Pencil className="h-4 w-4 text-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                    data-testid="input-profile-image"
                  />
                </label>
              </div>
              {/* Save button for new images */}
              {hasNewImages && (
                <Button
                  onClick={handleSaveImages}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700 text-foreground"
                  data-testid="button-save-images"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Images
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="container mx-auto px-6 space-y-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {renderEditableField("Full Name", "fullName")}
            {renderEditableField("Location", "location")}
            {renderEditableField("Occupation", "profession")}
            {renderEditableField("Bio", "bio", true)}
            {renderVibeField()}
            {renderEditableField("Born", "birthLocation")}
            {renderEditableField("Lived", "livedLocation")}
            {renderEditableField("Upcoming", "nextLocation")}
          </div>

        </div>
      </div>

      <BottomNav />
    </div>
  );
}
