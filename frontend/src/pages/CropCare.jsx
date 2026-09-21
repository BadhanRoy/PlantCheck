import { useEffect, useState } from "react";

import AddCropForm from "../components/cropCare/AddCropForm";
import CropCard from "../components/cropCare/CropCard";
import WateringStatus from "../components/cropCare/WateringStatus";

import {
  getCrops,
  getRecommendation,
} from "../utils/cropCareApi";

// =========================
// SHARED BUTTON CLASSES
// (Matching Crop Care button design)
// =========================

const btnPrimary =
  "inline-flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium border border-emerald-200/60 dark:border-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed";

const btnSolid =
  "inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm shadow-emerald-600/20 hover:shadow-md hover:shadow-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed";

export default function CropCare() {
  const [crops, setCrops] = useState([]);

  const [selectedCropId, setSelectedCropId] = useState(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("cropId");
  });

  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState("");

  async function loadCrops() {
    try {
      setLoading(true);
      setError("");

      const result = await getCrops();
      const loadedCrops = result.crops || [];

      const cropsWithRecommendations = await Promise.all(
        loadedCrops.map(async (crop) => {
          try {
            const recommendationResult = await getRecommendation(crop.id);
            return {
              ...crop,
              recommendation: recommendationResult?.recommendation || null,
            };
          } catch {
            return {
              ...crop,
              recommendation: null,
            };
          }
        })
      );

      setCrops(cropsWithRecommendations);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCrops();
  }, []);

  useEffect(() => {
    if (!selectedCropId) return;

    const target = document.getElementById(`crop-card-${selectedCropId}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedCropId, crops]);

  function handleCreated() {
    setShowAddForm(false);
    loadCrops();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-sans antialiased p-4 md:p-8 transition-colors duration-300">
      <div className="mx-auto max-w-7xl">

        {/* HERO HEADER */}
        <div className="mb-8 overflow-hidden rounded-2xl ring-1 ring-emerald-200/60 dark:ring-emerald-500/20 bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 p-6 md:p-8 transition-colors duration-300">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">
                Crop Care Dashboard
              </p>

              <h1 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                🌱 Smart Crop Care
              </h1>

              <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">
                Monitor your crops and get location-aware watering guidance based on current weather.
              </p>
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className={btnSolid}
            >
              + Add New Crop
            </button>

          </div>
        </div>

        {/* ADD CROP FORM */}
        {showAddForm && (
          <div className="mx-auto mb-8 max-w-2xl">
            <AddCropForm
              onCreated={handleCreated}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-2xl bg-rose-50 dark:bg-rose-500/10 ring-1 ring-rose-200 dark:ring-rose-500/20 px-4 py-3 text-sm text-rose-700 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* WATERING STATUS */}
        {!loading && (
          <div className="mb-8">
            <WateringStatus crops={crops} />
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-800 py-16 text-center shadow-sm shadow-slate-200/50 dark:shadow-none transition-colors duration-300">
            <div className="mb-3 text-5xl">🌱</div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Loading your crops...
            </p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && crops.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-12 text-center shadow-sm shadow-slate-200/50 dark:shadow-none transition-colors duration-300">
            <div className="mb-5 text-6xl">🌿</div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              No crops added yet
            </h2>

            <p className="mt-2 mb-6 text-slate-500 dark:text-slate-400 text-sm">
              Add your first crop to start receiving smart care recommendations.
            </p>

            <button
              onClick={() => setShowAddForm(true)}
              className={btnSolid}
            >
              + Add Your First Crop
            </button>
          </div>
        )}

        {/* CROP GRID */}
        {!loading && crops.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {crops.map((crop) => (
              <CropCard
                key={crop.id}
                crop={crop}
                selected={selectedCropId === crop.id}
                onSelect={(cropId) => setSelectedCropId(cropId)}
                onChanged={loadCrops}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}