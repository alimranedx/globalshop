import { API } from '../../shared/constants/options';
import { apiGet, apiPost, apiPut } from '../../shared/api/client';

export const subscriptionService = {
    getPlans: () => apiGet(`${API}/platform/plans`),
    createPlan: (data) => apiPost(`${API}/platform/plans`, data),
    updatePlan: (id, data) => apiPut(`${API}/platform/plans/${id}`, data),
};
