import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    toast: {
        show: false,
        message: '',
        isError: false,
    },
    activeTab: 'dashboard',
    selectedReceipt: null,
    activityLogs: [],
    theme: localStorage.getItem('shop_panel_theme') || 'dark',
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        showToast(state, action) {
            state.toast = {
                show: true,
                message: action.payload.message ?? '',
                isError: action.payload.isError ?? false,
            };
        },
        clearToast(state) {
            state.toast = {
                show: false,
                message: '',
                isError: false,
            };
        },
        setActiveTab(state, action) {
            state.activeTab = action.payload;
        },
        setSelectedReceipt(state, action) {
            state.selectedReceipt = action.payload;
        },
        setActivityLogs(state, action) {
            state.activityLogs = action.payload;
        },
        toggleTheme(state) {
            state.theme = state.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('shop_panel_theme', state.theme);
        },
        clearUiState(state) {
            Object.assign(state, initialState);
        }
    }
});

export const { showToast, clearToast, setActiveTab, setSelectedReceipt, setActivityLogs, toggleTheme, clearUiState } = uiSlice.actions;
export default uiSlice.reducer;

