"use client";

import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  CloudSnow, 
  Moon, 
  CloudDrizzle,
  CloudFog,
  Wind
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWeatherCategory } from '@/lib/weather';

interface Props {
  code: number;
  isDay?: boolean;
  className?: string;
  size?: number;
}

export default function WeatherIcon({ code, isDay = true, className, size = 24 }: Props) {
  const category = getWeatherCategory(code);
  
  const iconProps = {
    size,
    className: cn("stroke-[1.5px] transition-all duration-500", className)
  };

  if (!isDay && code === 1000) {
    return (
      <Moon 
        {...iconProps} 
        className={cn(iconProps.className, "text-indigo-300 drop-shadow-[0_0_15px_rgba(165,180,252,0.5)] animate-float")} 
      />
    );
  }

  switch (category) {
    case 'clear': 
      return (
        <Sun 
          {...iconProps} 
          className={cn(iconProps.className, "text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)] animate-pulse-subtle")} 
        />
      );
    case 'cloudy': 
      return (
        <Cloud 
          {...iconProps} 
          className={cn(iconProps.className, "text-blue-100 drop-shadow-[0_0_15px_rgba(219,234,254,0.4)]")} 
        />
      );
    case 'rain': 
      return (
        <CloudRain 
          {...iconProps} 
          className={cn(iconProps.className, "text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]")} 
        />
      );
    case 'storm': 
      return (
        <CloudLightning 
          {...iconProps} 
          className={cn(iconProps.className, "text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.6)] animate-pulse")} 
        />
      );
    case 'snow': 
      return (
        <CloudSnow 
          {...iconProps} 
          className={cn(iconProps.className, "text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]")} 
        />
      );
    default: 
      return (
        <Cloud 
          {...iconProps} 
          className={cn(iconProps.className, "text-blue-200")} 
        />
      );
  }
}