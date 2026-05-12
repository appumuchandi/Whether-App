export interface CurrentWeather {
  temp: number;
  condition: string;
  conditionCode: number;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  visibility: number;
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
};

export const getWeatherCategory = (code: number) => {
  return CONDITION_MAP[code] || 'cloudy';
};

// Generic Mock Data used when API Key is missing
const MOCK_WEATHER: WeatherData = {
  current: {
    temp: 28,
    condition: "Clear Skies",
    conditionCode: 1000,
    humidity: 45,
    windSpeed: 12,
    feelsLike: 30,
    visibility: 10,
    isDay: true,
    locationName: "Bengaluru",
    region: "Karnataka",
    country: "India",
    lastUpdated: new Date().toISOString()
  },
  forecast: Array.from({ length: 5 }, (_, i) => ({
    date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxTemp: 32,
    minTemp: 21,
    condition: "Sunny",
    conditionCode: 1000,
    avgHumidity: 40,
    maxWind: 15
  }))
};

export async function fetchWeather(query: string): Promise<WeatherData> {
  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  
  if (!apiKey || apiKey.includes('placeholder')) {
    return {
      ...MOCK_WEATHER,
      current: {
        ...MOCK_WEATHER.current,
        locationName: query.includes(',') ? "My Location" : query.split(',')[0]
      }
    };
  }

  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${query}&days=5&aqi=no&alerts=no`
    );

    if (!response.ok) {
      throw new Error('Location not found');
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
        visibility: data.current.vis_km,
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
