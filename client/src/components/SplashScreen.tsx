import { useEffect, useState } from 'react';
import splashImage1 from '@assets/Nov 20, 2025 at 03_05_43 PM_1763670195108.png';
import splashImage2 from '@assets/6A83322A-7392-4A34-9AF7-E15B84033DB9_1763670195108.png';

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

  const images = [splashImage1, splashImage2];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500"
      style={{
        opacity,
        backgroundImage: `url(${images[currentImage]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
    </div>
  );
}
