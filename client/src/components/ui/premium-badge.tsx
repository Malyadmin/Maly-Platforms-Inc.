import malyLogo from "@/assets/maly-logo.png";

interface PremiumBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PremiumBadge({ size = "md", className = "" }: PremiumBadgeProps) {
  const sizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const iconSize = sizes[size];

  return (
    <div 
      className={`flex-shrink-0 inline-flex items-center justify-center rounded-full bg-white ${className}`}
      style={{ width: iconSize, height: iconSize, padding: '2px' }}
    >
      <img 
        src={malyLogo} 
        alt="Premium" 
        className="w-full h-full object-contain"
        style={{ filter: 'brightness(0)' }}
      />
    </div>
  );
}
