<?php

namespace App\Providers;

use App\Models\UserLoginHistory;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Logika pencatatan history login bawaan aplikasi kamu
        Event::listen(Login::class, function (Login $event) {
            UserLoginHistory::create([
                'user_id' => $event->user->id,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'login_at' => now(),
            ]);
        });

        // Catatan: Tidak perlu mendaftarkan SUBSTRING_INDEX ke SQLite karena semua
        // kueri migrasi sudah direfaktor menggunakan PHP murni (explode/end/implode).
        // Menghapus blok ini mencegah crash saat 'php artisan config:cache'
        // di fase build image Railway karena koneksi DB tidak disentuh sama sekali.
    }
}