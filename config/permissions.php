<?php

return [
    'modules' => [
        'products' => [
            'label' => 'Products Management',
            'sub_modules' => [
                'catalog' => [
                    'label' => 'Product Catalog',
                    'pages' => [
                        'products.index' => 'Product List',
                        'products.history' => 'Product History',
                        'products.import' => 'Import Products',
                    ],
                ],
                'categories' => [
                    'label' => 'Categories & Brands',
                    'pages' => [
                        'categories.index' => 'Category Management',
                        'brands.index' => 'Brand Management',
                    ],
                ],
            ],
        ],
        'employees' => [
            'label' => 'Staff Directory',
            'sub_modules' => [
                'staff' => [
                    'label' => 'Staff Management',
                    'pages' => [
                        'employees.index' => 'Employee List',
                        'roles.index' => 'Role Management',
                    ],
                ],
            ],
        ],
        'settings' => [
            'label' => 'Shop Configurations',
            'sub_modules' => [
                'general' => [
                    'label' => 'Settings',
                    'pages' => [
                        'settings.general' => 'General Settings',
                        'settings.shop' => 'Shop Settings',
                        'settings.subscription' => 'Subscription Details',
                    ],
                ],
            ],
        ],
    ],
    // Platform-Level Admin Page Mappings
    'platform_admin' => [
        'label' => 'Platform Administration',
        'sub_modules' => [
            'management' => [
                'label' => 'Platform Operations',
                'pages' => [
                    'admin.shops' => 'Platform Shop Directory',
                    'admin.plans' => 'Subscription Plans Quotas',
                    'admin.logs' => 'Platform System Logs',
                    'admin.admins' => 'Admin Accounts Management',
                ],
            ],
        ],
    ],
];
