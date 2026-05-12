"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, MapPin, Wind, Droplets, Thermometer, RefreshCw, Star, X, Building2, ChevronRight } from 'lucide-react';
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
        toast({
          title: "Location Access Required",
          description: "Please search for your city manually or enable location permissions."
        });
        // Default to Bengaluru if geolocation fails and no preference exists
        if (!prefs?.defaultCity) {
          handleFetch("Bengaluru", false);
        } else {
          setLoading(false);
        }
      }
    );
  }, [handleFetch, prefs?.defaultCity]);

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
          <p className="text-xl font-headline tracking-widest text-primary/80 animate-pulse uppercase">Syncing Atmospheric Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-4 py-8 md:px-8 max-w-7xl mx-auto overflow-hidden">
      {weather && (
        <>
          <DynamicBackground conditionCode={weather.current.conditionCode} isDay={weather.current.isDay} />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/20 rounded-xl backdrop-blur-md border border-white/20">
                <WeatherIcon code={weather.current.conditionCode} size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-headline font-bold text-white tracking-tight leading-none mb-1 uppercase text-glow">Atmos</h1>
                <p className="text-primary/70 font-medium text-xs tracking-widest uppercase">Karnataka Weather Intelligence</p>
              </div>
            </div>

            <div className="flex gap-2 w-full md:max-w-xl relative" ref={suggestionRef}>
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-primary transition-colors" size={18} />
                <Input 
                  placeholder="Search Indian cities..." 
                  className="bg-white/10 backdrop-blur-md border-white/20 focus:border-primary/50 text-white pl-10 h-12 rounded-xl transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetch(query, true)}
                  onFocus={() => query.length > 1 && setShowSuggestions(true)}
                />
                {query && (
                  <button 
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {suggestions.map((city) => (
                    <button
                      key={city}
                      onClick={() => handleFetch(city, true)}
                      className="w-full text-left px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0"
                    >
                      <MapPin size={14} className="text-primary/60" />
                      {city}
                    </button>
                  ))}
                </div>
              )}

              <Button 
                variant="outline" 
                size="icon" 
                className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 h-12 w-12 rounded-xl shrink-0"
                onClick={handleGeolocation}
                title="Detect My Location"
              >
                <MapPin size={20} className="text-white" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className={`bg-white/10 backdrop-blur-md border-white/20 h-12 w-12 rounded-xl shrink-0 transition-all ${weather.current.locationName === prefs?.defaultCity ? 'text-primary bg-primary/10 border-primary/50' : 'text-white hover:bg-white/20'}`}
                onClick={handleSetDefault}
                title="Set as Default City"
              >
                <Star size={20} fill={weather.current.locationName === prefs?.defaultCity ? "currentColor" : "none"} />
              </Button>
              <div className="hidden md:block w-px h-12 bg-white/10 mx-1" />
              <AuthButton />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div className="glass-card p-8 md:p-12 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 text-white/60 mb-2 font-medium">
                      <MapPin size={16} className="text-accent" />
                      <span className="tracking-wide">{weather.current.locationName}, {weather.current.region}</span>
                      {weather.current.locationName === prefs?.defaultCity && (
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest font-bold ml-2">Home</span>
                      )}
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
                      Wind
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
                      Feels Like
                    </div>
                    <p className="text-xl font-headline font-bold text-white">{weather.current.feelsLike}°C</p>
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

              <WeatherAdvice weather={weather} />
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="glass-card p-6">
                <h3 className="text-white font-headline font-bold uppercase tracking-widest text-sm flex items-center gap-2 mb-6">
                  <Building2 size={16} className="text-primary" />
                  Regional Hubs
                </h3>
                <div className="space-y-2">
                  {POPULAR_KARNATAKA.map(city => (
                    <button
                      key={city}
                      onClick={() => handleFetch(city, true)}
                      className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-primary/10 hover:border-primary/30 transition-all group"
                    >
                      <span className="text-white/80 font-medium group-hover:text-white">{city}</span>
                      <ChevronRight size={16} className="text-white/20 group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6 flex flex-col">
                <h3 className="text-white font-headline font-bold uppercase tracking-widest text-sm flex items-center gap-2 mb-6">
                  <RefreshCw size={16} className="text-primary" />
                  5-Day Forecast
                </h3>

                <div className="space-y-4">
                  {weather.forecast.map((day, idx) => (
                    <div 
                      key={day.date} 
                      className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                          <WeatherIcon code={day.conditionCode} size={24} />
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
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
