<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Pengaduan;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ComplaintPrivacyTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        // Force local mysql database for verification on seeded data
        config([
            'database.default' => 'mysql',
            'database.connections.mysql.database' => 'smart_rt',
            'database.connections.mysql.username' => 'root',
            'database.connections.mysql.password' => '',
        ]);
        \Illuminate\Support\Facades\DB::purge();
    }

    public function test_complaint_privacy_flow()
    {
        // 1. Find the citizen user (FATKHUR ROHMAN, email: rohmanftr@gmail.com)
        $citizen = User::where('email', 'rohmanftr@gmail.com')->first();
        $this->assertNotNull($citizen, 'Citizen user not found in seeded database.');

        // Verify citizen has warga relation
        $warga = $citizen->warga;
        $this->assertNotNull($warga, 'Citizen user does not have a linked warga record.');

        $publicTitle = 'Test Public Complaint ' . uniqid();
        $privateTitle = 'Test Private Complaint ' . uniqid();

        // 2. Submit a Public Complaint (is_private = 0 / false)
        $publicResponse = $this->actingAs($citizen)->post('/warga/pengaduan', [
            'judul' => $publicTitle,
            'kategori' => 'lingkungan',
            'prioritas' => 'sedang',
            'lokasi' => 'Taman RT',
            'deskripsi' => 'Ini adalah aduan publik untuk pengujian.',
            'is_private' => '0', // string false/0 is cast to boolean false
        ]);

        $publicResponse->assertRedirect();
        
        // Assert stored in DB
        $publicComplaint = Pengaduan::where('judul', $publicTitle)->first();
        $this->assertNotNull($publicComplaint);
        $this->assertFalse((bool)$publicComplaint->is_private, 'Public complaint is_private should be false');
        $this->assertEquals('diajukan', $publicComplaint->status);

        // 3. Submit a Private Complaint (is_private = 1 / true)
        $privateResponse = $this->actingAs($citizen)->post('/warga/pengaduan', [
            'judul' => $privateTitle,
            'kategori' => 'keamanan',
            'prioritas' => 'tinggi',
            'lokasi' => 'Depan Rumah',
            'deskripsi' => 'Ini adalah aduan rahasia untuk pengujian.',
            'is_private' => '1', // string true/1 is cast to boolean true
        ]);

        $privateResponse->assertRedirect();

        $privateComplaint = Pengaduan::where('judul', $privateTitle)->first();
        $this->assertNotNull($privateComplaint);
        $this->assertTrue((bool)$privateComplaint->is_private, 'Private complaint is_private should be true');
        $this->assertEquals('diajukan', $privateComplaint->status);

        // 4. Verify that neither complaint is on the public homepage yet (since they are 'diajukan', not 'diproses'/'selesai')
        $homeResponse = $this->get('/');
        $homeResponse->assertStatus(200);
        
        // Inertia components return their props. We can extract props using page() method on the test response.
        $complaints = $homeResponse->original->getData()['page']['props']['complaints'] ?? [];
        
        $publicIds = collect($complaints)->pluck('id')->toArray();
        $this->assertNotContains($publicComplaint->id, $publicIds, 'Public complaint with status diajukan should not show on homepage');
        $this->assertNotContains($privateComplaint->id, $publicIds, 'Private complaint with status diajukan should not show on homepage');

        // 5. Log in as admin and process both complaints
        $admin = User::where('email', 'admin@gmail.com')->first();
        $this->assertNotNull($admin, 'Admin user not found in seeded database.');

        // Update Public Complaint to "diproses"
        $updatePublicResponse = $this->actingAs($admin)->patch("/admin/complaints/{$publicComplaint->id}/status", [
            'status' => 'diproses',
            'catatan_admin' => 'Aduan publik sedang diproses oleh RT.',
        ]);
        $updatePublicResponse->assertRedirect();
        
        $publicComplaint->refresh();
        $this->assertEquals('diproses', $publicComplaint->status);

        // Update Private Complaint to "diproses"
        $updatePrivateResponse = $this->actingAs($admin)->patch("/admin/complaints/{$privateComplaint->id}/status", [
            'status' => 'diproses',
            'catatan_admin' => 'Aduan private sedang diproses oleh RT.',
        ]);
        $updatePrivateResponse->assertRedirect();

        $privateComplaint->refresh();
        $this->assertEquals('diproses', $privateComplaint->status);

        // 6. Verify homepage listing again.
        // Only the PUBLIC complaint with status 'diproses' should be visible.
        // The PRIVATE complaint with status 'diproses' should NOT be visible.
        $homeResponseAfter = $this->actingAs($citizen)->get('/');
        $homeResponseAfter->assertStatus(200);

        $complaintsAfter = $homeResponseAfter->original->getData()['page']['props']['complaints'] ?? [];
        $idsAfter = collect($complaintsAfter)->pluck('id')->toArray();

        $this->assertContains($publicComplaint->id, $idsAfter, 'Public complaint with status diproses should be visible on homepage');
        $this->assertNotContains($privateComplaint->id, $idsAfter, 'Private complaint with status diproses should NOT be visible on homepage');

        // 7. Update Public Complaint to "selesai" (finished)
        $completePublicResponse = $this->actingAs($admin)->patch("/admin/complaints/{$publicComplaint->id}/status", [
            'status' => 'selesai',
            'catatan_admin' => 'Aduan publik selesai ditindaklanjuti.',
        ]);
        $completePublicResponse->assertRedirect();
        
        $publicComplaint->refresh();
        $this->assertEquals('selesai', $publicComplaint->status);

        // Verify homepage listing again: completed public complaint should also show up!
        $homeResponseSelesai = $this->actingAs($citizen)->get('/');
        $homeResponseSelesai->assertStatus(200);

        $complaintsSelesai = $homeResponseSelesai->original->getData()['page']['props']['complaints'] ?? [];
        $idsSelesai = collect($complaintsSelesai)->pluck('id')->toArray();

        $this->assertContains($publicComplaint->id, $idsSelesai, 'Public complaint with status selesai should be visible on homepage');

        // 8. Test Archiving: Archive the completed public complaint
        $archiveResponse = $this->actingAs($admin)->patch("/admin/complaints/{$publicComplaint->id}/archive");
        $archiveResponse->assertRedirect();

        $publicComplaint->refresh();
        $this->assertTrue((bool)$publicComplaint->is_archived, 'Complaint should be archived now');

        // Verify homepage listing again: archived public complaint should NOT show up anymore!
        $homeResponseArchived = $this->actingAs($citizen)->get('/');
        $homeResponseArchived->assertStatus(200);

        $complaintsArchived = $homeResponseArchived->original->getData()['page']['props']['complaints'] ?? [];
        $idsArchived = collect($complaintsArchived)->pluck('id')->toArray();

        $this->assertNotContains($publicComplaint->id, $idsArchived, 'Archived public complaint should NOT be visible on homepage');

        // 9. Test Unarchiving: Toggle archive back to false
        $unarchiveResponse = $this->actingAs($admin)->patch("/admin/complaints/{$publicComplaint->id}/archive");
        $unarchiveResponse->assertRedirect();

        $publicComplaint->refresh();
        $this->assertFalse((bool)$publicComplaint->is_archived, 'Complaint should be unarchived now');

        // Verify homepage: public complaint should show up again!
        $homeResponseUnarchived = $this->actingAs($citizen)->get('/');
        $homeResponseUnarchived->assertStatus(200);

        $complaintsUnarchived = $homeResponseUnarchived->original->getData()['page']['props']['complaints'] ?? [];
        $idsUnarchived = collect($complaintsUnarchived)->pluck('id')->toArray();

        $this->assertContains($publicComplaint->id, $idsUnarchived, 'Unarchived public complaint should be visible on homepage again');
    }
}
