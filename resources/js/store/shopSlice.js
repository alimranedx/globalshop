import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    shop: null,
    limits: null,
    userLanguage: localStorage.getItem('app_language') || null,
};

const shopSlice = createSlice({
    name: 'shop',
    initialState,
    reducers: {
        setShop(state, action) {
            state.shop = action.payload;
            if (state.userLanguage && state.shop) {
                state.shop.language = state.userLanguage;
            }
        },
        setLimits(state, action) {
            state.limits = action.payload;
        },
        setUserLanguage(state, action) {
            state.userLanguage = action.payload;
            if (state.shop) {
                state.shop.language = action.payload;
            }
            localStorage.setItem('app_language', action.payload);
        },
        updateShopSettings(state, action) {
            if (state.shop) {
                state.shop.name = action.payload.name;
                state.shop.status = action.payload.status;
                state.shop.currency = action.payload.currency;
                if (!state.userLanguage) {
                    state.shop.language = action.payload.language;
                }
            }
        },
        clearShopState(state) {
            state.shop = null;
            state.limits = null;
        }
    }
});

export const { setShop, setLimits, setUserLanguage, updateShopSettings, clearShopState } = shopSlice.actions;
export default shopSlice.reducer;
