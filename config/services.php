<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'cpanel' => [
        'host' => env('CPANEL_HOST', 'https://104.152.168.205:2083'),
        'username' => env('CPANEL_USERNAME', 'shopbusk'),
        'token' => env('CPANEL_API_TOKEN', '8FD4C2QCFTSLQ1WD0Y0X45UM9HSVPGCP'),
        'root_domain' => env('CPANEL_ROOT_DOMAIN', 'shopbusket.com'),
        'enabled' => env('CPANEL_AUTO_SUBDOMAIN_ENABLED', false),
    ],

];
