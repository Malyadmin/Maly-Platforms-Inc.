import { useEffect } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { useTour, defaultTourSteps } from '@/hooks/use-tour';
import { useToast } from '@/hooks/use-toast';

export function TourGuide() {
  const { toast } = useToast();
  const { run, steps, setRun, setSteps, reset } = useTour();

  useEffect(() => {
    // Initialize with default steps
    setSteps(defaultTourSteps);

    // Force start the tour for testing
    setRun(true);
    console.log('Tour should start now:', { steps: defaultTourSteps });
  }, [setSteps, setRun]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, step } = data;
    console.log('Tour callback:', { status, type, step });

    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      reset();
      localStorage.setItem('hasSeenTour', 'true');

      if (status === STATUS.FINISHED) {
        toast({
          title: "Tour Completed! 🎉",
          description: "You're all set to explore our platform. Enjoy!",
        });
      }
    }
  };

  return (
    <Joyride
      run={run}
      steps={steps}
      continuous
      showProgress
      showSkipButton
      hideCloseButton={false}
      spotlightClicks={false}
      disableOverlayClose
      disableScrolling={false}
      styles={{
        options: {
          primaryColor: '#15B79E',
          zIndex: 9999,
          overlayColor: 'rgba(0, 0, 0, 0.85)',
          backgroundColor: '#18181b',
          arrowColor: '#18181b',
          textColor: '#ffffff',
        },
        spotlight: {
          backgroundColor: 'transparent',
        },
        tooltip: {
          fontSize: '14px',
          backgroundColor: '#18181b',
          color: '#ffffff',
          borderRadius: '8px',
        },
        buttonNext: {
          backgroundColor: 'transparent',
          backgroundImage: 'linear-gradient(to right, #FFFFFF, #FFFFFF)',
          border: 'none',
          padding: '8px 16px',
          fontSize: '14px',
          borderRadius: '6px',
        },
        buttonBack: {
          color: '#ffffff',
          marginRight: 10,
        },
        buttonSkip: {
          color: '#71717a',
        },
      }}
      callback={handleJoyrideCallback}
    />
  );
}