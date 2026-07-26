import { API } from '../../shared/constants/options';
import { apiGet, apiPost, apiPut } from '../../shared/api/client';

export const ticketService = {
    getTickets: (params = '') => apiGet(`${API}/platform/support-tickets?${params}`),
    getTicket: (id) => apiGet(`${API}/platform/support-tickets/${id}`),
    replyTicket: (id, data) => apiPost(`${API}/platform/support-tickets/${id}/reply`, data),
    updateTicketStatus: (id, data) => apiPut(`${API}/platform/support-tickets/${id}/status`, data),
};
