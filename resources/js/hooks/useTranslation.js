import { useSelector } from 'react-redux';
import { translations } from '../utils/lang';

export default function useTranslation() {
    const language = useSelector(state => state.shop.userLanguage || state.shop.shop?.language || localStorage.getItem('app_language') || 'en');
    
    return (key, defaultValue = '') => {
        const langTrans = translations[language] || translations['en'];
        return langTrans[key] || defaultValue || key;
    };
}
