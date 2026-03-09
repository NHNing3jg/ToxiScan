import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000, // 15s — évite les requêtes bloquées indéfiniment
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Intercepteur réponse ─────────────────────────────────────
// Transforme les erreurs FastAPI en messages lisibles
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error.response?.data?.detail;

    // FastAPI renvoie souvent { detail: "message" } ou { detail: [...] }
    if (Array.isArray(detail)) {
      // Erreurs de validation Pydantic : liste de { msg, loc }
      const msg = detail.map((e) => `${e.loc?.join(".")}: ${e.msg}`).join(" | ");
      return Promise.reject(new Error(msg));
    }

    if (typeof detail === "string") {
      return Promise.reject(new Error(detail));
    }

    // Fallback sur le status HTTP
    const status = error.response?.status;
    if (status === 408) return Promise.reject(new Error("Request timeout"));
    if (status === 404) return Promise.reject(new Error("Resource not found"));
    if (status === 500) return Promise.reject(new Error("Server error — check FastAPI logs"));

    return Promise.reject(error);
  }
);