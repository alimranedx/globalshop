<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CpanelSubdomainService
{
    protected string $host;
    protected string $username;
    protected string $token;
    protected string $rootDomain;
    protected bool $enabled;

    public function __construct()
    {
        $this->host = rtrim(config('services.cpanel.host', 'https://104.152.168.205:2083'), '/');
        $this->username = config('services.cpanel.username', 'shopbusk');
        $this->token = config('services.cpanel.token', '8FD4C2QCFTSLQ1WD0Y0X45UM9HSVPGCP');
        $this->rootDomain = config('services.cpanel.root_domain', 'shopbusket.com');
        $this->enabled = (bool) config('services.cpanel.enabled', false);
    }

    /**
     * Create a new subdomain in cPanel pointing to public_html.
     *
     * @param string $subdomain
     * @return array
     */
    public function createSubdomain(string $subdomain): array
    {
        if (! $this->enabled) {
            return ['success' => true, 'skipped' => true, 'message' => 'cPanel integration disabled.'];
        }

        $subdomain = strtolower(trim($subdomain));

        try {
            $response = Http::withHeaders([
                'Authorization' => "cpanel {$this->username}:{$this->token}",
            ])->withoutVerifying()
              ->timeout(10)
              ->get("{$this->host}/execute/SubDomain/addsubdomain", [
                  'domain' => $subdomain,
                  'rootdomain' => $this->rootDomain,
                  'dir' => 'public_html',
              ]);

            $json = $response->json();

            if ($response->successful() && ($json['status'] ?? 0) === 1) {
                Log::info("cPanel: Subdomain '{$subdomain}.{$this->rootDomain}' created successfully.");
                return ['success' => true, 'data' => $json];
            }

            $errorMsg = $json['errors'][0] ?? 'Unknown error creating cPanel subdomain.';
            Log::warning("cPanel: Failed to create subdomain '{$subdomain}.{$this->rootDomain}': {$errorMsg}");
            return ['success' => false, 'error' => $errorMsg];
        } catch (\Throwable $e) {
            Log::error("cPanel Exception on creating subdomain '{$subdomain}': " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Delete an existing subdomain in cPanel.
     *
     * @param string $subdomain
     * @return array
     */
    public function deleteSubdomain(string $subdomain): array
    {
        if (! $this->enabled) {
            return ['success' => true, 'skipped' => true, 'message' => 'cPanel integration disabled.'];
        }

        $subdomain = strtolower(trim($subdomain));
        $fullDomain = "{$subdomain}.{$this->rootDomain}";

        try {
            $response = Http::withHeaders([
                'Authorization' => "cpanel {$this->username}:{$this->token}",
            ])->withoutVerifying()
              ->timeout(10)
              ->get("{$this->host}/execute/SubDomain/delsubdomain", [
                  'domain' => $fullDomain,
              ]);

            $json = $response->json();

            if ($response->successful() && ($json['status'] ?? 0) === 1) {
                Log::info("cPanel: Subdomain '{$fullDomain}' deleted successfully.");
                return ['success' => true, 'data' => $json];
            }

            $errorMsg = $json['errors'][0] ?? 'Unknown error deleting cPanel subdomain.';
            Log::warning("cPanel: Failed to delete subdomain '{$fullDomain}': {$errorMsg}");
            return ['success' => false, 'error' => $errorMsg];
        } catch (\Throwable $e) {
            Log::error("cPanel Exception on deleting subdomain '{$subdomain}': " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
