import { useState, useEffect } from "react";
import { z } from "zod";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, RotateCcw, Plus, ImageIcon, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EventCreationStep, eventCreationSchema, step1Schema, step2Schema, type EventCreationData } from "../../../shared/eventCreation";

// Step 1: Basic Info Component
interface Step1Props {
  data: EventCreationData;
  onNext: (data: Partial<EventCreationData>) => void;
  onBack?: () => void;
}

function Step1BasicInfo({ data, onNext, onBack }: Step1Props) {
  const form = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      title: data.title || "",
      tagline: data.tagline || "",
      summary: data.summary || "",
    },
  });

  const onSubmit = (formData: any) => {
    onNext(formData);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center text-white"
            data-testid="button-back"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
        )}
        <div className="text-center">
          <h1 className="text-lg font-medium tracking-wide">M Ā L Y</h1>
        </div>
        <button
          type="submit"
          form="step1-form"
          className="text-white font-medium"
          data-testid="button-next"
        >
          Next
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-light mb-2">Create your event</h2>
          <p className="text-gray-400 text-sm">Promote or share remarkable experiences</p>
        </div>

        <div className="flex items-center justify-end">
          <button className="flex items-center text-yellow-400 text-sm font-medium">
            <span>Create from Previous</span>
            <RotateCcw className="w-4 h-4 ml-2" />
          </button>
        </div>

        <form 
          id="step1-form" 
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          <div className="space-y-2">
            <label className="text-white font-medium">Event Title</label>
            <Input
              {...form.register("title")}
              placeholder="Concise and engaging"
              className="bg-black border-gray-700 text-white placeholder-gray-500 focus:border-gray-500"
              data-testid="input-title"
            />
            {form.formState.errors.title && (
              <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-white font-medium">Event Tagline (optional)</label>
            <Input
              {...form.register("tagline")}
              placeholder="Short and catchy"
              className="bg-black border-gray-700 text-white placeholder-gray-500 focus:border-gray-500"
              data-testid="input-tagline"
            />
          </div>

          <div className="space-y-2">
            <label className="text-white font-medium">Event Summary / Invitation</label>
            <Textarea
              {...form.register("summary")}
              placeholder="A brief overview of your event. Use ChatGPT or similar if you need assistance."
              rows={5}
              className="bg-black border-gray-700 text-white placeholder-gray-500 focus:border-gray-500 resize-none"
              data-testid="textarea-summary"
            />
            {form.formState.errors.summary && (
              <p className="text-red-500 text-sm">{form.formState.errors.summary.message}</p>
            )}
          </div>
        </form>

        {/* Bottom spacing for mobile */}
        <div className="h-20"></div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-black">
        <Button
          type="submit"
          form="step1-form"
          className="w-full bg-white text-black hover:bg-gray-200 rounded-full py-4 text-lg font-medium"
          data-testid="button-next-bottom"
        >
          next
        </Button>
        <div className="text-center mt-4">
          <button className="text-gray-400 text-sm">
            Save as draft
          </button>
        </div>
      </div>
    </div>
  );
}

// Step 2: Build Event Gallery Component
interface Step2Props {
  data: EventCreationData;
  onNext: (data: Partial<EventCreationData>) => void;
  onBack: () => void;
}

function Step2BuildGallery({ data, onNext, onBack }: Step2Props) {
  const [selectedImages, setSelectedImages] = useState<File[]>(data.images || []);
  const [imagePreviews, setImagePreviews] = useState<string[]>(data.imageURLs || []);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(step2Schema.extend({
      images: z.array(z.any()).min(1, "At least one image is required"),
    })),
    defaultValues: {
      images: data.images || [],
      eventImageURL: data.eventImageURL || "",
      imageURLs: data.imageURLs || [],
      videoURLs: data.videoURLs || [],
    },
  });

  // Initialize previews from existing data
  useEffect(() => {
    if (data.imageURLs && data.imageURLs.length > 0 && imagePreviews.length === 0) {
      setImagePreviews(data.imageURLs);
    }
  }, [data.imageURLs]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const totalImages = selectedImages.length + files.length;
      if (totalImages > 6) {
        toast({
          variant: "destructive",
          title: "Too many images",
          description: "Maximum 6 images allowed"
        });
        return;
      }

      const newImages = [...selectedImages, ...files];
      setSelectedImages(newImages);

      // Create previews
      const newPreviews = [...imagePreviews];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
          setImagePreviews([...newPreviews]);
        };
        reader.readAsDataURL(file);
      });

      form.setValue("images", newImages);
    }
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
    form.setValue("images", newImages);
  };

  const onSubmit = async () => {
    // Trigger form validation
    const isValid = await form.trigger();
    
    if (!isValid) {
      toast({
        variant: "destructive", 
        title: "Validation Error",
        description: "At least one image is required to continue"
      });
      return;
    }

    const formData = {
      images: selectedImages,
      eventImageURL: imagePreviews[0] || "",
      imageURLs: imagePreviews,
      videoURLs: [],
    };
    onNext(formData);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button
          onClick={onBack}
          className="flex items-center text-white"
          data-testid="button-back"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </button>
        <div className="text-center">
          <h1 className="text-lg font-medium tracking-wide">M Ā L Y</h1>
        </div>
        <button
          onClick={onSubmit}
          className="text-white font-medium"
          data-testid="button-next"
        >
          Next
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-light mb-2">Build your event gallery</h2>
          <p className="text-gray-400 text-sm mb-1">Add high resolution photos or flyer to your event</p>
          <p className="text-gray-400 text-sm">First picture will be your event flyer</p>
        </div>

        {/* Main Image Upload Area */}
        <div className="relative">
          {imagePreviews.length > 0 ? (
            <div className="aspect-square rounded-lg overflow-hidden border-2 border-dashed border-gray-600">
              <img
                src={imagePreviews[0]}
                alt="Event flyer"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removeImage(0)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          ) : (
            <label
              className="aspect-square border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
              htmlFor="main-image-upload"
            >
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <ImageIcon className="w-8 h-8 text-gray-400" />
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
          {Array.from({ length: 6 }, (_, index) => {
            const isFirst = index === 0;
            const hasImage = imagePreviews[index];
            
            return (
              <div key={index} className="aspect-square relative">
                {hasImage ? (
                  <div className="w-full h-full rounded-lg overflow-hidden border border-gray-600">
                    <img
                      src={imagePreviews[index]}
                      alt={`Event image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label
                    className={`w-full h-full border-2 border-dashed ${isFirst ? 'border-yellow-400' : 'border-gray-600'} rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors`}
                    htmlFor={`image-upload-${index}`}
                  >
                    <Plus className={`w-4 h-4 ${isFirst ? 'text-yellow-400' : 'text-gray-400'}`} />
                    <input
                      id={`image-upload-${index}`}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>

        {/* Requirements */}
        <div className="space-y-1 text-xs text-gray-400">
          <p>• Up to 6 pictures, 1 mandatory</p>
          <p>• 1 video up to (file size)</p>
          <p>• Recommended (image size)</p>
          <p>• Maximum file size</p>
        </div>

        {/* Bottom spacing for mobile */}
        <div className="h-20"></div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-black">
        <Button
          onClick={onSubmit}
          disabled={selectedImages.length === 0}
          className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 rounded-full py-4 text-lg font-medium"
          data-testid="button-next-bottom"
        >
          next
        </Button>
        <div className="text-center mt-4">
          <button className="text-gray-400 text-sm">
            Save as draft
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Event Creation Flow Component
export default function CreateEventFlowPage() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<EventCreationStep>(EventCreationStep.BasicInfo);
  const [eventData, setEventData] = useState<EventCreationData>({
    // Initialize with default values from schema
    title: "",
    tagline: "",
    summary: "",
    images: [],
    imageURLs: [],
    videoURLs: [],
    isOnlineEvent: false,
    eventVisibility: "public",
    city: "",
    addressLine1: "",
    additionalInfo: "",
    startDate: new Date(),
    endDate: new Date(),
    addActivitySchedule: false,
    agendaItems: [],
    addEventLineup: false,
    eventLineup: [],
    dressCode: false,
    dressCodeDetails: "",
    isPaidEvent: false,
    price: "",
    eventPrivacy: "public",
    whoShouldAttend: "",
    spotsAvailable: "",
    promotionOnly: false,
    contactsOnly: false,
    invitationOnly: false,
    requireApproval: false,
    genderExclusive: "",
    moodSpecific: "",
    interestsSpecific: [],
    category: "Other",
  });

  const handleNext = (stepData: Partial<EventCreationData>) => {
    setEventData((prev: EventCreationData) => ({ ...prev, ...stepData }));
    
    // Move to next step
    if (currentStep < EventCreationStep.AudienceTargeting) {
      setCurrentStep((prev: EventCreationStep) => prev + 1);
    } else {
      // Final step - submit the event
      handleSubmitEvent();
    }
  };

  const handleBack = () => {
    if (currentStep > EventCreationStep.BasicInfo) {
      setCurrentStep((prev: EventCreationStep) => prev - 1);
    } else {
      // Go back to main page
      setLocation("/");
    }
  };

  const handleSubmitEvent = async () => {
    try {
      // Here we would submit to the API
      console.log("Submitting event:", eventData);
      // TODO: Implement API submission
      setLocation("/"); // Redirect after successful creation
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case EventCreationStep.BasicInfo:
        return (
          <Step1BasicInfo
            data={eventData}
            onNext={handleNext}
            onBack={currentStep > EventCreationStep.BasicInfo ? handleBack : undefined}
          />
        );
      
      case EventCreationStep.Gallery:
        return (
          <Step2BuildGallery
            data={eventData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      
      // TODO: Implement other steps
      default:
        return (
          <div className="min-h-screen bg-black text-white flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl mb-4">Step {currentStep} - Coming Soon</h2>
              <Button onClick={handleBack} className="bg-white text-black">
                Go Back
              </Button>
            </div>
          </div>
        );
    }
  };

  return renderStep();
}