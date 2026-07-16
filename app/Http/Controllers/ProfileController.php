<?php

namespace App\Http\Controllers;

use App\Models\WargaProfileChangeLog;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        $warga = $user?->warga;

        $validated = $request->validate([
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'phone' => ['nullable', 'string', 'max:30'],
            'profile_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $changes = [];

        if ($user->email !== $validated['email']) {
            $changes[] = [
                'field' => 'email',
                'old_value' => $user->email,
                'new_value' => $validated['email'],
            ];

            $user->email = $validated['email'];
            $user->email_verified_at = null;
        }

        if (($user->phone ?? '') !== ($validated['phone'] ?? '')) {
            $changes[] = [
                'field' => 'phone',
                'old_value' => $user->phone,
                'new_value' => $validated['phone'] ?? null,
            ];

            $user->phone = $validated['phone'] ?? null;
        }

        if ($request->hasFile('profile_photo')) {
            $oldPath = $user->profile_photo_path;

            $newPath = $request->file('profile_photo')->store('profile-photos', 'public');

            if ($oldPath && Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }

            $changes[] = [
                'field' => 'profile_photo',
                'old_value' => $oldPath ? 'Foto profil lama' : null,
                'new_value' => 'Foto profil diperbarui',
            ];

            $user->profile_photo_path = $newPath;
        }

        $user->save();

        foreach ($changes as $change) {
            WargaProfileChangeLog::create([
                'user_id' => $user->id,
                'warga_id' => $warga?->id,
                'field' => $change['field'],
                'old_value' => $change['old_value'],
                'new_value' => $change['new_value'],
            ]);
        }

        return Redirect::route('profile.edit')->with('success', 'Profil berhasil diperbarui.');
    }

    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        if ($user->profile_photo_path && Storage::disk('public')->exists($user->profile_photo_path)) {
            Storage::disk('public')->delete($user->profile_photo_path);
        }

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}