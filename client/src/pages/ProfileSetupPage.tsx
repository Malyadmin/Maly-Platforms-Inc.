import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Upload, ChevronLeft } from "lucide-react";
import { DIGITAL_NOMAD_CITIES, VIBE_AND_MOOD_TAGS } from "@/lib/constants";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  age: z.number().min(18, "Must be at least 18 years old"),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  profession: z.string().min(2, "Profession is required"),
  location: z.string(),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  currentMood: z.enum([
    "Party & Nightlife",
    "Networking & Business",
    "Adventure & Exploring",
    "Dining & Drinks",
    "Creative & Artsy"
  ]),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Use interests from the unified VIBE_AND_MOOD_TAGS list
const interests = VIBE_AND_MOOD_TAGS;

// Use moods from the unified VIBE_AND_MOOD_TAGS list
// We need to cast it to match the expected type in the form schema
const moods = ["Party & Nightlife", "Networking & Business", "Adventure & Exploring", "Dining & Drinks", "Creative & Artsy"] as const;

// Unified mood style definitions for consistent visual appearance
const moodStyles = {
  // New vibe and mood tags
  "Party & Nightlife": "bg-purple-500/20 text-purple-500 hover:bg-purple-500/30",
  "Fashion & Style": "bg-pink-500/20 text-pink-500 hover:bg-pink-500/30",
  "Networking & Business": "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30",
  "Dining & Drinks": "bg-green-500/20 text-green-500 hover:bg-green-500/30",
  "Outdoor & Nature": "bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30",
  "Wellness & Fitness": "bg-teal-500/20 text-teal-500 hover:bg-teal-500/30",
  "Creative & Artsy": "bg-violet-500/20 text-violet-500 hover:bg-violet-500/30",
  "Single & Social": "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30",
  "Chill & Recharge": "bg-cyan-500/20 text-cyan-500 hover:bg-cyan-500/30",
  "Adventure & Exploring": "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30",
  "Spiritual & Intentional": "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30",
  
  // Legacy tags for backward compatibility
  "Dating": "bg-pink-500/20 text-pink-500 hover:bg-pink-500/30",
  "Networking": "bg-blue-500/20 text-blue-500 hover:bg-blue-500/30",
  "Parties": "bg-purple-500/20 text-purple-500 hover:bg-purple-500/30",
  "Adventure": "bg-orange-500/20 text-orange-500 hover:bg-orange-500/30",
  "Dining Out": "bg-green-500/20 text-green-500 hover:bg-green-500/30"
} as const;

export default function ProfileSetupPage() {
  const { toast } = useToast();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      age: 18,
      bio: "",
      profession: "",
      location: "Mexico City",
      interests: [],
      currentMood: "Networking & Business",
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Profile Created",
        description: "Welcome to the community! Your profile has been set up successfully.",
      });

      // Redirect to home page or onboarding completion
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 gradient-text">Welcome to the Community</h1>
        <p className="text-lg text-white/60 mb-8">Let's set up your profile and help you connect with like-minded nomads.</p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Step 1: Basic Info */}
            <div className={`space-y-8 ${currentStep !== 1 && 'hidden'}`}>
              {/* Profile Image */}
              <div className="glass p-6 rounded-lg border border-white/10">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 ring-2 ring-primary/10">
                      <AvatarImage 
                        src={imagePreview || undefined} 
                        alt="Profile picture"
                      />
                      <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                    <label 
                      htmlFor="profile-image" 
                      className="absolute -bottom-2 -right-2 p-1.5 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      <input
                        id="profile-image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Profile Picture</h2>
                    <p className="text-sm text-white/60">
                      Upload a photo that best represents you
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="glass p-6 rounded-lg border border-white/10 space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} className="bg-white/5 border-white/10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            className="bg-white/5 border-white/10"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Location</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              {...field} 
                              className="pl-9 bg-white/5 border-white/10" 
                              placeholder="Where are you based?"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button 
                type="button" 
                size="lg" 
                className="w-full interactive-hover"
                onClick={() => setCurrentStep(2)}
              >
                Continue
              </Button>
            </div>

            {/* Step 2: Bio & Interests */}
            <div className={`space-y-8 ${currentStep !== 2 && 'hidden'}`}>
              {/* Bio & Profession */}
              <div className="glass p-6 rounded-lg border border-white/10 space-y-4">
                <FormField
                  control={form.control}
                  name="profession"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profession</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="What do you do?" 
                          {...field}
                          className="bg-white/5 border-white/10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about yourself..."
                          className="min-h-[100px] bg-white/5 border-white/10"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-white/60">
                        Share your story and what brings you here
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Vibe and Mood */}
              <div className="glass p-6 rounded-lg border border-white/10 space-y-4">
                <div>
                  <FormLabel>Vibe and Mood</FormLabel>
                  <FormDescription className="text-white/60">Select your vibes and interests</FormDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {interests.map(interest => (
                      <Badge
                        key={interest}
                        variant={selectedInterests.includes(interest) ? "default" : "outline"}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          const newInterests = selectedInterests.includes(interest)
                            ? selectedInterests.filter(i => i !== interest)
                            : [...selectedInterests, interest];
                          setSelectedInterests(newInterests);
                          form.setValue("interests", newInterests);
                        }}
                      >
                        {interest}
                      </Badge>
                    ))}
                  </div>
                  <FormMessage>{form.formState.errors.interests?.message}</FormMessage>
                </div>

                <FormField
                  control={form.control}
                  name="currentMood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Active Vibe</FormLabel>
                      <FormDescription className="text-white/60">What's your primary focus right now?</FormDescription>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {moods.map(mood => (
                          <Badge
                            key={mood}
                            variant={field.value === mood ? "default" : "outline"}
                            className={`cursor-pointer hover:opacity-80 transition-opacity ${
                              field.value === mood ? moodStyles[mood] : ""
                            }`}
                            onClick={() => field.onChange(mood)}
                          >
                            {mood}
                          </Badge>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  className="glass-hover"
                  onClick={() => setCurrentStep(1)}
                  aria-label="Go back"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span className="sr-only">Back</span>
                </Button>
                <Button type="submit" size="lg" className="flex-1 interactive-hover">
                  Complete Profile
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}