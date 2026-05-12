export interface CurrentWeather {
  temp: number;
  condition: string;
  conditionCode: number;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  isDay: boolean;
  locationName: string;
  region: string;
  country: string;
  lastUpdated: string;
}

export interface ForecastDay {
  date: string;
  maxTemp: number;
  minTemp: number;
  condition: string;
  conditionCode: number;
  avgHumidity: number;
  maxWind: number;
}

export interface WeatherData {
  current: CurrentWeather;
  forecast: ForecastDay[];
}

// WeatherAPI.com condition codes roughly mapped to categories
const CONDITION_MAP: Record<number, 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm'> = {
  1000: 'clear',
  1003: 'cloudy',
  1006: 'cloudy',
  1009: 'cloudy',
  1030: 'cloudy',
  1063: 'rain',
  1183: 'rain',
  1189: 'rain',
  1195: 'rain',
  1273: 'storm',
  1276: 'storm',
  // Simplified for mapping
};

export const getWeatherCategory = (code: number) => {
  return CONDITION_MAP[code] || 'cloudy';
};

// Demo/Mock Data as fallback
const MOCK_WEATHER: WeatherData = {
  current: {
    temp: 24,
    condition: "Partly cloudy",
    conditionCode: 1003,
    humidity: 52,
    windSpeed: 12,
    feelsLike: 26,
    isDay: true,
    locationName: "San Francisco",
    region: "California",
    country: "USA",
    lastUpdated: new Date().toISOString()
  },
  forecast: Array.from({ length: 5 }, (_, i) => ({
    date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxTemp: 26 + i,
    minTemp: 18 - i,
    condition: "Sunny",
    conditionCode: 1000,
    avgHumidity: 45,
    maxWind: 10
  }))
};

export async function fetchWeather(query: string): Promise<WeatherData> {
  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  
  if (!apiKey) {
    console.warn("WeatherAPI Key not found. Returning mock data.");
    return MOCK_WEATHER;
  }

  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${query}&days=5&aqi=no&alerts=no`
    );

    if (!response.ok) {
      throw new Error('City not found');
    }

    const data = await response.json();

    return {
      current: {
        temp: Math.round(data.current.temp_c),
        condition: data.current.condition.text,
        conditionCode: data.current.condition.code,
        humidity: data.current.humidity,
        windSpeed: data.current.wind_kph,
        feelsLike: Math.round(data.current.feelslike_c),
        isDay: !!data.current.is_day,
        locationName: data.location.name,
        region: data.location.region,
        country: data.location.country,
        lastUpdated: data.current.last_updated
      },
      forecast: data.forecast.forecastday.map((day: any) => ({
        date: day.date,
        maxTemp: Math.round(day.day.maxtemp_c),
        minTemp: Math.round(day.day.mintemp_c),
        condition: day.day.condition.text,
        conditionCode: day.day.condition.code,
        avgHumidity: day.day.avghumiditiy,
        maxWind: day.day.maxwind_kph
      }))
    };
  } catch (error) {
    console.error("Fetch weather error:", error);
    throw error;
  }
}
