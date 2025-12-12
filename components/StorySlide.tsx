import React from 'react';
import { MessageCircle } from 'lucide-react';

interface StorySlideProps {
  children: React.ReactNode;
  currentIndex: number;
  totalSlides: number;
  onNext: () => void;
  onPrev: () => void;
  colorTheme?: string;
}

export const StorySlide: React.FC<StorySlideProps> = ({ 
  children, 
  currentIndex, 
  totalSlides, 
  onNext, 
  onPrev,
  colorTheme = 'bg-gray-900'
}) => {
  return (
    <div className={`fixed inset-0 w-full h-full ${colorTheme} flex flex-col items-center justify-center overflow-hidden animate-fade-in select-none`}>
      
      {/* Progress Bars */}
      <div className="absolute top-4 left-0 w-full px-4 flex gap-2 z-50">
        {Array.from({ length: totalSlides }).map((_, idx) => (
          <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-white transition-all duration-300 ${
                idx < currentIndex ? 'w-full' : idx === currentIndex ? 'w-full animate-[width_5s_linear]' : 'w-0'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Header Brand */}
      <div className="absolute top-8 left-0 w-full flex justify-center items-center gap-2 opacity-50 z-40">
        <MessageCircle className="w-4 h-4" />
        <span className="text-xs font-bold tracking-widest uppercase">ZapRecap</span>
      </div>

      {/* Navigation Touch Areas */}
      <div className="absolute inset-y-0 left-0 w-1/3 z-30" onClick={onPrev} />
      <div className="absolute inset-y-0 right-0 w-1/3 z-30" onClick={onNext} />

      {/* Content */}
      <div className="relative z-20 w-full max-w-md px-6 flex flex-col items-center justify-center min-h-[60vh]">
        {children}
      </div>
    </div>
  );
};