import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    products: [],
    categories: [],
    brands: [],
};

const catalogSlice = createSlice({
    name: 'catalog',
    initialState,
    reducers: {
        setCatalogData(state, action) {
            state.products = action.payload.products ?? [];
            state.categories = action.payload.categories ?? [];
            state.brands = action.payload.brands ?? [];
        },
        setProducts(state, action) {
            state.products = action.payload;
        },
        setCategories(state, action) {
            state.categories = action.payload;
        },
        setBrands(state, action) {
            state.brands = action.payload;
        },
        clearCatalogState(state) {
            state.products = [];
            state.categories = [];
            state.brands = [];
        }
    }
});

export const { setCatalogData, setProducts, setCategories, setBrands, clearCatalogState } = catalogSlice.actions;
export default catalogSlice.reducer;
