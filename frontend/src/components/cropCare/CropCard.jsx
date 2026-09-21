import { useEffect, useState } from "react";

import {
  getRecommendation,
  markWatered,
  deleteCrop,
} from "../../utils/cropCareApi";
import CropJournal from "./CropJournal";

export default function CropCard({
  crop,
  onChanged,
  selected,
  onSelect,
}) {
  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [watering, setWatering] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showJournal, setShowJournal] = useState(false);

  async function loadRecommendation() {
    try {
      setLoading(true);

      const result =
        await getRecommendation(crop.id);

      setData(result);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecommendation();
  }, [crop.id]);

  async function handleWater() {
    try {
      setWatering(true);

      await markWatered(crop.id);

      await loadRecommendation();

      onChanged?.();
    } catch (error) {
      setError(error.message);
    } finally {
      setWatering(false);
    }
  }

  async function handleDelete() {
    const confirmed =
      window.confirm(
        `Delete ${crop.crop_name}?`
      );

    if (!confirmed) return;

    try {
      await deleteCrop(crop.id);

      onChanged?.();
    } catch (error) {
      setError(error.message);
    }
  }

  const recommendation =
    data?.recommendation;

  return (
    <div
      id={`crop-card-${crop.id}`}
      onClick={() => onSelect?.(crop.id)}
      className={`cursor-pointer overflow-hidden rounded-[28px] border ${selected ? "border-blue-400 ring-2 ring-blue-200" : "border-slate-200"} bg-gradient-to-br from-white via-blue-50 to-indigo-50 shadow-[0_20px_50px_-30px_rgba(59,130,246,0.35)] transition-all`}
    >
      <div className="border-b border-blue-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold">🌱 {crop.crop_name}</h3>
            <p className="mt-1 text-sm text-blue-50">
              {crop.location_name || "Location not specified"}
            </p>
          </div>

          <button
            onClick={handleDelete}
            className="rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
            title="Delete crop"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Planted</p>
            <p className="mt-1 font-semibold text-slate-700">{crop.planting_date || "Pending"}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Growth</p>
            <p className="mt-1 font-semibold text-slate-700">{crop.growth_stage || "Seedling"}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Soil</p>
            <p className="mt-1 font-semibold text-slate-700">{crop.soil_type || "Loamy"}</p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Last Watered</p>
            <p className="mt-1 font-semibold text-slate-700">{crop.last_watered || "Not recorded"}</p>
          </div>
        </div>

        {loading && (
          <div className="mt-5 rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-500">
            Checking weather and crop needs...
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {recommendation && (
          <div
            className={`mt-5 rounded-2xl p-4 ${
              recommendation.needsWater ? "bg-orange-50" : "bg-emerald-50"
            }`}
          >
            <div className="flex gap-3">
              <div className="text-2xl">
                {recommendation.needsWater ? "💧" : recommendation.status === "rain_expected" ? "🌧️" : "🌱"}
              </div>

              <div>
                <h4 className="font-bold text-slate-800">{recommendation.title}</h4>
                <p className="mt-1 text-sm text-slate-600">{recommendation.message}</p>
                <p className="mt-2 text-xs text-slate-500">{recommendation.reason}</p>
              </div>
            </div>
          </div>
        )}

        {data?.weather && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-blue-50 p-2 text-center">
              <div>🌡️</div>
              <div className="mt-1 font-semibold text-slate-700">
                {data.weather.current?.temperature ?? "--"}°C
              </div>
            </div>

            <div className="rounded-xl bg-blue-50 p-2 text-center">
              <div>💧</div>
              <div className="mt-1 font-semibold text-slate-700">
                {data.weather.current?.humidity ?? "--"}%
              </div>
            </div>

            <div className="rounded-xl bg-blue-50 p-2 text-center">
              <div>🌧️</div>
              <div className="mt-1 font-semibold text-slate-700">
                {data.weather.hourly?.precipitationProbability?.[0] ?? data.weather.daily?.rainProbability?.[0] ?? "--"}%
              </div>
              <div className="text-[10px] text-slate-500">Current rain</div>
            </div>
          </div>
        )}

        <div className="mt-5">
          <button
            onClick={handleWater}
            disabled={watering || !recommendation?.needsWater}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-700 hover:to-green-700 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {watering ? "Saving..." : "💧 Mark as Watered"}
          </button>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setShowJournal((current) => !current);
          }}
          className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
        >
          {showJournal ? "Hide Crop Journal" : "Open Crop Journal"}
        </button>

        {showJournal && <CropJournal cropId={crop.id} />}
      </div>
    </div>
  );
}