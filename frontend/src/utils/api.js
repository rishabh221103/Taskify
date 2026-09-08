export const API_BASE = import.meta.env.VITE_API_BASE || (typeof window !== "undefined" && window.location.hostname === "127.0.0.1"
  ? "http://127.0.0.1:8000"
  : "http://localhost:8000");

export const apiRequest = async (url, options = {}) => {
  const token = sessionStorage.getItem("authToken");
  const headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else if (url !== "/api/login" && url !== "/api/register") {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }

  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("currentUserId");
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    if (!text || !text.trim()) {
      return null;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      parsed = null;
    }

    if (!response.ok) {
      let message = "";
      if (parsed) {
        if (parsed.message) {
          message = parsed.message;
        } else if (parsed.error) {
          message = parsed.error;
        } else if (parsed.errors && typeof parsed.errors === "object") {
          const firstErr = Object.values(parsed.errors).flat()[0];
          if (firstErr) message = firstErr;
        }
      }
      if (!message) {
        message = response.statusText || `Request failed with status ${response.status}`;
      }
      const err = new Error(message);
      err.status = response.status;
      err.data = parsed;
      throw err;
    }

    return parsed;
  } catch (err) {
    if (err.status === 401) {
      throw err;
    }
    const netErr = new Error(err.message || "Failed to fetch");
    netErr.status = err.status || 500;
    netErr.data = err.data;
    throw netErr;
  }
};

export const ensureCsrf = async () => {
  // No-op for Bearer token auth
};

