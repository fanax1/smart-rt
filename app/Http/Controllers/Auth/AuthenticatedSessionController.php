<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $user = \App\Models\User::where('email', $request->email)->first();
        if ($user && $user->role === 'admin') {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'email' => 'Akun ini adalah akun Admin. Silakan login melalui halaman login admin.',
            ]);
        }

        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Display the admin login view.
     */
    public function createAdmin(): Response
    {
        return Inertia::render('Auth/AdminLogin', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming admin authentication request.
     */
    public function storeAdmin(LoginRequest $request): RedirectResponse
    {
        $user = \App\Models\User::where('email', $request->email)->first();
        if ($user && $user->role !== 'admin') {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'email' => 'Akun ini bukan akun Admin. Silakan login melalui halaman login warga.',
            ]);
        }

        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $isAdmin = Auth::check() && Auth::user()->role === 'admin';

        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        if ($isAdmin) {
            return redirect()->route('login.admin');
        }

        return redirect('/');
    }
}
