const DEFAULT_BASE = "http://localhost:3001/api";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE;

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const error = data?.error || "REQUEST_FAILED";
    const message = typeof error === "string" ? error : "REQUEST_FAILED";
    throw new Error(message);
  }

  return data;
}

export function listPeople() {
  return request("/people");
}

export function createPerson(payload) {
  return request("/people", { method: "POST", body: JSON.stringify(payload) });
}

export function updatePerson(id, payload) {
  return request(`/people/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deletePerson(id) {
  return request(`/people/${id}`, { method: "DELETE" });
}

