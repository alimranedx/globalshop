import { API } from '../../shared/constants/options';
import { apiGet, apiPut, apiPost } from '../../shared/api/client';

export const employeeService = {
    getEmployees: (params = '') => apiGet(`${API}/platform/directory/employees?${params}`),
    updateStatus: (id, status) => apiPut(`${API}/platform/directory/users/${id}/status`, { status }),
    resetPassword: (id, action, new_password = null) => apiPost(`${API}/platform/directory/users/${id}/reset-password`, { action, new_password }),
};
