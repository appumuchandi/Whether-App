"use client";

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { intelligentActivityAdvisor } from '@/ai/flows/intelligent-activity-advisor';
import type { WeatherData } from '@/lib/weather';

interface Props {
  weather: WeatherData;
}

export default function WeatherAdvice({ weather }: Props) {
  const [advice, setAdvice] = useState<string>('Analyzing atmospheric conditions...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getAdvice() {
      setLoading(true);
      try {
        const result = await intelligentActivityAdvisor({
          currentWeather: {
            temperature: weather.current.temp,
            condition: weather.current.condition,
            humidity: weather.current.humidity,
            windSpeed: weather.current.windSpeed,
            feelsLike: weather.current.feelsLike,
          },
          forecast: weather.forecast.map(day => ({
            date: day.date,
            maxTemp: day.maxTemp,
            minTemp: day.minTemp,
            condition: day.condition,
          })),
        });
        setAdvice(result.suggestion);
      } catch (error) {
        console.error("AI Advice Error:", error);
        setAdvice("Stay safe and prepared for the changing weather conditions.");
      } finally {
        setLoading(false);
      }
    }

    getAdvice();
  }, [weather]);

  return (
    <div className="glass-card p-6 flex items-start gap-4 border-l-4 border-l-accent/50 group">
      <div className="p-2 bg-accent/20 rounded-full text-accent group-hover:scale-110 transition-transform duration-300">
        <Sparkles size={20} className={loading ? "animate-pulse" : ""} />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-accent/80 uppercase tracking-wider mb-1 font-headline">Atmosphere Intelligence</h3>
        <p className="text-white font-medium leading-relaxed">
          {advice}
        </p>
      </div>
    </div>
  );
}
