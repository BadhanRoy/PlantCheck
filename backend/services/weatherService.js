import https from "https";

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function firstValue(values, fallback = 0) {
  if (Array.isArray(values) && values.length > 0) {
    return toNumber(values[0], fallback);
  }

  return fallback;
}

export async function getWeather(latitude, longitude) {
  if (!latitude || !longitude) {
    throw new Error("Latitude and longitude are required");
  }

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code` +
    `&hourly=precipitation_probability` +
    `&daily=precipitation_sum,rain_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min` +
    `&timezone=auto` +
    `&forecast_days=3`;

  const data = await fetchJSON(url);
  const daily = data.daily || {};
  const hourly = data.hourly || {};
  const precipitationProbability =
    Array.isArray(hourly.precipitation_probability)
      ? hourly.precipitation_probability.slice(0, 24)
      : [];

  return {
    current: {
      temperature: toNumber(data.current?.temperature_2m, null),
      humidity: toNumber(data.current?.relative_humidity_2m, null),
      precipitation: toNumber(data.current?.precipitation, null),
      rain: toNumber(data.current?.rain, null),
      weatherCode: data.current?.weather_code ?? null,
    },

    hourly: {
      precipitationProbability,
    },

    daily: {
      dates: daily.time || [],
      rainProbability: daily.precipitation_probability_max || [],
      precipitation:
        daily.precipitation_sum ||
        daily.precipitation ||
        [],
      rain:
        daily.rain_sum ||
        daily.rain ||
        [],
      maxTemperature:
        daily.temperature_2m_max || [],
      minTemperature:
        daily.temperature_2m_min || [],
    },
  };
}

