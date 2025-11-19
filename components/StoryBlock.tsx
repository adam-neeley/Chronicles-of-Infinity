import React from 'react';
import { Turn } from '../types';
import { ImagePlaceholder } from './Spinner';

interface StoryBlockProps {
  turn: Turn;
  isLast: boolean;
}

export const StoryBlock: React.FC<StoryBlockProps> = ({ turn, isLast }) => {
  return (
    <div className={`mb-12 animate-fade-in ${isLast ? 'min-h-[50vh]' : ''}`}>
      <div className="mb-6">
        {turn.isImageLoading ? (
          <ImagePlaceholder />
        ) : turn.imageUrl ? (
          <div className="relative rounded-lg overflow-hidden shadow-2xl border border-gray-800 group">
             <img 
               src={turn.imageUrl} 
               alt="Scene visualization" 
               className="w-full h-auto object-cover max-h-[500px] transition-transform duration-700 group-hover:scale-105"
               loading="lazy"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
          </div>
        ) : null}
      </div>
      
      <div className="prose prose-invert prose-lg max-w-none">
        <p className="font-serif text-xl leading-relaxed text-gray-300 tracking-wide">
          {turn.text}
        </p>
      </div>
    </div>
  );
};