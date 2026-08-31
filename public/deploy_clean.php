<?php

/**
 * GlobalShop — Direct Cache Purge & Route Synchronization Webhook
 *
 * This script runs at the raw PHP level before Laravel boots to reliably
 * delete stale bootstrap cache files (routes-v7.php, config.php, packages.php)
 * on shared hosting environments (cPanel/LiteSpeed) where Artisan CLI access is restricted.
 */

$secret = 'globalshop_deploy_secret_key_2026';
$token = $_GET['secret'] ?? $_SERVER['HTTP_X_DEPLOY_SECRET'] ?? '';

if (empty($token) || !hash_equals($secret, (string)$token)) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Forbidden']);
    exit;
}

$candidateDirs = [
    __DIR__ . '/../globalshop/bootstrap/cache',
    __DIR__ . '/../bootstrap/cache',
    dirname(__DIR__) . '/globalshop/bootstrap/cache',
    '/home/shopbusk/globalshop/bootstrap/cache',
];

$deleted = [];

foreach ($candidateDirs as $dir) {
    if (is_dir($dir)) {
        $files = glob($dir . '/*.php');
        if ($files) {
            foreach ($files as $file) {
                if (@unlink($file)) {
                    $deleted[] = $file;
                }
            }
        }
    }
}

// Clear compiled views if present
$viewDirs = [
    __DIR__ . '/../globalshop/storage/framework/views',
    __DIR__ . '/../storage/framework/views',
    '/home/shopbusk/globalshop/storage/framework/views',
];

foreach ($viewDirs as $vDir) {
    if (is_dir($vDir)) {
        $vFiles = glob($vDir . '/*.php');
        if ($vFiles) {
            foreach ($vFiles as $vf) {
                @unlink($vf);
            }
        }
    }
}

// Sync public_html/build/manifest.json to /globalshop/public/build/manifest.json
$publicManifest = __DIR__ . '/build/manifest.json';
$backendManifestTargets = [
    __DIR__ . '/../globalshop/public/build/manifest.json',
    '/home/shopbusk/globalshop/public/build/manifest.json',
];

$syncedManifests = [];
if (file_exists($publicManifest)) {
    $manifestContent = file_get_contents($publicManifest);
    foreach ($backendManifestTargets as $target) {
        $targetDir = dirname($target);
        if (!is_dir($targetDir)) {
            @mkdir($targetDir, 0755, true);
        }
        if (@file_put_contents($target, $manifestContent)) {
            $syncedManifests[] = $target;
        }
    }
}

// Reset OPcache and stat caches if supported
if (function_exists('opcache_reset')) {
    @opcache_reset();
}
clearstatcache(true);

header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'message' => 'All stale caches purged and manifests synchronized successfully!',
    'deleted_files' => $deleted,
    'synced_manifests' => $syncedManifests,
    'timestamp' => date('Y-m-d H:i:s')
]);
exit;

