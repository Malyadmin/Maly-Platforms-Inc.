import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Globe2, Check, Save } from "lucide-react";
import { useTranslation } from "@/lib/translations";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/hooks/use-toast";

export default function TranslatorPage() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'es'>(language);
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    // Initialize selected language from current language
    setSelectedLanguage(language);
  }, [language]);

  const handleLanguageSelect = (lang: 'en' | 'es') => {
    setSelectedLanguage(lang);
    // Only mark as changed if the selection is different from current language
    setIsChanged(lang !== language);
  };

  const handleSave = () => {
    setLanguage(selectedLanguage);
    toast({
      title: selectedLanguage === 'en' ? 'Language Updated' : 'Idioma Actualizado',
      description: selectedLanguage === 'en' 
        ? 'Your language preference has been saved.' 
        : 'Tu preferencia de idioma ha sido guardada.',
      duration: 3000,
    });
    setIsChanged(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-black/40 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-white hover:bg-accent"
                onClick={() => setLocation("/")}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Globe2 className="w-6 h-6" />
                <h1 className="text-lg font-semibold">{t('languageSettings')}</h1>
              </div>
            </div>
            {isChanged && (
              <Button 
                onClick={handleSave}
                variant="default"
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {language === 'en' ? 'Save' : 'Guardar'}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto space-y-4">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">{t('selectYourLanguage')}</h2>
            <div className="space-y-3">
              <Button
                variant={selectedLanguage === 'en' ? 'default' : 'outline'}
                className={`w-full justify-between text-left ${selectedLanguage === 'en' ? 'bg-primary' : ''}`}
                onClick={() => handleLanguageSelect('en')}
              >
                <div className="flex items-center">
                  <Globe2 className="w-4 h-4 mr-2" />
                  English
                </div>
                {selectedLanguage === 'en' && <Check className="w-4 h-4" />}
              </Button>
              <Button
                variant={selectedLanguage === 'es' ? 'default' : 'outline'}
                className={`w-full justify-between text-left ${selectedLanguage === 'es' ? 'bg-primary' : ''}`}
                onClick={() => handleLanguageSelect('es')}
              >
                <div className="flex items-center">
                  <Globe2 className="w-4 h-4 mr-2" />
                  Español
                </div>
                {selectedLanguage === 'es' && <Check className="w-4 h-4" />}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
