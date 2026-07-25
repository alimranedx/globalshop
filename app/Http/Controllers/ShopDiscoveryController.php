<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ShopDiscoveryController extends Controller
{
    /**
     * Display the central Bootstrap 5 Shop Discovery / Selection page.
     */
    public function index(Request $request): View
    {
        $search = trim((string) $request->input('search', ''));

        $query = Shop::where('status', 'active');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                  ->orWhere('slug', 'LIKE', "%{$search}%");
            });
        }

        $shops = $query->orderBy('name', 'asc')->paginate(12)->withQueryString();

        return view('shop.discovery', [
            'shops' => $shops,
            'search' => $search,
        ]);
    }

    /**
     * API search endpoint for shops (debounced AJAX / JSON response).
     */
    public function search(Request $request): JsonResponse
    {
        $query = trim((string) $request->input('q', $request->input('search', '')));

        $shopsQuery = Shop::query();

        // Platform admins see all status; public users see active only
        if (!auth()->check() || !auth()->user()->is_platform_admin) {
            $shopsQuery->where('status', 'active');
        }

        if ($query !== '') {
            $shopsQuery->where(function ($q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                  ->orWhere('slug', 'LIKE', "%{$query}%");
            });
        }

        $shops = $shopsQuery->orderBy('name', 'asc')->take(20)->get(['id', 'name', 'slug', 'status', 'currency', 'language']);

        return response()->json([
            'success' => true,
            'query' => $query,
            'shops' => $shops,
        ]);
    }
}
