import React from 'react';
import { createRoot } from 'react-dom/client';
import AdminApp from './admin/AdminApp.jsx';

const container = document.getElementById('admin-root');
if (container) {
    createRoot(container).render(<AdminApp />);
}
