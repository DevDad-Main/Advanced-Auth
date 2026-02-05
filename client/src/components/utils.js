import toast from "react-hot-toast";

// API base URL - update this to match your backend
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Generic API request function with token refresh logic
 * Uses cookies for authentication (backend sets cookies automatically)
 */
async function apiRequest(path, options = {}) {
  const url = `${API_BASE_URL}/${path}`;
  
  // Default headers - no Authorization header needed since cookies handle auth
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include", // Include cookies for authentication
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    // Handle token refresh automatically through cookies
    if (response.status === 401) {
      // Backend will handle token refresh via cookies automatically
      // If still 401 after refresh, redirect to login
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }

    return data;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
}

/**
 * Manual refresh token request (if needed for specific cases)
 * Still uses cookies - the response will set new cookies automatically
 */
async function refreshTokens() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies
      // No need to send refreshToken in body - cookies handle it
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Token refresh error:", error);
    return false;
  }
}

/**
 * POST request with JSON body
 */
async function updateData(path, content, showToast = true) {
  try {
    const data = await apiRequest(path, {
      method: "POST",
      body: JSON.stringify(content),
    });

    if (data.success) {
      if (showToast) {
        toast.success(data.message || "Success!");
      }
      return data.data;
    } else {
      // Handle validation errors
      if (data.errors && Array.isArray(data.errors)) {
        data.errors.forEach((err) => {
          toast.error(err.msg || err.message);
        });
      } else {
        toast.error(data.message || "Something went wrong");
      }
      return null;
    }
  } catch (error) {
    toast.error(error.message || "Network error. Please try again.");
    return null;
  }
}

/**
 * GET request
 */
async function fetchData(path, showToast = false) {
  try {
    const data = await apiRequest(path, {
      method: "GET",
    });

    if (data.success) {
      if (showToast) {
        toast.success(data.message || "Success!");
      }
      return data.data;
    } else {
      toast.error(data.message || "Something went wrong");
      return null;
    }
  } catch (error) {
    if (showToast) {
      toast.error(error.message || "Network error. Please try again.");
    }
    return null;
  }
}

/**
 * POST request with FormData (for file uploads)
 * Uses cookies for authentication
 */
async function updateWithFormData(path, formData, showToast = true) {
  try {
    const config = {
      method: "POST",
      body: formData,
      credentials: "include", // Include cookies for auth
    };

    const response = await fetch(`${API_BASE_URL}/${path}`, config);
    const data = await response.json();

    if (data.success) {
      if (showToast) {
        toast.success(data.message || "Success!");
      }
      return data.data;
    } else {
      if (data.errors && Array.isArray(data.errors)) {
        data.errors.forEach((err) => {
          toast.error(err.msg || err.message);
        });
      } else {
        toast.error(data.message || "Something went wrong");
      }
      return null;
    }
  } catch (error) {
    if (showToast) {
      toast.error(error.message || "Network error. Please try again.");
    }
    return null;
  }
}

/**
 * Logout function - calls backend logout and redirects
 */
async function logout() {
  try {
    // Call backend logout to clear cookies
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Clear any local storage and redirect
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/login";
  }
}

/**
 * Check if user is authenticated (for protected routes)
 */
function isAuthenticated() {
  // Since we're using cookies, we can't directly check tokens
  // In a real app, you might have a protected endpoint to check auth
  // For now, assume authenticated if not redirected to login
  return true;
}

export { 
  apiRequest, 
  updateData, 
  fetchData, 
  updateWithFormData, 
  refreshTokens, 
  logout 
};