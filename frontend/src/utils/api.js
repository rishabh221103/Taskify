export const API_BASE = "http://localhost:8000";

export const apiRequest = async (url, options = {}) => {
  const token = sessionStorage.getItem("authToken");
  const headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

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

  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
};

export const ensureCsrf = async () => {
  // No-op for Bearer token auth
};
