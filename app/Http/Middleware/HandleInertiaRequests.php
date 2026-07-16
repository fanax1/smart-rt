<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        $profilePhotoUrl = null;
        if ($user?->profile_photo_path) {
            $profilePhotoUrl = asset('storage/' . ltrim($user->profile_photo_path, '/'));
        } elseif ($user) {
            $profilePhotoUrl = 'https://ui-avatars.com/api/?name=' . urlencode($user->warga?->nama_lengkap ?: $user->name) . '&background=10B981&color=fff&bold=true';
        }

        $name = $user?->name;
        $noRumah = null;
        if ($user && $user->warga) {
            $name = $user->warga->nama_lengkap ?: $user->name;
            $user->warga->loadMissing('hunian');
            $noRumah = $user->warga->hunian?->no_rumah;
        }

        $rtSettings = [];
        if (\Illuminate\Support\Facades\Schema::hasTable('rt_settings')) {
            $settings = \App\Models\RtSetting::pluck('value', 'key')->toArray();
            $rtSettings = [
                'logoUrl' => ($settings['logo_path'] ?? null) ? \Illuminate\Support\Facades\Storage::url($settings['logo_path']) : null,
                'rtName' => $settings['rt_name'] ?? 'RT 004',
                'kelurahan' => $settings['kelurahan'] ?? 'Kelurahan Bahagia',
                'kecamatan' => $settings['kecamatan'] ?? 'Babelan',
                'kota' => $settings['kota'] ?? 'Bekasi',
                'siteName' => $settings['site_name'] ?? 'SMART-RT 004',
            ];
        } else {
            $rtSettings = [
                'logoUrl' => null,
                'rtName' => 'RT 004',
                'kelurahan' => 'Kelurahan Bahagia',
                'kecamatan' => 'Babelan',
                'kota' => 'Bekasi',
                'siteName' => 'SMART-RT 004',
            ];
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id'                => $user->id,
                    'name'              => $name,
                    'email'             => $user->email,
                    'role'              => $user->role,
                    'is_active'         => $user->is_active,
                    'profile_photo_url' => $profilePhotoUrl,
                    'no_rumah'          => $noRumah,
                ] : null,
                'unread_tickets_count' => $user && $user->role === 'admin'
                    ? \App\Models\Ticket::where('status', 'Menunggu Admin')->count()
                    : 0,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'rtSettings' => $rtSettings,
        ];
    }
}