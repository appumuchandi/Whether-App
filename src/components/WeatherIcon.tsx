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
    className: cn("stroke-[1.5px] transition-all duration-300 drop-shadow-[0_0_8px_rgba(135,185,255,0.4)]", className)
  };

  if (!isDay && code === 1000) return <Moon {...iconProps} className={cn(iconProps.className, "text-indigo-200")} />;

  switch (category) {
    case 'clear': return <Sun {...iconProps} className={cn(iconProps.className, "text-yellow-300")} />;
    case 'cloudy': return <Cloud {...iconProps} className={cn(iconProps.className, "text-blue-100")} />;
    case 'rain': return <CloudRain {...iconProps} className={cn(iconProps.className, "text-blue-400")} />;
    case 'storm': return <CloudLightning {...iconProps} className={cn(iconProps.className, "text-purple-400")} />;
    case 'snow': return <CloudSnow {...iconProps} className={cn(iconProps.className, "text-white")} />;
    default: return <Cloud {...iconProps} className={cn(iconProps.className, "text-blue-100")} />;
  }
}
