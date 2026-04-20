import { useEffect, useState } from 'react';
import { cn } from "@/lib/utils";

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, 2500 - elapsedTime); // Ensure at least 2.5 seconds total

          setTimeout(() => {
            setLoadingComplete(true);
            setTimeout(onComplete, 800); // Wait for fade out
          }, remainingTime);
          
          return 100;
        }
        return prev + 2 + Math.random() * 5;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-700 ease-in-out",
        loadingComplete ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
    >
      <div className="flex flex-col items-center gap-16 w-full max-w-2xl px-12">
        {/* Significantly Larger Logo Container */}
        <div className="relative w-full max-w-md animate-in zoom-in-90 duration-1000 fade-in fill-mode-both">
          <img 
            src="/banklogo.png" 
            alt="Indian Bank Logo" 
            className="w-full h-auto object-contain drop-shadow-xl"
          />
        </div>

        {/* Professional Loading Bar */}
        <div className="w-full max-w-sm space-y-4 animate-in slide-in-from-bottom-8 duration-1000 fade-in delay-500 fill-mode-both">
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="text-center text-xs font-bold text-primary/60 uppercase tracking-[0.3em] animate-pulse">
            Establishing Secure Connection
          </div>
        </div>
      </div>
      
      {/* Subtle brand gradients */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-secondary/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
    </div>
  );
}
