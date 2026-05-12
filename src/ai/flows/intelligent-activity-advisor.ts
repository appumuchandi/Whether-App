'use server';
/**
 * @fileOverview An AI agent that provides intelligent activity suggestions based on weather conditions.
 *
 * - intelligentActivityAdvisor - A function that generates activity suggestions.
 * - IntelligentActivityAdvisorInput - The input type for the intelligentActivityAdvisor function.
 * - IntelligentActivityAdvisorOutput - The return type for the intelligentActivityAdvisor function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const IntelligentActivityAdvisorInputSchema = z.object({
  currentWeather: z.object({
    temperature: z.number().describe('Current temperature in Celsius.'),
    condition: z.string().describe('Current weather condition (e.g., "Partly cloudy", "Rain").'),
    humidity: z.number().describe('Current humidity percentage.'),
    windSpeed: z.number().describe('Current wind speed in km/h.'),
    feelsLike: z.number().describe('Current "feels like" temperature in Celsius.'),
  }).describe('Details about the current weather conditions.'),
  forecast: z.array(z.object({
    date: z.string().describe('Date of the forecast in YYYY-MM-DD format.'),
    maxTemp: z.number().describe('Maximum temperature for the day in Celsius.'),
    minTemp: z.number().describe('Minimum temperature for the day in Celsius.'),
    condition: z.string().describe('Weather condition for the day (e.g., "Sunny", "Light rain").'),
  })).describe('A 5-day weather forecast.'),
});
export type IntelligentActivityAdvisorInput = z.infer<typeof IntelligentActivityAdvisorInputSchema>;

const IntelligentActivityAdvisorOutputSchema = z.object({
  suggestion: z.string().describe('A simple, intelligent suggestion based on weather conditions.'),
});
export type IntelligentActivityAdvisorOutput = z.infer<typeof IntelligentActivityAdvisorOutputSchema>;

export async function intelligentActivityAdvisor(input: IntelligentActivityAdvisorInput): Promise<IntelligentActivityAdvisorOutput> {
  try {
    return await intelligentActivityAdvisorFlow(input);
  } catch (error: any) {
    // Gracefully handle rate limits or other AI service errors
    console.error("AI Advisor Flow Error:", error);
    
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      return { 
        suggestion: "AI insights are temporarily resting due to high demand. Please check back in a minute for updated advice." 
      };
    }
    
    return { 
      suggestion: "Plan your day wisely based on the current temperature and conditions." 
    };
  }
}

const prompt = ai.definePrompt({
  name: 'intelligentActivityAdvisorPrompt',
  input: { schema: IntelligentActivityAdvisorInputSchema },
  output: { schema: IntelligentActivityAdvisorOutputSchema },
  prompt: `You are an intelligent activity advisor. Based on the current weather and the 5-day forecast, provide a simple, concise suggestion to the user. Focus on whether they need to prepare for rain or if it's good for outdoor activities.

Here is the current weather information:
Temperature: {{{currentWeather.temperature}}}°C
Feels Like: {{{currentWeather.feelsLike}}}°C
Condition: {{{currentWeather.condition}}}
Humidity: {{{currentWeather.humidity}}}%
Wind Speed: {{{currentWeather.windSpeed}}} km/h

Here is the 5-day forecast:
{{#each forecast}}
- Date: {{{date}}}, Max: {{{maxTemp}}}°C, Min: {{{minTemp}}}°C, Condition: {{{condition}}}
{{/each}}

Provide your suggestion in a single sentence, for example, "Carry an umbrella today, as light rain is expected." or "Good weather for outdoor activities all week!"
Suggestion:`,
});

const intelligentActivityAdvisorFlow = ai.defineFlow(
  {
    name: 'intelligentActivityAdvisorFlow',
    inputSchema: IntelligentActivityAdvisorInputSchema,
    outputSchema: IntelligentActivityAdvisorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
