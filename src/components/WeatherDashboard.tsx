"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, MapPin, Wind, Droplets, Thermometer, RefreshCw, Star, X, Building2, ChevronRight, Eye, CloudLightning, Loader2 } from 'lucide-react';
import { fetchWeather, type WeatherData } from '@/lib/weather';
import DynamicBackground from './DynamicBackground';
import WeatherIcon from './WeatherIcon';
import WeatherAdvice from './WeatherAdvice';
import AuthButton from './AuthButton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useUser, useDoc, useFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { IndianCities } from '@/lib/indian-cities';
import { cn } from '@/lib/utils';

const POPULAR_KARNATAKA = [
  "Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Hampi"
];

export default function WeatherDashboard() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const { user } = useUser();
  const { firestore } = useFirebase();
  const suggestionRef = useRef<HTMLDivElement>(null);
  
  const { data: prefs, loading: prefsLoading } = useDoc<{ defaultCity: string }>(
    user && firestore ? `users/${user.uid}` : null
  );

  const handleFetch = useCallback(async (searchQuery: string, isAutoSave = true) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setShowSuggestions(false);
    try {
      const data = await fetchWeather(searchQuery);
      setWeather(data);
      setQuery('');
      
      if (user && firestore && isAutoSave) {
        const prefsRef = doc(firestore, 'users', user.uid);
        setDoc(prefsRef, { defaultCity: data.current.locationName }, { merge: true });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Location Not Found",
        description: `We couldn't find atmospheric data for "${searchQuery}". Please check the spelling.`
      });
    } finally {
      setLoading(false);
    }
  }, [user, firestore]);

  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS Unsupported",
        description: "Your browser doesn't support geolocation. Please search manually."
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleFetch(`${pos.coords.latitude},${pos.coords.longitude}`, true);
      },
      (error) => {
        console.warn("Geolocation error:", error);
        if (!prefs?.defaultCity && !weather) {
          handleFetch("Bengaluru", false);
        } else {
          setLoading(false);
        }
      },
      { timeout: 10000 }
    );
  }, [handleFetch, prefs?.defaultCity, weather]);

  useEffect(() => {
    if (prefsLoading) return;

    if (prefs?.defaultCity && !weather) {
      handleFetch(prefs.defaultCity, false);
    } else if (!weather && !query) {
      handleGeolocation();
    }
  }, [prefsLoading, prefs?.defaultCity, handleFetch, handleGeolocation, weather, query]);

  useEffect(() => {
    if (query.length > 1) {
      const filtered = IndianCities.filter(city => 
        city.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSetDefault = () => {
    if (!user || !firestore || !weather) {
      toast({
        description: "Sign in to save your default city preference."
      });
      return;
    }

    const prefsRef = doc(firestore, 'users', user.uid);
    setDoc(prefsRef, { defaultCity: weather.current.locationName }, { merge: true });
    
    toast({
      title: "Preference Saved",
      description: `${weather.current.locationName} is now your home atmosphere.`
    });
  };

  if (loading && !weather) {
    return (
      <div className="flex h-screen items-center justify-center bg-background overflow-hidden">
        <div className="relative flex flex-col items-center gap-6 text-center page-transition">
          <div className="relative">
            <RefreshCw className="animate-spin text-primary opacity-20" size={120} />
            <CloudLightning className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-headline font-black tracking-[0.3em] text-white uppercase animate-pulse">Syncing Atmosphere</h2>
            <p className="text-white/30 font-medium text-xs tracking-widest uppercase">Connecting to Karnataka Intelligence Hubs</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-4 py-8 md:px-12 max-w-[1400px] mx-auto overflow-hidden page-transition">
      {weather && (
        <>
          <DynamicBackground conditionCode={weather.current.conditionCode} isDay={weather.current.isDay} />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
            <div className="flex items-center gap-5 group cursor-default">
              <div className="p-4 bg-primary/10 rounded-3xl backdrop-blur-3xl border border-white/10 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                <WeatherIcon code={weather.current.conditionCode} size={40} />
              </div>
              <div>
                <h1 className="text-6xl font-headline font-black text-white tracking-tighter leading-none mb-1 uppercase text-glow">Atmos</h1>
                <p className="text-primary/70 font-bold text-[10px] tracking-[0.4em] uppercase ml-1">Weather Intelligence</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:max-w-3xl relative" ref={suggestionRef}>
              <div className="relative flex-1">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                <Input 
                  placeholder="Search Indian cities..." 
                  className="bg-white/[0.03] backdrop-blur-3xl border-white/10 focus:border-primary/40 text-white pl-14 h-16 rounded-[2rem] transition-all shadow-inner text-lg placeholder:text-white/20"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetch(query, true)}
                  onFocus={() => query.length > 1 && setShowSuggestions(true)}
                />
                {query && (
                  <button 
                    onClick={() => setQuery('')}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
                {loading && (
                   <div className="absolute right-14 top-1/2 -translate-y-1/2">
                     <Loader2 className="animate-spin text-primary/40" size={20} />
                   </div>
                )}
              </div>

              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-black/90 backdrop-blur-[100px] border border-white/10 rounded-[2rem] shadow-2xl z-50 overflow-hidden page-transition">
                  {suggestions.map((city) => (
                    <button
                      key={city}
                      onClick={() => handleFetch(city, true)}
                      className="w-full text-left px-8 py-5 text-lg text-white/60 hover:text-white hover:bg-white/5 transition-all flex items-center gap-5 border-b border-white/5 last:border-0"
                    >
                      <MapPin size={20} className="text-primary/40" />
                      {city}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-3 shrink-0">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="bg-white/[0.03] backdrop-blur-3xl border-white/10 hover:bg-white/10 h-16 w-16 rounded-[2rem] shadow-lg transition-all active:scale-95"
                  onClick={handleGeolocation}
                >
                  <MapPin size={24} className="text-white" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={cn(
                    "bg-white/[0.03] backdrop-blur-3xl border-white/10 h-16 w-16 rounded-[2rem] shadow-lg transition-all active:scale-95",
                    weather.current.locationName === prefs?.defaultCity && "text-primary bg-primary/10 border-primary/30"
                  )}
                  onClick={handleSetDefault}
                >
                  <Star size={24} fill={weather.current.locationName === prefs?.defaultCity ? "currentColor" : "none"} />
                </Button>
                <div className="w-px h-16 bg-white/5 mx-2 hidden sm:block" />
                <AuthButton />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-8 space-y-10">
              <div className="glass-card glass-card-hover p-10 md:p-16 relative overflow-hidden group">
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none group-hover:bg-primary/10 transition-colors duration-1000" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 relative z-10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 text-white/40 font-bold text-xl">
                      <MapPin size={24} className="text-accent" />
                      <span className="tracking-tight">{weather.current.locationName}, {weather.current.region}</span>
                      {weather.current.locationName === prefs?.defaultCity && (
                        <span className="text-[10px] bg-primary text-primary-foreground px-4 py-1.5 rounded-full uppercase tracking-[0.3em] font-black ml-4 shadow-2xl">Home Station</span>
                      )}
                    </div>
                    <div className="relative animate-float">
                      <h2 className="text-9xl md:text-[14rem] font-headline font-black text-white tracking-tighter text-glow leading-none select-none">
                        {weather.current.temp}°
                        <span className="text-5xl md:text-7xl text-white/20 align-top mt-12 inline-block font-light">C</span>
                      </h2>
                    </div>
                  </div>
                  <div className="mt-12 md:mt-0 md:text-right space-y-3">
                    <p className="text-5xl md:text-7xl font-headline font-black text-white accent-glow">{weather.current.condition}</p>
                    <p className="text-white/20 text-xl font-bold uppercase tracking-[0.4em]">Feels like {weather.current.feelsLike}°C</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 pt-12 border-t border-white/5 relative z-10">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">
                      <Wind size={20} className="text-primary" />
                      Wind Flow
                    </div>
                    <p className="text-3xl font-headline font-black text-white">{weather.current.windSpeed} <span className="text-sm text-white/30 font-medium">km/h</span></p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">
                      <Droplets size={20} className="text-primary" />
                      Humidity
                    </div>
                    <p className="text-3xl font-headline font-black text-white">{weather.current.humidity}<span className="text-sm text-white/30 font-medium">%</span></p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">
                      <Eye size={20} className="text-primary" />
                      Visibility
                    </div>
                    <p className="text-3xl font-headline font-black text-white">{weather.current.visibility} <span className="text-sm text-white/30 font-medium">km</span></p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">
                      <RefreshCw size={20} className="text-primary" />
                      Atmos Sync
                    </div>
                    <p className="text-3xl font-headline font-black text-white">{format(new Date(weather.current.lastUpdated), 'HH:mm')}</p>
                  </div>
                </div>
              </div>

              <WeatherAdvice weather={weather} />
            </div>

            <div className="lg:col-span-4 space-y-10">
              <div className="glass-card p-10 shadow-2xl">
                <h3 className="text-white/40 font-headline font-black uppercase tracking-[0.3em] text-[10px] flex items-center gap-4 mb-10">
                  <Building2 size={20} className="text-primary" />
                  Regional Intelligence
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {POPULAR_KARNATAKA.map(city => (
                    <button
                      key={city}
                      onClick={() => handleFetch(city, true)}
                      className="w-full flex items-center justify-between p-6 bg-white/[0.02] rounded-3xl border border-white/5 hover:bg-primary/10 hover:border-primary/20 transition-all group shadow-sm active:scale-95"
                    >
                      <span className="text-white/50 font-black group-hover:text-white text-xl tracking-tight transition-colors">{city}</span>
                      <ChevronRight size={20} className="text-white/10 group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card p-10 shadow-2xl">
                <h3 className="text-white/40 font-headline font-black uppercase tracking-[0.3em] text-[10px] flex items-center gap-4 mb-10">
                  <RefreshCw size={20} className="text-primary" />
                  Outlook Protocol
                </h3>

                <div className="space-y-5">
                  {weather.forecast.map((day, idx) => (
                    <div 
                      key={day.date} 
                      className="flex items-center justify-between p-6 bg-white/[0.02] rounded-3xl border border-white/5 hover:bg-white/[0.08] transition-all duration-500 group cursor-default"
                    >
                      <div className="flex items-center gap-6">
                        <div className="p-4 bg-white/[0.03] rounded-2xl group-hover:scale-110 transition-transform duration-500">
                          <WeatherIcon code={day.conditionCode} size={32} />
                        </div>
                        <div>
                          <p className="text-white font-black font-headline text-xl">
                            {idx === 0 ? 'Today' : format(new Date(day.date), 'EEE')}
                          </p>
                          <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">{day.condition}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-white font-black font-headline text-2xl block">{day.maxTemp}°</span>
                          <span className="text-white/20 font-black font-headline text-lg block">{day.minTemp}°</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}