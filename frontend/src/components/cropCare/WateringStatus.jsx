export default function WateringStatus({
  crops,
}) {
  const needWater =
    crops.filter(
      (crop) =>
        crop.recommendation?.needsWater
    ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-[24px] border border-blue-200 bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 p-5 text-white shadow-[0_18px_50px_-28px_rgba(59,130,246,0.8)]">
        <p className="text-sm text-blue-50">
          Registered Crops
        </p>

        <p className="mt-2 text-3xl font-bold">
          {crops.length}
        </p>
      </div>

      <div className="rounded-[24px] border border-cyan-200 bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 p-5 text-white shadow-[0_18px_50px_-28px_rgba(14,165,233,0.8)]">
        <p className="text-sm text-cyan-50">
          Need Watering
        </p>

        <p className="mt-2 text-3xl font-bold">
          {needWater}
        </p>
      </div>

      <div className="rounded-[24px] border border-indigo-200 bg-gradient-to-br from-indigo-500 via-blue-500 to-sky-500 p-5 text-white shadow-[0_18px_50px_-28px_rgba(99,102,241,0.8)]">
        <p className="text-sm text-indigo-50">
          Crop Care
        </p>

        <p className="mt-2 text-3xl font-bold">
          🌱
        </p>
      </div>
    </div>
  );
}