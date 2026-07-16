<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hunian;
use App\Models\KartuKeluarga;
use App\Models\User;
use App\Models\Warga;
use App\Models\WargaProfileChangeLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdminResidentController extends Controller
{
    public function index(): Response
    {
        $residents = Hunian::query()
            ->with(['kartuKeluarga.wargas.user'])
            ->latest()
            ->get()
            ->map(function (Hunian $hunian) {
                $kk = $hunian->kartuKeluarga;
                $members = $kk?->wargas ?? collect();

                $kepalaKeluarga = $members->firstWhere('is_kepala_keluarga', true)
                    ?? $members->firstWhere('hubungan_keluarga', 'Kepala Keluarga');

                return [
                    'id' => $hunian->id,
                    'houseNumber' => $hunian->no_rumah,
                    'headOfFamily' => $kk?->nama_kepala_keluarga ?? $kepalaKeluarga?->nama_lengkap ?? '-',
                    'kkNumber' => $kk?->no_kk ? $this->maskKkNumber($kk->no_kk) : '-',
                    'occupancyStatus' => $hunian->status_hunian,
                    'residentStatus' => $hunian->status_warga,
                    'phone' => $hunian->kontak_penghuni,
                    'address' => $hunian->alamat_hunian,

                    'headWargaId' => $kepalaKeluarga?->id,
                    'hasAccount' => $kepalaKeluarga?->user ? true : false,
                    'accountEmail' => $kepalaKeluarga?->user?->email,

                    'kkDetail' => $kk ? [
                        'kkNumber' => $kk->no_kk,
                        'headOfFamily' => $kk->nama_kepala_keluarga,
                        'address' => $kk->alamat,
                        'rt' => $kk->rt,
                        'rw' => $kk->rw,
                        'village' => $kk->kelurahan_desa,
                        'district' => $kk->kecamatan,
                        'city' => $kk->kabupaten_kota,
                        'province' => $kk->provinsi,
                        'postalCode' => $kk->kode_pos,
                    ] : null,

                    'occupancyDetails' => [
                        'owner' => $hunian->pemilik_nama,
                        'ownerContact' => $hunian->pemilik_kontak,
                        'ownerAddress' => $hunian->pemilik_alamat,
                        'startDate' => $this->formatDate($hunian->tanggal_mulai_menempati),
                        'contractEnd' => $this->formatDate($hunian->masa_kontrak_selesai),
                        'boardingHouse' => $hunian->nama_kos,
                        'roomNumber' => $hunian->nomor_kamar,
                        'notes' => $hunian->catatan_hunian,
                    ],

                    'familyMembers' => $members->map(fn (Warga $warga) => [
                        'name' => $warga->nama_lengkap,
                        'nik' => $warga->nik,
                        'gender' => $warga->jenis_kelamin,
                        'birthPlace' => $warga->tempat_lahir,
                        'birthDate' => $this->formatDate($warga->tanggal_lahir),
                        'religion' => $warga->agama,
                        'education' => $warga->pendidikan,
                        'occupation' => $warga->pekerjaan,
                        'maritalStatus' => $warga->status_perkawinan,
                        'relationship' => $warga->hubungan_keluarga,
                        'citizenship' => $warga->kewarganegaraan,
                        'father' => $warga->nama_ayah,
                        'mother' => $warga->nama_ibu,
                    ])->values(),
                ];
            })
            ->values();

        $latestChanges = WargaProfileChangeLog::query()
            ->with(['warga', 'user'])
            ->latest()
            ->take(3)
            ->get()
            ->map(function ($log) {
                $warga = $log->warga ?? $log->user?->warga;
                return [
                    'id' => $log->id,
                    'wargaName' => $warga?->nama_lengkap ?: 'Warga',
                    'field' => $log->field,
                    'newValue' => $log->new_value,
                    'createdAt' => $log->created_at?->diffForHumans() ?: '-',
                ];
            })
            ->values();

        $total_tetap = Hunian::where('status_warga', 'Warga Tetap')->count();
        $total_kontrak = Hunian::whereIn('status_warga', ['Warga Kontrak', 'Warga Kos', 'Warga Domisili', 'Pendatang'])->count();
        $total_pending = WargaProfileChangeLog::whereNull('read_at')->count();

        return Inertia::render('Admin/Residents', [
            'residents' => $residents,
            'latestChanges' => $latestChanges,
            'stats' => [
                'total_tetap' => $total_tetap,
                'total_kontrak' => $total_kontrak,
                'total_pending' => $total_pending,
            ]
        ]);
    }

    public function users(): Response
    {
        $residentUsers = User::query()
            ->where('role', 'warga')
            ->with(['warga.hunian'])
            ->withCount('loginHistories')
            ->withMax('loginHistories', 'login_at')
            ->latest()
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'isActive' => (bool) $user->is_active,
                'profilePhotoUrl' => $user->profile_photo_path
                    ? asset('storage/' . ltrim($user->profile_photo_path, '/'))
                    : null,
                'warga' => $user->warga ? [
                    'id' => $user->warga->id,
                    'nama' => $user->warga->nama_lengkap,
                    'noRumah' => $user->warga->hunian?->no_rumah,
                ] : null,
                'lastLoginAt' => $user->login_histories_max_login_at
                    ? $this->formatDateTime($user->login_histories_max_login_at)
                    : null,
                'loginCount' => (int) $user->login_histories_count,
            ])
            ->values();

        return Inertia::render('Admin/ResidentUsers', [
            'residentUsers' => $residentUsers,
        ]);
    }


    public function profileChangeLogs(): Response
    {
        $logs = WargaProfileChangeLog::query()
            ->with(['user.warga.hunian', 'warga.hunian', 'editor'])
            ->latest()
            ->get()
            ->map(function (WargaProfileChangeLog $log) {
                $warga = $log->warga ?? $log->user?->warga;
                
                if ($log->editor) {
                    $editorName = $log->editor->role === 'admin' ? 'Admin Utama' : $log->editor->name;
                } else {
                    $editorName = $log->user?->role === 'admin' ? 'Admin Utama' : ($warga?->nama_lengkap ?: 'Warga');
                }

                return [
                    'id' => $log->id,
                    'field' => $log->field,
                    'oldValue' => $log->old_value,
                    'newValue' => $log->new_value,
                    'readAt' => $log->read_at ? $this->formatDateTime($log->read_at) : null,
                    'createdAt' => $this->formatDateTime($log->created_at),
                    'user' => [
                        'id' => $log->user?->id,
                        'name' => $log->user?->name,
                        'email' => $log->user?->email,
                    ],
                    'warga' => $warga ? [
                        'id' => $warga->id,
                        'nama' => $warga->nama_lengkap,
                        'noRumah' => $warga->hunian?->no_rumah,
                    ] : null,
                    'editorName' => $editorName,
                ];
            })
            ->values();

        return Inertia::render('Admin/ResidentProfileChanges', [
            'logs' => $logs,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->rules());

        $this->ensureOneHeadOfFamily($validated['family_members']);

        DB::transaction(function () use ($validated) {
            $hunian = Hunian::create($this->hunianPayload($validated));

            $kk = KartuKeluarga::create($this->kkPayload($validated, $hunian->id));

            $this->syncFamilyMembers($validated['family_members'], $hunian->id, $kk->id);
        });

        return redirect()
            ->route('admin.residents.index')
            ->with('success', 'Data hunian, kartu keluarga, dan anggota keluarga berhasil ditambahkan.');
    }

    public function update(Request $request, Hunian $hunian): RedirectResponse
    {
        $kk = $hunian->kartuKeluarga;

        $validated = $request->validate($this->rules($hunian, $kk));

        $this->ensureOneHeadOfFamily($validated['family_members']);
        $this->ensureNikAvailableForUpdate($validated['family_members'], $hunian);

        DB::transaction(function () use ($validated, $hunian) {
            $oldStatusHunian = $hunian->status_hunian;
            $oldStatusWarga = $hunian->status_warga;

            $hunian->update($this->hunianPayload($validated));

            $kk = $hunian->kartuKeluarga;

            if ($kk) {
                $kk->update($this->kkPayload($validated, $hunian->id));
            } else {
                $kk = KartuKeluarga::create($this->kkPayload($validated, $hunian->id));
            }

            $this->syncFamilyMembers($validated['family_members'], $hunian->id, $kk->id);

            // Create profile change logs if statuses changed
            $warga = Warga::where('hunian_id', $hunian->id)->where('is_kepala_keluarga', true)->first()
                ?? Warga::where('hunian_id', $hunian->id)->first();
            $targetUserId = $warga?->user?->id ?? auth()->id();

            if ($oldStatusHunian !== $hunian->status_hunian) {
                WargaProfileChangeLog::create([
                    'user_id' => $targetUserId,
                    'warga_id' => $warga?->id,
                    'editor_id' => auth()->id(),
                    'field' => 'status_hunian',
                    'old_value' => $oldStatusHunian,
                    'new_value' => $hunian->status_hunian,
                ]);
            }

            if ($oldStatusWarga !== $hunian->status_warga) {
                WargaProfileChangeLog::create([
                    'user_id' => $targetUserId,
                    'warga_id' => $warga?->id,
                    'editor_id' => auth()->id(),
                    'field' => 'status_warga',
                    'old_value' => $oldStatusWarga,
                    'new_value' => $hunian->status_warga,
                ]);
            }

            $incomingNiks = collect($validated['family_members'])
                ->pluck('nik')
                ->filter()
                ->values();

            Warga::query()
                ->where('hunian_id', $hunian->id)
                ->whereNotIn('nik', $incomingNiks)
                ->delete();
        });

        return redirect()
            ->route('admin.residents.index')
            ->with('success', 'Data warga berhasil diperbarui.');
    }

    public function createAccount(Request $request, Hunian $hunian): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $kepalaKeluarga = Warga::query()
            ->where('hunian_id', $hunian->id)
            ->where(function ($query) {
                $query->where('is_kepala_keluarga', true)
                    ->orWhere('hubungan_keluarga', 'Kepala Keluarga');
            })
            ->first();

        if (! $kepalaKeluarga) {
            return back()->withErrors([
                'account' => 'Kepala keluarga belum ditemukan pada data hunian ini.',
            ]);
        }

        $sudahPunyaAkun = User::query()
            ->where('warga_id', $kepalaKeluarga->id)
            ->exists();

        if ($sudahPunyaAkun) {
            return back()->withErrors([
                'account' => 'Kepala keluarga ini sudah memiliki akun.',
            ]);
        }

        $user = User::create([
            'name' => $kepalaKeluarga->nama_lengkap,
            'email' => $validated['email'],
            'phone' => $kepalaKeluarga->hunian?->kontak_penghuni,
            'password' => Hash::make($validated['password']),
            'role' => 'warga',
            'warga_id' => $kepalaKeluarga->id,
            'is_active' => true,
        ]);

        // Set email_verified_at directly so the warga can login immediately
        $user->forceFill(['email_verified_at' => now()])->save();

        return redirect()
            ->route('admin.residents.index')
            ->with('success', 'Akun warga berhasil dibuat.');
    }

    public function toggleUserActive(User $user): RedirectResponse
    {
        abort_if($user->role !== 'warga', 403);

        $user->update([
            'is_active' => ! $user->is_active,
        ]);

        return back()->with('success', 'Status akun warga berhasil diperbarui.');
    }

    public function resetUserPassword(User $user): RedirectResponse
    {
        abort_if($user->role !== 'warga', 403);

        $user->update([
            'password' => Hash::make('password123'),
        ]);

        return back()->with('success', 'Password akun warga berhasil direset ke password123.');
    }

    public function destroy(Hunian $hunian): RedirectResponse
    {
        $hunian->delete();

        return redirect()
            ->route('admin.residents.index')
            ->with('success', 'Data warga berhasil dihapus.');
    }

    private function rules(?Hunian $hunian = null, ?KartuKeluarga $kk = null): array
    {
        $isUpdate = $hunian !== null;

        return [
            'no_rumah' => [
                'required',
                'string',
                'max:50',
                Rule::unique('hunians', 'no_rumah')->ignore($hunian?->id),
            ],

            'status_hunian' => [
                'required',
                'string',
                'in:Milik Sendiri,Kontrak/Sewa,Kos,Ikut Keluarga,Rumah Dinas,Lainnya',
            ],

            'status_warga' => [
                'required',
                'string',
                'in:Warga Tetap,Warga Kontrak,Warga Kos,Warga Domisili,Pendatang,Nonaktif',
            ],

            'kontak_penghuni' => ['nullable', 'string', 'max:30'],
            'alamat_hunian' => ['nullable', 'string'],

            'pemilik_nama' => ['nullable', 'string', 'max:255'],
            'pemilik_kontak' => ['nullable', 'string', 'max:30'],
            'pemilik_alamat' => ['nullable', 'string'],
            'tanggal_mulai_menempati' => ['nullable', 'date'],
            'masa_kontrak_selesai' => ['nullable', 'date'],
            'nama_kos' => ['nullable', 'string', 'max:255'],
            'nomor_kamar' => ['nullable', 'string', 'max:50'],
            'catatan_hunian' => ['nullable', 'string'],

            'no_kk' => [
                'required',
                'string',
                'max:30',
                Rule::unique('kartu_keluargas', 'no_kk')->ignore($kk?->id),
            ],

            'nama_kepala_keluarga' => ['required', 'string', 'max:255'],
            'kk_alamat' => ['nullable', 'string'],
            'rt' => ['nullable', 'string', 'max:10'],
            'rw' => ['nullable', 'string', 'max:10'],
            'kelurahan_desa' => ['nullable', 'string', 'max:255'],
            'kecamatan' => ['nullable', 'string', 'max:255'],
            'kabupaten_kota' => ['nullable', 'string', 'max:255'],
            'provinsi' => ['nullable', 'string', 'max:255'],
            'kode_pos' => ['nullable', 'string', 'max:20'],

            'family_members' => ['required', 'array', 'min:1'],
            'family_members.*.nama_lengkap' => ['required', 'string', 'max:255'],

            'family_members.*.nik' => $isUpdate
                ? ['required', 'string', 'max:30', 'distinct']
                : ['required', 'string', 'max:30', 'distinct', 'unique:wargas,nik'],

            'family_members.*.jenis_kelamin' => ['nullable', 'string', 'in:Laki-laki,Perempuan'],
            'family_members.*.tempat_lahir' => ['nullable', 'string', 'max:255'],
            'family_members.*.tanggal_lahir' => ['nullable', 'date'],
            'family_members.*.agama' => ['nullable', 'string', 'max:100'],
            'family_members.*.pendidikan' => ['nullable', 'string', 'max:100'],
            'family_members.*.pekerjaan' => ['nullable', 'string', 'max:255'],
            'family_members.*.status_perkawinan' => ['nullable', 'string', 'max:100'],
            'family_members.*.hubungan_keluarga' => ['nullable', 'string', 'max:100'],
            'family_members.*.kewarganegaraan' => ['nullable', 'string', 'max:50'],
            'family_members.*.nama_ayah' => ['nullable', 'string', 'max:255'],
            'family_members.*.nama_ibu' => ['nullable', 'string', 'max:255'],
        ];
    }

    private function hunianPayload(array $validated): array
    {
        return [
            'no_rumah' => $validated['no_rumah'],
            'status_hunian' => $validated['status_hunian'],
            'status_warga' => $validated['status_warga'],
            'kontak_penghuni' => $validated['kontak_penghuni'] ?? null,
            'alamat_hunian' => $validated['alamat_hunian'] ?? null,
            'pemilik_nama' => $validated['pemilik_nama'] ?? null,
            'pemilik_kontak' => $validated['pemilik_kontak'] ?? null,
            'pemilik_alamat' => $validated['pemilik_alamat'] ?? null,
            'tanggal_mulai_menempati' => $this->blankToNull($validated['tanggal_mulai_menempati'] ?? null),
            'masa_kontrak_selesai' => $this->blankToNull($validated['masa_kontrak_selesai'] ?? null),
            'nama_kos' => $validated['nama_kos'] ?? null,
            'nomor_kamar' => $validated['nomor_kamar'] ?? null,
            'catatan_hunian' => $validated['catatan_hunian'] ?? null,
        ];
    }

    private function kkPayload(array $validated, int $hunianId): array
    {
        return [
            'hunian_id' => $hunianId,
            'no_kk' => $validated['no_kk'],
            'nama_kepala_keluarga' => $validated['nama_kepala_keluarga'],
            'alamat' => $validated['kk_alamat'] ?? ($validated['alamat_hunian'] ?? null),
            'rt' => $validated['rt'] ?? '003',
            'rw' => $validated['rw'] ?? '005',
            'kelurahan_desa' => $validated['kelurahan_desa'] ?? null,
            'kecamatan' => $validated['kecamatan'] ?? null,
            'kabupaten_kota' => $validated['kabupaten_kota'] ?? null,
            'provinsi' => $validated['provinsi'] ?? null,
            'kode_pos' => $validated['kode_pos'] ?? null,
        ];
    }

    private function syncFamilyMembers(array $members, int $hunianId, int $kkId): void
    {
        foreach ($members as $member) {
            $warga = Warga::updateOrCreate(
                [
                    'hunian_id' => $hunianId,
                    'nik' => $member['nik'],
                ],
                [
                    'kartu_keluarga_id' => $kkId,
                    'nama_lengkap' => $member['nama_lengkap'],
                    'jenis_kelamin' => $member['jenis_kelamin'] ?? null,
                    'tempat_lahir' => $member['tempat_lahir'] ?? null,
                    'tanggal_lahir' => $this->blankToNull($member['tanggal_lahir'] ?? null),
                    'agama' => $member['agama'] ?? null,
                    'pendidikan' => $member['pendidikan'] ?? null,
                    'pekerjaan' => $member['pekerjaan'] ?? null,
                    'status_perkawinan' => $member['status_perkawinan'] ?? null,
                    'hubungan_keluarga' => $member['hubungan_keluarga'] ?? null,
                    'kewarganegaraan' => $member['kewarganegaraan'] ?? 'WNI',
                    'nama_ayah' => $member['nama_ayah'] ?? null,
                    'nama_ibu' => $member['nama_ibu'] ?? null,
                    'is_kepala_keluarga' => ($member['hubungan_keluarga'] ?? null) === 'Kepala Keluarga',
                ]
            );

            if ($warga->user) {
                $warga->user->update([
                    'name' => $member['nama_lengkap'],
                ]);
            }
        }
    }

    private function ensureNikAvailableForUpdate(array $members, Hunian $hunian): void
    {
        $niks = collect($members)
            ->pluck('nik')
            ->filter()
            ->values();

        $existsOutsideThisHunian = Warga::query()
            ->whereIn('nik', $niks)
            ->where('hunian_id', '!=', $hunian->id)
            ->exists();

        if ($existsOutsideThisHunian) {
            throw ValidationException::withMessages([
                'family_members' => 'Ada NIK yang sudah dipakai pada data warga/hunian lain.',
            ]);
        }
    }

    public function markLogAsRead(WargaProfileChangeLog $profileChangeLog): RedirectResponse
    {
        $profileChangeLog->update(['read_at' => now()]);

        return back()->with('success', 'Log ditandai sudah dibaca.');
    }

    public function markAllLogsAsRead(): RedirectResponse
    {
        WargaProfileChangeLog::whereNull('read_at')->update(['read_at' => now()]);

        return back()->with('success', 'Semua log ditandai sudah dibaca.');
    }

    private function ensureOneHeadOfFamily(array $members): void
    {
        $totalHead = collect($members)
            ->where('hubungan_keluarga', 'Kepala Keluarga')
            ->count();

        if ($totalHead < 1) {
            throw ValidationException::withMessages([
                'family_members' => 'Minimal harus ada satu anggota dengan hubungan keluarga sebagai Kepala Keluarga.',
            ]);
        }

        if ($totalHead > 1) {
            throw ValidationException::withMessages([
                'family_members' => 'Kepala Keluarga tidak boleh lebih dari satu orang dalam satu KK.',
            ]);
        }
    }

    private function formatDate($value): ?string
    {
        if (! $value) {
            return null;
        }

        return method_exists($value, 'format') ? $value->format('Y-m-d') : (string) $value;
    }

    private function formatDateTime($value): ?string
    {
        if (! $value) {
            return null;
        }

        try {
            return \Illuminate\Support\Carbon::parse($value)->translatedFormat('d M Y H:i');
        } catch (\Throwable) {
            return (string) $value;
        }
    }

    private function maskKkNumber(string $noKk): string
    {
        if (Str::length($noKk) <= 8) {
            return $noKk;
        }

        return Str::substr($noKk, 0, 4) . '********' . Str::substr($noKk, -4);
    }

    private function blankToNull(?string $value): ?string
    {
        return $value === '' ? null : $value;
    }
}