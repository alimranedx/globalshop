export const getCsrf = () =>
    document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

export async function apiGet(url) {
    try {
        const r = await fetch(url, {
            headers: { Accept: 'application/json', 'X-CSRF-TOKEN': getCsrf() },
            credentials: 'same-origin',
        });
        return await r.json();
    } catch { return null; }
}

export async function apiPost(url, body = {}) {
    try {
        const r = await fetch(url, {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
            credentials: 'same-origin',
            body: JSON.stringify(body),
        });
        return await r.json();
    } catch { return null; }
}

export async function apiPut(url, body = {}) {
    try {
        const r = await fetch(url, {
            method: 'PUT',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': getCsrf() },
            credentials: 'same-origin',
            body: JSON.stringify(body),
        });
        return await r.json();
    } catch { return null; }
}

export async function apiDelete(url) {
    try {
        const r = await fetch(url, {
            method: 'DELETE',
            headers: { Accept: 'application/json', 'X-CSRF-TOKEN': getCsrf() },
            credentials: 'same-origin',
        });
        return await r.json();
    } catch { return null; }
}
