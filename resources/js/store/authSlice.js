import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    authenticated: false,
    user: null,
    currentUserEmail: '',
    userPermissions: [],
    managerPermissions: [],
    graceAdminPermissions: [],
    permissionsConfig: [],
    platformPermissionsConfig: [],
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuthState(state, action) {
            state.authenticated = action.payload.authenticated ?? false;
            state.user = action.payload.user ?? null;
            state.currentUserEmail = action.payload.currentUserEmail ?? '';
            state.userPermissions = action.payload.userPermissions ?? [];
            state.managerPermissions = action.payload.managerPermissions ?? [];
            state.graceAdminPermissions = action.payload.graceAdminPermissions ?? [];
            state.permissionsConfig = action.payload.permissionsConfig ?? [];
            state.platformPermissionsConfig = action.payload.platformPermissionsConfig ?? [];
        },
        setCurrentUserEmail(state, action) {
            state.currentUserEmail = action.payload;
        },
        clearAuthState(state) {
            Object.assign(state, initialState);
        }
    }
});

export const { setAuthState, setCurrentUserEmail, clearAuthState } = authSlice.actions;
export default authSlice.reducer;
