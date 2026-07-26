export const API = '/api/v1';

export const CURRENCY_OPTIONS = [
    { value: 'USD', label: 'USD ($) — US Dollar' },
    { value: 'BDT', label: 'BDT (৳) — Bangladeshi Taka' },
    { value: 'EUR', label: 'EUR (€) — Euro' },
    { value: 'GBP', label: 'GBP (£) — British Pound' },
    { value: 'CAD', label: 'CAD ($) — Canadian Dollar' },
    { value: 'AUD', label: 'AUD ($) — Australian Dollar' },
    { value: 'JPY', label: 'JPY (¥) — Japanese Yen' },
    { value: 'INR', label: 'INR (₹) — Indian Rupee' },
];

export const TIMEZONE_OPTIONS = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'Asia/Dhaka', label: 'Asia/Dhaka (BST / GMT+6)' },
    { value: 'America/New_York', label: 'America/New_York (EST / GMT-5)' },
    { value: 'America/Chicago', label: 'America/Chicago (CST / GMT-6)' },
    { value: 'America/Denver', label: 'America/Denver (MST / GMT-7)' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST / GMT-8)' },
    { value: 'Europe/London', label: 'Europe/London (GMT / BST)' },
    { value: 'Europe/Paris', label: 'Europe/Paris (CET / GMT+1)' },
    { value: 'Asia/Dubai', label: 'Asia/Dubai (GST / GMT+4)' },
    { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST / GMT+5:30)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT / GMT+8)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST / GMT+9)' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST / GMT+10)' },
];

export const PLATFORM_PERMISSIONS_CONFIG = {
    'admin.shops': 'Platform Shop Directory',
    'admin.plans': 'Subscription Plans Quotas',
    'admin.logs': 'Platform System Logs',
    'admin.admins': 'Admin Accounts Management',
};
