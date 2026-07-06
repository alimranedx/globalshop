import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CatalogRedirect({ hasPermission }) {
    const navigate = useNavigate();
    useEffect(() => {
        if (!hasPermission) {
            navigate('/catalog-hub/categories', { replace: true });
            return;
        }
        if (hasPermission('categories.index')) {
            navigate('/catalog-hub/categories', { replace: true });
        } else if (hasPermission('brands.index')) {
            navigate('/catalog-hub/brands', { replace: true });
        } else if (hasPermission('products.index')) {
            navigate('/catalog-hub/products', { replace: true });
        } else {
            navigate('/dashboard', { replace: true });
        }
    }, [navigate, hasPermission]);
    return null;
}
