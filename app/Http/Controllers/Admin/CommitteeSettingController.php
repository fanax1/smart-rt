<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CommitteeMember;
use App\Models\CommitteePeriod;
use App\Models\EmergencyContact;
use App\Models\RtSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CommitteeSettingController extends Controller
{
    public function index(): Response
    {
        $periods = CommitteePeriod::query()
            ->with(['members' => function ($query) {
                $query->orderBy('sort_order')->orderBy('id');
            }])
            ->orderByDesc('is_active')
            ->orderByDesc('start_year')
            ->orderByDesc('id')
            ->get();

        $activePeriod = $periods->firstWhere('is_active', true)
            ?? $periods->firstWhere('status', 'active');

        $previousPeriods = $periods
            ->reject(fn (CommitteePeriod $period) => $activePeriod && $period->id === $activePeriod->id)
            ->values();

        // RT Settings
        $allSettings = RtSetting::all()->keyBy('key');
        $rtSettings = $allSettings->map(fn ($s) => [
            'key'   => $s->key,
            'value' => $s->value,
            'type'  => $s->type,
            'label' => $s->label,
            'group' => $s->group,
        ])->values()->toArray();

        $logoUrl = null;
        if ($allSettings->has('logo_path') && $allSettings['logo_path']->value) {
            $logoUrl = Storage::url($allSettings['logo_path']->value);
        }

        // Emergency Contacts
        $emergencyContacts = EmergencyContact::ordered()->get()->map(fn ($c) => [
            'id'          => $c->id,
            'name'        => $c->name,
            'phone'       => $c->phone,
            'role'        => $c->role,
            'description' => $c->description,
            'sort_order'  => $c->sort_order,
            'is_active'   => $c->is_active,
        ])->values()->toArray();

        return Inertia::render('Admin/Pengaturan', [
            'committeePeriods'  => $periods->map(fn (CommitteePeriod $period) => $this->mapPeriod($period))->values(),
            'activePeriod'      => $activePeriod ? $this->mapPeriod($activePeriod) : null,
            'previousPeriods'   => $previousPeriods->map(fn (CommitteePeriod $period) => $this->mapPeriod($period))->values(),
            'rtSettings'        => $rtSettings,
            'logoUrl'           => $logoUrl,
            'emergencyContacts' => $emergencyContacts,
        ]);
    }

    public function storePeriod(Request $request): RedirectResponse
    {
        $validated = $this->validatePeriod($request);

        DB::transaction(function () use ($validated) {
            $isActive = $validated['status'] === 'active';

            if ($isActive) {
                CommitteePeriod::query()->update([
                    'is_active' => false,
                    'status' => 'completed',
                ]);
            }

            CommitteePeriod::create([
                'name' => $validated['name'],
                'start_year' => $validated['start_year'] ?? null,
                'end_year' => $validated['end_year'] ?? null,
                'status' => $isActive ? 'active' : $validated['status'],
                'is_active' => $isActive,
                'description' => $validated['description'] ?? null,
            ]);
        });

        return back()->with('success', 'Periode kepengurusan berhasil ditambahkan.');
    }

    public function updatePeriod(Request $request, CommitteePeriod $committeePeriod): RedirectResponse
    {
        $validated = $this->validatePeriod($request);

        DB::transaction(function () use ($validated, $committeePeriod) {
            $isActive = $validated['status'] === 'active';

            if ($isActive) {
                CommitteePeriod::query()
                    ->whereKeyNot($committeePeriod->id)
                    ->update([
                        'is_active' => false,
                        'status' => 'completed',
                    ]);
            }

            $committeePeriod->update([
                'name' => $validated['name'],
                'start_year' => $validated['start_year'] ?? null,
                'end_year' => $validated['end_year'] ?? null,
                'status' => $isActive ? 'active' : $validated['status'],
                'is_active' => $isActive,
                'description' => $validated['description'] ?? null,
            ]);
        });

        return back()->with('success', 'Periode kepengurusan berhasil diperbarui.');
    }

    public function destroyPeriod(CommitteePeriod $committeePeriod): RedirectResponse
    {
        if ($committeePeriod->is_active) {
            return back()->withErrors([
                'period' => 'Periode aktif tidak dapat dihapus. Ubah statusnya terlebih dahulu.',
            ]);
        }

        $committeePeriod->delete();

        return back()->with('success', 'Periode kepengurusan berhasil dihapus.');
    }

    public function storeMember(Request $request): RedirectResponse
    {
        $validated = $this->validateMember($request);

        $photoPath = null;

        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('committee-members', 'public');
        }

        CommitteeMember::create([
            'committee_period_id' => $validated['committee_period_id'],
            'name' => $validated['name'],
            'position' => $validated['position'],
            'category' => $validated['category'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'photo_path' => $photoPath,
            'description' => $validated['description'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $request->boolean('is_active'),
        ]);

        return back()->with('success', 'Anggota pengurus berhasil ditambahkan.');
    }

    public function updateMember(Request $request, CommitteeMember $committeeMember): RedirectResponse
    {
        $validated = $this->validateMember($request);

        $photoPath = $committeeMember->photo_path;

        if ($request->hasFile('photo')) {
            if ($committeeMember->photo_path) {
                Storage::disk('public')->delete($committeeMember->photo_path);
            }

            $photoPath = $request->file('photo')->store('committee-members', 'public');
        }

        $committeeMember->update([
            'committee_period_id' => $validated['committee_period_id'],
            'name' => $validated['name'],
            'position' => $validated['position'],
            'category' => $validated['category'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'photo_path' => $photoPath,
            'description' => $validated['description'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $request->boolean('is_active'),
        ]);

        return back()->with('success', 'Anggota pengurus berhasil diperbarui.');
    }

    public function destroyMember(CommitteeMember $committeeMember): RedirectResponse
    {
        if ($committeeMember->photo_path) {
            Storage::disk('public')->delete($committeeMember->photo_path);
        }

        $committeeMember->delete();

        return back()->with('success', 'Anggota pengurus berhasil dihapus.');
    }

    private function validatePeriod(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'start_year' => ['nullable', 'integer', 'min:1900', 'max:2200'],
            'end_year' => ['nullable', 'integer', 'min:1900', 'max:2200', 'gte:start_year'],
            'status' => ['required', 'in:draft,active,completed'],
            'description' => ['nullable', 'string', 'max:2000'],
        ]);
    }

    private function validateMember(Request $request): array
    {
        return $request->validate([
            'committee_period_id' => ['required', 'exists:committee_periods,id'],
            'name' => ['required', 'string', 'max:255'],
            'position' => ['required', 'string', 'max:255'],
            'category' => ['required', 'in:core,division,member'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048', 'dimensions:max_width=2000,max_height=2000'],
            'description' => ['nullable', 'string', 'max:2000'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
            'is_active' => ['nullable', 'boolean'],
        ], [
            'photo.dimensions' => 'Resolusi foto pengurus maksimal 2000x2000 piksel.',
            'photo.max' => 'Ukuran foto pengurus maksimal 2 MB.',
            'photo.image' => 'File harus berupa gambar.',
            'photo.mimes' => 'Format gambar harus JPG, JPEG, PNG, atau WebP.',
        ]);
    }

    private function mapPeriod(CommitteePeriod $period): array
    {
        return [
            'id' => $period->id,
            'name' => $period->name,
            'start_year' => $period->start_year,
            'end_year' => $period->end_year,
            'status' => $period->status,
            'is_active' => $period->is_active,
            'description' => $period->description,
            'members' => $period->members->map(fn (CommitteeMember $member) => [
                'id' => $member->id,
                'committee_period_id' => $member->committee_period_id,
                'name' => $member->name,
                'position' => $member->position,
                'category' => $member->category,
                'phone' => $member->phone,
                'email' => $member->email,
                'photo_path' => $member->photo_path,
                'photo_url' => $member->photo_path ? Storage::url($member->photo_path) : null,
                'description' => $member->description,
                'sort_order' => $member->sort_order,
                'is_active' => $member->is_active,
            ])->values(),
        ];
    }
}