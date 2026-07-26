import { API } from '../../shared/constants/options';
import { apiGet, apiPost, apiPut, apiDelete } from '../../shared/api/client';

export const shopService = {
    getShops: (params = '') => apiGet(`${API}/platform/shops?${params}`),
    getShop: (id) => apiGet(`${API}/platform/shops/${id}`),
    createShop: (payload) => apiPost(`${API}/platform/shops`, payload),
    updateShop: (id, payload) => apiPut(`${API}/platform/shops/${id}`, payload),
    deleteShop: (id) => apiDelete(`${API}/platform/shops/${id}`),
    toggleSuspend: (id) => apiPost(`${API}/platform/shops/${id}/toggle-suspension`),
    updateHandoverStatus: (id, status) => apiPost(`${API}/platform/shops/${id}/handover`, { status }),
    assignOwner: (id, body) => apiPost(`${API}/platform/shops/${id}/owner`, body),
    getUsers: () => apiGet(`${API}/platform/users`),

    // Employees
    getEmployees: (id) => apiGet(`${API}/platform/shops/${id}/employees`),
    addEmployee: (id, data) => apiPost(`${API}/platform/shops/${id}/employees`, data),
    updateEmployee: (shopId, userId, data) => apiPut(`${API}/platform/shops/${shopId}/employees/${userId}`, data),
    removeEmployee: (shopId, userId) => apiDelete(`${API}/platform/shops/${shopId}/employees/${userId}`),

    // Roles & Permissions
    getRoles: (id) => apiGet(`${API}/platform/shops/${id}/roles`),
    createRole: (id, data) => apiPost(`${API}/platform/shops/${id}/roles`, data),
    deleteRole: (shopId, roleId) => apiDelete(`${API}/platform/shops/${shopId}/roles/${roleId}`),
    getPermissions: (shopId, roleId) => apiGet(`${API}/platform/shops/${shopId}/roles/${roleId}/permissions`),
    syncPermissions: (shopId, roleId, pages) => apiPut(`${API}/platform/shops/${shopId}/roles/${roleId}/permissions`, { pages }),

    // Products
    getProducts: (id) => apiGet(`${API}/platform/shops/${id}/products`),
    addProduct: (id, data) => apiPost(`${API}/platform/shops/${id}/products`, data),
    updateProduct: (shopId, prodId, data) => apiPut(`${API}/platform/shops/${shopId}/products/${prodId}`, data),
    deleteProduct: (shopId, prodId) => apiDelete(`${API}/platform/shops/${shopId}/products/${prodId}`),

    // Audit Logs
    getShopLogs: (id) => apiGet(`${API}/platform/shops/${id}/logs`),
};
