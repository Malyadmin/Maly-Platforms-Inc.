import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RotateCcw, Plus, ImageIcon, Upload, Calendar, MapPin, Clock, Trash2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EventCreationStep, eventCreationSchema, step1Schema, step2Schema, step3Schema, step4Schema, step5Schema, step6Schema, type EventCreationData, type TicketTier, EVENT_VISIBILITY_OPTIONS, EVENT_PRIVACY_OPTIONS, GENDER_OPTIONS, VIBE_OPTIONS } from "../../../shared/eventCreation";
import { BottomNav } from "@/components/ui/bottom-nav";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useTranslation } from "@/lib/translations";

// Step 1: Basic Info Component
interface Step1Props {
  data: EventCreationData;
  onNext: (data: Partial<EventCreationData>) => void;
  onBack?: () => void;
}

function Step1BasicInfo({ data, onNext, onBack }: Step1Props) {
  const { t } = useTranslation();
  const form = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      title: data.title || "",
      summary: data.summary || "",
    },
  });

  const onSubmit = (formData: any) => {
    onNext(formData);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-gray-800">
        {/* MALY logo on left */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto"
          />
        </div>
        
        {/* Controls section */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-4">
            {onBack && (
              <BackButton onClick={onBack} className="text-foreground" />
            )}
            <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>{t('createSpaced')}</h2>
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <ProgressBar currentStep={EventCreationStep.BasicInfo} totalSteps={6} />

      {/* Content */}
      <div className="p-6 space-y-8">
        <div>
          <h2 className="text-2xl font-light mb-2">{t('createYourEvent')}</h2>
          <p className="text-muted-foreground text-sm">{t('promoteOrShare')}</p>
        </div>


        <form 
          id="step1-form" 
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          <div className="space-y-2">
            <label className="text-foreground font-medium">{t('eventTitle')}</label>
            <Input
              {...form.register("title")}
              placeholder={t('conciseAndEngaging')}
              className="bg-background border-gray-700 text-foreground placeholder-gray-500 focus:border-gray-500"
              data-testid="input-title"
            />
            {form.formState.errors.title && (
              <p className="text-red-500 text-sm">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-foreground font-medium">{t('eventSummary')}</label>
            <Textarea
              {...form.register("summary")}
              placeholder={t('briefOverview')}
              rows={5}
              className="bg-background border-gray-700 text-foreground placeholder-gray-500 focus:border-gray-500 resize-none"
              data-testid="textarea-summary"
            />
            {form.formState.errors.summary && (
              <p className="text-red-500 text-sm">{form.formState.errors.summary.message}</p>
            )}
          </div>
        </form>

        {/* Bottom spacing for mobile */}
        <div className="h-32"></div>
      </div>

      {/* Fixed Next Button */}
      <div className="fixed bottom-24 left-0 right-0 px-6 pb-8 bg-gradient-to-t from-black via-black to-transparent">
        <button
          type="submit"
          form="step1-form"
          className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 hover:from-purple-700 hover:via-pink-700 hover:to-red-600 text-white font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
          data-testid="button-next"
        >
          <ArrowRight className="h-5 w-5" />
          {t('next')}
        </button>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNav />
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
  const { t } = useTranslation();
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
          title: t('tooManyImages'),
          description: t('maxImagesAllowed')
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
        title: t('validationError'),
        description: t('atLeastOneImage')
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-gray-800">
        {/* MALY logo on left */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto"
          />
        </div>
        
        {/* Controls section */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-4">
            <BackButton onClick={onBack} className="text-foreground" />
            <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>{t('createSpaced')}</h2>
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <ProgressBar currentStep={EventCreationStep.Gallery} totalSteps={6} />

      {/* Content */}
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-light mb-2">{t('buildYourEventGallery')}</h2>
          <p className="text-muted-foreground text-sm mb-1">{t('addHighResPhotos')}</p>
          <p className="text-muted-foreground text-sm">{t('firstPictureFlyer')}</p>
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
                className="absolute top-2 right-2 bg-red-500 text-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs"
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
                      className="absolute top-1 right-1 bg-red-500 text-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label
                    className={`w-full h-full border-2 border-dashed ${isFirst ? 'border-yellow-400' : 'border-gray-600'} rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-500 transition-colors`}
                    htmlFor={`image-upload-${index}`}
                  >
                    <Plus className={`w-4 h-4 ${isFirst ? 'text-yellow-400' : 'text-muted-foreground'}`} />
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
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>• Up to 6 pictures, 1 mandatory</p>
          <p>• 1 video up to (file size)</p>
          <p>• Recommended (image size)</p>
          <p>• Maximum file size</p>
        </div>

        {/* Bottom spacing for mobile */}
        <div className="h-32"></div>
      </div>

      {/* Fixed Next Button */}
      <div className="fixed bottom-24 left-0 right-0 px-6 pb-8 bg-gradient-to-t from-black via-black to-transparent">
        <button
          onClick={onSubmit}
          className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 hover:from-purple-700 hover:via-pink-700 hover:to-red-600 text-white font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
          data-testid="button-next"
        >
          <ArrowRight className="h-5 w-5" />
          {t('next')}
        </button>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

// Step 3: Event Details Component
interface Step3Props {
  data: EventCreationData;
  onNext: (data: Partial<EventCreationData>) => void;
  onBack: () => void;
}

function Step3EventDetails({ data, onNext, onBack }: Step3Props) {
  const { t } = useTranslation();
  const form = useForm({
    resolver: zodResolver(step3Schema.extend({
      city: z.string().optional(),
      startDate: z.coerce.date().refine((date) => date > new Date(), "Start date must be in the future"),
      endDate: z.coerce.date(),
    }).refine((data) => data.endDate >= data.startDate, {
      message: "End date must be after start date",
      path: ["endDate"],
    }).refine((data) => {
      // Only require city if it's not an online event
      if (!data.isOnlineEvent && !data.city) {
        return false;
      }
      return true;
    }, {
      message: "City is required for physical events",
      path: ["city"],
    })),
    defaultValues: {
      isOnlineEvent: data.isOnlineEvent,
      eventVisibility: data.eventVisibility,
      city: data.city,
      addressLine1: data.addressLine1,
      additionalInfo: data.additionalInfo,
      startDate: data.startDate,
      endDate: data.endDate,
      addActivitySchedule: data.addActivitySchedule,
      agendaItems: data.agendaItems,
    },
  });

  const [agendaItems, setAgendaItems] = useState(data.agendaItems || []);
  const [isOnlineEvent, setIsOnlineEvent] = useState(data.isOnlineEvent);
  const [addActivitySchedule, setAddActivitySchedule] = useState(data.addActivitySchedule);
  const [cityQuery, setCityQuery] = useState(data.city || "");
  const [citySuggestions, setCitySuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const searchCities = async (query: string) => {
    if (query.length < 2) {
      setCitySuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
    if (!apiKey) {
      console.error("Geoapify API key not configured");
      return;
    }

    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&type=city&format=json&apiKey=${apiKey}`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        setCitySuggestions(data.results);
        setShowSuggestions(true);
      } else {
        setCitySuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Error fetching city suggestions:", error);
      setCitySuggestions([]);
    }
  };

  const handleCityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCityQuery(value);
    form.setValue("city", value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchCities(value);
    }, 300);
  };

  const selectCity = (city: any) => {
    const cityName = city.city || city.name || city.formatted;
    setCityQuery(cityName);
    form.setValue("city", cityName);
    setShowSuggestions(false);
    setCitySuggestions([]);
  };

  const addAgendaItem = () => {
    const newItem = { time: "", description: "" };
    setAgendaItems([...agendaItems, newItem]);
  };

  const removeAgendaItem = (index: number) => {
    setAgendaItems(agendaItems.filter((_, i) => i !== index));
  };

  const updateAgendaItem = (index: number, field: string, value: string) => {
    const updated = agendaItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setAgendaItems(updated);
  };

  const onSubmit = (formData: any) => {
    const submissionData = {
      ...formData,
      isOnlineEvent,
      addActivitySchedule,
      agendaItems: addActivitySchedule ? agendaItems : [],
      // Ensure city is included for online events
      city: isOnlineEvent ? "Online" : formData.city,
    };
    onNext(submissionData);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-gray-800">
        {/* MALY logo on left */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto"
          />
        </div>
        
        {/* Controls section */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-4">
            <BackButton onClick={onBack} className="text-foreground" />
            <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>{t('createSpaced')}</h2>
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <ProgressBar currentStep={EventCreationStep.EventDetails} totalSteps={6} />

      {/* Content */}
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-light mb-2">{t('eventDetails')}</h2>
          <p className="text-muted-foreground text-sm">{t('setLocationSchedule')}</p>
        </div>

        <Form {...form}>
          <form 
            id="step3-form" 
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
          {/* Online Event Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-foreground font-medium">{t('onlineEvent')}</label>
              <p className="text-muted-foreground text-sm">{t('hostedVirtually')}</p>
            </div>
            <Switch
              checked={isOnlineEvent}
              onCheckedChange={setIsOnlineEvent}
              data-testid="switch-online-event"
            />
          </div>

          {/* Event Visibility */}
          <FormField
            control={form.control}
            name="eventVisibility"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground font-medium">{t('eventVisibility')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background border-gray-700 text-foreground" data-testid="select-visibility">
                      <SelectValue placeholder={t('selectVisibility')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EVENT_VISIBILITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location Fields */}
          {!isOnlineEvent && (
            <>
              <div className="space-y-2 relative">
                <label className="text-foreground font-medium flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {t('city')}
                </label>
                <Input
                  value={cityQuery}
                  onChange={handleCityInputChange}
                  onFocus={() => cityQuery.length >= 2 && citySuggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder={t('startTypingCity')}
                  className="bg-background border-gray-700 text-foreground placeholder-gray-500 focus:border-gray-500"
                  data-testid="input-city"
                  autoComplete="off"
                />
                {showSuggestions && citySuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {citySuggestions.map((city, index) => (
                      <div
                        key={index}
                        onClick={() => selectCity(city)}
                        className="px-4 py-3 hover:bg-gray-800 cursor-pointer border-b border-gray-800 last:border-b-0"
                        data-testid={`city-suggestion-${index}`}
                      >
                        <div className="text-foreground text-sm">
                          {city.city || city.name}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {city.country}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {form.formState.errors.city && (
                  <p className="text-red-500 text-sm">{form.formState.errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-foreground font-medium">{t('venueAddress')}</label>
                <Input
                  {...form.register("addressLine1")}
                  placeholder={t('addressPlaceholder')}
                  className="bg-background border-gray-700 text-foreground placeholder-gray-500 focus:border-gray-500"
                  data-testid="input-address"
                />
              </div>

              <div className="space-y-2">
                <label className="text-foreground font-medium">{t('additionalLocationInfo')}</label>
                <Textarea
                  {...form.register("additionalInfo")}
                  placeholder={t('optionalFloorNotes')}
                  rows={3}
                  className="bg-background border-gray-700 text-foreground placeholder-gray-500 focus:border-gray-500 resize-none"
                  data-testid="textarea-additional-info"
                />
              </div>
            </>
          )}

          {/* Date and Time */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-foreground font-medium flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {t('startDateTime')}
              </label>
              <Input
                {...form.register("startDate")}
                type="datetime-local"
                className="bg-background border-gray-700 text-foreground focus:border-gray-500"
                data-testid="input-start-date"
              />
              {form.formState.errors.startDate && (
                <p className="text-red-500 text-sm">{form.formState.errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-foreground font-medium flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {t('endDateTime')}
              </label>
              <Input
                {...form.register("endDate")}
                type="datetime-local"
                className="bg-background border-gray-700 text-foreground focus:border-gray-500"
                data-testid="input-end-date"
              />
              {form.formState.errors.endDate && (
                <p className="text-red-500 text-sm">{form.formState.errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Activity Schedule Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-foreground font-medium">{t('activitySchedule')}</label>
              <p className="text-muted-foreground text-sm">{t('addItinerary')}</p>
            </div>
            <Switch
              checked={addActivitySchedule}
              onCheckedChange={setAddActivitySchedule}
              data-testid="switch-activity-schedule"
            />
          </div>

          {/* Agenda Items */}
          {addActivitySchedule && (
            <div className="space-y-4">
              <label className="text-foreground font-medium">{t('activitySchedule')}</label>
              
              {agendaItems.map((item, index) => (
                <div key={index} className="p-4 border border-gray-700 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Activity {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeAgendaItem(index)}
                      className="text-red-500 hover:text-red-400"
                      data-testid={`button-remove-agenda-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Time (e.g., 7:00 PM)"
                      value={item.time}
                      onChange={(e) => updateAgendaItem(index, "time", e.target.value)}
                      className="bg-background border-gray-600 text-foreground placeholder-gray-500"
                      data-testid={`input-agenda-time-${index}`}
                    />
                    <Input
                      placeholder="Activity description"
                      value={item.description}
                      onChange={(e) => updateAgendaItem(index, "description", e.target.value)}
                      className="bg-background border-gray-600 text-foreground placeholder-gray-500"
                      data-testid={`input-agenda-description-${index}`}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addAgendaItem}
                className="w-full border-2 border-dashed border-gray-600 rounded-lg p-4 text-center text-muted-foreground hover:border-gray-500 hover:text-gray-300 transition-colors"
                data-testid="button-add-agenda"
              >
                <Plus className="w-5 h-5 mx-auto mb-2" />
                {t('addActivity')}
              </button>
            </div>
          )}
          </form>
        </Form>

        {/* Bottom spacing */}
        <div className="h-32"></div>
      </div>

      {/* Fixed Next Button */}
      <div className="fixed bottom-24 left-0 right-0 px-6 pb-8 bg-gradient-to-t from-black via-black to-transparent">
        <button
          type="submit"
          form="step3-form"
          className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 hover:from-purple-700 hover:via-pink-700 hover:to-red-600 text-white font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
          data-testid="button-next"
        >
          <ArrowRight className="h-5 w-5" />
          {t('next')}
        </button>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

// Step 4: Event Specifics Component
interface Step4Props {
  data: EventCreationData;
  onNext: (data: Partial<EventCreationData>) => void;
  onBack: () => void;
}

function Step4EventSpecifics({ data, onNext, onBack }: Step4Props) {
  const { t } = useTranslation();
  const form = useForm({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      addEventLineup: data.addEventLineup,
      eventLineup: data.eventLineup,
      dressCode: data.dressCode,
      dressCodeDetails: data.dressCodeDetails,
    },
  });

  const [addEventLineup, setAddEventLineup] = useState(data.addEventLineup);
  const [dressCode, setDressCode] = useState(data.dressCode);

  const onSubmit = (formData: any) => {
    const submissionData = {
      ...formData,
      addEventLineup,
      dressCode,
      eventLineup: addEventLineup ? formData.eventLineup : [],
      dressCodeDetails: dressCode ? formData.dressCodeDetails : "",
    };
    onNext(submissionData);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-gray-800">
        {/* MALY logo on left */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto"
          />
        </div>
        
        {/* Controls section */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-4">
            <BackButton onClick={onBack} className="text-foreground" />
            <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>{t('createSpaced')}</h2>
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <ProgressBar currentStep={EventCreationStep.EventSpecifics} totalSteps={6} />

      {/* Content */}
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-light mb-2">Event specifics</h2>
          <p className="text-muted-foreground text-sm">Add lineup and dress code details</p>
        </div>

        <Form {...form}>
          <form 
            id="step4-form" 
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
          {/* Event Lineup Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-foreground font-medium">Add Event Lineup</label>
              <p className="text-muted-foreground text-sm">Feature hosts, performers, or speakers</p>
            </div>
            <Switch
              checked={addEventLineup}
              onCheckedChange={setAddEventLineup}
              data-testid="switch-event-lineup"
            />
          </div>

          {/* Event Lineup Details */}
          {addEventLineup && (
            <div className="space-y-4">
              <label className="text-foreground font-medium">Event Lineup</label>
              <div className="p-4 border border-gray-700 rounded-lg">
                <p className="text-muted-foreground text-sm mb-4">
                  Event lineup feature will allow you to showcase featured guests, performers, or speakers at your event.
                </p>
                <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">
                  <p className="text-gray-500">Lineup management coming soon</p>
                  <p className="text-xs text-gray-600 mt-2">You'll be able to add and feature event hosts here</p>
                </div>
              </div>
            </div>
          )}

          {/* Dress Code Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-foreground font-medium">Dress Code</label>
              <p className="text-muted-foreground text-sm">Set specific attire requirements</p>
            </div>
            <Switch
              checked={dressCode}
              onCheckedChange={setDressCode}
              data-testid="switch-dress-code"
            />
          </div>

          {/* Dress Code Details */}
          {dressCode && (
            <div className="space-y-2">
              <label className="text-foreground font-medium">Dress Code Details</label>
              <Textarea
                {...form.register("dressCodeDetails")}
                placeholder="Describe the dress code (e.g., Cocktail attire, Business casual, Themed costume, etc.)"
                rows={3}
                className="bg-background border-gray-700 text-foreground placeholder-gray-500 focus:border-gray-500 resize-none"
                data-testid="textarea-dress-code"
              />
            </div>
          )}
          </form>
        </Form>

        {/* Bottom spacing */}
        <div className="h-32"></div>
      </div>

      {/* Fixed Next Button */}
      <div className="fixed bottom-24 left-0 right-0 px-6 pb-8 bg-gradient-to-t from-black via-black to-transparent">
        <button
          type="submit"
          form="step4-form"
          className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 hover:from-purple-700 hover:via-pink-700 hover:to-red-600 text-white font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
          data-testid="button-next"
        >
          <ArrowRight className="h-5 w-5" />
          Next
        </button>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

// Step 5: Pricing & Audience Component
interface Step5Props {
  data: EventCreationData;
  onNext: (data: Partial<EventCreationData>) => void;
  onBack: () => void;
}

function Step5PricingAudience({ data, onNext, onBack }: Step5Props) {
  const { t } = useTranslation();
  const form = useForm({
    resolver: zodResolver(step5Schema),
    defaultValues: {
      isPaidEvent: data.isPaidEvent,
      ticketTiers: data.ticketTiers || [],
      eventPrivacy: data.eventPrivacy,
      whoShouldAttend: data.whoShouldAttend,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ticketTiers"
  });

  const [isPaidEvent, setIsPaidEvent] = useState(data.isPaidEvent);

  const onSubmit = (formData: any) => {
    const submissionData = {
      ...formData,
      isPaidEvent,
      ticketTiers: isPaidEvent ? formData.ticketTiers : [],
    };
    onNext(submissionData);
  };

  const addTier = () => {
    append({
      name: "",
      description: "",
      price: 0,
      quantity: undefined
    });
  };

  // Automatically add a tier when paid event is toggled on and no tiers exist
  const handlePaidEventToggle = (checked: boolean) => {
    setIsPaidEvent(checked);
    if (checked && fields.length === 0) {
      addTier();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-gray-800">
        {/* MALY logo on left */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto"
          />
        </div>
        
        {/* Controls section */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-4">
            <BackButton onClick={onBack} className="text-foreground" />
            <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>{t('createSpaced')}</h2>
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <ProgressBar currentStep={EventCreationStep.PricingAudience} totalSteps={6} />

      {/* Content */}
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-light mb-2">{t('ticketingSetup')}</h2>
          <p className="text-muted-foreground text-sm">{t('setTicketPrices')}</p>
        </div>

        <Form {...form}>
          <form 
            id="step5-form" 
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
          {/* Paid Event Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-foreground font-medium">{t('eventPaid')}</label>
              <p className="text-muted-foreground text-sm">{t('setTicketPrices')}</p>
            </div>
            <Switch
              checked={isPaidEvent}
              onCheckedChange={handlePaidEventToggle}
              data-testid="switch-paid-event"
            />
          </div>

          {/* Ticket Tiers */}
          {isPaidEvent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-foreground font-medium">{t('addTicketTier')}</label>
                <Button
                  type="button"
                  onClick={addTier}
                  className="bg-gray-800 hover:bg-gray-700 text-foreground"
                  data-testid="button-add-tier"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tier
                </Button>
              </div>
              
              {fields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No ticket tiers yet. Add a tier to get started.</p>
                </div>
              )}
              
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border border-gray-700 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-foreground font-medium">Tier {index + 1}</h4>
                    <Button
                      type="button"
                      onClick={() => remove(index)}
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      data-testid={`button-remove-tier-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-foreground text-sm">Name</label>
                      <Input
                        {...form.register(`ticketTiers.${index}.name`)}
                        placeholder="e.g., Early Bird, VIP"
                        className="bg-background border-gray-700 text-foreground placeholder-gray-500 focus:border-gray-500"
                        data-testid={`input-tier-name-${index}`}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-foreground text-sm">Price</label>
                      <Input
                        {...form.register(`ticketTiers.${index}.price`)}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="bg-background border-gray-700 text-foreground placeholder-gray-500 focus:border-gray-500"
                        data-testid={`input-tier-price-${index}`}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-foreground text-sm">Description (optional)</label>
                    <Textarea
                      {...form.register(`ticketTiers.${index}.description`)}
                      placeholder="What's included in this tier?"
                      rows={2}
                      className="bg-background border-gray-700 text-foreground placeholder-gray-500 focus:border-gray-500 resize-none"
                      data-testid={`textarea-tier-description-${index}`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-foreground text-sm">Quantity (optional)</label>
                    <Input
                      {...form.register(`ticketTiers.${index}.quantity`)}
                      type="number"
                      min="1"
                      placeholder="Leave empty for unlimited"
                      className="bg-background border-gray-700 text-foreground placeholder-gray-500 focus:border-gray-500"
                      data-testid={`input-tier-quantity-${index}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Event Privacy */}
          <FormField
            control={form.control}
            name="eventPrivacy"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground font-medium">Event Privacy</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background border-gray-700 text-foreground" data-testid="select-privacy">
                      <SelectValue placeholder="Select privacy level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {EVENT_PRIVACY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Who Should Attend */}
          <div className="space-y-2">
            <label className="text-foreground font-medium">Who Should Attend?</label>
            <Textarea
              {...form.register("whoShouldAttend")}
              placeholder="Describe your ideal attendees (e.g., Digital nomads, entrepreneurs, creative professionals, etc.)"
              rows={4}
              className="bg-background border-gray-700 text-foreground placeholder-gray-500 focus:border-gray-500 resize-none"
              data-testid="textarea-who-should-attend"
            />
          </div>
          </form>
        </Form>

        {/* Bottom spacing */}
        <div className="h-32"></div>
      </div>

      {/* Fixed Next Button */}
      <div className="fixed bottom-24 left-0 right-0 px-6 pb-8 bg-gradient-to-t from-black via-black to-transparent">
        <button
          type="submit"
          form="step5-form"
          className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 hover:from-purple-700 hover:via-pink-700 hover:to-red-600 text-white font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
          data-testid="button-next"
        >
          <ArrowRight className="h-5 w-5" />
          Next
        </button>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

// Step 6: Advanced Audience Targeting Component
interface Step6Props {
  data: EventCreationData;
  onNext: (data: Partial<EventCreationData>) => void;
  onBack: () => void;
}

function Step6AudienceTargeting({ data, onNext, onBack }: Step6Props) {
  const { t } = useTranslation();
  const form = useForm({
    resolver: zodResolver(step6Schema),
    defaultValues: {
      spotsAvailable: data.spotsAvailable,
      promotionOnly: data.promotionOnly,
      contactsOnly: data.contactsOnly,
      invitationOnly: data.invitationOnly,
      requireApproval: data.requireApproval,
      genderExclusive: data.genderExclusive,
      ageExclusiveMin: data.ageExclusiveMin,
      ageExclusiveMax: data.ageExclusiveMax,
      moodSpecific: data.moodSpecific,
      interestsSpecific: data.interestsSpecific,
      vibes: data.vibes || [],
    },
  });

  const [selectedVibes, setSelectedVibes] = useState<string[]>(data.vibes || []);

  const onSubmit = (formData: any) => {
    const submissionData = {
      ...formData,
      vibes: selectedVibes,
    };
    onNext(submissionData);
  };

  const toggleVibe = (vibeValue: string) => {
    setSelectedVibes(prev => {
      if (prev.includes(vibeValue)) {
        return prev.filter(v => v !== vibeValue);
      } else {
        return [...prev, vibeValue];
      }
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-gray-800">
        {/* MALY logo on left */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <img 
            src="/attached_assets/IMG_1849-removebg-preview_1758943125594.png" 
            alt="MÁLY" 
            className="h-14 w-auto"
          />
        </div>
        
        {/* Controls section */}
        <div className="px-5 pb-3">
          <div className="flex items-center gap-4">
            <BackButton onClick={onBack} className="text-foreground" />
            <h2 className="gradient-text text-lg font-medium uppercase" style={{ letterSpacing: '0.3em' }}>{t('createSpaced')}</h2>
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <ProgressBar currentStep={EventCreationStep.AudienceTargeting} totalSteps={6} />

      {/* Content */}
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-light mb-2">{t('eventSetup')}</h2>
          <p className="text-muted-foreground text-sm">{t('privacySettings')}</p>
        </div>

        <Form {...form}>
          <form 
            id="step6-form" 
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
          {/* Available Spots */}
          <div className="space-y-2">
            <label className="text-foreground font-medium">Available Spots</label>
            <Input
              {...form.register("spotsAvailable")}
              placeholder="e.g., 50 or unlimited"
              className="bg-background border-gray-700 text-foreground placeholder-gray-500 focus:border-gray-500"
              data-testid="input-spots-available"
            />
          </div>

          {/* Access Restrictions */}
          <div className="space-y-4">
            <label className="text-foreground font-medium">Access Restrictions</label>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-foreground">Promotion Only</span>
                <Switch
                  {...form.register("promotionOnly")}
                  data-testid="switch-promotion-only"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-foreground">Contacts Only</span>
                <Switch
                  {...form.register("contactsOnly")}
                  data-testid="switch-contacts-only"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-foreground">Invitation Only</span>
                <Switch
                  {...form.register("invitationOnly")}
                  data-testid="switch-invitation-only"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-foreground">{t('requiresApproval')}</span>
                <Switch
                  {...form.register("requireApproval")}
                  data-testid="switch-require-approval"
                />
              </div>
            </div>
          </div>

          {/* Gender Restrictions */}
          <FormField
            control={form.control}
            name="genderExclusive"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground font-medium">{t('genderRestrictions')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background border-gray-700 text-foreground" data-testid="select-gender">
                      <SelectValue placeholder="Select gender preference" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Age Restrictions */}
          <div className="space-y-4">
            <label className="text-foreground font-medium">Age Restrictions</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Minimum Age</label>
                <Input
                  {...form.register("ageExclusiveMin", { valueAsNumber: true })}
                  type="number"
                  placeholder="18"
                  className="bg-background border-gray-700 text-foreground placeholder-gray-500 focus:border-gray-500"
                  data-testid="input-min-age"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Maximum Age</label>
                <Input
                  {...form.register("ageExclusiveMax", { valueAsNumber: true })}
                  type="number"
                  placeholder="35"
                  className="bg-background border-gray-700 text-foreground placeholder-gray-500 focus:border-gray-500"
                  data-testid="input-max-age"
                />
              </div>
            </div>
          </div>

          {/* Vibe Selection */}
          <div className="space-y-4">
            <label className="text-foreground font-medium">{t('requiredVibes')}</label>
            <p className="text-xs text-muted-foreground">{t('selectVibes')}</p>
            <div className="grid grid-cols-2 gap-3">
              {VIBE_OPTIONS.map((vibe) => (
                <div
                  key={vibe.value}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedVibes.includes(vibe.value)
                      ? 'border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 p-[2px]'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => toggleVibe(vibe.value)}
                  data-testid={`vibe-option-${vibe.value}`}
                >
                  <div className={`${selectedVibes.includes(vibe.value) ? 'bg-background rounded-md p-3 -m-[2px]' : ''}`}>
                    <div className={`text-sm font-medium ${selectedVibes.includes(vibe.value) ? 'gradient-text' : 'text-gray-300'}`}>
                      {vibe.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {selectedVibes.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Selected: {selectedVibes.length} vibe{selectedVibes.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          </form>
        </Form>

        {/* Bottom spacing */}
        <div className="h-32"></div>
      </div>

      {/* Fixed Create Button */}
      <div className="fixed bottom-24 left-0 right-0 px-6 pb-8 bg-gradient-to-t from-black via-black to-transparent">
        <button
          type="submit"
          form="step6-form"
          className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 hover:from-purple-700 hover:via-pink-700 hover:to-red-600 text-white font-medium rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
          data-testid="button-create"
        >
          <ArrowRight className="h-5 w-5" />
          {t('createEvent')}
        </button>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

// Main Event Creation Flow Component
export default function CreateEventFlowPage() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<EventCreationStep>(EventCreationStep.BasicInfo);
  const { toast } = useToast();
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
    ticketTiers: [],
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
    vibes: [],
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
    console.log("🚀 Starting event submission...");
    try {
      // No need to check localStorage - we rely on session-based authentication
      // The session cookie will be automatically sent with credentials: 'include'

      // Prepare form data for multipart upload (handles images)
      const formData = new FormData();
      
      // Map our EventCreationData to the backend schema format
      const eventPayload = {
        title: eventData.title,
        description: eventData.summary, // Map summary to description
        category: eventData.category || "Other",
        location: eventData.isOnlineEvent ? "Online" : `${eventData.city}${eventData.addressLine1 ? ', ' + eventData.addressLine1 : ''}`,
        date: eventData.startDate.toISOString(),
        time: eventData.startDate.toTimeString().split(' ')[0], // Extract time part
        price: eventData.isPaidEvent && eventData.ticketTiers?.length > 0 ? eventData.ticketTiers[0].price : 0,
        ticketTiers: eventData.isPaidEvent ? eventData.ticketTiers : [],
        capacity: eventData.spotsAvailable ? parseInt(eventData.spotsAvailable) : undefined,
        eventPrivacy: eventData.eventPrivacy || "public", // Add the missing eventPrivacy field
        itinerary: eventData.agendaItems?.map(item => ({
          time: item.time,
          activity: item.description,
          location: eventData.location
        })) || [],
        tags: [
          ...(eventData.vibes || []),
          ...(eventData.dressCode ? ['Dress Code Required'] : []),
          ...(eventData.isOnlineEvent ? ['Online Event'] : []),
          ...(eventData.isPaidEvent ? ['Paid Event'] : ['Free Event'])
        ]
      };

      // Add text fields to FormData
      Object.entries(eventPayload).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Add the main image (backend expects 'image' field name)
      if (eventData.images && eventData.images.length > 0) {
        formData.append('image', eventData.images[0]); // Use first image as main image
      }

      console.log("📦 Submitting event data:", eventPayload);
      console.log("📸 Has images:", !!eventData.images && eventData.images.length > 0);

      // Make API call
      console.log("🌐 Making API call to /api/events...");
      const response = await fetch('/api/events', {
        method: 'POST',
        // No custom headers needed - session authentication is handled via cookies
        body: formData,
        credentials: 'include', // This ensures session cookies are sent
      });

      console.log("📡 Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("❌ API Error:", errorText);
        throw new Error(`Failed to create event: ${errorText}`);
      }

      const createdEvent = await response.json();
      console.log("✅ Event created successfully:", createdEvent);

      toast({
        title: "Congratulations!",
        description: "Your event was successfully posted and is now live!"
      });

      // Redirect to the created event or back to discover
      setLocation("/discover");
      
    } catch (error) {
      console.error("💥 Error creating event:", error);
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create event. Please try again."
      });
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
      
      case EventCreationStep.EventDetails:
        return (
          <Step3EventDetails
            data={eventData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      
      case EventCreationStep.EventSpecifics:
        return (
          <Step4EventSpecifics
            data={eventData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      
      case EventCreationStep.PricingAudience:
        return (
          <Step5PricingAudience
            data={eventData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      
      case EventCreationStep.AudienceTargeting:
        return (
          <Step6AudienceTargeting
            data={eventData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      
      default:
        return (
          <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
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