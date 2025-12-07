import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
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
  Save, 
  Loader2,
  ChevronsUpDown,
  Plus
} from "lucide-react";
import { GradientHeader } from "@/components/ui/GradientHeader";
import { z } from "zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VIBE_AND_MOOD_TAGS, DIGITAL_NOMAD_CITIES } from "@/lib/constants";
import { useUser } from "@/hooks/use-user";
import { ItineraryFormField } from "@/components/ItineraryFormField";
import { useQuery } from "@tanstack/react-query";
import { LocationAutocomplete } from "@/components/ui/location-autocomplete";

// Define a schema for itinerary items
const itineraryItemSchema = z.object({
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  description: z.string().min(1, "Description is required"),
});

// Event schema without the category field
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
});

// Define the form data type using the zod schema
type FormData = z.infer<typeof eventSchema>;

// Use the unified vibe and mood tags
const interestTags = VIBE_AND_MOOD_TAGS;

export default function EditEventPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useUser();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);

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
      itinerary: [] // Initialize with empty array
    },
  });

  // Fetch existing event data
  const { data: event, isLoading, error } = useQuery({
    queryKey: [`/api/events/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/events/${id}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Error fetching event: ${response.status}`);
      }

      return response.json();
    },
  });

  // Set form values from the fetched event data
  useEffect(() => {
    if (event && !isLoading) {
      // Only allow editing if the user is the creator
      if (user?.id !== event.creatorId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You can only edit your own events"
        });
        setLocation("/");
        return;
      }

      // Parse the price correctly
      let eventPrice = 0;
      if (event.price !== null) {
        eventPrice = typeof event.price === 'string' ? parseFloat(event.price) : event.price;
      }

      // Set form values
      form.reset({
        title: event.title,
        description: event.description,
        location: event.location,
        address: event.address || "",
        date: new Date(event.date).toISOString(),
        price: eventPrice,
        isPrivate: event.isPrivate === true,
        itinerary: event.itinerary || []
      });

      // Set selected tags
      if (event.tags && Array.isArray(event.tags)) {
        setSelectedTags(event.tags);
      }

      // Set image preview if available
      if (event.image || event.image_url) {
        setImagePreview(event.image || event.image_url || null);
      }

      setIsLoadingEvent(false);
    }
  }, [event, isLoading, form, user, toast, setLocation]);

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

  // Function to update the event
  const updateEvent = async () => {
    // Manually trigger validation for all fields
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

    // Only proceed if we have a user and verify they are the event creator
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to edit events"
      });
      return;
    }

    if (user.id !== event.creatorId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You can only edit your own events"
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

      // Add the image file if it exists
      if (selectedFile) {
        formData.append('image', selectedFile);
        console.log("Added image file:", selectedFile.name);
      } else {
        console.log("No new image file selected");
      }

      // Get the sessionId from localStorage
      const sessionId = localStorage.getItem('maly_session_id');
      console.log("Using sessionId for authentication:", sessionId ? "yes" : "no");

      // Make the PUT request to update the event
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
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
      console.log("Event updated successfully:", result);

      toast({
        title: "Success",
        description: "Event updated successfully"
      });

      // Redirect back to the event page
      setLocation(`/event/${id}`);
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update event"
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingEvent || isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading event details...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <GradientHeader 
        title="Edit Event"
        backButtonFallbackPath={`/event/${id}`}
      />

      <ScrollArea className="flex-1" style={{ height: 'calc(100vh - 140px)' }}>
        <div className="container mx-auto px-4 py-8 space-y-8 max-w-2xl">
            <div className="space-y-4">
              <p className="text-sm text-white/60">Update your event</p>
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
                        Add photos or flyer for your event
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
                
                {/* Add a button to change image if preview exists */}
                {imagePreview && (
                  <label className="absolute bottom-2 right-2 bg-black/80 text-white px-3 py-1.5 rounded-md text-sm cursor-pointer hover:bg-black">
                    Change Image
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
                  placeholder="Event title"
                />
                {form.formState.errors.title && (
                  <p className="text-red-500 text-xs">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Textarea
                  {...form.register("description")}
                  className="bg-white/5 border-0 h-32 resize-none"
                  placeholder="Fill in event details"
                />
                {form.formState.errors.description && (
                  <p className="text-red-500 text-xs">{form.formState.errors.description.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Vibes for this event</h3>
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
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Event Location</h3>
              <Select
                value={form.watch("location")}
                onValueChange={(value) => form.setValue("location", value)}
              >
                <SelectTrigger className="w-full h-12 bg-white/5 border-white/10 hover:bg-foreground/10">
                  <SelectValue placeholder="Select a city" />
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
              <h3 className="text-sm font-medium">Event Date</h3>
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
                  Free
                </Button>
                <Button
                  type="button"
                  variant={form.watch("price") > 0 ? "default" : "outline"}
                  className="flex-1 h-12"
                  onClick={() => form.setValue("price", 10)}
                >
                  Paid
                </Button>
              </div>

              {form.watch("price") > 0 && (
                <div className="space-y-2">
                  <Input
                    type="number"
                    {...form.register("price", { valueAsNumber: true })}
                    className="bg-white/5 border-0 h-12"
                    placeholder="0.00"
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
                <p className="text-red-500 text-xs">Please complete all itinerary items</p>
              )}
            </div>
        </div>
      </ScrollArea>

      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10">
        <div className="container mx-auto max-w-2xl p-4">
          <Button
            type="button"
            className="w-full h-12 bg-white hover:bg-gray-100 text-black text-white transition-all duration-200"
            disabled={loading}
            onClick={updateEvent}
          >
            <Save className="h-5 w-5 mr-2" />
            <span>{loading ? "Updating..." : "Update Event"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}