import WeatherDashboard from '@/components/WeatherDashboard';
import { Toaster } from '@/components/ui/toaster';

export default function Home() {
  return (
    <main className="min-h-screen bg-background selection:bg-primary/30">
      <WeatherDashboard />
      <Toaster />
    </main>
  );
}
