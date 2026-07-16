<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        /*
        |--------------------------------------------------------------------------
        | Trusted Proxies
        |--------------------------------------------------------------------------
        |
        | Cloudflare Tunnel menerima HTTPS dari pengguna, lalu meneruskan request
        | ke aplikasi lokal melalui HTTP. Header X-Forwarded-Proto digunakan
        | Laravel untuk mengenali bahwa request asli menggunakan HTTPS.
        |
        */
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_FOR
                | Request::HEADER_X_FORWARDED_HOST
                | Request::HEADER_X_FORWARDED_PORT
                | Request::HEADER_X_FORWARDED_PROTO
        );

        /*
        |--------------------------------------------------------------------------
        | Web Middleware
        |--------------------------------------------------------------------------
        */
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        /*
        |--------------------------------------------------------------------------
        | Middleware Aliases
        |--------------------------------------------------------------------------
        */
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);

        /*
        |--------------------------------------------------------------------------
        | Guest Redirect
        |--------------------------------------------------------------------------
        */
        $middleware->redirectGuestsTo(
            fn ($request) => $request->is('admin*')
                ? route('login.admin')
                : route('login')
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->create();