import React from 'react';
import { Provider } from 'react-redux';
import store from '../store';

export default function ShopManagerApp() {
    return (
        <Provider store={store}>
            <div className="shop-manager-container">
                {/* Shop Management Panel Application */}
            </div>
        </Provider>
    );
}
