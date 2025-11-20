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
    <svg 
      width={iconSize} 
      height={iconSize} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="premium-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgb(147, 51, 234)" />
          <stop offset="50%" stopColor="rgb(219, 39, 119)" />
          <stop offset="100%" stopColor="rgb(239, 68, 68)" />
        </linearGradient>
      </defs>
      <path
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        fill="url(#premium-gradient)"
        stroke="url(#premium-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
