<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\RtSetting;
use App\Models\Pengumuman;
use App\Models\Kegiatan;
use App\Models\IuranKomponen;
use App\Models\IuranPembayaran;
use App\Models\FinanceTransaction;
use App\Models\KartuKeluarga;
use App\Models\Dokumen;
use App\Models\DokumenFile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class AdminContentSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Get Admin User
        $adminUser = User::where('role', 'admin')->first();
        $adminId = $adminUser ? $adminUser->id : 1;

        // 2. Seed RtSetting
        $settings = [
            'rt_name' => 'RT 004',
            'rt_number' => '004',
            'rw_number' => '005',
            'kelurahan' => 'BAHAGIA',
            'kecamatan' => 'BABELAN',
            'kota' => 'BEKASI',
            'provinsi' => 'JAWA BARAT',
            'alamat_kantor' => 'Kantor Sekretariat RT 004, KP UJUNG HARAPAN RW 005, KEL.BAHAGIA, KEC. BABELAN, BEKASI',
            'telepon_rt' => '08128149448',
            'email_rt' => 'rt004bahagia@gmail.com',
            'site_name' => 'SMART-RT 004',
            'tagline' => 'Kerukunan & Kebersamaan Warga',
            'deskripsi' => 'Portal resmi warga RT 004 / RW 005 Kelurahan Bahagia, Kecamatan Babelan, Bekasi. Mempermudah administrasi, pengaduan, dan iuran warga.',
            'warna_aksen' => '#10B981',
            'footer_text' => 'RT 004 / RW 005 Kelurahan Bahagia, Babelan, Bekasi',
            'copyright' => '© 2026 SMART-RT 004',
            'wa_link' => 'https://chat.whatsapp.com/rt004bahagia',
            'instagram' => 'https://instagram.com/rt004.bahagia',
            'facebook' => 'https://facebook.com/rt004.bahagia',
            'youtube' => 'https://youtube.com/rt004.bahagia',
            'email_publik' => 'rt004bahagia@gmail.com',
        ];

        foreach ($settings as $key => $value) {
            RtSetting::where('key', $key)->update(['value' => $value]);
        }

        // 3. Seed Pengumuman
        // Clear old ones first to prevent duplication
        Pengumuman::query()->delete();
        $announcements = [
            [
                'judul' => 'Kerja Bakti Massal Kebersihan Lingkungan RT 004',
                'isi' => 'Diberitahukan kepada seluruh warga RT 004/RW 005 Kelurahan Bahagia bahwa akan diadakan kegiatan Kerja Bakti Massal pada hari Minggu, 28 Juni 2026 pukul 07.30 WIB. Titik kumpul di depan Pos Satpam Utama. Agenda utama meliputi pembersihan got/saluran air, perapihan tanaman liar, dan pembersihan pojok lapangan voli dari tumpukan sampah. Mohon partisipasi dan kehadiran seluruh kepala keluarga demi kenyamanan lingkungan bersama.',
                'kategori' => 'Jadwal',
                'target_audiens' => 'semua',
                'status' => 'published',
                'published_at' => Carbon::now()->subDays(1),
                'created_by' => $adminId,
            ],
            [
                'judul' => 'Pengingat Pembayaran Iuran Warga Bulanan - Periode Juni 2026',
                'isi' => 'Bapak/Ibu warga RT 004, kami mengingatkan kembali untuk pembayaran iuran bulanan (Kebersihan, Keamanan, dan Kas RT) periode Juni 2026. Pembayaran dapat dilakukan secara tunai ke bendahara RT or transfer ke rekening RT. Bagi warga yang melakukan transfer, mohon untuk mengunggah bukti transfer di halaman Iuran portal SMART-RT agar dapat diverifikasi oleh admin. Terima kasih atas kontribusi aktif Anda dalam membangun lingkungan yang bersih dan aman.',
                'kategori' => 'Lainnya',
                'target_audiens' => 'semua',
                'status' => 'published',
                'published_at' => Carbon::now()->subDays(5),
                'created_by' => $adminId,
            ],
            [
                'judul' => 'Laporan Keuangan Kas RT004 Periode Mei 2026',
                'isi' => 'Pengurus RT 004 menyampaikan laporan pertanggungjawaban keuangan kas RT periode bulan Mei 2026. Total Penerimaan Kas: Rp 1.850.000, Total Pengeluaran Kas (PJU, Sampah, Alat Tulis): Rp 1.200.000, Saldo Kas Akhir Mei: Rp 650.000. Detail laporan dalam bentuk PDF dapat diunduh pada menu Dokumentasi di portal SMART-RT. Transparansi keuangan adalah komitmen kami untuk kenyamanan dan kepercayaan warga.',
                'kategori' => 'Laporan Keuangan',
                'target_audiens' => 'semua',
                'status' => 'published',
                'published_at' => Carbon::now()->subDays(10),
                'created_by' => $adminId,
            ],
            [
                'judul' => 'Himbauan Keamanan Lingkungan dan Ketertiban Parkir',
                'isi' => "Menyikapi perkembangan situasi keamanan di wilayah sekitar, pengurus RT 004 menghimbau kepada seluruh warga untuk:\n1. Selalu mengunci ganda kendaraan bermotor Anda saat diparkir.\n2. Tidak memarkir mobil di bahu jalan gang utama yang dapat mengganggu akses mobil pemadam kebakaran atau ambulans.\n3. Segera laporkan kepada petugas keamanan RT jika melihat ada orang yang mencurigakan di area RT 004.\n\nMari kita jaga bersama keamanan lingkungan kita.",
                'kategori' => 'Peraturan RT',
                'target_audiens' => 'semua',
                'status' => 'published',
                'published_at' => Carbon::now()->subDays(12),
                'created_by' => $adminId,
            ],
        ];

        foreach ($announcements as $ann) {
            Pengumuman::create($ann);
        }

        // 4. Seed Kegiatan
        Kegiatan::query()->delete();
        $activities = [
            [
                'judul' => 'Kerja Bakti Kebersihan Lingkungan RT 004',
                'tanggal' => Carbon::now()->addDays(2)->toDateString(),
                'jam_mulai' => '07:30:00',
                'jam_selesai' => '11:30:00',
                'lokasi' => 'Lingkungan RT 004, Kp Ujung Harapan',
                'kategori' => 'Kerja Bakti',
                'memerlukan_dana' => true,
                'estimasi_biaya' => 150000.00,
                'status_kegiatan' => 'Disetujui',
                'deskripsi' => 'Membersihkan saluran got/drainase utama, perapihan dahan pohon liar, dan membersihkan tumpukan sampah di sekitar lapangan voli.',
                'penanggung_jawab' => 'Budi Rohman',
                'target_peserta' => 50,
                'wajib_hadir' => true,
                'sumber_dana' => 'Kas RT',
                'penanggung_jawab_dana' => 'Bendahara RT',
                'catatan_anggaran' => 'Konsumsi (snack + minum) Rp 100.000, Kantong sampah besar & sapu lidi Rp 50.000.',
            ],
            [
                'judul' => 'Rapat Bulanan Pengurus RT 004',
                'tanggal' => Carbon::now()->addDays(8)->toDateString(),
                'jam_mulai' => '19:30:00',
                'jam_selesai' => '22:00:00',
                'lokasi' => 'Balai Warga RT 004',
                'kategori' => 'Rapat Warga',
                'memerlukan_dana' => false,
                'estimasi_biaya' => 0.00,
                'status_kegiatan' => 'Disetujui',
                'deskripsi' => 'Evaluasi kinerja bulanan petugas keamanan dan kebersihan, koordinasi persiapan perlombaan HUT RI ke-81.',
                'penanggung_jawab' => 'Fatkhur Rohman',
                'target_peserta' => 15,
                'wajib_hadir' => false,
            ],
            [
                'judul' => 'Pesta Rakyat Hari Kemerdekaan RI ke-81',
                'tanggal' => Carbon::now()->addDays(52)->toDateString(),
                'jam_mulai' => '08:00:00',
                'jam_selesai' => '17:00:00',
                'lokasi' => 'Lapangan Voli RT 004',
                'kategori' => 'Perayaan',
                'memerlukan_dana' => true,
                'estimasi_biaya' => 1200000.00,
                'status_kegiatan' => 'Draft',
                'deskripsi' => 'Berbagai perlombaan anak-anak (balap karung, makan kerupuk, kelereng) dan perlombaan dewasa (voli, catur), ditutup dengan pembagian hadiah.',
                'penanggung_jawab' => 'Hendra Wijaya',
                'target_peserta' => 100,
                'wajib_hadir' => false,
                'sumber_dana' => 'Iuran Warga & Sponsor',
                'penanggung_jawab_dana' => 'Panitia Agustusan',
                'catatan_anggaran' => 'Hadiah lomba Rp 800.000, Sewa tenda & sound system Rp 400.000.',
            ],
        ];

        foreach ($activities as $act) {
            Kegiatan::create($act);
        }

        // 5. Seed IuranKomponen
        IuranKomponen::query()->delete();
        $components = [
            [
                'nama' => 'Iuran Kebersihan',
                'nominal' => 20000.00,
                'keterangan' => 'Pengangkutan sampah rumah tangga mingguan',
                'urutan' => 1,
                'is_active' => true,
            ],
            [
                'nama' => 'Iuran Keamanan',
                'nominal' => 25000.00,
                'keterangan' => 'Honor petugas keamanan & pemeliharaan pos ronda',
                'urutan' => 2,
                'is_active' => true,
            ],
            [
                'nama' => 'Iuran Kas RT',
                'nominal' => 10000.00,
                'keterangan' => 'Dana sosial kemasyarakatan & kas RT',
                'urutan' => 3,
                'is_active' => true,
            ],
        ];

        foreach ($components as $comp) {
            IuranKomponen::create($comp);
        }

        // 6. Seed IuranPembayaran
        IuranPembayaran::query()->delete();
        FinanceTransaction::query()->delete(); // Clear so we rebuild synced transactions

        $families = KartuKeluarga::all();
        $monthsToSeed = [
            Carbon::now()->subMonth()->startOfMonth(), // May
            Carbon::now()->startOfMonth(),             // June
        ];

        foreach ($families as $kk) {
            foreach ($monthsToSeed as $period) {
                // Determine payment characteristics
                $dateOffset = rand(1, 10);
                $payDate = (clone $period)->addDays($dateOffset);
                $methods = ['Tunai', 'Transfer Bank', 'E-Wallet'];
                $method = $methods[$kk->id % count($methods)];
                
                $payment = IuranPembayaran::create([
                    'kartu_keluarga_id' => $kk->id,
                    'periode' => $period->toDateString(),
                    'jumlah_dibayar' => 55000.00,
                    'tanggal_bayar' => $payDate->toDateString(),
                    'metode_pembayaran' => $method,
                    'status_verifikasi' => 'verified',
                    'bukti_pembayaran' => $method === 'Transfer Bank' ? 'iuran/bukti-pembayaran/dummy_receipt.jpg' : null,
                    'catatan' => 'Lunas iuran bulanan',
                    'created_by' => $adminId,
                    'verified_by' => $adminId,
                    'verified_at' => $payDate->addHours(2),
                ]);

                // Create a finance transaction to match
                FinanceTransaction::create([
                    'tipe' => 'pemasukan',
                    'kategori' => 'Iuran',
                    'jumlah' => 55000.00,
                    'deskripsi' => 'Pembayaran Iuran Warga - Rumah No. ' . ($kk->hunian?->no_rumah ?? '-') . ' (' . $kk->nama_kepala_keluarga . ')',
                    'tanggal' => $payment->tanggal_bayar,
                    'status' => 'Berhasil',
                    'created_by' => $adminId,
                ]);
            }
        }

        // Seed a few expense transactions to make the dashboard look like a real running RT
        $expenses = [
            [
                'tipe' => 'pengeluaran',
                'kategori' => 'Keamanan',
                'jumlah' => 350000.00,
                'deskripsi' => 'Honor Petugas Keamanan Periode Mei 2026',
                'tanggal' => Carbon::now()->subMonth()->startOfMonth()->addDays(28)->toDateString(),
            ],
            [
                'tipe' => 'pengeluaran',
                'kategori' => 'Kebersihan',
                'jumlah' => 300000.00,
                'deskripsi' => 'Biaya Pembuangan Sampah TPA Periode Mei 2026',
                'tanggal' => Carbon::now()->subMonth()->startOfMonth()->addDays(28)->toDateString(),
            ],
            [
                'tipe' => 'pengeluaran',
                'kategori' => 'Keamanan',
                'jumlah' => 350000.00,
                'deskripsi' => 'Honor Petugas Keamanan Periode Juni 2026',
                'tanggal' => Carbon::now()->startOfMonth()->addDays(25)->toDateString(),
            ],
            [
                'tipe' => 'pengeluaran',
                'kategori' => 'Fasilitas',
                'jumlah' => 120000.00,
                'deskripsi' => 'Pembelian Bohlam Lampu PJU Blok B yang Mati',
                'tanggal' => Carbon::now()->subDays(7)->toDateString(),
            ],
        ];

        foreach ($expenses as $exp) {
            FinanceTransaction::create(array_merge($exp, [
                'status' => 'Berhasil',
                'created_by' => $adminId,
            ]));
        }

        // 7. Seed Dokumen & DokumenFile
        Dokumen::query()->delete();
        DokumenFile::query()->delete();

        $documents = [
            [
                'judul' => 'Surat Keputusan Susunan Pengurus RT 004 Periode 2026-2029',
                'slug' => 'sk-susunan-pengurus-rt-004-periode-2026-2029',
                'deskripsi' => 'Dokumen resmi penetapan susunan pengurus Rukun Tetangga (RT) 004 RW 005 Kelurahan Bahagia.',
                'kategori' => 'Struktur Pengurus',
                'tipe' => 'manual_upload',
                'visibility' => 'publik',
                'status' => 'published',
                'periode_bulan' => 6,
                'periode_tahun' => 2026,
                'published_at' => Carbon::now()->subDays(20),
                'created_by' => $adminId,
                'file_name' => 'sk_pengurus_rt_004.pdf',
                'file_path' => 'dokumen-rt/sk_pengurus_rt_004.pdf',
            ],
            [
                'judul' => 'Laporan Pertanggungjawaban Keuangan RT 004 Bulan Mei 2026',
                'slug' => 'laporan-pertanggungjawaban-keuangan-rt-004-bulan-mei-2026',
                'deskripsi' => 'Laporan kas RT terperinci mencakup pemasukan dari iuran warga dan pengeluaran operasional RT sepanjang Mei 2026.',
                'kategori' => 'Laporan Keuangan',
                'tipe' => 'manual_upload',
                'visibility' => 'publik',
                'status' => 'published',
                'periode_bulan' => 5,
                'periode_tahun' => 2026,
                'published_at' => Carbon::now()->subDays(10),
                'created_by' => $adminId,
                'file_name' => 'laporan_keuangan_mei_2026.pdf',
                'file_path' => 'dokumen-rt/laporan_keuangan_mei_2026.pdf',
            ],
            [
                'judul' => 'Formulir Pelaporan Warga Baru RT 004',
                'slug' => 'formulir-pelaporan-warga-baru-rt-004',
                'deskripsi' => 'Formulir kosong yang wajib diisi oleh warga baru yang pindah masuk ke lingkungan RT 004.',
                'kategori' => 'Formulir',
                'tipe' => 'form_template',
                'visibility' => 'publik',
                'status' => 'published',
                'periode_bulan' => null,
                'periode_tahun' => null,
                'published_at' => Carbon::now()->subDays(15),
                'created_by' => $adminId,
                'file_name' => 'formulir_warga_baru.pdf',
                'file_path' => 'dokumen-rt/formulir_warga_baru.pdf',
            ]
        ];

        foreach ($documents as $doc) {
            $fileName = $doc['file_name'];
            $filePath = $doc['file_path'];
            
            unset($doc['file_name']);
            unset($doc['file_path']);

            $createdDoc = Dokumen::create($doc);

            // Put dummy file in disk
            Storage::disk('public')->put($filePath, 'Ini adalah file simulasi ' . $createdDoc->judul . '.');

            $createdDoc->files()->create([
                'original_name' => $fileName,
                'path' => $filePath,
                'mime_type' => 'application/pdf',
                'size' => 102400,
                'file_type' => 'main_file',
            ]);
        }
    }
}
