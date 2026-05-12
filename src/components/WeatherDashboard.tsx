"use client";

import { useState, useEffect } from 'react';
import { Search, MapPin, Wind, Droplets, Thermometer, RefreshCw } from 'lucide-react';
import { fetchWeather, type WeatherData } from '@/lib/weather';
import DynamicBackground from './DynamicBackground';
import WeatherIcon from './WeatherIcon';
import WeatherAdvice from './WeatherAdvice';
import ProfessionalClock from './ProfessionalClock';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function WeatherDashboard() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  const handleFetch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const data = await fetchWeather(searchQuery);
      setWeather(data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "City Not Found",
        description: "Please check the spelling and try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        description: "Geolocation is not supported by your browser."
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleFetch(`${pos.coords.latitude},${pos.coords.longitude}`);
      },
      () => {
        toast({
          variant: "destructive",
          description: "Location access denied. Using San Francisco as default."
        });
        handleFetch('San Francisco');
      }
    );
  };

  useEffect(() => {
    handleGeolocation();
  }, []);

  if (loading && !weather) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-primary" size={48} />
          <p className="text-xl font-headline tracking-widest text-primary/80 animate-pulse uppercase">Atmos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-4 py-8 md:px-8 max-w-7xl mx-auto overflow-hidden">
      {weather && (
        <>
          <DynamicBackground conditionCode={weather.current.conditionCode} isDay={weather.current.isDay} />
          
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-xl backdrop-blur-md border border-white/20">
                <WeatherIcon code={weather.current.conditionCode} isDay={weather.current.isDay} size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-headline font-bold text-white tracking-tight leading-none mb-1 uppercase">Atmos</h1>
                <p className="text-primary/70 font-medium text-xs tracking-widest uppercase">Live Weather Hub</p>
              </div>
            </div>

            <div className="flex gap-2 w-full md:max-w-md">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors" size={18} />
                <Input 
                  placeholder="Discover weather in any city..." 
                  className="bg-white/10 backdrop-blur-md border-white/20 focus:border-primary/50 text-white pl-10 h-12 rounded-xl transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetch(query)}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 h-12 w-12 rounded-xl shrink-0"
                onClick={handleGeolocation}
              >
                <MapPin size={20} className="text-white" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Main Weather Card */}
            <div className="lg:col-span-8 space-y-6">
              <div className="glass-card p-8 md:p-12 animate-fade-in [animation-delay:100ms] overflow-hidden relative">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 text-white/60 mb-2 font-medium">
                      <MapPin size={16} className="text-accent" />
                      <span className="tracking-wide">{weather.current.locationName}, {weather.current.country}</span>
                    </div>
                    <h2 className="text-8xl md:text-9xl font-headline font-bold text-white tracking-tighter text-glow relative leading-none">
                      {weather.current.temp}°
                      <span className="text-3xl md:text-4xl text-white/40 align-top mt-4 inline-block font-light">C</span>
                    </h2>
                  </div>
                  <div className="mt-6 md:mt-0 text-right">
                    <p className="text-2xl md:text-3xl font-headline font-medium text-white mb-2">{weather.current.condition}</p>
                    <p className="text-white/50 text-sm font-medium uppercase tracking-widest">Feels like {weather.current.feelsLike}°C</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-white/10 relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-white/50 text-sm uppercase font-semibold tracking-wider">
                      <Wind size={14} className="text-primary" />
                      Wind Speed
                    </div>
                    <p className="text-xl font-headline font-bold text-white">{weather.current.windSpeed} km/h</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-white/50 text-sm uppercase font-semibold tracking-wider">
                      <Droplets size={14} className="text-primary" />
                      Humidity
                    </div>
                    <p className="text-xl font-headline font-bold text-white">{weather.current.humidity}%</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-white/50 text-sm uppercase font-semibold tracking-wider">
                      <Thermometer size={14} className="text-primary" />
                      Pressure
                    </div>
                    <p className="text-xl font-headline font-bold text-white">1012 hPa</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-white/50 text-sm uppercase font-semibold tracking-wider">
                      <RefreshCw size={14} className="text-primary" />
                      Updated
                    </div>
                    <p className="text-xl font-headline font-bold text-white">{format(new Date(weather.current.lastUpdated), 'HH:mm')}</p>
                  </div>
                </div>
              </div>

              {/* AI Advice */}
              <div className="animate-fade-in [animation-delay:200ms]">
                <WeatherAdvice weather={weather} />
              </div>
            </div>

            {/* Forecast Sidebar */}
            <div className="lg:col-span-4 space-y-6 animate-fade-in [animation-delay:300ms]">
              
              {/* Professional Clock Component */}
              <div className="glass-card p-6 flex items-center justify-center overflow-hidden">
                <ProfessionalClock locationName={weather.current.locationName} />
              </div>

              <div className="glass-card p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-headline font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                    <RefreshCw size={16} className="text-primary" />
                    5-Day Forecast
                  </h3>
                </div>

                <div className="space-y-4">
                  {weather.forecast.map((day, idx) => (
                    <div 
                      key={day.date} 
                      className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                          <WeatherIcon code={day.conditionCode} isDay={true} size={24} />
                        </div>
                        <div>
                          <p className="text-white font-semibold font-headline">
                            {idx === 0 ? 'Today' : format(new Date(day.date), 'EEEE')}
                          </p>
                          <p className="text-white/40 text-xs font-medium uppercase tracking-tighter">{day.condition}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white font-bold font-headline">{day.maxTemp}°</span>
                        <div className="w-px h-6 bg-white/10" />
                        <span className="text-white/40 font-bold font-headline">{day.minTemp}°</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
                  <p className="text-primary font-medium text-xs uppercase tracking-widest mb-1">Atmosphere Note</p>
                  <p className="text-white/70 text-sm leading-relaxed italic">
                    Forecast precision increases as the observation date approaches. Atmos provides real-time adjustments.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
