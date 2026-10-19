// It centralizes communication between React and Express. Instead of writing fetch() and handling responses separately in every component, we create one reusable function.

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function apiRequest(path, options = {}) {
    const requestOptions = {
        method: options.method || "GET",
        credentials: "include",
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers,
        },
    };

    if (options.body !== undefined) {
        requestOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(
        `${API_BASE_URL}${path}`,
        requestOptions
    );

    const result = await response.json().catch(() => null);

    if(!response.ok) {
        throw new Error(
            result?.message || `Request failed with status ${response.status}`
        );
    }

    return result?.data;
}