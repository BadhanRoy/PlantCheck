export function calculateWateringRecommendation(crop, weather) {
  const todayRainProbability = Number(weather?.daily?.rainProbability?.[0] ?? 0);
  const todayRain = Number(weather?.daily?.rain?.[0] ?? 0);
  const temperature = Number(weather?.current?.temperature ?? 0);
  const humidity = Number(weather?.current?.humidity ?? 0);

  const cropName = crop.crop_name || crop.cropName || "Crop";

  const lastWateredValue = crop.last_watered ?? crop.lastWatered ?? null;
  const lastWatered = lastWateredValue ? new Date(lastWateredValue) : null;
  const nextWateringValue = crop.next_watering ?? crop.nextWatering ?? null;
  const nextWatering = nextWateringValue ? new Date(nextWateringValue) : null;
  const today = new Date();

  let daysSinceWatered = null;

  if (lastWatered) {
    const difference = today.getTime() - lastWatered.getTime();
    daysSinceWatered = Math.floor(difference / (1000 * 60 * 60 * 24));
  }

  const effectiveNextWatering = nextWatering &&
    (!lastWatered || nextWatering > lastWatered)
    ? nextWatering
    : lastWatered
      ? new Date(lastWatered.getTime() + 2 * 24 * 60 * 60 * 1000)
      : null;

  const isDueBySchedule = effectiveNextWatering
    ? today >= effectiveNextWatering
    : lastWatered === null || daysSinceWatered >= 2;

  const hasStrongRainSignal =
    todayRainProbability >= 70 && todayRain >= 2;

  const hasHeavyRainSignal = todayRain >= 8;

  if ((hasStrongRainSignal || hasHeavyRainSignal) && !isDueBySchedule) {
    return {
      status: "rain_expected",
      needsWater: false,
      title: "No watering required",
      message:
        "Rain is expected before the next watering time, so watering can wait.",
      reason:
        `Rain probability is ${todayRainProbability}% with ${todayRain} mm expected.`,
      nextWatering: "After rainfall",
    };
  }

  if (
    temperature >= 35 &&
    humidity <= 55 &&
    (daysSinceWatered === null || daysSinceWatered >= 1)
  ) {
    return {
      status: "urgent",
      needsWater: true,
      title: "Watering recommended",
      message:
        "The heat is intense and the air is dry, so the crop will need water soon.",
      reason:
        `Temperature is ${temperature}°C with ${humidity}% humidity, which is a strong evaporation condition in Bangladesh summer weather.`,
      nextWatering: "Today",
    };
  }

  if (
    temperature >= 30 &&
    humidity >= 80 &&
    !isDueBySchedule
  ) {
    return {
      status: "monitor",
      needsWater: false,
      title: "Monitor moisture level",
      message:
        "The weather is humid, so soil moisture is likely being retained despite the heat.",
      reason:
        `Humidity is ${humidity}% and temperature is ${temperature}°C, which is typical for humid Bangladesh conditions.`,
      nextWatering: "Check in 1 day",
    };
  }

  if (
    isDueBySchedule
  ) {
    return {
      status: "needs_water",
      needsWater: true,
      title: "Water today",
      message:
        `${cropName} is due for watering based on its crop schedule.`,
      reason:
        !lastWatered
          ? "The crop has not been watered yet."
          : effectiveNextWatering && today >= effectiveNextWatering
            ? "The scheduled watering time has arrived."
            : `It has been ${daysSinceWatered} days since the last watering.`,
      nextWatering: "Today",
    };
  }

  return {
    status: "healthy",
    needsWater: false,
    title: "No watering needed",
    message:
      `${cropName} does not currently need watering.`,
    reason:
      daysSinceWatered === null
        ? "Recent watering information is unavailable."
        : `Last watered ${daysSinceWatered} day(s) ago.`,
    nextWatering: "Monitor",
  };
}
