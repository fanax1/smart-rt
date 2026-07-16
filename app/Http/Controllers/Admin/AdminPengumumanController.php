<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pengumuman;
use App\Models\PengumumanFile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminPengumumanController extends Controller
{
    private array $statusOptions = [
        ['value' => 'draft', 'label' => 'Draft'],
        ['value' => 'published', 'label' => 'Published'],
        ['value' => 'archived', 'label' => 'Archived'],
    ];

    private array $targetOptions = [
        ['value' => 'semua', 'label' => 'Semua'],
        ['value' => 'warga', 'label' => 'Warga'],
        ['value' => 'admin', 'label' => 'Admin'],
    ];

    private array $categoryOptions = [
        ['value' => 'umum', 'label' => 'Umum'],
        ['value' => 'penting', 'label' => 'Penting'],
        ['value' => 'kegiatan', 'label' => 'Kegiatan'],
        ['value' => 'iuran', 'label' => 'Iuran'],
        ['value' => 'sosial', 'label' => 'Sosial'],
        ['value' => 'keamanan', 'label' => 'Keamanan'],
    ];

    public function index(Request $request): Response
    {
        $filters = [
            'search' => (string) $request->query('search', ''),
            'status' => (string) $request->query('status', 'all'),
            'kategori' => (string) $request->query('kategori', 'all'),
        ];

        $query = Pengumuman::query()
            ->with(['files', 'creator'])
            ->latest('published_at')
            ->latest('id');

        if ($filters['search'] !== '') {
            $query->where(function ($builder) use ($filters) {
                $builder->where('judul', 'like', '%' . $filters['search'] . '%')
                    ->orWhere('isi', 'like', '%' . $filters['search'] . '%')
                    ->orWhere('kategori', 'like', '%' . $filters['search'] . '%');
            });
        }

        if ($filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if ($filters['kategori'] !== 'all') {
            $query->where('kategori', $filters['kategori']);
        }

        $pengumumans = $query->get();

        return Inertia::render('Admin/Announcements', [
            'announcements' => $pengumumans->map(fn (Pengumuman $pengumuman) => $this->mapAnnouncement($pengumuman))->values(),
            'filters' => $filters,
            'summary' => [
                'total' => Pengumuman::query()->count(),
                'draft' => Pengumuman::query()->where('status', 'draft')->count(),
                'published' => Pengumuman::query()->where('status', 'published')->count(),
                'archived' => Pengumuman::query()->where('status', 'archived')->count(),
                'views_rate' => 92,
            ],
            'statusOptions' => $this->statusOptions,
            'targetOptions' => $this->targetOptions,
            'categoryOptions' => $this->categoryOptions,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateAnnouncement($request);

        $pengumuman = Pengumuman::create([
            'judul' => $validated['judul'],
            'isi' => $validated['isi'],
            'kategori' => $validated['kategori'],
            'target_audiens' => $validated['target_audiens'],
            'status' => $validated['status'],
            'published_at' => $validated['status'] === 'published' ? now() : null,
            'created_by' => $request->user()?->id,
            'updated_by' => $request->user()?->id,
        ]);

        $this->storeFiles($request, $pengumuman);

        return redirect()
            ->route('admin.announcements.index')
            ->with('success', 'Pengumuman berhasil dibuat.');
    }

    public function update(Request $request, Pengumuman $pengumuman): RedirectResponse
    {
        $validated = $this->validateAnnouncement($request);

        $pengumuman->update([
            'judul' => $validated['judul'],
            'isi' => $validated['isi'],
            'kategori' => $validated['kategori'],
            'target_audiens' => $validated['target_audiens'],
            'status' => $validated['status'],
            'published_at' => $validated['status'] === 'published'
                ? ($pengumuman->published_at ?: now())
                : $pengumuman->published_at,
            'updated_by' => $request->user()?->id,
        ]);

        $this->storeFiles($request, $pengumuman);

        return redirect()
            ->route('admin.announcements.index')
            ->with('success', 'Pengumuman berhasil diperbarui.');
    }

    public function publish(Request $request, Pengumuman $pengumuman): RedirectResponse
    {
        $pengumuman->update([
            'status' => 'published',
            'published_at' => $pengumuman->published_at ?: now(),
            'updated_by' => $request->user()?->id,
        ]);

        return back()->with('success', 'Pengumuman berhasil dipublish.');
    }

    public function unpublish(Request $request, Pengumuman $pengumuman): RedirectResponse
    {
        $pengumuman->update([
            'status' => 'draft',
            'updated_by' => $request->user()?->id,
        ]);

        return back()->with('success', 'Pengumuman dikembalikan ke draft.');
    }

    public function destroy(Request $request, Pengumuman $pengumuman): RedirectResponse
    {
        $pengumuman->update([
            'status' => 'archived',
            'updated_by' => $request->user()?->id,
        ]);

        return back()->with('success', 'Pengumuman berhasil diarsipkan.');
    }

    public function destroyFile(PengumumanFile $file): RedirectResponse
    {
        Storage::disk('public')->delete($file->path);
        $file->delete();

        return back()->with('success', 'Lampiran berhasil dihapus.');
    }

    private function validateAnnouncement(Request $request): array
    {
        return $request->validate([
            'judul' => ['required', 'string', 'max:180'],
            'isi' => ['required', 'string'],
            'kategori' => ['required', 'string', 'max:80'],
            'target_audiens' => ['required', Rule::in(['semua', 'warga', 'admin'])],
            'status' => ['required', Rule::in(['draft', 'published', 'archived'])],
            'lampiran' => ['nullable', 'array', 'max:5'],
            'lampiran.*' => ['file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);
    }

    private function storeFiles(Request $request, Pengumuman $pengumuman): void
    {
        if (! $request->hasFile('lampiran')) {
            return;
        }

        foreach ($request->file('lampiran', []) as $file) {
            $path = $file->store('pengumuman/lampiran', 'public');

            $pengumuman->files()->create([
                'original_name' => $file->getClientOriginalName(),
                'path' => $path,
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize() ?: 0,
            ]);
        }
    }

    private function mapAnnouncement(Pengumuman $pengumuman): array
    {
        return [
            'id' => $pengumuman->id,
            'judul' => $pengumuman->judul,
            'isi' => $pengumuman->isi,
            'kategori' => $pengumuman->kategori,
            'targetAudiens' => $pengumuman->target_audiens,
            'status' => $pengumuman->status,
            'statusLabel' => $this->statusLabel($pengumuman->status),
            'publishedAt' => $pengumuman->published_at?->toDateTimeString(),
            'createdAt' => $pengumuman->created_at?->toDateTimeString(),
            'creator' => $pengumuman->creator?->name,
            'files' => $pengumuman->files->map(fn (PengumumanFile $file) => [
                'id' => $file->id,
                'originalName' => $file->original_name,
                'url' => Storage::url($file->path),
                'mimeType' => $file->mime_type,
                'size' => (int) $file->size,
            ])->values(),
        ];
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            'draft' => 'Draft',
            'published' => 'Published',
            'archived' => 'Archived',
            default => ucfirst($status),
        };
    }
}
