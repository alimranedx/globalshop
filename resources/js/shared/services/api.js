export const API_BASE = '/api/v1';

export const getCsrfToken = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

export async function apiFetch(endpoint, options = {}) {
    const defaultHeaders = {
        'Accept': 'application/json',
        'X-CSRF-TOKEN': getCsrfToken(),
        'Content-Type': 'application/json',
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    return response.json();
}
