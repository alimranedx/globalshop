export function getCurrencySymbol(currency) {
    if (currency === 'BDT') return '৳';
    return '$'; // default USD
}

export function formatCurrency(amount, currency = 'USD') {
    const symbol = getCurrencySymbol(currency);
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) return `${symbol}0.00`;
    return `${symbol}${parsed.toFixed(2)}`;
}
