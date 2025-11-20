interface ImageWithDemoOverlayProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}

export function ImageWithDemoOverlay({ src, alt, className = "", loading }: ImageWithDemoOverlayProps) {
  return (
    <div className="relative">
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-black/70 text-white font-bold px-4 py-2 text-center rotate-[-15deg] text-lg sm:text-xl md:text-2xl">
          FOR DEMO ONLY
        </div>
      </div>
    </div>
  );
}
