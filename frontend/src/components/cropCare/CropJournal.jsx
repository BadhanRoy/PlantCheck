import { useEffect, useState } from "react";
import { createJournalEntry, getJournalEntries } from "../../utils/cropCareApi";

const ENTRY_TYPES = [
  { value: "observation", label: "Observation" },
  { value: "treatment", label: "Treatment" },
  { value: "diagnosis", label: "Diagnosis follow-up" },
];

const typeIcon = {
  watering: "💧",
  observation: "👀",
  treatment: "🧪",
  diagnosis: "🩺",
};

export default function CropJournal({ cropId }) {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ type: "observation", title: "", details: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadEntries() {
    try {
      setLoading(true);
      const result = await getJournalEntries(cropId);
      setEntries(result.entries || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load journal.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntries();
  }, [cropId]);

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Add a short title for this journal entry.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const result = await createJournalEntry(cropId, form);
      setEntries((current) => [result.entry, ...current]);
      setForm({ type: "observation", title: "", details: "" });
    } catch (saveError) {
      setError(saveError.message || "Unable to save journal entry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4" onClick={(event) => event.stopPropagation()}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Crop Journal</p>
          <p className="mt-1 text-sm text-slate-600">Keep notes about care, treatment, and progress.</p>
        </div>
        <span className="text-xl">📖</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-[150px_1fr]">
          <select name="type" value={form.type} onChange={handleChange} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500">
            {ENTRY_TYPES.map((entryType) => <option key={entryType.value} value={entryType.value}>{entryType.label}</option>)}
          </select>
          <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. New leaves look healthier" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500" />
        </div>
        <textarea name="details" value={form.details} onChange={handleChange} rows="2" placeholder="Add details, treatment, or chatbot advice..." className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500" />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button type="submit" disabled={saving} className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60">
          {saving ? "Saving..." : "Add journal note"}
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {loading && <p className="text-xs text-slate-500">Loading journal...</p>}
        {!loading && entries.length === 0 && <p className="text-xs text-slate-500">Your watering and care history will appear here.</p>}
        {entries.slice(0, 5).map((entry) => (
          <div key={entry._id} className="flex gap-2 rounded-xl border border-slate-200 bg-white p-3">
            <span>{typeIcon[entry.type] || "📝"}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <p className="text-sm font-semibold text-slate-800">{entry.title}</p>
                <time className="text-[10px] text-slate-400">{new Date(entry.createdAt).toLocaleDateString()}</time>
              </div>
              {entry.details && <p className="mt-1 text-xs text-slate-600">{entry.details}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
