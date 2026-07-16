<?php

namespace App\Providers;

use App\Models\UserLoginHistory;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;

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

        // Trik Aman: Mengajari SQLite fungsi SUBSTRING_INDEX hanya saat diakses via Web (Bukan saat Build/Console)
        if (!app()->runningInConsole()) {
            if (DB::connection() instanceof \Illuminate\Database\SQLiteConnection) {
                DB::connection()->getPdo()->sqliteCreateFunction('SUBSTRING_INDEX', function ($string, $delim, $count) {
                    if ($count > 0) {
                        $parts = explode($delim, $string, $count + 1);
                        array_pop($parts);
                        return implode($delim, $parts);
                    } else {
                        $parts = explode($delim, $string);
                        $count = abs($count);
                        if ($count >= count($parts)) {
                            return $string;
                        }
                        return implode($delim, array_slice($parts, -$count));
                    }
                });
            }
        }
    }
}