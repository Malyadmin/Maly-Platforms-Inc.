import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type ColorTheme = "default" | "sunset" | "forest" | "ocean" | "lavender";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultColorTheme?: ColorTheme;
  storageKey?: string;
  colorStorageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  colorTheme: ColorTheme;
  setTheme: (theme: Theme) => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

const colorThemes: Record<ColorTheme, Record<string, string>> = {
  default: {
    primary: "hsl(222.2 47.4% 11.2%)",
    secondary: "hsl(217.2 32.6% 17.5%)",
    accent: "hsl(210 40% 96.1%)",
  },
  sunset: {
    primary: "hsl(20 47.4% 11.2%)",
    secondary: "hsl(15 32.6% 17.5%)",
    accent: "hsl(30 40% 96.1%)",
  },
  forest: {
    primary: "hsl(150 47.4% 11.2%)",
    secondary: "hsl(145 32.6% 17.5%)",
    accent: "hsl(140 40% 96.1%)",
  },
  ocean: {
    primary: "hsl(200 47.4% 11.2%)",
    secondary: "hsl(195 32.6% 17.5%)",
    accent: "hsl(190 40% 96.1%)",
  },
  lavender: {
    primary: "hsl(270 47.4% 11.2%)",
    secondary: "hsl(265 32.6% 17.5%)",
    accent: "hsl(260 40% 96.1%)",
  },
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultColorTheme = "default",
  storageKey = "ui-theme",
  colorStorageKey = "ui-color-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  const [colorTheme, setColorTheme] = useState<ColorTheme>(
    () => (localStorage.getItem(colorStorageKey) as ColorTheme) || defaultColorTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        const newTheme = e.matches ? "dark" : "light";
        root.classList.remove("light", "dark");
        root.classList.add(newTheme);
      };
      
      // Modern browsers
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleChange);
      } else {
        // Legacy browsers
        mediaQuery.addListener(handleChange);
      }
      
      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener("change", handleChange);
        } else {
          mediaQuery.removeListener(handleChange);
        }
      };
    } else {
      root.classList.add(theme);
    }

    // Apply color theme
    const colors = colorThemes[colorTheme];
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
      root.style.setProperty(`--${key}-foreground`, 
        theme === "dark" ? "hsl(0 0% 98%)" : "hsl(0 0% 3.9%)");
    });

    // Add transition styles
    root.style.setProperty(
      "transition",
      "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease"
    );
  }, [theme, colorTheme]);

  const value = {
    theme,
    colorTheme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    setColorTheme: (colorTheme: ColorTheme) => {
      localStorage.setItem(colorStorageKey, colorTheme);
      setColorTheme(colorTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};