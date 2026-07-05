import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CatalogRedirect() {
    const navigate = useNavigate();
    useEffect(() => {
        navigate('/catalog-hub/categories', { replace: true });
    }, [navigate]);
    return null;
}
