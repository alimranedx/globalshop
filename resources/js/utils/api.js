import store from '../store';

export const getCsrfToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
};

export const getHeaders = (shopIdOverride = null) => {
    const state = store.getState();
    const token = getCsrfToken();
    const shopId = shopIdOverride || state.shop.shop?.id || '';
    const email = state.auth.currentUserEmail || '';

    const headers = {
        'Accept': 'application/json',
        'X-CSRF-TOKEN': token,
        'X-Tenant-ID': String(shopId),
    };

    if (email) {
        headers['Authorization'] = 'Bearer ' + email;
    }

    return headers;
};
