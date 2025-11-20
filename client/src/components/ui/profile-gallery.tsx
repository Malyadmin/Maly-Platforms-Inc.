import { useState, useEffect } from "react";
import { Plus, ImageIcon, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileGalleryProps {
  images: File[];
  imagePreviews: string[];
  onImagesChange: (images: File[], previews: string[]) => void;
  maxImages?: number;
}

export function ProfileGallery({ 
  images, 
  imagePreviews, 
  onImagesChange, 
  maxImages = 6 
}: ProfileGalleryProps) {
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const totalImages = images.length + files.length;
      if (totalImages > maxImages) {
        toast({
          variant: "destructive",
          title: "Too many images",
          description: `Maximum ${maxImages} images allowed`
        });
        return;
      }

      const newImages = [...images, ...files];
      const newPreviews = [...imagePreviews];
      
      // Create previews for new files
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          onImagesChange(newImages, [...newPreviews]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    onImagesChange(newImages, newPreviews);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">Build your profile gallery</h3>
        <p className="text-muted-foreground text-sm mb-1">Add high resolution photos to your profile</p>
        <p className="text-muted-foreground text-sm">First picture will be your main profile photo</p>
      </div>

      {/* Main Image Upload Area */}
      <div className="relative">
        {imagePreviews.length > 0 ? (
          <div className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden border-2 border-dashed border-gray-600 relative">
              <img
                src={imagePreviews[0]}
                alt="Main profile photo"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="bg-black/70 text-white font-bold px-2 py-1 text-center rotate-[-15deg] text-xs sm:text-sm whitespace-nowrap">
                  FOR DEMO ONLY
                </div>
              </div>
            </div>
            <div className="absolute top-2 right-2 flex gap-2 z-20">
              <button
                type="button"
                onClick={() => removeImage(0)}
                className="bg-red-500 text-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                data-testid="remove-main-image"
              >
                ×
              </button>
            </div>
          </div>
        ) : (
          <label
            className="aspect-square border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
            htmlFor="main-image-upload"
          >
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <input
              id="main-image-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              data-testid="input-main-image"
            />
          </label>
        )}
      </div>

      {/* Additional Images Grid */}
      <div className="grid grid-cols-6 gap-2">
        {Array.from({ length: maxImages }, (_, index) => {
          const isFirst = index === 0;
          const hasImage = imagePreviews[index];
          
          return (
            <div key={index} className="aspect-square relative">
              {hasImage ? (
                <div className="w-full h-full rounded-lg overflow-hidden border border-gray-600 relative">
                  <img
                    src={imagePreviews[index]}
                    alt={`Profile image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="bg-black/70 text-white font-bold px-1 py-0.5 text-center rotate-[-15deg] text-[0.5rem] leading-tight whitespace-nowrap">
                      FOR DEMO ONLY
                    </div>
                  </div>
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs z-20"
                    data-testid={`remove-image-${index}`}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label
                  className={`w-full h-full border-2 border-dashed ${isFirst ? 'border-blue-400' : 'border-gray-600'} rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors`}
                  htmlFor={`image-upload-${index}`}
                >
                  <Plus className={`w-4 h-4 ${isFirst ? 'text-blue-400' : 'text-muted-foreground'}`} />
                  <input
                    id={`image-upload-${index}`}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    data-testid={`input-image-${index}`}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>

      {/* Requirements */}
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>• Up to {maxImages} pictures</p>
        <p>• Recommended high resolution</p>
        <p>• First image becomes your main profile photo</p>
      </div>
    </div>
  );
}