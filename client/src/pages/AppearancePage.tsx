import { PageHeader } from "@/components/ui/page-header";
import { useTheme } from "@/lib/theme-provider";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/lib/translations";

type ThemeOption = "light" | "dark" | "system";

export default function AppearancePage() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const themeOptions: { value: ThemeOption; labelKey: 'light' | 'dark' | 'system'; icon: typeof Sun; descriptionKey: 'useLightTheme' | 'useDarkTheme' | 'followDeviceSettings' }[] = [
    {
      value: "light",
      labelKey: "light",
      icon: Sun,
      descriptionKey: "useLightTheme"
    },
    {
      value: "dark",
      labelKey: "dark",
      icon: Moon,
      descriptionKey: "useDarkTheme"
    },
    {
      value: "system",
      labelKey: "system",
      icon: Monitor,
      descriptionKey: "followDeviceSettings"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title={t('appearance')} />
      
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">{t('theme')}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t('selectTheme')}
            </p>
          </div>

          <div className="space-y-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`w-full transition-all ${
                    isSelected 
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                      : ""
                  }`}
                  data-testid={`theme-option-${option.value}`}
                >
                  <Card className={`p-4 cursor-pointer hover:bg-foreground/10/50 transition-colors ${
                    isSelected ? "bg-accent" : ""
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${
                        isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted"
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 text-left">
                        <div className="font-medium">{t(option.labelKey)}</div>
                        <div className="text-sm text-muted-foreground">
                          {t(option.descriptionKey)}
                        </div>
                      </div>
                      
                      {isSelected && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </Card>
                </button>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{t('note')}:</strong> {t('themeNote')}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
