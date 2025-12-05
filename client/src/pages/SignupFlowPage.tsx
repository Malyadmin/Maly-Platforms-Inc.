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
import { useTranslation } from "@/lib/translations";

// Step schemas with mandatory/optional field distinctions
const step1Schema = z.object({
  fullName: z.string().min(1, "Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().optional(), // Optional
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  age: z.string().min(1, "Age is required"),
  gender: z.string().min(1, "Gender is required"),
  sexualOrientation: z.string().optional(), // Optional
});

const step3Schema = z.object({
  location: z.string().min(1, "Current location is required"),
  birthLocation: z.string().optional(), // Optional
  livedLocation: z.string().optional(), // Optional
  nextLocation: z.string().optional(), // Optional
});

const step4Schema = z.object({
  vibes: z.array(z.string()).min(2, "Please select at least 2 vibes"),
  intention: z.string().min(1, "Please select an intention"),
  profession: z.string().optional(), // Optional
});

const step5Schema = z.object({
  bio: z.string().optional(), // Optional
  profileImage: z.any().optional(),
  hasProfileImage: z.boolean().refine((val) => val === true, {
    message: "A profile photo is required",
  }),
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

interface StepProps {
  data: SignupData;
  onNext: (data: Partial<SignupData>) => void;
  onBack?: () => void;
}

// Step 1: Basic Account Info
function Step1BasicInfo({ data, onNext, onBack }: StepProps) {
  const { t } = useTranslation();
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto logo-adaptive"
          />
        </div>
        
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center text-foreground"
                  data-testid="button-back"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>{t('signupSpaced')}</h2>
            </div>
            
            <Button
              type="submit"
              form="step1-form"
              variant="outline"
              size="sm"
              className="rounded-full border-border bg-muted/30 text-foreground hover:bg-muted/50 px-4 py-2"
              data-testid="button-next"
            >
              {t('next')}
            </Button>
          </div>
        </div>
      </div>
      
      <ProgressBar currentStep={1} totalSteps={5} />

      <div className="p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-light mb-2">{t('welcomeToMaly')}</h2>
          <p className="text-muted-foreground text-sm">{t('step1Instruction')}</p>
        </div>

        <form 
          id="step1-form" 
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="space-y-2">
            <label className="text-foreground font-medium">{t('name')}</label>
            <Input
              {...form.register("fullName")}
              placeholder={t('yourFullName')}
              className="bg-muted border-border text-foreground placeholder-muted-foreground focus:border-primary"
              data-testid="input-fullName"
            />
            {form.formState.errors.fullName && (
              <p className="text-red-500 text-sm">{form.formState.errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-foreground font-medium">{t('username')}</label>
            <Input
              {...form.register("username")}
              placeholder={t('chooseUsername')}
              className="bg-muted border-border text-foreground placeholder-muted-foreground focus:border-primary"
              autoCapitalize="none"
              autoCorrect="off"
              data-testid="input-username"
            />
            {form.formState.errors.username && (
              <p className="text-red-500 text-sm">{form.formState.errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-foreground font-medium">{t('email')}</label>
            <Input
              {...form.register("email")}
              type="email"
              placeholder="your.email@example.com"
              className="bg-muted border-border text-foreground placeholder-muted-foreground focus:border-primary"
              autoCapitalize="none"
              autoCorrect="off"
              data-testid="input-email"
            />
            {form.formState.errors.email && (
              <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-foreground font-medium">{t('phoneNumber')} <span className="text-muted-foreground text-sm font-normal">* {t('optional')}</span></label>
            <Input
              {...form.register("phoneNumber")}
              type="tel"
              placeholder="+1 234 567 8900"
              className="bg-muted border-border text-foreground placeholder-muted-foreground focus:border-primary"
              data-testid="input-phoneNumber"
            />
          </div>

          <div className="space-y-2">
            <label className="text-foreground font-medium">{t('password')}</label>
            <div className="relative">
              <Input
                {...form.register("password")}
                type={showPassword ? "text" : "password"}
                placeholder={t('choosePassword')}
                className="bg-muted border-border text-foreground placeholder-muted-foreground focus:border-primary pr-10"
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
            <label className="text-foreground font-medium">{t('confirmPasswordLabel')}</label>
            <div className="relative">
              <Input
                {...form.register("confirmPassword")}
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t('confirmPasswordLabel')}
                className="bg-muted border-border text-foreground placeholder-muted-foreground focus:border-primary pr-10"
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
  const { t } = useTranslation();
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto logo-adaptive"
          />
        </div>
        
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center text-foreground"
                data-testid="button-back"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>{t('signupSpaced')}</h2>
            </div>
            
            <Button
              type="submit"
              form="step2-form"
              variant="outline"
              size="sm"
              className="rounded-full border-border bg-muted/30 text-foreground hover:bg-muted/50 px-4 py-2"
              data-testid="button-next"
            >
              {t('next')}
            </Button>
          </div>
        </div>
      </div>
      
      <ProgressBar currentStep={2} totalSteps={5} />

      <div className="p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-light mb-2">{t('tellUsAboutYourself')}</h2>
          <p className="text-muted-foreground text-sm">{t('step2Instruction')}</p>
        </div>

        <form 
          id="step2-form" 
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="space-y-2">
            <label className="text-foreground font-medium">{t('age')}</label>
            <Input
              {...form.register("age")}
              type="number"
              placeholder={t('selectAge')}
              className="bg-muted border-border text-foreground placeholder-muted-foreground focus:border-primary"
              data-testid="input-age"
            />
            {form.formState.errors.age && (
              <p className="text-red-500 text-sm">{form.formState.errors.age.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-foreground font-medium">{t('gender')}</label>
            <select
              {...form.register("gender")}
              className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 focus:border-primary"
              data-testid="select-gender"
            >
              <option value="">{t('selectGender')}</option>
              <option value="male">{t('male')}</option>
              <option value="female">{t('female')}</option>
              <option value="non-binary">{t('nonBinary')}</option>
              <option value="prefer-not-to-say">{t('preferNotToSay')}</option>
            </select>
            {form.formState.errors.gender && (
              <p className="text-red-500 text-sm">{form.formState.errors.gender.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-foreground font-medium">{t('sexualOrientation')} <span className="text-muted-foreground text-sm font-normal">* {t('optional')}</span></label>
            <select
              {...form.register("sexualOrientation")}
              className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 focus:border-primary"
              data-testid="select-sexualOrientation"
            >
              <option value="">{t('selectOrientation')}</option>
              <option value="straight">{t('straight')}</option>
              <option value="gay">{t('gay')}</option>
              <option value="lesbian">{t('lesbian')}</option>
              <option value="bisexual">{t('bisexual')}</option>
              <option value="pansexual">{t('pansexual')}</option>
              <option value="asexual">{t('asexual')}</option>
              <option value="queer">{t('queer')}</option>
              <option value="questioning">{t('questioning')}</option>
              <option value="prefer-not-to-say">{t('preferNotToSay')}</option>
            </select>
          </div>
        </form>
      </div>
    </div>
  );
}

// Step 3: Locations
function Step3Locations({ data, onNext, onBack }: StepProps) {
  const { t } = useTranslation();
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto logo-adaptive"
          />
        </div>
        
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center text-foreground"
                data-testid="button-back"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>{t('signupSpaced')}</h2>
            </div>
            
            <Button
              type="submit"
              form="step3-form"
              variant="outline"
              size="sm"
              className="rounded-full border-border bg-muted/30 text-foreground hover:bg-muted/50 px-4 py-2"
              data-testid="button-next"
            >
              {t('next')}
            </Button>
          </div>
        </div>
      </div>
      
      <ProgressBar currentStep={3} totalSteps={5} />

      <div className="p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-light mb-2">{t('whereAreYouBased')}</h2>
          <p className="text-muted-foreground text-sm">{t('step3Instruction')}</p>
        </div>

        <form 
          id="step3-form" 
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <div className="space-y-2">
            <label className="text-foreground font-medium">{t('currentLocation')}</label>
            <Input
              {...form.register("location")}
              placeholder={t('enterCurrentCity')}
              className="bg-muted border-border text-foreground placeholder-muted-foreground focus:border-primary"
              data-testid="input-location"
            />
            {form.formState.errors.location && (
              <p className="text-red-500 text-sm">{form.formState.errors.location.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-foreground font-medium">{t('bornIn')} <span className="text-muted-foreground text-sm font-normal">* {t('optional')}</span></label>
            <Input
              {...form.register("birthLocation")}
              placeholder={t('enterBirthplace')}
              className="bg-muted border-border text-foreground placeholder-muted-foreground focus:border-primary"
              data-testid="input-birthLocation"
            />
          </div>

          <div className="space-y-2">
            <label className="text-foreground font-medium">{t('livedIn')} <span className="text-muted-foreground text-sm font-normal">* {t('optional')}</span></label>
            <Input
              {...form.register("livedLocation")}
              placeholder={t('enterPreviousCity')}
              className="bg-muted border-border text-foreground placeholder-muted-foreground focus:border-primary"
              data-testid="input-livedLocation"
            />
          </div>

          <div className="space-y-2">
            <label className="text-foreground font-medium">{t('nextLocation')} <span className="text-muted-foreground text-sm font-normal">* {t('optional')}</span></label>
            <Input
              {...form.register("nextLocation")}
              placeholder={t('enterNextDestination')}
              className="bg-muted border-border text-foreground placeholder-muted-foreground focus:border-primary"
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
  const { t } = useTranslation();
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto logo-adaptive"
          />
        </div>
        
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center text-foreground"
                data-testid="button-back"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>{t('signupSpaced')}</h2>
            </div>
            
            <Button
              type="submit"
              form="step4-form"
              variant="outline"
              size="sm"
              className="rounded-full border-border bg-muted/30 text-foreground hover:bg-muted/50 px-4 py-2"
              data-testid="button-next"
            >
              {t('next')}
            </Button>
          </div>
        </div>
      </div>
      
      <ProgressBar currentStep={4} totalSteps={5} />

      <div className="p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-light mb-2">{t('yourVibeYourWorld')}</h2>
          <p className="text-muted-foreground text-sm">{t('step4Instruction')}</p>
        </div>

        <form 
          id="step4-form" 
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          <div className="space-y-3">
            <label className="text-foreground font-medium">{t('yourVibes')} <span className="text-muted-foreground text-sm font-normal">({t('selectAtLeast2')})</span></label>
            <div className="flex flex-wrap gap-2">
              {VIBE_AND_MOOD_TAGS.map(vibe => {
                const isSelected = selectedVibes.includes(vibe);
                
                return (
                  <Badge
                    key={vibe}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${isSelected ? "bg-primary hover:bg-primary/90" : "hover:bg-muted"}`}
                    onClick={() => handleVibeToggle(vibe)}
                    data-testid={`badge-vibe-${vibe.replace(/\s+/g, '-')}`}
                  >
                    {vibe}
                  </Badge>
                );
              })}
            </div>
            {form.formState.errors.vibes && (
              <p className="text-red-500 text-sm">{form.formState.errors.vibes.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-foreground font-medium">{t('intention')}</label>
            <select
              {...form.register("intention")}
              className="w-full bg-muted border border-border text-foreground rounded-md px-3 py-2 focus:border-primary"
              data-testid="select-intention"
            >
              <option value="">{t('whatAreYouLookingFor')}</option>
              <option value="dating">{t('dating')}</option>
              <option value="social">{t('social')}</option>
              <option value="networking">{t('networking')}</option>
              <option value="friends">{t('friends')}</option>
              <option value="community">{t('community')}</option>
            </select>
            {form.formState.errors.intention && (
              <p className="text-red-500 text-sm">{form.formState.errors.intention.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-foreground font-medium">{t('profession')} <span className="text-muted-foreground text-sm font-normal">* {t('optional')}</span></label>
            <Input
              {...form.register("profession")}
              placeholder={t('enterProfession')}
              className="bg-muted border-border text-foreground placeholder-muted-foreground focus:border-primary"
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
  const { t } = useTranslation();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(step5Schema),
    defaultValues: {
      bio: data.bio || "",
      profileImage: data.profileImage || null,
      hasProfileImage: false,
      termsAccepted: false,
      privacyAccepted: false,
    },
  });

  const handleImagesChange = (newImages: File[], newPreviews: string[]) => {
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
    form.setValue('hasProfileImage', newImages.length > 0);
    if (newImages.length > 0) {
      setPhotoError(false);
    }
  };

  const onSubmit = (formData: any) => {
    if (selectedImages.length === 0) {
      setPhotoError(true);
      return;
    }
    if (!termsAccepted || !privacyAccepted) {
      return;
    }
    onNext({ ...formData, profileImages: selectedImages, termsAccepted, privacyAccepted });
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="border-b border-border">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto logo-adaptive"
          />
        </div>
        
        <div className="px-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center text-foreground"
                data-testid="button-back"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>{t('signupSpaced')}</h2>
            </div>
            
            <button
              type="submit"
              form="step5-form"
              className="text-foreground font-medium"
              data-testid="button-create"
            >
              {t('submitProfile')}
            </button>
          </div>
        </div>
      </div>
      
      <ProgressBar currentStep={5} totalSteps={5} />

      <div className="p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-light mb-2">{t('makeProfileShine')}</h2>
          <p className="text-muted-foreground text-sm">{t('step5Instruction')}</p>
        </div>

        <form 
          id="step5-form" 
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          <div className="space-y-3">
            <label className="text-foreground font-medium">{t('profilePhoto')} <span className="text-muted-foreground text-sm font-normal">({t('clearFaceRequired')})</span></label>
            <ProfileGallery
              images={selectedImages}
              imagePreviews={imagePreviews}
              onImagesChange={handleImagesChange}
              maxImages={7}
            />
            {photoError && (
              <p className="text-red-500 text-sm">{t('profilePhotoRequired')}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-foreground font-medium">{t('bio')} <span className="text-muted-foreground text-sm font-normal">* {t('optional')}</span></label>
            <Textarea
              {...form.register("bio")}
              placeholder={t('writeBio')}
              className="bg-muted border-border text-foreground placeholder-muted-foreground focus:border-primary min-h-[120px]"
              data-testid="input-bio"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
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
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-background text-foreground border-border">
                      <DialogHeader>
                        <DialogTitle>Maly Platforms Inc. DBA Maly – Terms and Conditions</DialogTitle>
                        <DialogDescription className="text-muted-foreground">Effective Date: May 17, 2025</DialogDescription>
                      </DialogHeader>
                      <div className="text-sm space-y-4 mt-4 text-muted-foreground">
                        <p>Welcome to Maly Platforms Inc. ("Maly"). These Terms and Conditions govern your use of our mobile application and website platform. By accessing or using Maly, you agree to be bound by these terms.</p>
                        
                        <div>
                          <h3 className="font-bold mb-2 text-foreground">1. Eligibility</h3>
                          <p>You must be at least 18 years old to use Maly. By using the platform, you confirm that you are legally permitted to use the service under your local jurisdiction.</p>
                        </div>
                        
                        <div>
                          <h3 className="font-bold mb-2 text-foreground">2. User Content</h3>
                          <p>You are responsible for any content you upload, including profile information, event listings, and messages. By submitting content, you grant Maly a worldwide, non-exclusive, royalty-free license to use, display, and distribute this content on our platform and promotional materials.</p>
                        </div>
                        
                        <div>
                          <h3 className="font-bold mb-2 text-foreground">3. Community Standards</h3>
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
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-background text-foreground border-border">
                      <DialogHeader>
                        <DialogTitle>Maly Platforms Inc. DBA Maly – Privacy Policy</DialogTitle>
                        <DialogDescription className="text-muted-foreground">Effective Date: May 17, 2025</DialogDescription>
                      </DialogHeader>
                      <div className="text-sm space-y-4 mt-4 text-muted-foreground">
                        <p>Your privacy is important to us at Maly. This Privacy Policy explains how we collect, use, and protect your information when you use our platform.</p>
                        
                        <div>
                          <h3 className="font-bold mb-2 text-foreground">1. Information We Collect</h3>
                          <p>We collect information you provide directly (profile details, messages), usage data (interactions, event attendance), and device information.</p>
                        </div>
                        
                        <div>
                          <h3 className="font-bold mb-2 text-foreground">2. How We Use Your Information</h3>
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
        // Set flag for new user welcome message
        localStorage.setItem('maly_new_user', 'true');
        // Wait a moment for session to be established, then navigate
        setTimeout(() => {
          window.location.href = '/discover?welcome=true';
        }, 100);
      } else if (response.ok) {
        // Set flag for new user welcome message
        localStorage.setItem('maly_new_user', 'true');
        // Direct success without redirect
        window.location.href = '/discover?welcome=true';
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
