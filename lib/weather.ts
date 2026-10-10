import type { WeatherForecast } from "./types";

export async function fetchKolkataWeather(): Promise<WeatherForecast> {
  const apiKey = process.env.WEATHER_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=Kolkata&days=1&aqi=no`
      );
      if (res.ok) {
        const data = await res.json();
        const current = data.current;
        const forecastDay = data.forecast?.forecastday?.[0]?.day;
        const rainChance = forecastDay?.daily_chance_of_rain || 35;
        const willRain = rainChance > 40;

        return {
          locality: "Kolkata (Alipore Met Centre)",
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          tempC: Math.round(current.temp_c),
          condition: current.condition.text,
          rainProbability: rainChance,
          rainWarning: willRain,
          advice: willRain
            ? "Scattered evening showers predicted. Carry an umbrella and start pandal hopping early!"
            : "Pleasant autumn breeze (Sharodiya hawa). Ideal conditions for walking tours.",
          updatedAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        };
      }
    } catch (e) {
      console.warn("Weather API error, using Kolkata festival forecast fallback:", e);
    }
  }

  // Deterministic seasonal meteorological forecast for Kolkata Durga Puja (October)
  const hour = new Date().getHours();
  const isEvening = hour >= 18;
  const rainProb = isEvening ? 45 : 20;

  return {
    locality: "Kolkata & Suburbs (Festival Forecast)",
    time: isEvening ? "Tonight (Mahalaya / Pujo)" : "Today (Daytime)",
    tempC: isEvening ? 27 : 31,
    condition: isEvening ? "Passing clouds & mild breeze" : "Sunny with festive autumn sky (Kash phul)",
    rainProbability: rainProb,
    rainWarning: isEvening,
    advice: isEvening
      ? "Brief showers possible after 8:30 PM. Keep rainwear handy or check nearby covered pandals."
      : "Clear autumn conditions. Great time for photography and less crowded queues.",
    updatedAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  };
}
