<?php

namespace App\Modules\AuditLog\Actions;

use App\Models\ActivityLog;
use App\Modules\ShopManager\TenantManager;
use Illuminate\Support\Facades\Request;

class LogActivityAction
{
    /**
     * Log a critical operation into the activity trail database.
     */
    public function execute(
        string $action,
        string $description,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $shopId = null,
        ?string $userId = null
    ): ActivityLog {
        $shopId = $shopId ?? TenantManager::getTenantId();
        $userId = $userId ?? auth()->id();

        $userAgent = Request::header('User-Agent');

        // Simple device parsing
        $deviceType = 'Desktop';
        if ($userAgent) {
            if (preg_match('/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i', $userAgent)) {
                $deviceType = 'Tablet';
            } elseif (preg_match('/(up.browser|up.link|mmp|symbian|smartphone|midp|wap|phone|android|iemobile)/i', $userAgent)) {
                $deviceType = 'Mobile';
            }
        }

        return ActivityLog::create([
            'shop_id' => $shopId,
            'user_id' => $userId,
            'action' => $action,
            'description' => $description,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
            'user_agent' => substr($userAgent, 0, 500),
            'device_type' => $deviceType,
        ]);
    }
}
