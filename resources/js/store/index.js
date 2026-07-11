import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import shopReducer from './shopSlice';
import catalogReducer from './catalogSlice';
import employeesReducer from './employeesSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        shop: shopReducer,
        catalog: catalogReducer,
        employees: employeesReducer,
        ui: uiReducer,
    },
});

export default store;
