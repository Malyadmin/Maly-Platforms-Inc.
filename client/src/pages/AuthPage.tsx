import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ExternalLink, Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { z } from "zod";
import { Logo } from "@/components/ui/logo";
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
import { useTranslation } from "@/lib/translations";

const loginSchema = z.object({
  username: z.string().min(3, "Username or email must be provided"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().optional(), // Changed to "name" in the UI but keeping field name the same in schema
  location: z.string().optional(),
  interests: z.string().optional(), // Changed to vibe/mood filters in UI
  age: z.string().optional(),
  profileImage: z.any().optional(), // For profile picture upload
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms and Conditions to register" }),
  }),
  privacyAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Privacy Policy to register" }),
  }),
});

// Mood style definitions for consistent visual appearance
const moodStyles = {
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

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    location: "",
    interests: "",
    age: "",
    profileImage: null as File | null,
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReplitEnv, setIsReplitEnv] = useState(false);
  const [replitData, setReplitData] = useState<any>(null);
  const { login, register, user } = useUser();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  
  // If user is already logged in, redirect to home page
  useEffect(() => {
    // Use cached data first instead of making an API call
    const cachedUser = localStorage.getItem('maly_user_data');
    if (cachedUser) {
      try {
        // Check if cached user data exists and is valid JSON
        JSON.parse(cachedUser);
        console.log("Cached user found, redirecting to homepage");
        setLocation("/");
        return;
      } catch (e) {
        // Invalid JSON in cache, will continue with normal flow
        localStorage.removeItem('maly_user_data');
      }
    }
    
    // If we already have user data in the React state, redirect without making another request
    if (user) {
      console.log("User found in state, redirecting to homepage");
      setLocation("/");
    }
    // We don't need to check auth status here since we're already on the auth page
    // The user will need to log in
  }, [user, setLocation]);
  
  // Check if we're in a Replit environment
  useEffect(() => {
    const checkReplitEnvironment = async () => {
      try {
        const response = await fetch('/api/replit-info');
        const data = await response.json();
        setIsReplitEnv(data.isReplit);
        if (data.isReplit) {
          setReplitData({
            replId: data.replId,
            owner: data.owner,
            slug: data.slug
          });
        }
      } catch (error) {
        console.error('Error checking Replit environment:', error);
      }
    };
    
    checkReplitEnvironment();
  }, []);

  const validateForm = () => {
    try {
      if (isLogin) {
        loginSchema.parse(formData);
      } else {
        // Include terms and privacy acceptance in validation
        registerSchema.parse({
          ...formData,
          termsAccepted,
          privacyAccepted
        });
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error.errors[0].message,
        });
      }
      return false;
    }
  };

  // Check for error messages in URL when component mounts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.replace(/\+/g, ' '),
      });
      // Clear the error from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Type cast to avoid type issues
      setFormData(prev => ({ ...prev, profileImage: file }));
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleMoodToggle = (mood: string) => {
    setSelectedMoods(prev => {
      if (prev.includes(mood)) {
        return prev.filter(m => m !== mood);
      } else {
        return [...prev, mood];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // For login, use traditional form submission
      if (isLogin) {
        const loginForm = document.createElement('form');
        loginForm.method = 'POST';
        loginForm.action = '/api/login-redirect';
        
        // Add form fields
        const usernameInput = document.createElement('input');
        usernameInput.type = 'hidden';
        usernameInput.name = 'username';
        usernameInput.value = formData.username;
        loginForm.appendChild(usernameInput);
        
        const passwordInput = document.createElement('input');
        passwordInput.type = 'hidden';
        passwordInput.name = 'password';
        passwordInput.value = formData.password;
        loginForm.appendChild(passwordInput);
        
        document.body.appendChild(loginForm);
        loginForm.submit();
        return; // Early return for login
      }
      
      // For registration with file upload, use FormData and fetch
      // This approach works best when there's a file to upload
      const registrationData = new FormData();
      
      // Add all regular form fields except profileImage
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'profileImage' && value !== undefined && value !== null && value !== '') {
          registrationData.append(key, value as string);
        }
      });
      
      // Add moods as interests
      if (selectedMoods.length > 0) {
        registrationData.append('interests', JSON.stringify(selectedMoods));
      }
      
      // Add profile image if present
      if (formData.profileImage) {
        registrationData.append('profileImage', formData.profileImage);
        console.log("Added profile image to form data:", formData.profileImage.name);
      }
      
      // We're using fetch API with FormData for proper file handling
      try {
        const response = await fetch('/api/register-redirect', {
          method: 'POST',
          body: registrationData
        });
        
        if (response.redirected) {
          window.location.href = response.url;
        } else if (response.ok) {
          window.location.href = '/';
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Registration failed');
        }
      } catch (fetchError: any) {
        console.error("Fetch error during registration:", fetchError);
        throw fetchError;
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred",
      });
      setIsSubmitting(false);
    }
  };
  
  // Function to handle Replit profile setup
  const handleReplitProfileSetup = () => {
    // Navigate to the Replit profile setup page
    setLocation("/replit-profile");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 flex items-center justify-center w-full">
        <Logo className="h-12 w-auto" />
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? t('login') : t('register')}</CardTitle>
          <CardDescription>
            {isLogin 
              ? t('signInToAccount')
              : t('createNewAccount')
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{isLogin ? t('usernameOrEmail') : t('username')}</Label>
              <Input
                id="username"
                required
                placeholder={isLogin ? t('enterUsernameOrEmail') : t('enterUsername')}
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder={t('enterEmail')}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder={t('enterPassword')}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('name')}</Label>
                  <Input
                    id="fullName"
                    placeholder={t('enterName')}
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">{t('age')} <span className="text-xs text-muted-foreground">{t('willNotBeDisplayed')}</span></Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder={t('enterAge')}
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">{t('location')}</Label>
                  <Input
                    id="location"
                    placeholder={t('whereAreYouBased')}
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="moods">{t('chooseYourVibe')}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {VIBE_AND_MOOD_TAGS.map(mood => {
                      const isSelected = selectedMoods.includes(mood);
                      // @ts-ignore - Type safety handled through known values
                      const moodStyle = moodStyles[mood] || "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30";
                      
                      return (
                        <Badge
                          key={mood}
                          className={`cursor-pointer transition-all ${isSelected ? moodStyle + ' font-medium' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                          onClick={() => handleMoodToggle(mood)}
                        >
                          {mood}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profileImage">{t('profilePicture')}</Label>
                  {imagePreview && (
                    <div className="mb-2">
                      <img 
                        src={imagePreview} 
                        alt={t('profilePreview')}
                        className="w-24 h-24 rounded-full object-cover border"
                      />
                    </div>
                  )}
                  <Input
                    id="profileImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                </div>
              </>
            )}

            {!isLogin && (
              <div className="space-y-3 mb-4">
                {/* Terms and Conditions Checkbox */}
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                    className="mt-1"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {t('iAgreeToThe')}{" "}
                      <Dialog open={showTerms} onOpenChange={setShowTerms}>
                        <DialogTrigger asChild>
                          <span className="text-primary cursor-pointer underline">{t('termsAndConditions')}</span>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Maly Platforms Inc. DBA Maly – Terms and Conditions</DialogTitle>
                            <DialogDescription>Effective Date: May 17, 2025</DialogDescription>
                          </DialogHeader>
                          <div className="text-sm space-y-4 mt-4">
                            <p>Welcome to Maly Platforms Inc. ("Maly"). These Terms and Conditions govern your use of our mobile application and website platform. By accessing or using Maly, you agree to be bound by these terms.</p>
                            
                            <div>
                              <h3 className="font-bold mb-2">1. Eligibility</h3>
                              <p>You must be at least 18 years old to use Maly. By using the platform, you confirm that you are legally permitted to use the service under your local jurisdiction.</p>
                            </div>
                            
                            <div>
                              <h3 className="font-bold mb-2">2. User Content</h3>
                              <p>You are responsible for any content you upload, including profile information, event listings, and messages. By submitting content, you grant Maly a worldwide, non-exclusive, royalty-free license to use, display, and distribute this content on our platform and promotional materials.</p>
                            </div>
                            
                            <div>
                              <h3 className="font-bold mb-2">3. Community Standards</h3>
                              <p>To maintain a respectful environment, users may not post offensive, obscene, discriminatory, or misleading content. Maly reserves the right to remove content or suspend accounts in violation of our guidelines.</p>
                            </div>
                            
                            <div>
                              <h3 className="font-bold mb-2">4. Event Participation</h3>
                              <p>If you attend or create events through Maly, you acknowledge that you do so at your own risk. Maly is not responsible for any harm, injury, or liability arising from user-created or attended events.</p>
                            </div>
                            
                            <div>
                              <h3 className="font-bold mb-2">5. Third-Party Links</h3>
                              <p>Maly may include links to third-party services. We are not responsible for the content, terms, or privacy practices of those external services.</p>
                            </div>
                            
                            <div>
                              <h3 className="font-bold mb-2">6. Subscription and Billing</h3>
                              <p>Some features may be offered as paid subscriptions. By subscribing, you agree to recurring charges unless you cancel prior to the next billing cycle. Cancellations can be managed via your account settings.</p>
                            </div>
                            
                            <div>
                              <h3 className="font-bold mb-2">7. Modifications</h3>
                              <p>Maly may update these terms at any time. Continued use after changes means you accept the revised terms.</p>
                            </div>
                            
                            <div>
                              <h3 className="font-bold mb-2">8. Termination</h3>
                              <p>We reserve the right to suspend or terminate your access for violations of these terms.</p>
                            </div>
                            
                            <div>
                              <h3 className="font-bold mb-2">9. Limitation of Liability</h3>
                              <p>To the fullest extent permitted by law, Maly shall not be liable for any indirect, incidental, special, or consequential damages arising from the use of the platform.</p>
                            </div>
                            
                            <div>
                              <h3 className="font-bold mb-2">10. Governing Law</h3>
                              <p>These terms are governed by and construed in accordance with the laws of the State of Delaware, USA, without regard to conflict of law principles.</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </label>
                  </div>
                </div>
                
                {/* Privacy Policy Checkbox */}
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="privacy" 
                    checked={privacyAccepted}
                    onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                    className="mt-1"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="privacy"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {t('iAgreeToThe')}{" "}
                      <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
                        <DialogTrigger asChild>
                          <span className="text-primary cursor-pointer underline">{t('privacyPolicy')}</span>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Maly Platforms Inc. DBA Maly – Privacy Policy</DialogTitle>
                            <DialogDescription>Effective Date: May 17, 2025</DialogDescription>
                          </DialogHeader>
                          <div className="text-sm space-y-4 mt-4">
                            <p>This Privacy Policy explains how Maly Platforms Inc. ("Maly") collects, uses, and protects your personal data when you use our mobile and web-based services.</p>
                            
                            <div>
                              <h3 className="font-bold mb-2">1. Information We Collect</h3>
                              <ul className="list-disc pl-6 space-y-1">
                                <li>Profile details (name, email, photo, etc.)</li>
                                <li>Location data (with your permission)</li>
                                <li>Content you submit (event listings, messages)</li>
                                <li>Device and usage data (IP, browser, interactions)</li>
                              </ul>
                            </div>
                            
                            <div>
                              <h3 className="font-bold mb-2">2. How We Use Your Data</h3>
                              <ul className="list-disc pl-6 space-y-1">
                                <li>To operate and improve our services</li>
                                <li>To personalize content and event recommendations</li>
                                <li>To communicate with you about updates, offers, and feedback</li>
                                <li>To ensure safety and prevent abuse</li>
                              </ul>
                            </div>
                            
                            <div>
                              <h3 className="font-bold mb-2">3. Sharing Your Data</h3>
                              <ul className="list-disc pl-6 space-y-1">
                                <li>With service providers who help us operate (e.g., hosting, analytics)</li>
                                <li>With your consent (e.g., when sharing an event publicly)</li>
                                <li>If required by law</li>
                              </ul>
                            </div>
                            
                            <div>
                              <h3 className="font-bold mb-2">4. Your Choices</h3>
                              <ul className="list-disc pl-6 space-y-1">
                                <li>You can update your profile and communication settings at any time.</li>
                                <li>You can request to delete your account and associated data.</li>
                              </ul>
                            </div>
                            
                            <div>
                              <h3 className="font-bold mb-2">5. Data Security</h3>
                              <p>We implement appropriate technical and organizational measures to protect your data.</p>
                            </div>
                            
                            <div>
                              <h3 className="font-bold mb-2">6. Children's Privacy</h3>
                              <p>Maly is not intended for users under 18. We do not knowingly collect data from minors.</p>
                            </div>
                            
                            <div>
                              <h3 className="font-bold mb-2">7. Changes to this Policy</h3>
                              <p>We may update this policy as our services evolve. Material changes will be communicated via the app or email.</p>
                            </div>
                            
                            <div>
                              <h3 className="font-bold mb-2">8. Contact</h3>
                              <p>If you have questions, contact us at: support@malyapp.com</p>
                            </div>
                            
                            <div>
                              <h3 className="font-bold mb-2">9. International Users and GDPR/LGPD Compliance</h3>
                              <p>If you are a resident of the European Union (EU) or Brazil, you are entitled to certain rights under the General Data Protection Regulation (GDPR) or the Lei Geral de Proteção de Dados (LGPD), respectively. These rights include:</p>
                              <ul className="list-disc pl-6 space-y-1 mt-2">
                                <li>The right to access, correct, or delete your personal data</li>
                                <li>The right to object to or restrict the processing of your data</li>
                                <li>The right to data portability</li>
                                <li>The right to withdraw your consent at any time, where applicable</li>
                              </ul>
                              <p className="mt-2">We collect and process your personal data only where we have legal bases to do so, including your consent, to fulfill our contractual obligations to you, and based on our legitimate interests in operating and improving Maly.</p>
                              <p className="mt-2">Please note that your data may be transferred to and processed in the United States. We take appropriate safeguards to ensure your information is treated securely and in accordance with applicable data protection laws.</p>
                              <p className="mt-2">To exercise your rights or contact us with questions about our privacy practices, please reach out to us at:</p>
                              <p>support@malyapp.com</p>
                              <p>Subject: Data Privacy Request</p>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || (!isLogin && (!termsAccepted || !privacyAccepted))}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLogin ? (
                t('login')
              ) : (
                t('register')
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button
            variant="ghost"
            type="button"
            className="w-full"
            onClick={() => {
              if (isLogin) {
                setLocation("/signup");
              } else {
                setIsLogin(true);
              }
            }}
            disabled={isSubmitting}
          >
            {isLogin
              ? `${t('dontHaveAccount')} ${t('register')}`
              : `${t('alreadyHaveAccount')} ${t('login')}`}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}