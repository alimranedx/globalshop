<?php

return [
    'modules' => [
        'products' => [
            'label' => 'Products Management',
            'sub_modules' => [
                'categories' => [
                    'label' => 'Categories & Brands',
                    'pages' => [
                        'categories.index' => 'Category Management',
                        'brands.index' => 'Brand Management',
                    ],
                ],
                'catalog' => [
                    'label' => 'Product Catalog',
                    'pages' => [
                        'products.index' => 'View Products',
                        'products.create' => 'Add Products',
                        'products.edit' => 'Edit Products',
                        'products.destroy' => 'Delete Products',
                        'products.history' => 'Product History',
                        'products.import' => 'Import Products',
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
        'sales' => [
            'label' => 'Sales & POS Management',
            'sub_modules' => [
                'pos' => [
                    'label' => 'Sales Transactions',
                    'pages' => [
                        'sales.index' => 'Sales Log',
                        'sales.create' => 'POS Terminal',
                    ],
                ],
            ],
        ],
        'customers' => [
            'label' => 'Customer Management',
            'sub_modules' => [
                'directory' => [
                    'label' => 'Customer Directory',
                    'pages' => [
                        'customers.index' => 'View Customers',
                        'customers.edit' => 'Edit Customers & Credit',
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
