import { useState } from "react";
import { z } from "zod";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronLeft, Eye, EyeOff, ImageIcon, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { VIBE_AND_MOOD_TAGS } from "@/lib/constants";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProfileGallery } from "@/components/ui/profile-gallery";

// Step schemas
const step1Schema = z.object({
  fullName: z.string().min(1, "Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  age: z.string().optional(),
  gender: z.string().optional(),
  sexualOrientation: z.string().optional(),
});

const step3Schema = z.object({
  location: z.string().optional(),
  birthLocation: z.string().optional(),
  livedLocation: z.string().optional(),
  nextLocation: z.string().optional(),
});

const step4Schema = z.object({
  vibes: z.array(z.string()).optional(),
  intention: z.string().optional(),
  profession: z.string().optional(),
});

const step5Schema = z.object({
  bio: z.string().optional(),
  profileImage: z.any().optional(),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms and Conditions to register" }),
  }),
  privacyAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Privacy Policy to register" }),
  }),
});

interface SignupData {
  fullName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  password: string;
  confirmPassword: string;
  age?: string;
  gender?: string;
  sexualOrientation?: string;
  location?: string;
  birthLocation?: string;
  livedLocation?: string;
  nextLocation?: string;
  vibes?: string[];
  intention?: string;
  profession?: string;
  bio?: string;
  profileImage?: File | null;
  profileImages?: File[];
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
}

const moodStyles: Record<string, string> = {
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
};

interface StepProps {
  data: SignupData;
  onNext: (data: Partial<SignupData>) => void;
  onBack?: () => void;
}

// Step 1: Basic Account Info
function Step1BasicInfo({ data, onNext, onBack }: StepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      fullName: data.fullName || "",
      username: data.username || "",
      email: data.email || "",
      phoneNumber: data.phoneNumber || "",
      password: data.password || "",
      confirmPassword: data.confirmPassword || "",
    },
  });

  const onSubmit = (formData: any) => {
    onNext(formData);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-gray-800">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto"
          />
        </div>
        
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center text-white"
                  data-testid="button-back"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>S I G N U P</h2>
            </div>
            
            <Button
              type="submit"
              form="step1-form"
              variant="outline"
              size="sm"
              className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 px-4 py-2"
              data-testid="button-next"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      
      <ProgressBar currentStep={1} totalSteps={5} />

      <div className="p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-light mb-2">Create your account</h2>
          <p className="text-muted-foreground text-sm">Let's get started with the basics</p>
        </div>

        <form 
          id="step1-form" 
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="space-y-2">
            <label className="text-white font-medium">Name</label>
            <Input
              {...form.register("fullName")}
              placeholder="Your full name"
              className="bg-black border-gray-700 text-white placeholder-gray-500 focus:border-gray-500"
              data-testid="input-fullName"
            />
            {form.formState.errors.fullName && (
              <p className="text-red-500 text-sm">{form.formState.errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-white font-medium">Username</label>
            <Input
              {...form.register("username")}
              placeholder="Choose a username"
              className="bg-black border-gray-700 text-white placeholder-gray-500 focus:border-gray-500"
              data-testid="input-username"
            />
            {form.formState.errors.username && (
              <p className="text-red-500 text-sm">{form.formState.errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-white font-medium">Email</label>
            <Input
              {...form.register("email")}
              type="email"
              placeholder="your.email@example.com"
              className="bg-black border-gray-700 text-white placeholder-gray-500 focus:border-gray-500"
              data-testid="input-email"
            />
            {form.formState.errors.email && (
              <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-white font-medium">Phone Number (optional)</label>
            <Input
              {...form.register("phoneNumber")}
              type="tel"
              placeholder="+1 234 567 8900"
              className="bg-black border-gray-700 text-white placeholder-gray-500 focus:border-gray-500"
              data-testid="input-phoneNumber"
            />
          </div>

          <div className="space-y-2">
            <label className="text-white font-medium">Password</label>
            <div className="relative">
              <Input
                {...form.register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                className="bg-black border-gray-700 text-white placeholder-gray-500 focus:border-gray-500 pr-10"
                data-testid="input-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-gray-300"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-white font-medium">Confirm Password</label>
            <div className="relative">
              <Input
                {...form.register("confirmPassword")}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                className="bg-black border-gray-700 text-white placeholder-gray-500 focus:border-gray-500 pr-10"
                data-testid="input-confirmPassword"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-gray-300"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-red-500 text-sm">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

// Step 2: Demographics
function Step2Demographics({ data, onNext, onBack }: StepProps) {
  const form = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      age: data.age || "",
      gender: data.gender || "",
      sexualOrientation: data.sexualOrientation || "",
    },
  });

  const onSubmit = (formData: any) => {
    onNext(formData);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-gray-800">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto"
          />
        </div>
        
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center text-white"
                data-testid="button-back"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>S I G N U P</h2>
            </div>
            
            <Button
              type="submit"
              form="step2-form"
              variant="outline"
              size="sm"
              className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 px-4 py-2"
              data-testid="button-next"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      
      <ProgressBar currentStep={2} totalSteps={5} />

      <div className="p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-light mb-2">Tell us about yourself</h2>
          <p className="text-muted-foreground text-sm">This helps us connect you with the right people</p>
        </div>

        <form 
          id="step2-form" 
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="space-y-2">
            <label className="text-white font-medium">Age <span className="text-xs text-muted-foreground">(will not be displayed)</span></label>
            <Input
              {...form.register("age")}
              type="number"
              placeholder="Your age"
              className="bg-black border-gray-700 text-white placeholder-gray-500 focus:border-gray-500"
              data-testid="input-age"
            />
          </div>

          <div className="space-y-2">
            <label className="text-white font-medium">Gender</label>
            <select
              {...form.register("gender")}
              className="w-full bg-black border border-gray-700 text-white rounded-md px-3 py-2 focus:border-gray-500"
              data-testid="select-gender"
            >
              <option value="">Select your gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-white font-medium">Sexual Orientation</label>
            <select
              {...form.register("sexualOrientation")}
              className="w-full bg-black border border-gray-700 text-white rounded-md px-3 py-2 focus:border-gray-500"
              data-testid="select-sexualOrientation"
            >
              <option value="">Select your orientation</option>
              <option value="straight">Straight</option>
              <option value="gay">Gay</option>
              <option value="lesbian">Lesbian</option>
              <option value="bisexual">Bisexual</option>
              <option value="pansexual">Pansexual</option>
              <option value="asexual">Asexual</option>
              <option value="queer">Queer</option>
              <option value="questioning">Questioning</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>
        </form>
      </div>
    </div>
  );
}

// Step 3: Locations
function Step3Locations({ data, onNext, onBack }: StepProps) {
  const form = useForm({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      location: data.location || "",
      birthLocation: data.birthLocation || "",
      livedLocation: data.livedLocation || "",
      nextLocation: data.nextLocation || "",
    },
  });

  const onSubmit = (formData: any) => {
    onNext(formData);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-gray-800">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto"
          />
        </div>
        
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center text-white"
                data-testid="button-back"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>S I G N U P</h2>
            </div>
            
            <Button
              type="submit"
              form="step3-form"
              variant="outline"
              size="sm"
              className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 px-4 py-2"
              data-testid="button-next"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      
      <ProgressBar currentStep={3} totalSteps={5} />

      <div className="p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-light mb-2">Where are you?</h2>
          <p className="text-muted-foreground text-sm">Help others find you and connect based on location</p>
        </div>

        <form 
          id="step3-form" 
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="space-y-2">
            <label className="text-white font-medium">Current Location</label>
            <Input
              {...form.register("location")}
              placeholder="Where do you live now?"
              className="bg-black border-gray-700 text-white placeholder-gray-500 focus:border-gray-500"
              data-testid="input-location"
            />
          </div>

          <div className="space-y-2">
            <label className="text-white font-medium">Born In</label>
            <Input
              {...form.register("birthLocation")}
              placeholder="Your birthplace"
              className="bg-black border-gray-700 text-white placeholder-gray-500 focus:border-gray-500"
              data-testid="input-birthLocation"
            />
          </div>

          <div className="space-y-2">
            <label className="text-white font-medium">Lived In</label>
            <Input
              {...form.register("livedLocation")}
              placeholder="Places you've lived"
              className="bg-black border-gray-700 text-white placeholder-gray-500 focus:border-gray-500"
              data-testid="input-livedLocation"
            />
          </div>

          <div className="space-y-2">
            <label className="text-white font-medium">Traveling To</label>
            <Input
              {...form.register("nextLocation")}
              placeholder="Where are you headed next?"
              className="bg-black border-gray-700 text-white placeholder-gray-500 focus:border-gray-500"
              data-testid="input-nextLocation"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

// Step 4: Preferences
function Step4Preferences({ data, onNext, onBack }: StepProps) {
  const [selectedVibes, setSelectedVibes] = useState<string[]>(data.vibes || []);
  
  const form = useForm({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      vibes: data.vibes || [],
      intention: data.intention || "",
      profession: data.profession || "",
    },
  });

  const handleVibeToggle = (vibe: string) => {
    setSelectedVibes(prev => {
      const newVibes = prev.includes(vibe)
        ? prev.filter(v => v !== vibe)
        : [...prev, vibe];
      form.setValue('vibes', newVibes);
      return newVibes;
    });
  };

  const onSubmit = (formData: any) => {
    onNext({ ...formData, vibes: selectedVibes });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-gray-800">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto"
          />
        </div>
        
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center text-white"
                data-testid="button-back"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>S I G N U P</h2>
            </div>
            
            <Button
              type="submit"
              form="step4-form"
              variant="outline"
              size="sm"
              className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20 px-4 py-2"
              data-testid="button-next"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      
      <ProgressBar currentStep={4} totalSteps={5} />

      <div className="p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-light mb-2">What brings you here?</h2>
          <p className="text-muted-foreground text-sm">Tell us your interests and intentions</p>
        </div>

        <form 
          id="step4-form" 
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          <div className="space-y-3">
            <label className="text-white font-medium">Choose your vibe</label>
            <div className="flex flex-wrap gap-2">
              {VIBE_AND_MOOD_TAGS.map(vibe => {
                const isSelected = selectedVibes.includes(vibe);
                const vibeStyle = moodStyles[vibe] || "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30";
                
                return (
                  <Badge
                    key={vibe}
                    className={`cursor-pointer transition-all ${isSelected ? vibeStyle + ' font-medium' : 'bg-gray-800 text-muted-foreground hover:bg-gray-700'}`}
                    onClick={() => handleVibeToggle(vibe)}
                    data-testid={`badge-vibe-${vibe.replace(/\s+/g, '-')}`}
                  >
                    {vibe}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-white font-medium">Intention</label>
            <select
              {...form.register("intention")}
              className="w-full bg-black border border-gray-700 text-white rounded-md px-3 py-2 focus:border-gray-500"
              data-testid="select-intention"
            >
              <option value="">What are you looking for?</option>
              <option value="dating">Dating</option>
              <option value="social">Social</option>
              <option value="networking">Networking</option>
              <option value="friends">Friends</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-white font-medium">Occupation</label>
            <Input
              {...form.register("profession")}
              placeholder="What do you do?"
              className="bg-black border-gray-700 text-white placeholder-gray-500 focus:border-gray-500"
              data-testid="input-profession"
            />
          </div>
        </form>
      </div>
    </div>
  );
}

// Step 5: Profile Completion
function Step5ProfileCompletion({ data, onNext, onBack }: StepProps) {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(step5Schema),
    defaultValues: {
      bio: data.bio || "",
      profileImage: data.profileImage || null,
      termsAccepted: false,
      privacyAccepted: false,
    },
  });

  const handleImagesChange = (newImages: File[], newPreviews: string[]) => {
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const onSubmit = (formData: any) => {
    if (!termsAccepted || !privacyAccepted) {
      return;
    }
    onNext({ ...formData, profileImages: selectedImages, termsAccepted, privacyAccepted });
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      <div className="border-b border-gray-800">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto"
          />
        </div>
        
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center text-white"
                data-testid="button-back"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>S I G N U P</h2>
            </div>
            
            <button
              type="submit"
              form="step5-form"
              className="text-white font-medium"
              data-testid="button-create"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
      
      <ProgressBar currentStep={5} totalSteps={5} />

      <div className="p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-light mb-2">Complete your profile</h2>
          <p className="text-muted-foreground text-sm">Add a photo and bio to stand out</p>
        </div>

        <form 
          id="step5-form" 
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          <div className="space-y-3">
            <label className="text-white font-medium">Profile Photos</label>
            <p className="text-white/70 text-sm leading-relaxed">
              Show your best face—avoid group, distant, and low-quality photos for great connections. Add up to 7 images to highlight your travels, vibe, and lifestyle.
            </p>
            <ProfileGallery
              images={selectedImages}
              imagePreviews={imagePreviews}
              onImagesChange={handleImagesChange}
              maxImages={7}
            />
          </div>

          <div className="space-y-2">
            <label className="text-white font-medium">Bio</label>
            <Textarea
              {...form.register("bio")}
              placeholder="Tell us a bit about yourself..."
              className="bg-black border-gray-700 text-white placeholder-gray-500 focus:border-gray-500 min-h-[120px]"
              data-testid="input-bio"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-800">
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="terms" 
                checked={termsAccepted}
                onCheckedChange={(checked) => {
                  setTermsAccepted(checked as boolean);
                  form.setValue('termsAccepted', checked as boolean);
                }}
                className="mt-1"
                data-testid="checkbox-terms"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  I agree to the{" "}
                  <Dialog open={showTerms} onOpenChange={setShowTerms}>
                    <DialogTrigger asChild>
                      <span className="text-purple-400 cursor-pointer underline">Terms and Conditions</span>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-black text-white border-gray-800">
                      <DialogHeader>
                        <DialogTitle>Maly Platforms Inc. DBA Maly – Terms and Conditions</DialogTitle>
                        <DialogDescription className="text-muted-foreground">Effective Date: May 17, 2025</DialogDescription>
                      </DialogHeader>
                      <div className="text-sm space-y-4 mt-4 text-gray-300">
                        <p>Welcome to Maly Platforms Inc. ("Maly"). These Terms and Conditions govern your use of our mobile application and website platform. By accessing or using Maly, you agree to be bound by these terms.</p>
                        
                        <div>
                          <h3 className="font-bold mb-2 text-white">1. Eligibility</h3>
                          <p>You must be at least 18 years old to use Maly. By using the platform, you confirm that you are legally permitted to use the service under your local jurisdiction.</p>
                        </div>
                        
                        <div>
                          <h3 className="font-bold mb-2 text-white">2. User Content</h3>
                          <p>You are responsible for any content you upload, including profile information, event listings, and messages. By submitting content, you grant Maly a worldwide, non-exclusive, royalty-free license to use, display, and distribute this content on our platform and promotional materials.</p>
                        </div>
                        
                        <div>
                          <h3 className="font-bold mb-2 text-white">3. Community Standards</h3>
                          <p>To maintain a respectful environment, users may not post offensive, obscene, discriminatory, or misleading content. Maly reserves the right to remove content or suspend accounts in violation of our guidelines.</p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </label>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Checkbox 
                id="privacy" 
                checked={privacyAccepted}
                onCheckedChange={(checked) => {
                  setPrivacyAccepted(checked as boolean);
                  form.setValue('privacyAccepted', checked as boolean);
                }}
                className="mt-1"
                data-testid="checkbox-privacy"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="privacy"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  I agree to the{" "}
                  <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
                    <DialogTrigger asChild>
                      <span className="text-purple-400 cursor-pointer underline">Privacy Policy</span>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-black text-white border-gray-800">
                      <DialogHeader>
                        <DialogTitle>Maly Platforms Inc. DBA Maly – Privacy Policy</DialogTitle>
                        <DialogDescription className="text-muted-foreground">Effective Date: May 17, 2025</DialogDescription>
                      </DialogHeader>
                      <div className="text-sm space-y-4 mt-4 text-gray-300">
                        <p>Your privacy is important to us at Maly. This Privacy Policy explains how we collect, use, and protect your information when you use our platform.</p>
                        
                        <div>
                          <h3 className="font-bold mb-2 text-white">1. Information We Collect</h3>
                          <p>We collect information you provide directly (profile details, messages), usage data (interactions, event attendance), and device information.</p>
                        </div>
                        
                        <div>
                          <h3 className="font-bold mb-2 text-white">2. How We Use Your Information</h3>
                          <p>We use your information to provide services, facilitate connections, improve user experience, and send relevant notifications.</p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </label>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SignupFlowPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [signupData, setSignupData] = useState<SignupData>({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = (data: Partial<SignupData>) => {
    setSignupData(prev => ({ ...prev, ...data }));
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit(data);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      setLocation("/auth");
    }
  };

  const handleSubmit = async (finalData: Partial<SignupData>) => {
    const completeData = { ...signupData, ...finalData };
    setIsSubmitting(true);

    try {
      // Step 1: Upload multiple profile images if any were selected
      let uploadedImageUrls: string[] = [];
      
      if (completeData.profileImages && completeData.profileImages.length > 0) {
        const imageFormData = new FormData();
        completeData.profileImages.forEach((image: File) => {
          imageFormData.append('images', image);
        });
        
        // Upload without auth headers since user isn't logged in yet
        const imageResponse = await fetch('/api/upload-images-public', {
          method: 'POST',
          body: imageFormData
        });
        
        if (!imageResponse.ok) {
          throw new Error('Failed to upload profile images');
        }
        
        const imageResult = await imageResponse.json();
        uploadedImageUrls = imageResult.imageUrls || [];
      }

      // Step 2: Create registration data with uploaded image URLs
      const registrationData = new FormData();
      
      // Add all fields
      if (completeData.fullName) registrationData.append('fullName', completeData.fullName);
      if (completeData.username) registrationData.append('username', completeData.username);
      if (completeData.email) registrationData.append('email', completeData.email);
      if (completeData.phoneNumber) registrationData.append('phoneNumber', completeData.phoneNumber);
      if (completeData.password) registrationData.append('password', completeData.password);
      if (completeData.age) registrationData.append('age', completeData.age);
      if (completeData.gender) registrationData.append('gender', completeData.gender);
      if (completeData.sexualOrientation) registrationData.append('sexualOrientation', completeData.sexualOrientation);
      if (completeData.location) registrationData.append('location', completeData.location);
      if (completeData.birthLocation) registrationData.append('birthLocation', completeData.birthLocation);
      if (completeData.livedLocation) registrationData.append('livedLocation', completeData.livedLocation);
      if (completeData.nextLocation) registrationData.append('nextLocation', completeData.nextLocation);
      if (completeData.intention) registrationData.append('intention', completeData.intention);
      if (completeData.profession) registrationData.append('profession', completeData.profession);
      if (completeData.bio) registrationData.append('bio', completeData.bio);
      
      // Add vibes as both interests and currentMoods for consistency
      if (completeData.vibes && completeData.vibes.length > 0) {
        registrationData.append('currentMoods', JSON.stringify(completeData.vibes));
      }
      
      // Add uploaded image URLs
      if (uploadedImageUrls.length > 0) {
        registrationData.append('profileImages', JSON.stringify(uploadedImageUrls));
        // Set first image as main profile image for backward compatibility
        registrationData.append('profileImage', uploadedImageUrls[0]);
      }

      const response = await fetch('/api/register-redirect', {
        method: 'POST',
        body: registrationData,
        credentials: 'include',
        redirect: 'manual'
      });
      
      // Handle redirect responses (3xx status codes)
      if (response.type === 'opaqueredirect' || response.status >= 300 && response.status < 400) {
        // Wait a moment for session to be established, then navigate
        setTimeout(() => {
          window.location.href = '/discover';
        }, 100);
      } else if (response.ok) {
        // Direct success without redirect
        window.location.href = '/discover';
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred during registration",
      });
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1BasicInfo data={signupData} onNext={handleNext} onBack={handleBack} />;
      case 2:
        return <Step2Demographics data={signupData} onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <Step3Locations data={signupData} onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <Step4Preferences data={signupData} onNext={handleNext} onBack={handleBack} />;
      case 5:
        return <Step5ProfileCompletion data={signupData} onNext={handleNext} onBack={handleBack} />;
      default:
        return <Step1BasicInfo data={signupData} onNext={handleNext} onBack={handleBack} />;
    }
  };

  return renderStep();
}
