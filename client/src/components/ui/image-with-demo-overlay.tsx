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
        <span className="text-white/30 text-[10px] font-medium tracking-wide uppercase">
          demo
        </span>
      </div>
    </div>
  );
}
