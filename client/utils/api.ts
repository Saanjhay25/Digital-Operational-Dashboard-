// src/utils/api.ts
export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');

    const headers = new Headers(options.headers || {});

    // Connect JSON type if none provided
    if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    // Inject Authorization Bearer Token if present
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

    // Log request payload for debugging
    console.log(`[FETCH DEBUG] ${options.method || 'GET'} ${apiBase}${endpoint}`);
    if (options.body) {
        console.log('[FETCH DEBUG] Body:', options.body);
    }

    try {
        const response = await fetch(`${apiBase}${endpoint}`, {
            ...options,
            headers,
        });

        // Automatically handle 401 Unauthorized (invalid/expired token)
        if (response.status === 401) {
            // Only reload if NOT on the login endpoint (wrong password shouldn't reload)
            if (!endpoint.includes('/auth/login')) {
                localStorage.removeItem('token');
                window.location.reload();
            }
        }

        return response;
    } catch (error) {
        console.error('API Fetch Error:', error);
        throw error;
    }
};
