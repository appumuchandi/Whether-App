"use client";

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface Props {
  locationName: string;
}

export default function ProfessionalClock({ locationName }: Props) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) {
    return (
      <div className="flex flex-col items-center gap-6 py-4 animate-pulse">
        <div className="w-44 h-44 rounded-full bg-white/5" />
        <div className="h-8 w-24 bg-white/5 rounded-full" />
        <div className="h-8 w-32 bg-white/5 rounded-full" />
      </div>
    );
  }

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;
  const minuteDeg = minutes * 6 + seconds * 0.1;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Material Design Scalloped Clock Face */}
      <div className="relative w-44 h-44 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform hover:scale-105 duration-700 ease-out">
        <svg viewBox="0 0 100 100" className="w-full h-full text-[#2c2c2c] fill-current">
          <path d="M50 2.5C54.4 2.5 57.5 6.8 61.8 7.9C66.1 9 70.8 6.8 74.5 9.2C78.2 11.6 79.9 17 83 20.2C86.1 23.4 91.5 25 93.8 28.7C96.1 32.4 94 37.1 95.1 41.4C96.2 45.7 100 48.8 100 53.2C100 57.6 96.2 60.7 95.1 65C94 69.3 96.1 74 93.8 77.7C91.5 81.4 86.1 83 83 86.2C79.9 89.4 78.2 94.8 74.5 97.2C70.8 99.6 66.1 97.4 61.8 98.5C57.5 99.6 54.4 103.9 50 103.9C45.6 103.9 42.5 99.6 38.2 98.5C33.9 97.4 29.2 99.6 25.5 97.2C21.8 94.8 20.1 89.4 17 86.2C13.9 83 8.5 81.4 6.2 77.7C3.9 74 6 69.3 4.9 65C3.8 60.7 0 57.6 0 53.2C0 48.8 3.8 45.7 4.9 41.4C6 37.1 3.9 32.4 6.2 28.7C8.5 25 13.9 23.4 17 20.2C20.1 17 21.8 11.6 25.5 9.2C29.2 6.8 33.9 9 38.2 7.9C42.5 6.8 45.6 2.5 50 2.5Z" />
        </svg>

        {/* Decorative accent dot */}
        <div className="absolute top-[22%] left-[28%] w-2.5 h-2.5 rounded-full bg-[#4a4a4a]" />

        {/* Hands */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Hour Hand */}
          <div 
            className="absolute w-3 h-12 bg-[#9ca3af] rounded-full origin-bottom"
            style={{ 
              transform: `translateY(-50%) rotate(${hourDeg}deg)`,
              height: '48px',
              top: '50%',
              marginTop: '-24px'
            }} 
          />
          
          {/* Minute Hand */}
          <div 
            className="absolute w-3 h-18 bg-[#e5e7eb] rounded-full origin-bottom"
            style={{ 
              transform: `translateY(-50%) rotate(${minuteDeg}deg)`,
              height: '72px',
              top: '50%',
              marginTop: '-36px'
            }} 
          />

          {/* Center Point */}
          <div className="w-2.5 h-2.5 bg-[#1f2937] rounded-full z-10 border border-white/10" />
        </div>
      </div>

      {/* Info Pills */}
      <div className="flex flex-col gap-2 items-center w-full">
        <div className="bg-[#18181b] px-6 py-2 rounded-2xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
          <span className="text-white text-[11px] font-bold tracking-[0.25em] uppercase font-headline">{locationName}</span>
        </div>
        <div className="bg-[#18181b] px-6 py-2 rounded-2xl border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
          <span className="text-white/60 text-[11px] font-medium tracking-wide font-headline">{format(time, 'EEE, MMM d')}</span>
        </div>
      </div>
    </div>
  );
}
