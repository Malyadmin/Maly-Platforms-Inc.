import { BackButton } from '@/components/ui/back-button';
import { useLocation } from 'wouter';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
  showBackButton?: boolean;
  backButtonFallbackPath?: string;
  forceUsePathFallback?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  icon: Icon,
  children,
  showBackButton = true,
  backButtonFallbackPath = "/discover",
  forceUsePathFallback = false,
  className = ""
}: PageHeaderProps) {
  const [location] = useLocation();
  
  const isProfilePage = location.startsWith('/profile/');
  const shouldForcePathFallback = forceUsePathFallback || isProfilePage;
  
  return (
    <header className={`sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border ${className}`}>
      <div className="container mx-auto px-5 py-4">
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-center gap-3 text-left">
            {Icon && <Icon className="w-5 h-5 text-foreground" />}
            <h1 className="text-[28px] font-light tracking-wide uppercase text-foreground">
              {title}
            </h1>
            {children && (
              <div className="ml-auto flex items-center flex-shrink-0 gap-2">
                {children}
              </div>
            )}
          </div>
          {showBackButton && (
            <BackButton 
              fallbackPath={backButtonFallbackPath} 
              forceUsePathFallback={shouldForcePathFallback} 
            />
          )}
        </div>
      </div>
    </header>
  );
}
