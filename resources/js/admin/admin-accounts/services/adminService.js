import { API } from '../../shared/constants/options';
import { apiGet, apiPost, apiPut } from '../../shared/api/client';

export const adminService = {
    getAdmins: () => apiGet(`${API}/platform/admins`),
    createAdmin: (data) => apiPost(`${API}/platform/admins`, data),
    updatePermissions: (id, pages) => apiPut(`${API}/platform/admins/${id}/permissions`, { pages }),
};
