import { useState } from "react";
import { useLocation } from "wouter";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { 
  CalendarIcon, 
  Plus, 
  Loader2,
  ChevronsUpDown
} from "lucide-react";
import { GradientHeader } from "@/components/ui/GradientHeader";
import { z } from "zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VIBE_AND_MOOD_TAGS, DIGITAL_NOMAD_CITIES } from "@/lib/constants";
import { useUser } from "@/hooks/use-user";
import { ItineraryFormField } from "@/components/ItineraryFormField";
import { useTranslation } from "@/lib/translations";
import StripeConnectBanner from "@/components/StripeConnectBanner";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";

// Define a simple schema for our form
// Define a schema for itinerary items
const itineraryItemSchema = z.object({
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  description: z.string().min(1, "Description is required"),
});

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(3, "Location is required"),
  address: z.string().optional(),
  price: z.coerce.number().min(0).default(0),
  isPrivate: z.boolean().default(false),
  // Add a proper date validator to ensure valid dates
  date: z.string()
    .refine(val => !isNaN(Date.parse(val)), "Please enter a valid date")
    .default(() => new Date().toISOString()),
  // Add itinerary field (optional array of itinerary items)
  itinerary: z.array(itineraryItemSchema).optional().default([]),
  // Include category field even though we don't show it in the UI anymore
  category: z.string().default("Other"),
});

// Define the form data type using the zod schema
type FormData = z.infer<typeof eventSchema>;

// Use the unified vibe and mood tags
const interestTags = VIBE_AND_MOOD_TAGS;

export default function CreateEventPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useUser();
  const { t } = useTranslation();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Use our simplified schema
  const form = useForm<FormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      date: new Date().toISOString(),
      price: 0,
      isPrivate: false,
      itinerary: [], // Initialize with empty array
      // Include a default category even though we don't show it in the UI anymore
      category: "Other"
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // The main function to publish events
  const publishEvent = async () => {
    // Manually trigger validation for all fields and log current form values
    console.log("Current form values:", form.getValues());

    const isValid = await form.trigger();

    if (!isValid) {
      console.log("Form validation errors:", form.formState.errors);

      // Create a more specific error message based on which fields failed validation
      const errorFields = Object.keys(form.formState.errors)
        .map(field => {
          const errorField = field as keyof typeof form.formState.errors;
          return `${field}: ${form.formState.errors[errorField]?.message}`;
        })
        .join(', ');

      toast({
        variant: "destructive",
        title: "Validation Error",
        description: errorFields || "Please fill out all required fields correctly"
      });
      return;
    }

    // Only proceed if we have a user
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create events"
      });
      return;
    }

    try {
      setLoading(true);

      // Get data from the form
      const data = form.getValues();
      console.log("Form data to be submitted:", data);

      // Create a FormData object for the API call
      const formData = new FormData();

      // Add all form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'itinerary' && Array.isArray(value)) {
            // Serialize the itinerary array to JSON
            formData.append(key, JSON.stringify(value));
            console.log(`Added itinerary field with ${value.length} items`);
          } else {
            formData.append(key, value.toString());
            console.log(`Added form field: ${key} = ${value}`);
          }
        }
      });

      // Add the selected tags
      formData.append('tags', JSON.stringify(selectedTags));
      console.log("Added tags:", selectedTags);

      // Add the isDraft flag (always false since we removed draft functionality)
      formData.append('isDraft', 'false');

      // Add the image file if it exists
      if (selectedFile) {
        formData.append('image', selectedFile);
        console.log("Added image file:", selectedFile.name);
      } else {
        console.log("No image file selected");
      }

      // Make the API call with credentials
      console.log("Submitting event");

      // Get the current user ID from the user object
      if (user?.id) {
        formData.append('userId', user.id.toString());
        console.log("Adding userId to form data:", user.id);
      }

      // Get the sessionId from localStorage - using the correct key 'maly_session_id'
      const sessionId = localStorage.getItem('maly_session_id');
      console.log("Using sessionId for authentication:", sessionId ? "yes" : "no");

      const response = await fetch('/api/events', {
        method: 'POST',
        body: formData,
        headers: {
          // Include session ID in custom header
          'X-Session-ID': sessionId || '',
          // Include user ID in header
          'X-User-ID': user?.id?.toString() || '',
        },
        credentials: 'include', // Include credentials like cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Event created successfully:", result);

      toast({
        title: "Success",
        description: "Event published successfully"
      });

      // Redirect back to the main page
      setLocation("/");
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create event"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <GradientHeader 
        title={t('create')}
        backButtonFallbackPath="/"
      />

      <ScrollArea className="flex-1" style={{ height: 'calc(100vh - 140px)' }}>
        <div className="container mx-auto px-4 py-8 space-y-8 max-w-2xl">
            <div className="space-y-4">
              <p className="text-sm text-white/60">{t('letsGetStarted')}</p>
              <div className="relative aspect-[3/2] bg-white/5 rounded-lg overflow-hidden">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Event preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-foreground/10 transition-colors">
                    <div className="flex flex-col items-center gap-2">
                      <Plus className="w-8 h-8 text-white/60" />
                      <span className="text-sm text-white/60">
                        {t('addPhotosFlyer')}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Input
                  {...form.register("title")}
                  className="bg-white/5 border-0 h-12 text-lg"
                  placeholder={t('eventTitle')}
                />
                {form.formState.errors.title && (
                  <p className="text-red-500 text-xs">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Textarea
                  {...form.register("description")}
                  className="bg-white/5 border-0 h-32 resize-none"
                  placeholder={t('fillEventDetails')}
                />
                {form.formState.errors.description && (
                  <p className="text-red-500 text-xs">{form.formState.errors.description.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">{t('vibesForEvent')}</h3>
              <div className="flex flex-wrap gap-2">
                {interestTags.map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className={`h-auto min-h-8 px-3 py-1.5 text-sm whitespace-normal break-words ${
                      selectedTags.includes(tag)
                        ? ""
                        : "bg-white/5 border-white/10 hover:bg-foreground/10"
                    }`}
                    onClick={() => {
                      setSelectedTags((prev) =>
                        prev.includes(tag)
                          ? prev.filter((t) => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                  >
                    {t(tag)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">{t('eventLocation')}</h3>
              <Select
                value={form.watch("location")}
                onValueChange={(value) => form.setValue("location", value)}
              >
                <SelectTrigger className="w-full h-12 bg-white/5 border-white/10 hover:bg-foreground/10">
                  <SelectValue placeholder={t('selectCity')} />
                </SelectTrigger>
                <SelectContent>
                  {DIGITAL_NOMAD_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.location && (
                <p className="text-red-500 text-xs">{form.formState.errors.location.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Event Address</h3>
              <Controller
                name="address"
                control={form.control}
                defaultValue=""
                render={({ field }) => (
                  <LocationAutocomplete
                    value={field.value || ""}
                    onChange={(value) => field.onChange(value)}
                    placeholder="Enter exact event address"
                    className="bg-white/5 border-0 h-12"
                    type="address"
                  />
                )}
              />
              {form.formState.errors.address && (
                <p className="text-red-500 text-xs">{form.formState.errors.address.message}</p>
              )}
            </div>



            {/* Date Picker */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t('eventDate')}</h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 bg-white/5 border-white/10 hover:bg-foreground/10 justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch("date") ? (
                      format(new Date(form.watch("date")), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.watch("date") ? new Date(form.watch("date")) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        form.setValue("date", date.toISOString());
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.date && (
                <p className="text-red-500 text-xs">{form.formState.errors.date.message}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={form.watch("price") === 0 ? "default" : "outline"}
                  className="flex-1 h-12"
                  onClick={() => form.setValue("price", 0)}
                >
                  {t('free')}
                </Button>
                <Button
                  type="button"
                  variant={form.watch("price") > 0 ? "default" : "outline"}
                  className="flex-1 h-12"
                  onClick={() => form.setValue("price", 10)}
                >
                  {t('paid')}
                </Button>
              </div>

              {form.watch("price") > 0 && (
                <div className="space-y-4">
                  <Input
                    type="number"
                    {...form.register("price", { valueAsNumber: true })}
                    className="bg-white/5 border-0 h-12"
                    placeholder="0.00"
                  />
                  <StripeConnectBanner 
                    eventPrice={form.watch("price")?.toString()}
                    showForFreeEvents={false}
                  />
                </div>
              )}
            </div>

            {/* Event Itinerary */}
            <div className="space-y-4 bg-white/5 p-6 rounded-lg">
              <FormProvider {...form}>
                <ItineraryFormField name="itinerary" />
              </FormProvider>
              {form.formState.errors.itinerary && (
                <p className="text-red-500 text-xs">Please check itinerary details</p>
              )}
            </div>

            {/* Publication Button */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  type="button"
                  className="flex-1 h-12 bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 hover:from-teal-700 hover:via-blue-700 hover:to-purple-700 text-white"
                  disabled={loading}
                  onClick={publishEvent}
                >
                  {t('publishEvent')}
                </Button>
              </div>
            </div>
          </div>

        <div className="container mx-auto max-w-2xl px-4 pb-32">
          <div className="rounded-lg overflow-hidden relative">
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded z-10">
              Premium Ad Partner
            </div>
            <img
              src="/attached_assets/Screenshot 2025-03-05 at 1.56.31 AM.png"
              alt="American Express Platinum - The world is yours with Platinum"
              className="w-full object-cover"
            />
          </div>
        </div>
      </ScrollArea>

      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10">
        <div className="container mx-auto max-w-2xl p-4">
          <Button
            type="button"
            className="w-full h-12 bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 hover:from-teal-700 hover:via-blue-700 hover:to-purple-700 text-white transition-all duration-200"
            disabled={loading}
            onClick={publishEvent}
          >
            <Plus className="h-5 w-5 mr-2" />
            <span>{loading ? "Creating..." : "Create Event"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}