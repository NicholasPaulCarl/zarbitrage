import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, ArrowRightCircle } from 'lucide-react';
import { ArbitrageOpportunity } from '@/lib/types';
import { formatZAR, formatPercentage } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface AlertNotificationProps {
  visible: boolean;
  opportunity: ArbitrageOpportunity | null;
}

export default function AlertNotification({ visible, opportunity }: AlertNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentOpportunity, setCurrentOpportunity] = useState<ArbitrageOpportunity | null>(null);
  const previousVisibleRef = useRef(visible);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Clear any existing timeout when props change
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }

    // If visibility changed from false to true, or it's the first time with an opportunity, 
    // or opportunity changed while visible
    if ((visible && !previousVisibleRef.current) || 
        (visible && opportunity && !currentOpportunity) ||
        (visible && opportunity && 
         currentOpportunity && 
         (opportunity.route !== currentOpportunity.route || 
          opportunity.spreadPercentage !== currentOpportunity.spreadPercentage))) {
      
      // Update current opportunity
      setCurrentOpportunity(opportunity);
      setIsAnimating(true);
      
      // Reset progress and start countdown
      setProgress(100);
      const duration = 5000; // 5 seconds
      const interval = 50; // Update every 50ms
      const steps = duration / interval;
      const decrement = 100 / steps;
      
      progressRef.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.max(0, prev - decrement);
          return newProgress;
        });
      }, interval);
      
      // Show alert
      setIsVisible(true);
      
      // Auto-hide after 5 seconds
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
        
        // Wait for exit animation to complete
        setTimeout(() => {
          setIsVisible(false);
        }, 300);
        
      }, 5000);
      
    } else if (!visible && previousVisibleRef.current) {
      // If visibility changed from true to false
      setIsAnimating(false);
      
      // Wait for exit animation to complete
      setTimeout(() => {
        setIsVisible(false);
      }, 300);
    }
    
    // Update previous visible ref
    previousVisibleRef.current = visible;
    
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
    };
  }, [visible, opportunity, currentOpportunity]);

  const handleClose = () => {
    setIsAnimating(false);
    
    // Wait for exit animation to complete
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  };

  if (!isVisible || !currentOpportunity) {
    return null;
  }

  return (
    <div 
      className={cn(
        "fixed bottom-4 right-4 max-w-sm w-full bg-white rounded-lg shadow-lg z-50 overflow-hidden transition-all duration-300",
        isAnimating 
          ? "opacity-100 translate-y-0 transform" 
          : "opacity-0 translate-y-4 transform"
      )}
      id="alert-container"
    >
      <div className="relative">
        {/* Progress bar */}
        <div 
          className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
        
        {/* Green highlight border */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
        
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              <div className="bg-green-100 rounded-full p-2 animate-pulse">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="w-0 flex-1 pt-0.5">
              <div className="flex items-center">
                <p className="text-sm font-medium text-gray-900" id="alert-title">
                  Arbitrage Opportunity!
                </p>
                <div className="ml-auto">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 text-gray-400 hover:text-gray-500 -mr-1 -mt-1" 
                    onClick={handleClose}
                    id="close-alert"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="mt-2 bg-gray-50 rounded-md p-2">
                <div className="flex items-center text-sm font-medium">
                  <span className="truncate">{currentOpportunity.buyExchange}</span>
                  <ArrowRightCircle className="mx-1 h-3 w-3 text-gray-500" />
                  <span className="truncate">{currentOpportunity.sellExchange}</span>
                </div>
                
                <div className="flex justify-between items-center mt-1">
                  <div className="text-green-600 font-mono font-medium">
                    {formatZAR(currentOpportunity.spread)}
                  </div>
                  <div className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                    {formatPercentage(currentOpportunity.spreadPercentage)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
