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
// (Matching Dashboard button design — green CTA)
// =========================

const btnPrimary =
  "inline-flex items-center justify-center bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium border border-green-200/60 dark:border-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed";

const btnSolid =
  "inline-flex items-center justify-center bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm shadow-green-600/20 hover:shadow-md hover:shadow-green-600/30 disabled:opacity-50 disabled:cursor-not-allowed";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 text-gray-900 dark:text-white font-sans antialiased p-4 md:p-8 transition-colors duration-300">
      <div className="mx-auto max-w-7xl">

        {/* HERO HEADER */}
        <div className="mb-8 overflow-hidden rounded-2xl ring-1 ring-blue-100 dark:ring-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur p-6 md:p-8 transition-colors duration-300">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-green-700 dark:text-green-400">
                Crop Care Dashboard
              </p>

              <h1 className="mt-2 text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                🌱 Smart Crop Care
              </h1>

              <p className="mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-400">
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
          <div className="rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur ring-1 ring-blue-100 dark:ring-gray-700 py-16 text-center shadow-sm transition-colors duration-300">
            <div className="mb-3 text-5xl">🌱</div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Loading your crops...
            </p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && crops.length === 0 && (
          <div className="rounded-2xl border border-dashed border-blue-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur p-12 text-center shadow-sm transition-colors duration-300">
            <div className="mb-5 text-6xl">🌿</div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              No crops added yet
            </h2>

            <p className="mt-2 mb-6 text-gray-600 dark:text-gray-400 text-sm">
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