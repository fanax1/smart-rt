<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Dokumen;
use App\Models\DokumenFile;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DokumenFileTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected User $warga;

    protected function setUp(): void
    {
        parent::setUp();

        // Database configuration matches the project defaults
        config([
            'database.default' => 'mysql',
            'database.connections.mysql.database' => 'smart_rt',
            'database.connections.mysql.username' => 'root',
            'database.connections.mysql.password' => '',
        ]);
        \Illuminate\Support\Facades\DB::purge();

        // Get seed users
        $this->admin = User::where('email', 'admin@smart-rt.test')->first() 
            ?? User::factory()->create(['role' => 'admin', 'email' => 'admin@smart-rt.test']);
        $this->warga = User::where('email', 'rohmanftr@gmail.com')->first()
            ?? User::factory()->create(['role' => 'warga', 'email' => 'rohmanftr@gmail.com']);

        // Use Laravel's Storage fake to isolate file upload testing
        Storage::fake('local');
        Storage::fake('public');
    }

    /**
     * Helper to create a dummy document with a unique slug.
     */
    private function createDocument(array $attributes = []): Dokumen
    {
        $unique = uniqid();
        return Dokumen::create(array_merge([
            'judul' => 'Aktivitas Kerja Bakti ' . $unique,
            'slug' => 'aktivitas-kerja-bakti-' . $unique,
            'deskripsi' => 'Rencana kerja bakti warga',
            'kategori' => 'Laporan Kegiatan',
            'tipe' => 'manual_upload',
            'visibility' => 'publik',
            'status' => 'published',
            'created_by' => $this->admin->id,
            'updated_by' => $this->admin->id,
        ], $attributes));
    }

    /**
     * 1. Admin dapat membuat dokumen tanpa file.
     */
    public function test_admin_can_create_document_without_files()
    {
        $response = $this->actingAs($this->admin)->post('/admin/documents', [
            'judul' => 'Dokumen Tanpa File ' . uniqid(),
            'deskripsi' => 'Ini deskripsi',
            'kategori' => 'Lainnya',
            'tipe' => 'manual_upload',
            'visibility' => 'publik',
            'status' => 'draft',
        ]);

        $response->assertRedirect();
    }

    /**
     * 2. Admin dapat mengunggah file utama.
     */
    public function test_admin_can_upload_main_file()
    {
        $file = UploadedFile::fake()->create('utama.pdf', 500, 'application/pdf');
        $judul = 'Dokumen File Utama ' . uniqid();

        $response = $this->actingAs($this->admin)->post('/admin/documents', [
            'judul' => $judul,
            'kategori' => 'Peraturan RT',
            'tipe' => 'manual_upload',
            'visibility' => 'publik',
            'status' => 'published',
            'main_file' => $file,
        ]);

        $response->assertRedirect();
        $doc = Dokumen::where('judul', $judul)->first();
        $this->assertNotNull($doc);

        $this->assertDatabaseHas('dokumen_files', [
            'dokumen_id' => $doc->id,
            'category' => 'main',
            'original_name' => 'utama.pdf',
        ]);

        $docFile = $doc->files()->where('category', 'main')->first();
        Storage::disk('local')->assertExists($docFile->stored_path);
    }

    /**
     * 3. Admin dapat mengunggah cover.
     */
    public function test_admin_can_upload_cover()
    {
        $cover = UploadedFile::fake()->create('header.png', 100, 'image/png');
        $judul = 'Dokumen Cover ' . uniqid();

        $response = $this->actingAs($this->admin)->post('/admin/documents', [
            'judul' => $judul,
            'kategori' => 'Laporan Kegiatan',
            'tipe' => 'manual_upload',
            'visibility' => 'publik',
            'status' => 'published',
            'cover_image' => $cover,
        ]);

        $response->assertRedirect();
        $doc = Dokumen::where('judul', $judul)->first();
        $coverFile = $doc->files()->where('category', 'cover')->first();
        $this->assertNotNull($coverFile);
        Storage::disk('local')->assertExists($coverFile->stored_path);
    }

    /**
     * 4. Admin dapat mengunggah banyak lampiran.
     */
    public function test_admin_can_upload_multiple_attachments()
    {
        $file1 = UploadedFile::fake()->create('attachment1.docx', 100);
        $file2 = UploadedFile::fake()->create('attachment2.xlsx', 100);
        $judul = 'Dokumen Multi Lampiran ' . uniqid();

        $response = $this->actingAs($this->admin)->post('/admin/documents', [
            'judul' => $judul,
            'kategori' => 'Laporan Keuangan',
            'tipe' => 'manual_upload',
            'visibility' => 'publik',
            'status' => 'published',
            'attachments' => [$file1, $file2],
        ]);

        $response->assertRedirect();
        $doc = Dokumen::where('judul', $judul)->first();
        $this->assertEquals(2, $doc->files()->where('category', 'attachment')->count());
    }

    /**
     * 5. Admin dapat mengunggah banyak foto galeri.
     */
    public function test_admin_can_upload_multiple_gallery_images()
    {
        $img1 = UploadedFile::fake()->create('foto1.jpg', 100, 'image/jpeg');
        $img2 = UploadedFile::fake()->create('foto2.webp', 100, 'image/webp');
        $judul = 'Dokumen Galeri ' . uniqid();

        $response = $this->actingAs($this->admin)->post('/admin/documents', [
            'judul' => $judul,
            'kategori' => 'Dokumentasi Kegiatan',
            'tipe' => 'event_documentation',
            'visibility' => 'publik',
            'status' => 'published',
            'gallery_files' => [$img1, $img2],
        ]);

        $response->assertRedirect();
        $doc = Dokumen::where('judul', $judul)->first();
        $this->assertEquals(2, $doc->files()->where('category', 'gallery')->count());
    }

    /**
     * 6. Update tanpa file baru mempertahankan file lama.
     */
    public function test_update_without_new_files_retains_old_files()
    {
        $doc = $this->createDocument();
        $file = UploadedFile::fake()->create('lama.pdf', 200);

        // Upload first
        $this->actingAs($this->admin)->put('/admin/documents/' . $doc->id, [
            'judul' => 'Judul Baru ' . uniqid(),
            'kategori' => $doc->kategori,
            'tipe' => $doc->tipe,
            'visibility' => $doc->visibility,
            'status' => $doc->status,
            'main_file' => $file,
        ]);

        $docFile = $doc->files()->where('category', 'main')->first();
        $this->assertNotNull($docFile);
        $oldPath = $docFile->stored_path;

        // Update without file
        $response = $this->actingAs($this->admin)->put('/admin/documents/' . $doc->id, [
            'judul' => 'Judul Lebih Baru ' . uniqid(),
            'kategori' => $doc->kategori,
            'tipe' => $doc->tipe,
            'visibility' => $doc->visibility,
            'status' => $doc->status,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('dokumen_files', [
            'dokumen_id' => $doc->id,
            'category' => 'main',
            'stored_path' => $oldPath,
        ]);
        Storage::disk('local')->assertExists($oldPath);
    }

    /**
     * 7. Admin dapat mengganti file utama.
     */
    public function test_admin_can_replace_main_file()
    {
        $doc = $this->createDocument();
        $fileLama = UploadedFile::fake()->create('lama.pdf', 200);

        // Save old file first
        $this->actingAs($this->admin)->put('/admin/documents/' . $doc->id, [
            'judul' => $doc->judul,
            'kategori' => $doc->kategori,
            'tipe' => $doc->tipe,
            'visibility' => $doc->visibility,
            'status' => $doc->status,
            'main_file' => $fileLama,
        ]);

        $oldDocFile = $doc->files()->where('category', 'main')->first();
        $oldPath = $oldDocFile->stored_path;
        Storage::disk('local')->assertExists($oldPath);

        // Replace with new file
        $fileBaru = UploadedFile::fake()->create('baru.pdf', 300);
        $response = $this->actingAs($this->admin)->put('/admin/documents/' . $doc->id, [
            'judul' => $doc->judul,
            'kategori' => $doc->kategori,
            'tipe' => $doc->tipe,
            'visibility' => $doc->visibility,
            'status' => $doc->status,
            'main_file' => $fileBaru,
        ]);

        $response->assertRedirect();
        
        // Assert old record was deleted and new one was created
        $this->assertDatabaseMissing('dokumen_files', ['id' => $oldDocFile->id]);
        $newDocFile = $doc->files()->where('category', 'main')->first();
        $this->assertNotNull($newDocFile);
        $this->assertEquals('baru.pdf', $newDocFile->original_name);

        // Assert old physical file is deleted and new one exists
        Storage::disk('local')->assertMissing($oldPath);
        Storage::disk('local')->assertExists($newDocFile->stored_path);
    }

    /**
     * 8. Admin dapat mengganti cover.
     */
    public function test_admin_can_replace_cover_image()
    {
        $doc = $this->createDocument();
        $coverLama = UploadedFile::fake()->create('cover_lama.jpg', 100, 'image/jpeg');

        // Save old cover first
        $this->actingAs($this->admin)->put('/admin/documents/' . $doc->id, [
            'judul' => $doc->judul,
            'kategori' => $doc->kategori,
            'tipe' => $doc->tipe,
            'visibility' => $doc->visibility,
            'status' => $doc->status,
            'cover_image' => $coverLama,
        ]);

        $oldCover = $doc->files()->where('category', 'cover')->first();
        $oldPath = $oldCover->stored_path;
        Storage::disk('local')->assertExists($oldPath);

        // Replace with new cover
        $coverBaru = UploadedFile::fake()->create('cover_baru.png', 100, 'image/png');
        $response = $this->actingAs($this->admin)->put('/admin/documents/' . $doc->id, [
            'judul' => $doc->judul,
            'kategori' => $doc->kategori,
            'tipe' => $doc->tipe,
            'visibility' => $doc->visibility,
            'status' => $doc->status,
            'cover_image' => $coverBaru,
        ]);

        $response->assertRedirect();
        Storage::disk('local')->assertMissing($oldPath);
        $newCover = $doc->files()->where('category', 'cover')->first();
        $this->assertNotNull($newCover);
        Storage::disk('local')->assertExists($newCover->stored_path);
    }

    /**
     * 9. Admin dapat menambah lampiran tanpa menghapus lampiran lama.
     */
    public function test_admin_can_add_attachments_without_removing_existing_ones()
    {
        $doc = $this->createDocument();
        $att1 = UploadedFile::fake()->create('att1.pdf', 100);

        // Upload first attachment
        $this->actingAs($this->admin)->put('/admin/documents/' . $doc->id, [
            'judul' => $doc->judul,
            'kategori' => $doc->kategori,
            'tipe' => $doc->tipe,
            'visibility' => $doc->visibility,
            'status' => $doc->status,
            'attachments' => [$att1],
        ]);

        $this->assertEquals(1, $doc->files()->where('category', 'attachment')->count());

        // Upload second attachment
        $att2 = UploadedFile::fake()->create('att2.pdf', 150);
        $response = $this->actingAs($this->admin)->put('/admin/documents/' . $doc->id, [
            'judul' => $doc->judul,
            'kategori' => $doc->kategori,
            'tipe' => $doc->tipe,
            'visibility' => $doc->visibility,
            'status' => $doc->status,
            'attachments' => [$att2],
        ]);

        $response->assertRedirect();
        $this->assertEquals(2, $doc->files()->where('category', 'attachment')->count());
    }

    /**
     * 10. Admin dapat menambah galeri tanpa menghapus foto lama.
     */
    public function test_admin_can_add_gallery_without_removing_existing_ones()
    {
        $doc = $this->createDocument();
        $img1 = UploadedFile::fake()->create('img1.png', 100, 'image/png');

        // Upload first
        $this->actingAs($this->admin)->put('/admin/documents/' . $doc->id, [
            'judul' => $doc->judul,
            'kategori' => $doc->kategori,
            'tipe' => $doc->tipe,
            'visibility' => $doc->visibility,
            'status' => $doc->status,
            'gallery_files' => [$img1],
        ]);

        $this->assertEquals(1, $doc->files()->where('category', 'gallery')->count());

        // Upload second
        $img2 = UploadedFile::fake()->create('img2.png', 100, 'image/png');
        $response = $this->actingAs($this->admin)->put('/admin/documents/' . $doc->id, [
            'judul' => $doc->judul,
            'kategori' => $doc->kategori,
            'tipe' => $doc->tipe,
            'visibility' => $doc->visibility,
            'status' => $doc->status,
            'gallery_files' => [$img2],
        ]);

        $response->assertRedirect();
        $this->assertEquals(2, $doc->files()->where('category', 'gallery')->count());
    }

    /**
     * 11. Admin dapat menghapus satu lampiran.
     */
    public function test_admin_can_delete_a_single_attachment()
    {
        $doc = $this->createDocument();
        $file = UploadedFile::fake()->create('attachment.pdf', 100);

        // Upload first
        $this->actingAs($this->admin)->put('/admin/documents/' . $doc->id, [
            'judul' => $doc->judul,
            'kategori' => $doc->kategori,
            'tipe' => $doc->tipe,
            'visibility' => $doc->visibility,
            'status' => $doc->status,
            'attachments' => [$file],
        ]);

        $att = $doc->files()->where('category', 'attachment')->first();
        $path = $att->stored_path;
        Storage::disk('local')->assertExists($path);

        // Delete attachment
        $response = $this->actingAs($this->admin)->delete("/admin/documents/{$doc->id}/files/{$att->id}");
        $response->assertRedirect();

        $this->assertDatabaseMissing('dokumen_files', ['id' => $att->id]);
        Storage::disk('local')->assertMissing($path);
    }

    /**
     * 12. Admin dapat menghapus satu foto galeri.
     */
    public function test_admin_can_delete_a_single_gallery_file()
    {
        $doc = $this->createDocument();
        $img = UploadedFile::fake()->create('gallery.jpg', 100, 'image/jpeg');

        $this->actingAs($this->admin)->put('/admin/documents/' . $doc->id, [
            'judul' => $doc->judul,
            'kategori' => $doc->kategori,
            'tipe' => $doc->tipe,
            'visibility' => $doc->visibility,
            'status' => $doc->status,
            'gallery_files' => [$img],
        ]);

        $gal = $doc->files()->where('category', 'gallery')->first();
        $path = $gal->stored_path;
        Storage::disk('local')->assertExists($path);

        $response = $this->actingAs($this->admin)->delete("/admin/documents/{$doc->id}/files/{$gal->id}");
        $response->assertRedirect();

        $this->assertDatabaseMissing('dokumen_files', ['id' => $gal->id]);
        Storage::disk('local')->assertMissing($path);
    }

    /**
     * 13. File fisik ikut terhapus ketika record dihapus.
     */
    public function test_physical_files_are_deleted_when_document_is_deleted()
    {
        $doc = $this->createDocument();
        $file = UploadedFile::fake()->create('main.pdf', 100);

        $this->actingAs($this->admin)->put('/admin/documents/' . $doc->id, [
            'judul' => $doc->judul,
            'kategori' => $doc->kategori,
            'tipe' => $doc->tipe,
            'visibility' => $doc->visibility,
            'status' => $doc->status,
            'main_file' => $file,
        ]);

        $docFile = $doc->files()->where('category', 'main')->first();
        $path = $docFile->stored_path;
        Storage::disk('local')->assertExists($path);

        // Delete entire document
        $response = $this->actingAs($this->admin)->delete('/admin/documents/' . $doc->id);
        $response->assertRedirect();

        $this->assertDatabaseMissing('dokumens', ['id' => $doc->id]);
        $this->assertDatabaseMissing('dokumen_files', ['id' => $docFile->id]);
        Storage::disk('local')->assertMissing($path);
    }

    /**
     * 14. Pengguna dapat download file satuan.
     */
    public function test_user_can_download_single_file()
    {
        $doc = $this->createDocument();
        $file = UploadedFile::fake()->create('document.pdf', 100);

        $this->actingAs($this->admin)->put('/admin/documents/' . $doc->id, [
            'judul' => $doc->judul,
            'kategori' => $doc->kategori,
            'tipe' => $doc->tipe,
            'visibility' => $doc->visibility,
            'status' => $doc->status,
            'main_file' => $file,
        ]);

        $docFile = $doc->files()->where('category', 'main')->first();

        // Download as a normal guest/user
        $response = $this->get("/documents/{$doc->id}/files/{$docFile->id}/download");
        $response->assertStatus(200);
        
        $contentDisposition = $response->headers->get('Content-Disposition');
        $this->assertStringContainsString('attachment', $contentDisposition);
        $this->assertStringContainsString('document.pdf', $contentDisposition);
    }

    /**
     * 15. Pengguna dapat download ZIP.
     */
    public function test_user_can_download_zip()
    {
        $doc = $this->createDocument();
        $file1 = UploadedFile::fake()->create('doc1.pdf', 100);
        $file2 = UploadedFile::fake()->create('doc2.pdf', 100);

        $this->actingAs($this->admin)->put('/admin/documents/' . $doc->id, [
            'judul' => $doc->judul,
            'kategori' => $doc->kategori,
            'tipe' => $doc->tipe,
            'visibility' => $doc->visibility,
            'status' => $doc->status,
            'main_file' => $file1,
            'attachments' => [$file2],
        ]);

        $response = $this->get("/documents/{$doc->id}/download-zip");

        if (class_exists(\ZipArchive::class)) {
            $response->assertStatus(200);
            $response->assertHeader('Content-Disposition', 'attachment; filename="' . $doc->slug . '-dokumen.zip"');
        } else {
            // Redirect back with error
            $response->assertStatus(302);
            $response->assertSessionHas('error');
        }
    }

    /**
     * 16. Dokumen draft tidak dapat diunduh.
     */
    public function test_draft_document_cannot_be_downloaded()
    {
        $doc = $this->createDocument(['status' => 'draft']);
        $file = UploadedFile::fake()->create('draft.pdf', 100);

        $this->actingAs($this->admin)->put('/admin/documents/' . $doc->id, [
            'judul' => $doc->judul,
            'kategori' => $doc->kategori,
            'tipe' => $doc->tipe,
            'visibility' => $doc->visibility,
            'status' => $doc->status,
            'main_file' => $file,
        ]);

        $docFile = $doc->files()->where('category', 'main')->first();

        $response = $this->get("/documents/{$doc->id}/files/{$docFile->id}/download");
        $response->assertStatus(404);
    }

    /**
     * 17. Dokumen private tidak dapat diunduh.
     */
    public function test_private_document_cannot_be_downloaded_from_homepage()
    {
        $doc = $this->createDocument(['visibility' => 'admin']);
        $file = UploadedFile::fake()->create('secret.pdf', 100);

        $this->actingAs($this->admin)->put('/admin/documents/' . $doc->id, [
            'judul' => $doc->judul,
            'kategori' => $doc->kategori,
            'tipe' => $doc->tipe,
            'visibility' => $doc->visibility,
            'status' => $doc->status,
            'main_file' => $file,
        ]);

        $docFile = $doc->files()->where('category', 'main')->first();

        $response = $this->get("/documents/{$doc->id}/files/{$docFile->id}/download");
        $response->assertStatus(404);
    }

    /**
     * 18. File dari dokumen lain tidak dapat diakses dengan mengganti ID URL.
     */
    public function test_cannot_access_file_using_mismatched_document_id()
    {
        $doc1 = $this->createDocument();
        $doc2 = $this->createDocument(['judul' => 'Dokumen 2 ' . uniqid(), 'slug' => 'dokumen-2-' . uniqid()]);
        $file = UploadedFile::fake()->create('doc1.pdf', 100);

        $this->actingAs($this->admin)->put('/admin/documents/' . $doc1->id, [
            'judul' => $doc1->judul,
            'kategori' => $doc1->kategori,
            'tipe' => $doc1->tipe,
            'visibility' => $doc1->visibility,
            'status' => $doc1->status,
            'main_file' => $file,
        ]);

        $docFile = $doc1->files()->where('category', 'main')->first();

        // Mismatched document download request
        $response = $this->get("/documents/{$doc2->id}/files/{$docFile->id}/download");
        $response->assertStatus(404);
    }

    /**
     * 19. File berbahaya ditolak.
     */
    public function test_dangerous_file_extensions_are_rejected()
    {
        $file = UploadedFile::fake()->create('malicious.php', 10);

        $response = $this->actingAs($this->admin)->post('/admin/documents', [
            'judul' => 'Dokumen Bahaya ' . uniqid(),
            'kategori' => 'Lainnya',
            'tipe' => 'manual_upload',
            'visibility' => 'publik',
            'status' => 'draft',
            'main_file' => $file,
        ]);

        $response->assertSessionHasErrors('main_file');
    }

    /**
     * 20. File lebih dari 10 MB ditolak.
     */
    public function test_large_files_over_10mb_are_rejected()
    {
        $file = UploadedFile::fake()->create('huge.pdf', 11000); // ~11MB

        $response = $this->actingAs($this->admin)->post('/admin/documents', [
            'judul' => 'Dokumen Raksasa ' . uniqid(),
            'kategori' => 'Lainnya',
            'tipe' => 'manual_upload',
            'visibility' => 'publik',
            'status' => 'draft',
            'main_file' => $file,
        ]);

        $response->assertSessionHasErrors('main_file');
    }

    /**
     * 21. ZIP tidak gagal jika salah satu file hilang.
     */
    public function test_zip_does_not_fail_if_one_file_is_missing()
    {
        $doc = $this->createDocument();
        $file1 = UploadedFile::fake()->create('doc1.pdf', 100);
        $file2 = UploadedFile::fake()->create('doc2.pdf', 100);

        $this->actingAs($this->admin)->put('/admin/documents/' . $doc->id, [
            'judul' => $doc->judul,
            'kategori' => $doc->kategori,
            'tipe' => $doc->tipe,
            'visibility' => $doc->visibility,
            'status' => $doc->status,
            'main_file' => $file1,
            'attachments' => [$file2],
        ]);

        // Manually delete one physical file from fake disk
        $att = $doc->files()->where('category', 'attachment')->first();
        Storage::disk('local')->delete($att->stored_path);

        // ZIP download should still complete if ZipArchive exists, or redirect back if not
        $response = $this->get("/documents/{$doc->id}/download-zip");

        if (class_exists(\ZipArchive::class)) {
            $response->assertStatus(200);
        } else {
            $response->assertStatus(302);
        }
    }

    /**
     * 22. Temporary ZIP terhapus setelah dikirim.
     */
    public function test_temporary_zip_is_deleted_after_download()
    {
        $doc = $this->createDocument();
        $file = UploadedFile::fake()->create('doc.pdf', 100);

        $this->actingAs($this->admin)->put('/admin/documents/' . $doc->id, [
            'judul' => $doc->judul,
            'kategori' => $doc->kategori,
            'tipe' => $doc->tipe,
            'visibility' => $doc->visibility,
            'status' => $doc->status,
            'main_file' => $file,
        ]);

        $response = $this->get("/documents/{$doc->id}/download-zip");

        if (class_exists(\ZipArchive::class)) {
            $response->assertStatus(200);
            $tempPath = storage_path('app/temp-downloads');
            $files = glob($tempPath . '/*.zip');
            $this->assertEmpty($files, 'Temporary zip files should be cleaned up.');
        } else {
            $response->assertStatus(302);
        }
    }

    /**
     * 23. ZipArchive yang tidak tersedia tidak menghasilkan error 500.
     */
    public function test_zip_archive_unavailable_returns_friendly_error()
    {
        $doc = $this->createDocument();
        $file = UploadedFile::fake()->create('doc.pdf', 100);

        $this->actingAs($this->admin)->put('/admin/documents/' . $doc->id, [
            'judul' => $doc->judul,
            'kategori' => $doc->kategori,
            'tipe' => $doc->tipe,
            'visibility' => $doc->visibility,
            'status' => $doc->status,
            'main_file' => $file,
        ]);

        $response = $this->get("/documents/{$doc->id}/download-zip");

        if (! class_exists(\ZipArchive::class)) {
            // Must redirect to previous page with error session instead of 500 error page
            $response->assertStatus(302);
            $response->assertSessionHas('error');
        } else {
            $response->assertStatus(200);
        }
    }
}
