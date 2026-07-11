import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    employees: [],
    shopRoles: [],
};

const employeesSlice = createSlice({
    name: 'employees',
    initialState,
    reducers: {
        setEmployeesData(state, action) {
            state.employees = action.payload.employees ?? [];
            state.shopRoles = action.payload.shopRoles ?? [];
        },
        setEmployees(state, action) {
            state.employees = action.payload;
        },
        setShopRoles(state, action) {
            state.shopRoles = action.payload;
        },
        clearEmployeesState(state) {
            state.employees = [];
            state.shopRoles = [];
        }
    }
});

export const { setEmployeesData, setEmployees, setShopRoles, clearEmployeesState } = employeesSlice.actions;
export default employeesSlice.reducer;
