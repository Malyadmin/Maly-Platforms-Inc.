import { useEffect, useState, useCallback } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [phase, setPhase] = useState<'loading' | 'image1' | 'fade1' | 'image2' | 'fade2' | 'complete'>('loading');

  const images = ['/splash-1.png', '/splash-2.png'];

  // Preload images before showing anything
  useEffect(() => {
    let mounted = true;
    
    const preloadImages = async () => {
      const promises = images.map(src => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Continue even if image fails
          img.src = src;
        });
      });
      
      await Promise.all(promises);
      
      if (mounted) {
        setImagesLoaded(true);
        // Start showing first image immediately after load
        requestAnimationFrame(() => {
          setPhase('image1');
        });
      }
    };

    preloadImages();

    return () => {
      mounted = false;
    };
  }, []);

  // Handle animation phases with smooth timing
  useEffect(() => {
    if (!imagesLoaded) return;

    let timer: ReturnType<typeof setTimeout>;

    switch (phase) {
      case 'image1':
        // Show first image for 2.5 seconds
        timer = setTimeout(() => setPhase('fade1'), 2500);
        break;
      case 'fade1':
        // After fade out (500ms in CSS), switch to second image
        timer = setTimeout(() => setPhase('image2'), 500);
        break;
      case 'image2':
        // Show second image for 2.5 seconds
        timer = setTimeout(() => setPhase('fade2'), 2500);
        break;
      case 'fade2':
        // After final fade out, complete
        timer = setTimeout(() => {
          setPhase('complete');
          onComplete();
        }, 500);
        break;
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [phase, imagesLoaded, onComplete]);

  // Determine which image to show and opacity
  const currentImage = phase === 'image2' || phase === 'fade2' ? 1 : 0;
  const isVisible = phase === 'image1' || phase === 'image2';

  // Don't render anything until images are loaded
  if (!imagesLoaded || phase === 'complete') {
    return (
      <div 
        className="fixed inset-0 z-[9999] bg-black"
        style={{
          opacity: phase === 'complete' ? 0 : 1,
          transition: 'opacity 300ms ease-out',
          pointerEvents: 'none'
        }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black overflow-hidden"
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'none',
        userSelect: 'none'
      }}
    >
      {/* Full-screen image container */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 500ms ease-in-out',
          willChange: 'opacity',
          transform: 'translateZ(0)' // Force GPU acceleration
        }}
      >
        {/* Blurred background for edge coverage */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${images[currentImage]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(30px) brightness(0.8)',
            transform: 'scale(1.2)',
            willChange: 'transform'
          }}
        />
        
        {/* Main image - covers full screen */}
        <img
          src={images[currentImage]}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
            willChange: 'opacity'
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}
