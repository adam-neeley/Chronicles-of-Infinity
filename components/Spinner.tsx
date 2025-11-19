import React from 'react';

export const Spinner = () => (
  <div className="flex justify-center items-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-game-highlight"></div>
  </div>
);

export const ImagePlaceholder = () => (
  <div className="w-full h-64 bg-gray-800 rounded-lg flex items-center justify-center animate-pulse border border-gray-700">
    <span className="text-gray-500 font-serif italic">Conjuring visuals...</span>
  </div>
);