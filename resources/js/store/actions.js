import { setAuthState, setCurrentUserEmail, clearAuthState } from './authSlice';
import { setShop, setLimits, clearShopState } from './shopSlice';
import { setProducts, setCategories, setBrands, clearCatalogState } from './catalogSlice';
import { setEmployees, setShopRoles, clearEmployeesState } from './employeesSlice';
import { showToast, setActivityLogs, clearUiState } from './uiSlice';
import { getHeaders } from '../utils/api';

export const fetchState = () => async (dispatch) => {
    try {
        const headers = getHeaders();
        const response = await fetch('/demo/state', { 
            headers: { ...headers, 'Content-Type': 'application/json' } 
        });

        if (response.status === 401) {
            dispatch(clearAuthState());
            dispatch(clearShopState());
            dispatch(clearCatalogState());
            dispatch(clearEmployeesState());
            dispatch(clearUiState());
            return;
        }

        const data = await response.json();
        
        dispatch(setAuthState({
            authenticated: data.authenticated,
            user: data.user,
            currentUserEmail: data.user?.email || '',
            userPermissions: data.user_permissions || [],
            managerPermissions: data.manager_permissions || [],
            graceAdminPermissions: data.grace_admin_permissions || [],
            permissionsConfig: data.permissions_config || [],
            platformPermissionsConfig: data.platform_permissions_config || [],
        }));

        dispatch(setShop(data.shop));
        dispatch(setLimits(data.limits));
        dispatch(setProducts(data.products || []));
        dispatch(setActivityLogs(data.activity_logs || []));

        if (data.toast) {
            dispatch(showToast({ message: data.toast, isError: false }));
        }

        if (data.shop?.id) {
            dispatch(fetchCatalogData(data.shop.id));
        }
    } catch (e) {
        console.error('Failed to load state', e);
        dispatch(showToast({ message: 'Failed to load state', isError: true }));
    }
};

export const fetchCatalogData = (currentShopId = null) => async (dispatch, getState) => {
    const shopId = currentShopId || getState().shop.shop?.id;
    if (!shopId) return;

    const headers = getHeaders(shopId);

    try {
        // Fetch Products
        const resProd = await fetch('/api/v1/tenant/products', { headers });
        const dataProd = await resProd.json();
        if (dataProd.success) dispatch(setProducts(dataProd.data));

        // Fetch Categories
        const resCat = await fetch('/api/v1/tenant/categories', { headers });
        const dataCat = await resCat.json();
        if (dataCat.success) dispatch(setCategories(dataCat.data));

        // Fetch Brands
        const resBrand = await fetch('/api/v1/tenant/brands', { headers });
        const dataBrand = await resBrand.json();
        if (dataBrand.success) dispatch(setBrands(dataBrand.data));

        // Fetch Employees
        const resEmp = await fetch('/api/v1/tenant/employees', { headers });
        if (resEmp.status === 200) {
            const dataEmp = await resEmp.json();
            if (dataEmp.success) {
                dispatch(setEmployees(dataEmp.data));
                dispatch(setShopRoles(dataEmp.roles || []));
            }
        } else {
            dispatch(setEmployees([]));
            dispatch(setShopRoles([]));
        }
    } catch (e) {
        console.error('Failed to fetch catalog lists', e);
        dispatch(showToast({ message: 'Failed to fetch catalog lists', isError: true }));
    }
};

export const handleQuickLogin = (email) => async (dispatch) => {
    if (!email) {
        dispatch(clearAuthState());
        dispatch(clearShopState());
        return;
    }

    try {
        const response = await fetch('/demo/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        if (data.success) {
            if (data.csrf_token) {
                const meta = document.querySelector('meta[name="csrf-token"]');
                if (meta) meta.setAttribute('content', data.csrf_token);
            }
            dispatch(setCurrentUserEmail(email));
            dispatch(fetchState());
        } else {
            dispatch(showToast({ message: data.message || 'Login failed', isError: true }));
        }
    } catch (e) {
        dispatch(showToast({ message: 'Quick login failed', isError: true }));
    }
};
