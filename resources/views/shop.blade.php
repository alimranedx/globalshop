<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shop Owner Management Console</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script>
        window.AppConfig = {
            shopSlug: "{{ $shopSlug }}"
        };
    </script>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/shop.jsx'])
</head>

<body class="bg-[#0a0a0c] text-[#f3f4f6]">
    <div id="shop-owner-root"></div>
</body>
</html>
