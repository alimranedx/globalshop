import { useSelector } from 'react-redux';

export default function useHasPermission() {
    const user = useSelector(state => state.auth.user);
    const userPermissions = useSelector(state => state.auth.userPermissions);

    return (permission) => {
        if (user?.is_platform_admin) return true;
        if (user?.role === 'Owner') return true;
        return userPermissions.includes(permission);
    };
}
