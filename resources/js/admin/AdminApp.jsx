import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, RequireAdmin } from './shared/context/AuthContext';
import { AdminLayout } from './shared/components/AdminLayout';

// Feature Pages
import { LoginPage } from './auth/pages/LoginPage';
import { DashboardPage } from './dashboard/pages/DashboardPage';
import { ShopDirectoryPage } from './shops/pages/ShopDirectoryPage';
import { CreateShopPage } from './shops/pages/CreateShopPage';
import { EditShopPage } from './shops/pages/EditShopPage';
import { ShopHubPage } from './shops/pages/ShopHubPage';
import { CustomerDirectoryPage } from './customers/pages/CustomerDirectoryPage';
import { ShopOwnerDirectoryPage } from './shop-owners/pages/ShopOwnerDirectoryPage';
import { EmployeeDirectoryPage } from './employees/pages/EmployeeDirectoryPage';
import { TicketDirectoryPage } from './support-tickets/pages/TicketDirectoryPage';
import { TicketDetailsPage } from './support-tickets/pages/TicketDetailsPage';
import { PlansPage } from './subscriptions/pages/PlansPage';
import { AdminsPage } from './admin-accounts/pages/AdminsPage';
import { LogsPage } from './audit-logs/pages/LogsPage';

const globalStyles = `
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { margin: 0; background: #0a0a0c; }
input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { opacity: 1; }
`;

export default function AdminApp() {
    return (
        <>
            <style>{globalStyles}</style>
            <BrowserRouter>
                <AuthProvider>
                    <Routes>
                        {/* Public Admin Auth Route */}
                        <Route path="/admin/login" element={<LoginPage />} />

                        {/* Authenticated Platform Admin Routes */}
                        <Route path="/admin" element={
                            <RequireAdmin>
                                <AdminLayout><DashboardPage /></AdminLayout>
                            </RequireAdmin>
                        } />
                        <Route path="/admin/shops" element={
                            <RequireAdmin>
                                <AdminLayout><ShopDirectoryPage /></AdminLayout>
                            </RequireAdmin>
                        } />
                        <Route path="/admin/shops/create" element={
                            <RequireAdmin>
                                <AdminLayout><CreateShopPage /></AdminLayout>
                            </RequireAdmin>
                        } />
                        <Route path="/admin/shops/:shopId/edit" element={
                            <RequireAdmin>
                                <AdminLayout><EditShopPage /></AdminLayout>
                            </RequireAdmin>
                        } />
                        <Route path="/admin/shops/:shopId/manage" element={
                            <RequireAdmin>
                                <AdminLayout><ShopHubPage /></AdminLayout>
                            </RequireAdmin>
                        } />
                        <Route path="/admin/customers" element={
                            <RequireAdmin>
                                <AdminLayout><CustomerDirectoryPage /></AdminLayout>
                            </RequireAdmin>
                        } />
                        <Route path="/admin/shop-owners" element={
                            <RequireAdmin>
                                <AdminLayout><ShopOwnerDirectoryPage /></AdminLayout>
                            </RequireAdmin>
                        } />
                        <Route path="/admin/employees" element={
                            <RequireAdmin>
                                <AdminLayout><EmployeeDirectoryPage /></AdminLayout>
                            </RequireAdmin>
                        } />
                        <Route path="/admin/support-tickets" element={
                            <RequireAdmin>
                                <AdminLayout><TicketDirectoryPage /></AdminLayout>
                            </RequireAdmin>
                        } />
                        <Route path="/admin/support-tickets/:ticketId" element={
                            <RequireAdmin>
                                <AdminLayout><TicketDetailsPage /></AdminLayout>
                            </RequireAdmin>
                        } />
                        <Route path="/admin/plans" element={
                            <RequireAdmin>
                                <AdminLayout><PlansPage /></AdminLayout>
                            </RequireAdmin>
                        } />
                        <Route path="/admin/admins" element={
                            <RequireAdmin>
                                <AdminLayout><AdminsPage /></AdminLayout>
                            </RequireAdmin>
                        } />
                        <Route path="/admin/logs" element={
                            <RequireAdmin>
                                <AdminLayout><LogsPage /></AdminLayout>
                            </RequireAdmin>
                        } />

                        {/* Fallback Route */}
                        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        </>
    );
}
