import { PageHeader } from "@/components/ui/page-header";
import { useTheme } from "@/lib/theme-provider";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { Card } from "@/components/ui/card";

type ThemeOption = "light" | "dark" | "system";

export default function AppearancePage() {
  const { theme, setTheme } = useTheme();

  const themeOptions: { value: ThemeOption; label: string; icon: typeof Sun; description: string }[] = [
    {
      value: "light",
      label: "Light",
      icon: Sun,
      description: "Use light theme"
    },
    {
      value: "dark",
      label: "Dark",
      icon: Moon,
      description: "Use dark theme"
    },
    {
      value: "system",
      label: "System",
      icon: Monitor,
      description: "Follow device settings"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Appearance" />
      
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Theme</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select your preferred theme for the application
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
                  <Card className={`p-4 cursor-pointer hover:bg-accent/50 transition-colors ${
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
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-muted-foreground">
                          {option.description}
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
              <strong className="text-foreground">Note:</strong> System theme will automatically match your device's appearance settings. Changes take effect immediately.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
