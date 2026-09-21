export default function CropReminder({
  recommendations,
}) {
  if (!recommendations?.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {recommendations.map(
        (item) => (
          <div
            key={item.id}
            className={`rounded-xl p-4 ${
              item.needsWater
                ? "bg-orange-50 border border-orange-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            <div className="flex gap-3">
              <div className="text-xl">
                {item.needsWater
                  ? "💧"
                  : "🌧️"}
              </div>

              <div>
                <p className="font-semibold">
                  {item.cropName}
                </p>

                <p className="text-sm text-gray-600">
                  {item.message}
                </p>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}