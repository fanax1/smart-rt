<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmergencyContact;
use App\Models\RtSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RtSettingController extends Controller
{
    /**
     * Save a group of RT settings (Profil RT, Tampilan, Footer).
     */
    public function saveGroup(Request $request): RedirectResponse
    {
        $group = $request->input('group');

        $allowedGroups = ['profil_rt', 'tampilan', 'footer'];

        if (!in_array($group, $allowedGroups)) {
            return back()->withErrors(['group' => 'Grup tidak valid.']);
        }

        if ($group === 'footer') {
            $request->validate([
                'wa_link' => [
                    'nullable',
                    'string',
                    'max:500',
                    function ($attribute, $value, $fail) {
                        if (
                            filled($value) &&
                            !preg_match(
                                '#^https://chat\.whatsapp\.com/[A-Za-z0-9_-]+/?(?:\?.*)?$#',
                                trim($value)
                            )
                        ) {
                            $fail(
                                'Link WhatsApp Group harus berupa tautan undangan grup WhatsApp yang lengkap.'
                            );
                        }
                    },
                ],
                'instagram' => ['nullable', 'string', 'max:255'],
                'facebook' => ['nullable', 'url', 'max:500'],
                'youtube' => ['nullable', 'url', 'max:500'],
                'email_publik' => ['nullable', 'email', 'max:255'],
                'footer_text' => ['nullable', 'string', 'max:500'],
                'copyright' => ['nullable', 'string', 'max:255'],
            ]);
        }

        $settings = RtSetting::where('group', $group)->get();

        foreach ($settings as $setting) {
            if ($setting->key === 'gmaps_embed_url') {
                continue;
            }
            if ($setting->type === 'boolean') {
                $value = $request->boolean($setting->key) ? '1' : '0';
            } elseif ($setting->type === 'image') {
                // handled separately via uploadLogo
                continue;
            } else {
                if (!$request->has($setting->key)) {
                    continue;
                }
                $value = $request->input($setting->key);
                if ($setting->key === 'wa_link' && filled($value)) {
                    $value = trim($value);
                }
            }

            $setting->update(['value' => $value]);

            // Auto-resolve Google Maps URL to embed format
            if ($setting->key === 'gmaps_url' && !empty($value)) {
                try {
                    $response = \Illuminate\Support\Facades\Http::withHeaders([
                        'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    ])->get($value);
                    $finalUrl = $response->effectiveUri()->__toString();

                    $coords = null;
                    if (preg_match('/q=(-?\d+\.\d+),(-?\d+\.\d+)/', $finalUrl, $matches)) {
                        $coords = $matches[1] . ',' . $matches[2];
                    } elseif (preg_match('/@(-?\d+\.\d+),(-?\d+\.\d+)/', $finalUrl, $matches)) {
                        $coords = $matches[1] . ',' . $matches[2];
                    } elseif (preg_match('/3d(-?\d+\.\d+).*?4d(-?\d+\.\d+)/', $finalUrl, $matches)) {
                        $coords = $matches[1] . ',' . $matches[2];
                    }

                    if ($coords) {
                        $embedUrl = "https://maps.google.com/maps?q=" . urlencode($coords) . "&z=16&output=embed";
                    } else {
                        $embedUrl = "https://maps.google.com/maps?q=" . urlencode($value) . "&z=16&output=embed";
                    }
                    RtSetting::where('key', 'gmaps_embed_url')->update(['value' => $embedUrl]);
                } catch (\Exception $e) {
                    $embedUrl = "https://maps.google.com/maps?q=" . urlencode($value) . "&z=16&output=embed";
                    RtSetting::where('key', 'gmaps_embed_url')->update(['value' => $embedUrl]);
                }
            }
        }

        $message = $group === 'footer'
            ? 'Konfigurasi Footer & Sosial Media berhasil disimpan.'
            : 'Pengaturan berhasil disimpan.';

        return back()->with('success', $message);
    }

    /**
     * Upload logo RT.
     */
    public function uploadLogo(Request $request): RedirectResponse
    {
        $request->validate([
            'logo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp,svg', 'max:2048'],
        ]);

        // Delete old logo
        $oldPath = RtSetting::get('logo_path');
        if ($oldPath && Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
        }

        $path = $request->file('logo')->store('rt/logo', 'public');
        RtSetting::set('logo_path', $path);

        return back()->with('success', 'Logo berhasil diperbarui.');
    }

    /**
     * Create emergency contact.
     */
    public function storeContact(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:100'],
            'phone'       => ['required', 'string', 'max:50'],
            'role'        => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'sort_order'  => ['nullable', 'integer', 'min:0'],
            'is_active'   => ['nullable', 'boolean'],
        ]);

        EmergencyContact::create([
            'name'        => $validated['name'],
            'phone'       => $validated['phone'],
            'role'        => $validated['role'] ?? null,
            'description' => $validated['description'] ?? null,
            'sort_order'  => $validated['sort_order'] ?? 0,
            'is_active'   => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Kontak darurat berhasil ditambahkan.');
    }

    /**
     * Update emergency contact.
     */
    public function updateContact(Request $request, EmergencyContact $contact): RedirectResponse
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:100'],
            'phone'       => ['required', 'string', 'max:50'],
            'role'        => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'sort_order'  => ['nullable', 'integer', 'min:0'],
            'is_active'   => ['nullable', 'boolean'],
        ]);

        $contact->update([
            'name'        => $validated['name'],
            'phone'       => $validated['phone'],
            'role'        => $validated['role'] ?? null,
            'description' => $validated['description'] ?? null,
            'sort_order'  => $validated['sort_order'] ?? 0,
            'is_active'   => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Kontak darurat berhasil diperbarui.');
    }

    /**
     * Delete emergency contact.
     */
    public function destroyContact(EmergencyContact $contact): RedirectResponse
    {
        $contact->delete();
        return back()->with('success', 'Kontak darurat berhasil dihapus.');
    }
}
