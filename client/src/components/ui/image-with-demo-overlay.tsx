interface ImageWithDemoOverlayProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}

export function ImageWithDemoOverlay({ src, alt, className = "", loading }: ImageWithDemoOverlayProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
    />
  );
}
