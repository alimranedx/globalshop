import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    shop: null,
    limits: null,
};

const shopSlice = createSlice({
    name: 'shop',
    initialState,
    reducers: {
        setShop(state, action) {
            state.shop = action.payload;
        },
        setLimits(state, action) {
            state.limits = action.payload;
        },
        updateShopSettings(state, action) {
            if (state.shop) {
                state.shop.name = action.payload.name;
                state.shop.status = action.payload.status;
                state.shop.currency = action.payload.currency;
                state.shop.language = action.payload.language;
            }
        },
        clearShopState(state) {
            state.shop = null;
            state.limits = null;
        }
    }
});

export const { setShop, setLimits, updateShopSettings, clearShopState } = shopSlice.actions;
export default shopSlice.reducer;
