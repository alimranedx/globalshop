import { API } from '../../shared/constants/options';
import { apiGet, apiPut, apiPost } from '../../shared/api/client';

export const customerService = {
    getCustomers: (params = '') => apiGet(`${API}/platform/directory/customers?${params}`),
    updateStatus: (id, status) => apiPut(`${API}/platform/directory/customers/${id}/status`, { status }),
    resetPassword: (id, action, new_password = null) => apiPost(`${API}/platform/directory/customers/${id}/reset-password`, { action, new_password }),
};
