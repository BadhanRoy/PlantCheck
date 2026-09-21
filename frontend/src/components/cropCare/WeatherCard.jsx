export default function WeatherCard({
  weather,
}) {
  if (!weather) {
    return (
      <div className="bg-gray-50 rounded-xl p-5">
        Weather information unavailable.
      </div>
    );
  }

  const current =
    weather.current || {};

  const rainProbability =
    weather.daily
      ?.rainProbability?.[0] ?? 0;

  return (
    <div className="bg-blue-50 rounded-xl p-5">
      <h3 className="font-bold text-lg mb-4">
        🌤️ Current Weather
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-gray-500 text-sm">
            Temperature
          </p>

          <p className="text-xl font-bold">
            {current.temperature ?? "--"}°C
          </p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">
            Humidity
          </p>

          <p className="text-xl font-bold">
            {current.humidity ?? "--"}%
          </p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">
            Rain Probability
          </p>

          <p className="text-xl font-bold">
            {rainProbability}%
          </p>
        </div>

        <div>
          <p className="text-gray-500 text-sm">
            Rain
          </p>

          <p className="text-xl font-bold">
            {current.rain ?? 0} mm
          </p>
        </div>
      </div>
    </div>
  );
}