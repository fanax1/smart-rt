<?php

namespace Database\Seeders;

use App\Models\Hunian;
use App\Models\KartuKeluarga;
use App\Models\Pengaduan;
use App\Models\PengaduanFile;
use App\Models\User;
use App\Models\Warga;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PengaduanSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ensure Admin User exists for comments/status updates
        $adminUser = User::where('role', 'admin')->first();
        if (!$adminUser) {
            $adminUser = User::create([
                'name' => 'Admin RT',
                'email' => 'admin@smart-rt.test',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'is_active' => true,
            ]);
        }

        // Wargas will be loaded from DB after templates definition

        // 3. Define complaints templates
        $complaintTemplates = [
            [
                'judul' => 'Jalanan Berlubang di Dekat Pos Satpam',
                'kategori' => 'lingkungan',
                'prioritas' => 'tinggi',
                'status' => 'diproses',
                'lokasi' => 'Dekat Pos Satpam Utama Blok A',
                'deskripsi' => "Jalan masuk utama berlubang cukup dalam dan lebar. Hal ini sangat membahayakan pengendara sepeda motor khususnya saat malam hari karena penerangan minim atau saat hujan ketika lubang tertutup genangan air.\n\nMohon pengurus RT segera mengoordinasikan perbaikan jalan sebelum memakan korban jatuh lagi.",
                'catatan_admin' => 'Laporan diterima. Jadwal pengerjaan tambal sulam jalan berlubang akan dilaksanakan pada hari Sabtu akhir pekan ini secara bergotong royong oleh warga.',
                'image_url' => 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80',
                'tanggapans' => [
                    ['status_from' => 'diajukan', 'status_to' => 'diproses', 'pesan' => 'Laporan diterima dan divalidasi oleh Admin RT. Status diubah menjadi sedang ditindaklanjuti.', 'is_admin' => true],
                ],
                'days_ago' => 5,
            ],
            [
                'judul' => 'Penumpukan Sampah Liar di Pojokan Lapangan Voli',
                'kategori' => 'lingkungan',
                'prioritas' => 'sedang',
                'status' => 'diajukan',
                'lokasi' => 'Area pojok Lapangan Voli RT 04',
                'deskripsi' => "Ada oknum yang membuang tumpukan sampah plastik berisi sisa makanan rumah tangga di area pojokan lapangan voli. Baunya sudah sangat menyengat dan mengundang banyak lalat, sangat mengganggu warga dan anak-anak yang bermain.\n\nPerlu dibersihkan segera dan dipasang papan larangan membuang sampah.",
                'image_url' => 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80',
                'tanggapans' => [],
                'days_ago' => 1,
            ],
            [
                'judul' => 'Lampu Penerangan Jalan Umum (PJU) Blok B Mati',
                'kategori' => 'fasilitas',
                'prioritas' => 'sedang',
                'status' => 'selesai',
                'lokasi' => 'Depan Rumah No. 12 Blok B',
                'deskripsi' => "Lampu jalan penerangan umum di tiang listrik depan Rumah No. 12 Blok B mati total sejak 3 hari yang lalu. Kondisi gang menjadi sangat gelap gulita di malam hari. Mohon diganti bohlamnya agar warga merasa aman dari potensi kerawanan.",
                'catatan_admin' => 'Petugas keamanan RT sudah mengganti bohlam PJU yang mati dengan lampu LED 20 Watt baru yang lebih terang. Kendala selesai.',
                'image_url' => 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?auto=format&fit=crop&w=600&q=80',
                'tanggapans' => [
                    ['status_from' => 'diajukan', 'status_to' => 'diproses', 'pesan' => 'Pengurus RT sedang mengecek ketersediaan stok bohlam lampu baru di gudang logistik.', 'is_admin' => true],
                    ['status_from' => 'diproses', 'status_to' => 'selesai', 'pesan' => 'Penggantian lampu selesai dikerjakan oleh petugas keamanan dan kebersihan RT.', 'is_admin' => true],
                ],
                'days_ago' => 8,
            ],
            [
                'judul' => 'Genangan Air Akibat Got Saluran Air Sumbat',
                'kategori' => 'lingkungan',
                'prioritas' => 'tinggi',
                'status' => 'diproses',
                'lokasi' => 'Got saluran air Blok C gang 3',
                'deskripsi' => "Got saluran air tersumbat sampah plastik dan sedimen lumpur yang sudah sangat tebal. Air got tidak mengalir lancar dan meluap ke jalan setiap kali terjadi hujan lebat. Air yang tergenang juga menjadi sarang nyamuk jentik-jentik.\n\nMohon diagendakan kerja bakti pengurasan parit/got secepatnya.",
                'catatan_admin' => 'Aduan diterima. Telah dikoordinasikan untuk pengurasan got gotong royong warga pada hari Minggu besok pukul 07.30 WIB.',
                'image_url' => 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80',
                'tanggapans' => [
                    ['status_from' => 'diajukan', 'status_to' => 'diproses', 'pesan' => 'Aduan dikoordinasikan dengan koordinator seksi lingkungan RT untuk agenda kerja bakti.', 'is_admin' => true],
                ],
                'days_ago' => 3,
            ],
            [
                'judul' => 'Kucing Liar Masuk ke Plafon dan Mati Terjebak',
                'kategori' => 'lingkungan',
                'prioritas' => 'rendah',
                'status' => 'selesai',
                'lokasi' => 'Plafon garasi rumah warga',
                'deskripsi' => 'Ada bau bangkai menyengat di sekitar area garasi. Setelah diperiksa seksama, ternyata terdapat bangkai kucing di dalam celah plafon yang sulit dijangkau. Mohon bantuan petugas kebersihan RT untuk mengevakuasi bangkai tersebut.',
                'catatan_admin' => 'Bangkai kucing liar telah berhasil dievakuasi oleh tim kebersihan RT dan dikuburkan dengan layak di lahan kosong belakang perumahan.',
                'image_url' => null,
                'tanggapans' => [
                    ['status_from' => 'diajukan', 'status_to' => 'selesai', 'pesan' => 'Tim kebersihan RT langsung meluncur ke lokasi untuk mengevakuasi bangkai kucing liar tersebut.', 'is_admin' => true],
                ],
                'days_ago' => 10,
            ],
        ];

        // 4. Clean up existing complaints, files, and comments to prevent duplication
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        \App\Models\PengaduanFile::query()->truncate();
        \App\Models\PengaduanTanggapan::query()->truncate();
        Pengaduan::query()->truncate();
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Delete test user and warga Fatkhur Rohman if they exist
        $testWarga = Warga::where('nama_lengkap', 'Fatkhur Rohman')->first();
        if ($testWarga) {
            User::where('warga_id', $testWarga->id)->delete();
            $testWarga->delete();
        }

        // Fetch wargas with user accounts
        $wargas = Warga::has('user')->get();
        if ($wargas->isEmpty()) {
            return;
        }

        // 5. Create complaints distributed among wargas
        foreach ($complaintTemplates as $index => $tpl) {
            $warga = $wargas->get($index % $wargas->count());
            if (!$warga) continue;

            $wargaUser = User::where('warga_id', $warga->id)->first();
            $createdBy = $wargaUser ? $wargaUser->id : $adminUser->id;

            // Generate unique complaint number
            $dateStr = now()->subDays($tpl['days_ago'])->format('Ymd');
            do {
                $seq = str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
                $nomor = "ADU-{$dateStr}-{$seq}";
            } while (Pengaduan::where('nomor_pengaduan', $nomor)->exists());

            // Dates calculation
            $tanggalPengaduan = now()->subDays($tpl['days_ago']);
            $tanggalDiproses = $tpl['status'] !== 'diajukan' ? $tanggalPengaduan->copy()->addHours(6) : null;
            $tanggalSelesai = $tpl['status'] === 'selesai' ? $tanggalPengaduan->copy()->addDays(1) : null;

            // Determine if confirmed
            $isConfirmed = in_array($tpl['status'], ['diproses', 'selesai']);

            // Create the complaint
            $pengaduan = Pengaduan::create([
                'nomor_pengaduan' => $nomor,
                'warga_id' => $warga->id,
                'kartu_keluarga_id' => $warga->kartu_keluarga_id,
                'hunian_id' => $warga->hunian_id,
                'judul' => $tpl['judul'],
                'kategori' => $tpl['kategori'],
                'prioritas' => $tpl['prioritas'],
                'lokasi' => $tpl['lokasi'],
                'deskripsi' => $tpl['deskripsi'],
                'is_private' => false,
                'is_archived' => false,
                'is_confirmed' => $isConfirmed,
                'status' => $tpl['status'],
                'catatan_admin' => $tpl['catatan_admin'] ?? null,
                'tanggal_pengaduan' => $tanggalPengaduan,
                'tanggal_diproses' => $tanggalDiproses,
                'tanggal_selesai' => $tanggalSelesai,
                'created_by' => $createdBy,
                'updated_by' => $adminUser->id,
                'resolved_by' => $tpl['status'] === 'selesai' ? $adminUser->id : null,
            ]);

            // Create tanggapans logs
            // Initial creation log
            $pengaduan->tanggapans()->create([
                'user_id' => $createdBy,
                'status_from' => null,
                'status_to' => 'diajukan',
                'pesan' => 'Laporan pengaduan diajukan oleh warga.',
                'is_admin' => false,
                'created_at' => $tanggalPengaduan,
            ]);

            // Additional transition logs
            foreach ($tpl['tanggapans'] as $t) {
                $timestamp = $t['status_to'] === 'diproses' ? $tanggalDiproses : $tanggalSelesai;
                $pengaduan->tanggapans()->create([
                    'user_id' => $adminUser->id,
                    'status_from' => $t['status_from'],
                    'status_to' => $t['status_to'],
                    'pesan' => $t['pesan'],
                    'is_admin' => $t['is_admin'],
                    'created_at' => $timestamp,
                ]);
            }

            // Handle file attachment if template has an image_url
            if ($tpl['image_url']) {
                $filename = null;
                
                // Attempt to download Unsplash image to make it look super realistic
                try {
                    $imgResponse = Http::timeout(5)->get($tpl['image_url']);
                    if ($imgResponse->successful()) {
                        $filename = 'seeder_' . Str::random(20) . '.jpg';
                        Storage::disk('public')->put('pengaduan/warga/' . $filename, $imgResponse->body());
                    }
                } catch (\Exception $e) {
                    // Suppress exception
                }

                // Fallback to local files if download failed or timed out
                if (!$filename) {
                    $localFiles = glob(storage_path('app/public/pengaduan/warga/*.*'));
                    if (!empty($localFiles)) {
                        $randomFile = $localFiles[array_rand($localFiles)];
                        $filename = basename($randomFile);
                    } else {
                        // Absolute fallback string
                        $filename = 'placeholder.jpg';
                    }
                }

                // Create database entry for the file attachment
                PengaduanFile::create([
                    'pengaduan_id' => $pengaduan->id,
                    'label' => 'Bukti Foto Kejadian',
                    'original_name' => 'bukti_kejadian_' . strtolower(Str::slug($tpl['kategori'])) . '.jpg',
                    'path' => 'pengaduan/warga/' . $filename,
                    'mime_type' => 'image/jpeg',
                    'size' => 102400, // mock size 100KB
                    'is_admin_file' => false,
                ]);
            }
        }
    }
}
