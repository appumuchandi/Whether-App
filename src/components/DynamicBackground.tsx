"use client";

import { useEffect, useState } from 'react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { getWeatherCategory } from '@/lib/weather';

interface Props {
  conditionCode: number;
  isDay: boolean;
}

export default function DynamicBackground({ conditionCode, isDay }: Props) {
  const [bgImage, setBgImage] = useState('');

  useEffect(() => {
    const category = getWeatherCategory(conditionCode);
    let imageId = 'weather-sunny';

    if (!isDay) {
      imageId = 'weather-night';
    } else {
      switch (category) {
        case 'rain': imageId = 'weather-rain'; break;
        case 'storm': imageId = 'weather-storm'; break;
        case 'cloudy': imageId = 'weather-cloudy'; break;
        default: imageId = 'weather-sunny'; break;
      }
    }

    const found = PlaceHolderImages.find(img => img.id === imageId);
    if (found) setBgImage(found.imageUrl);
  }, [conditionCode, isDay]);

  return (
    <div className="fixed inset-0 z-[-1] transition-all duration-1000 ease-in-out">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{ 
          backgroundImage: `url(${bgImage})`,
          filter: 'brightness(0.4) saturate(1.2)'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />
    </div>
  );
}
