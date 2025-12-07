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
      <div className="absolute bottom-2 right-2 pointer-events-none">
        <span className="bg-black/20 text-white/40 text-[8px] font-medium tracking-wider uppercase px-2 py-0.5 rounded-full backdrop-blur-sm">
          demo
        </span>
      </div>
    </div>
  );
}
