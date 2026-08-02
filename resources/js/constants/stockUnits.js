export const STOCK_UNITS = [
    { id: 'pcs', name: 'PCS — Pieces', code: 'pcs', label: 'PCS — Pieces' },
    { id: 'kg', name: 'KG — Kilogram', code: 'kg', label: 'KG — Kilogram' },
    { id: 'g', name: 'G — Gram', code: 'g', label: 'G — Gram' },
    { id: 'ltr', name: 'LTR — Litre', code: 'ltr', label: 'LTR — Litre' },
    { id: 'ml', name: 'ML — Millilitre', code: 'ml', label: 'ML — Millilitre' },
    { id: 'm', name: 'M — Meter', code: 'm', label: 'M — Meter' },
    { id: 'cm', name: 'CM — Centimeter', code: 'cm', label: 'CM — Centimeter' },
    { id: 'box', name: 'BOX — Box', code: 'box', label: 'BOX — Box' },
    { id: 'pack', name: 'PACK — Pack', code: 'pack', label: 'PACK — Pack' },
    { id: 'set', name: 'SET — Set', code: 'set', label: 'SET — Set' },
    { id: 'pair', name: 'PAIR — Pair', code: 'pair', label: 'PAIR — Pair' },
    { id: 'dozen', name: 'DOZEN — Dozen', code: 'dozen', label: 'DOZEN — Dozen' },
];

export function getStockUnitLabel(unitCode) {
    if (!unitCode) return 'pcs';
    const found = STOCK_UNITS.find(u => u.id === unitCode.toLowerCase() || u.code === unitCode.toLowerCase());
    return found ? found.name : unitCode;
}
