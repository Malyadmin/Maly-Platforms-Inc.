import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => {
      setOpacity(0);
    }, 2500));

    timers.push(setTimeout(() => {
      setCurrentImage(1);
      setOpacity(1);
    }, 3000));

    timers.push(setTimeout(() => {
      setOpacity(0);
    }, 5500));

    timers.push(setTimeout(() => {
      onComplete();
    }, 6000));

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [onComplete]);

  const images = ['/splash-1.png', '/splash-2.png'];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 overflow-hidden"
      style={{
        opacity
      }}
    >
      {/* Blurred background layer - fills entire screen */}
      <div 
        className="absolute inset-0 scale-110"
        style={{
          backgroundImage: `url(${images[currentImage]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(20px)',
        }}
      />
      
      {/* Main image - contained to preserve aspect ratio */}
      <img
        src={images[currentImage]}
        alt="Splash"
        className="relative z-10 w-full h-full object-contain"
      />
    </div>
  );
}
