const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:3003"
).replace(/\/$/, "") + "/api";

export const WATERING_REMINDER_STREAM_URL = `${API_BASE}/crop-care/watering-reminders/stream`;


async function request(
  endpoint,
  options = {}
) {
  const response = await fetch(
    `${API_BASE}${endpoint}`,
    {
      credentials: "include",

      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },

      ...options,
    }
  );

  const data =
    await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Something went wrong"
    );
  }

  return data;
}


export async function getCrops() {
  return request(
    "/crop-care/crops"
  );
}


export async function createCrop(crop) {
  return request(
    "/crop-care/crops",
    {
      method: "POST",
      body: JSON.stringify(crop),
    }
  );
}


export async function getCrop(id) {
  return request(
    `/crop-care/crops/${id}`
  );
}


export async function updateCrop(
  id,
  crop
) {
  return request(
    `/crop-care/crops/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(crop),
    }
  );
}


export async function deleteCrop(id) {
  return request(
    `/crop-care/crops/${id}`,
    {
      method: "DELETE",
    }
  );
}


export async function getRecommendation(
  id
) {
  return request(
    `/crop-care/crops/${id}/recommendation`
  );
}


export async function markWatered(id) {
  return request(
    `/crop-care/crops/${id}/water`,
    {
      method: "POST",
    }
  );
}

export async function getJournalEntries(id) {
  return request(`/crop-care/crops/${id}/journal`);
}

export async function createJournalEntry(id, entry) {
  return request(`/crop-care/crops/${id}/journal`, {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

export async function getRecentDiagnoses() {
  return request("/diagnoses/recent");
}
