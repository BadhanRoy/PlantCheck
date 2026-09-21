import { useState } from "react";
import { createCrop } from "../../utils/cropCareApi";

const BANGLADESH_LOCATIONS = [
  { name: "Dhaka", latitude: 23.8103, longitude: 90.4125 },
  { name: "Chattogram", latitude: 22.3569, longitude: 91.7832 },
  { name: "Rajshahi", latitude: 24.3745, longitude: 88.6042 },
  { name: "Khulna", latitude: 22.8456, longitude: 89.5403 },
  { name: "Sylhet", latitude: 24.8949, longitude: 91.8687 },
  { name: "Barishal", latitude: 22.701, longitude: 90.3535 },
  { name: "Rangpur", latitude: 25.7439, longitude: 89.2752 },
  { name: "Mymensingh", latitude: 24.7471, longitude: 90.4203 },
];

export default function AddCropForm({
  onCreated,
  onCancel,
}) {
  const [form, setForm] = useState({
    crop_name: "",
    planting_date: "",
    last_watered: "",
    growth_stage: "Seedling",
    soil_type: "Loamy",
    location_name: "",
    location_choice: "",
    latitude: "",
    longitude: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    if (e.target.name === "location_choice") {
      const selectedLocation = BANGLADESH_LOCATIONS.find(
        (location) => location.name === e.target.value
      );

      if (selectedLocation) {
        setForm((previous) => ({
          ...previous,
          location_choice: selectedLocation.name,
          location_name: selectedLocation.name,
          latitude: selectedLocation.latitude.toFixed(7),
          longitude: selectedLocation.longitude.toFixed(7),
        }));
        return;
      }
    }

    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  }

  function getLocation() {
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((previous) => ({
          ...previous,
          location_choice: "custom",
          location_name: previous.location_name || "Selected device location",
          latitude: position.coords.latitude.toFixed(7),
          longitude: position.coords.longitude.toFixed(7),
        }));
      },
      () => {
        setError("Unable to read your location. Please enter coordinates manually.");
      }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.crop_name || !form.planting_date) {
      setError("Crop name and planting date are required.");
      return;
    }

    if (!form.location_choice) {
      setError("Please choose the farm or crop location first.");
      return;
    }

    if (form.location_choice === "custom" && !form.location_name.trim()) {
      setError("Please enter the village, district, or field name.");
      return;
    }

    if (!form.latitude || !form.longitude) {
      setError("Please provide your crop location.");
      return;
    }

    try {
      setLoading(true);

      const result = await createCrop({
        ...form,
        last_watered: form.last_watered || null,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      });

      setSuccess(`${result.crop?.crop_name || form.crop_name} added successfully.`);

      if (onCreated) {
        setTimeout(() => {
          onCreated(result.crop);
        }, 300);
      }
    } catch (error) {
      setError(error.message || "Unable to add crop right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-green-100 p-6 shadow-[0_20px_60px_-20px_rgba(16,185,129,0.35)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">
            Crop Care
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-800">
            Add New Crop
          </h2>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-lg text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Crop Name
            </label>
            <input
              name="crop_name"
              value={form.crop_name}
              onChange={handleChange}
              placeholder="e.g. Tomato"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Planting Date
            </label>
            <input
              type="date"
              name="planting_date"
              value={form.planting_date}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Last Watered
            </label>
            <input
              type="date"
              name="last_watered"
              value={form.last_watered}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Growth Stage
            </label>
            <select
              name="growth_stage"
              value={form.growth_stage}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option>Seedling</option>
              <option>Vegetative</option>
              <option>Flowering</option>
              <option>Fruiting</option>
              <option>Maturity</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Soil Type
            </label>
            <select
              name="soil_type"
              value={form.soil_type}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option>Loamy</option>
              <option>Sandy</option>
              <option>Clay</option>
              <option>Silty</option>
              <option>Peaty</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Farm or Crop Location
            </label>
            <select
              name="location_choice"
              value={form.location_choice}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="">Choose a Bangladesh location</option>
              {BANGLADESH_LOCATIONS.map((location) => (
                <option key={location.name} value={location.name}>
                  {location.name}
                </option>
              ))}
              <option value="custom">Custom village or field</option>
            </select>

            <input
              name="location_name"
              value={form.location_name}
              onChange={handleChange}
              placeholder="e.g. Trishal, Mymensingh"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
            <p className="mt-2 text-xs text-slate-500">
              Choose the crop or farm location, not necessarily your current location.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Latitude
            </label>
            <input
              name="latitude"
              value={form.latitude}
              onChange={handleChange}
              placeholder="23.8103"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Longitude
            </label>
            <input
              name="longitude"
              value={form.longitude}
              onChange={handleChange}
              placeholder="90.4125"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={getLocation}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50"
        >
          📍 Use Device Location Instead
        </button>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-700 hover:to-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Adding Crop..." : "Add Crop"}
          </button>
        </div>
      </form>
    </div>
  );
}