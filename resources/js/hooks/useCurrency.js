import { useSelector } from 'react-redux';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

export default function useCurrency() {
    const currency = useSelector(state => state.shop.shop?.currency || 'USD');

    return {
        symbol: getCurrencySymbol(currency),
        format: (amount) => formatCurrency(amount, currency),
        currency
    };
}
