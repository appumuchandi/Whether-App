"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, MapPin, Wind, Droplets, Thermometer, RefreshCw, Star, X, Building2, ChevronRight, Eye } from 'lucide-react';
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
        title: "Search Failed",
        description: "Could not find weather data for that location."
      });
    } finally {
      setLoading(false);
    }
  }, [user, firestore]);

  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Unsupported",
        description: "Please search for your city manually."
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
      }
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
        description: "Please sign in to save a default city."
      });
      return;
    }

    const prefsRef = doc(firestore, 'users', user.uid);
    setDoc(prefsRef, { defaultCity: weather.current.locationName }, { merge: true });
    
    toast({
      title: "Default Saved",
      description: `${weather.current.locationName} is now your home city.`
    });
  };

  if (loading && !weather) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <RefreshCw className="animate-spin text-primary" size={48} />
          <p className="text-xl font-headline tracking-widest text-primary/80 animate-pulse uppercase">Syncing Atmosphere...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-4 py-8 md:px-8 max-w-7xl mx-auto overflow-hidden">
      {weather && (
        <>
          <DynamicBackground conditionCode={weather.current.conditionCode} isDay={weather.current.isDay} />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-2xl backdrop-blur-xl border border-white/20 shadow-2xl">
                <WeatherIcon code={weather.current.conditionCode} size={36} />
              </div>
              <div>
                <h1 className="text-5xl font-headline font-bold text-white tracking-tighter leading-none mb-1 uppercase text-glow">Atmos</h1>
                <p className="text-primary/70 font-bold text-xs tracking-[0.2em] uppercase">Karnataka Intelligence</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full lg:max-w-2xl relative" ref={suggestionRef}>
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors" size={20} />
                <Input 
                  placeholder="Search Indian cities..." 
                  className="bg-white/5 backdrop-blur-2xl border-white/10 focus:border-primary/50 text-white pl-12 h-14 rounded-2xl transition-all shadow-inner text-lg"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetch(query, true)}
                  onFocus={() => query.length > 1 && setShowSuggestions(true)}
                />
                {query && (
                  <button 
                    onClick={() => setQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-black/80 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4">
                  {suggestions.map((city) => (
                    <button
                      key={city}
                      onClick={() => handleFetch(city, true)}
                      className="w-full text-left px-6 py-4 text-base text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-4 border-b border-white/5 last:border-0"
                    >
                      <MapPin size={18} className="text-primary/60" />
                      {city}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2 shrink-0">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="bg-white/5 backdrop-blur-2xl border-white/10 hover:bg-white/15 h-14 w-14 rounded-2xl shadow-lg group"
                  onClick={handleGeolocation}
                  title="Detect Location"
                >
                  <MapPin size={24} className="text-white group-hover:text-primary transition-colors" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={`bg-white/5 backdrop-blur-2xl border-white/10 h-14 w-14 rounded-2xl shadow-lg transition-all ${weather.current.locationName === prefs?.defaultCity ? 'text-primary bg-primary/10 border-primary/50' : 'text-white hover:bg-white/15'}`}
                  onClick={handleSetDefault}
                  title="Set as Default"
                >
                  <Star size={24} fill={weather.current.locationName === prefs?.defaultCity ? "currentColor" : "none"} />
                </Button>
                <div className="w-px h-14 bg-white/10 mx-1 hidden sm:block" />
                <AuthButton />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-8">
              <div className="glass-card p-10 md:p-14 animate-fade-in relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-1000" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 relative z-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-white/60 font-semibold text-lg">
                      <MapPin size={20} className="text-accent animate-pulse" />
                      <span className="tracking-tight">{weather.current.locationName}, {weather.current.region}</span>
                      {weather.current.locationName === prefs?.defaultCity && (
                        <span className="text-[10px] bg-primary text-primary-foreground px-3 py-1 rounded-full uppercase tracking-[0.2em] font-black ml-4 shadow-xl">Home</span>
                      )}
                    </div>
                    <div className="relative">
                      <h2 className="text-9xl md:text-[12rem] font-headline font-black text-white tracking-tighter text-glow leading-none select-none">
                        {weather.current.temp}°
                        <span className="text-4xl md:text-6xl text-white/30 align-top mt-10 inline-block font-light">C</span>
                      </h2>
                    </div>
                  </div>
                  <div className="mt-8 md:mt-0 md:text-right space-y-2">
                    <p className="text-4xl md:text-6xl font-headline font-bold text-white accent-glow">{weather.current.condition}</p>
                    <p className="text-white/40 text-lg font-bold uppercase tracking-[0.3em]">Feels like {weather.current.feelsLike}°C</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-10 border-t border-white/10 relative z-10">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-white/40 text-xs font-black uppercase tracking-[0.2em]">
                      <Wind size={18} className="text-primary" />
                      Wind Speed
                    </div>
                    <p className="text-2xl font-headline font-black text-white">{weather.current.windSpeed} <span className="text-sm text-white/40">km/h</span></p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-white/40 text-xs font-black uppercase tracking-[0.2em]">
                      <Droplets size={18} className="text-primary" />
                      Humidity
                    </div>
                    <p className="text-2xl font-headline font-black text-white">{weather.current.humidity}<span className="text-sm text-white/40">%</span></p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-white/40 text-xs font-black uppercase tracking-[0.2em]">
                      <Eye size={18} className="text-primary" />
                      Visibility
                    </div>
                    <p className="text-2xl font-headline font-black text-white">{weather.current.visibility} <span className="text-sm text-white/40">km</span></p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-white/40 text-xs font-black uppercase tracking-[0.2em]">
                      <RefreshCw size={18} className="text-primary" />
                      Last Sync
                    </div>
                    <p className="text-2xl font-headline font-black text-white">{format(new Date(weather.current.lastUpdated), 'HH:mm')}</p>
                  </div>
                </div>
              </div>

              <WeatherAdvice weather={weather} />
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="glass-card p-8 shadow-2xl">
                <h3 className="text-white font-headline font-black uppercase tracking-[0.25em] text-xs flex items-center gap-3 mb-8">
                  <Building2 size={18} className="text-primary" />
                  Karnataka Hubs
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {POPULAR_KARNATAKA.map(city => (
                    <button
                      key={city}
                      onClick={() => handleFetch(city, true)}
                      className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-primary/10 hover:border-primary/30 transition-all group shadow-sm"
                    >
                      <span className="text-white/70 font-bold group-hover:text-white text-lg">{city}</span>
                      <ChevronRight size={20} className="text-white/20 group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card p-8 shadow-2xl flex flex-col">
                <h3 className="text-white font-headline font-black uppercase tracking-[0.25em] text-xs flex items-center gap-3 mb-8">
                  <RefreshCw size={18} className="text-primary" />
                  5-Day Outlook
                </h3>

                <div className="space-y-4">
                  {weather.forecast.map((day, idx) => (
                    <div 
                      key={day.date} 
                      className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all duration-500 group cursor-default"
                    >
                      <div className="flex items-center gap-5">
                        <div className="p-3 bg-white/5 rounded-xl group-hover:scale-125 transition-transform duration-500">
                          <WeatherIcon code={day.conditionCode} size={28} />
                        </div>
                        <div>
                          <p className="text-white font-black font-headline text-lg">
                            {idx === 0 ? 'Today' : format(new Date(day.date), 'EEEE')}
                          </p>
                          <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">{day.condition}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-5">
                        <span className="text-white font-black font-headline text-xl">{day.maxTemp}°</span>
                        <div className="w-px h-8 bg-white/10" />
                        <span className="text-white/30 font-black font-headline text-xl">{day.minTemp}°</span>
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
