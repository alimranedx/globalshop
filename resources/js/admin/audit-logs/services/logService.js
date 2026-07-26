import { API } from '../../shared/constants/options';
import { apiGet } from '../../shared/api/client';

export const logService = {
    getLogs: () => apiGet(`${API}/platform/logs`),
};
