<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GlobalShop — Marketplace</title>
    <meta name="description" content="Browse products from all shops on GlobalShop. Find what you need from hundreds of shops.">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/marketplace.jsx'])
</head>
<body>
    <div id="marketplace-root"></div>
</body>
</html>
