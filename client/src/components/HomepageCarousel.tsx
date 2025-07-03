import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Database carousel type (snake_case from API)
interface CarouselFromDB {
  id: number;
  title: string;
  description: string | null;
  image_url: string;
  cta_text: string | null;
  cta_link: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function HomepageCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: carousels = [], isLoading } = useQuery<CarouselFromDB[]>({
    queryKey: ['/api/carousels'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Comprehensive debugging for carousel display
  console.log('🎠 HomepageCarousel Debug:');
  console.log('  - Loading:', isLoading);
  console.log('  - Carousels count:', carousels.length);
  console.log('  - Carousels data:', carousels);
  console.log('  - Current slide index:', currentSlide);
  if (carousels.length > 0) {
    console.log('  - Current carousel:', carousels[currentSlide]);
  }

  useEffect(() => {
    if (carousels.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carousels.length);
    }, 5000); // Auto-advance every 5 seconds

    return () => clearInterval(timer);
  }, [carousels.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carousels.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carousels.length) % carousels.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (isLoading) {
    return (
      <Card className="w-full h-64 animate-pulse">
        <CardContent className="p-0 h-full bg-muted rounded-lg" />
      </Card>
    );
  }

  if (carousels.length === 0) {
    return null; // Don't show anything if no carousels
  }

  const currentCarousel = carousels[currentSlide];

  return (
    <Card className="w-full relative overflow-hidden group">
      <CardContent className="p-0">
        <div className="relative h-64 md:h-80 lg:h-96">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${currentCarousel.image_url})` }}
          >
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/40" />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex items-center justify-center p-6 md:p-8">
            <div className="text-center text-white max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 drop-shadow-lg">
                {currentCarousel.title}
              </h2>
              {currentCarousel.description && (
                <p className="text-lg md:text-xl mb-6 text-white/90 drop-shadow-md max-w-2xl mx-auto">
                  {currentCarousel.description}
                </p>
              )}
              {currentCarousel.cta_text && currentCarousel.cta_link && (
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                  onClick={() => {
                    console.log('🔗 Carousel CTA clicked:', currentCarousel.cta_link);
                    if (currentCarousel.cta_link) {
                      if (currentCarousel.cta_link.startsWith('/')) {
                        // Internal link - use window.location for faster navigation
                        console.log('🔗 Internal link detected, navigating...');
                        window.location.href = currentCarousel.cta_link;
                      } else {
                        // External link - open in new tab
                        console.log('🔗 External link detected, opening in new tab...');
                        window.open(currentCarousel.cta_link, '_blank', 'noopener,noreferrer');
                      }
                    }
                  }}
                >
                  {currentCarousel.cta_text}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Arrows - Only show if more than 1 slide */}
          {carousels.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={prevSlide}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={nextSlide}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Dots Indicator - Only show if more than 1 slide */}
          {carousels.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {carousels.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentSlide 
                      ? 'bg-white' 
                      : 'bg-white/50 hover:bg-white/70'
                  }`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}