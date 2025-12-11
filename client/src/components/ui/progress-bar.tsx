interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  return (
    <div className="flex items-center justify-center w-full px-6 py-4">
      <div className="flex items-center space-x-2 w-full max-w-md">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;
          
          return (
            <div key={stepNumber} className="flex items-center flex-1">
              {/* Step indicator */}
              <div
                className={`h-2 flex-1 rounded-full transition-all duration-300 border border-gray-400 dark:border-gray-600 ${
                  isCompleted
                    ? 'bg-gray-700 dark:bg-gray-400'
                    : isCurrent
                    ? 'bg-gray-700 dark:bg-gray-400'
                    : 'bg-transparent'
                }`}
              />
              
              {/* Connector line (except for last step) */}
              {index < totalSteps - 1 && (
                <div
                  className={`h-0.5 w-2 transition-all duration-300 ${
                    isCompleted ? 'bg-gray-700 dark:bg-gray-400' : 'bg-gray-400 dark:bg-gray-600'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}