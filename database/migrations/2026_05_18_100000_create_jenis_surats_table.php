<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jenis_surats', function (Blueprint $table) {
            $table->id();
            $table->string('nama', 150);
            $table->string('kode', 50)->unique();
            $table->text('deskripsi')->nullable();
            $table->json('fields')->nullable();
            $table->json('upload_requirements')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('urutan')->default(0);
            $table->timestamps();

            $table->index('is_active');
            $table->index('urutan');
        });

        DB::table('jenis_surats')->insert($this->defaultJenisSurat());
    }

    public function down(): void
    {
        Schema::dropIfExists('jenis_surats');
    }

    private function defaultJenisSurat(): array
    {
        $now = now();

        return array_map(function (array $item) use ($now) {
            return [
                'nama' => $item['nama'],
                'kode' => $item['kode'],
                'deskripsi' => $item['deskripsi'],
                'fields' => json_encode($item['fields']),
                'upload_requirements' => json_encode($item['upload_requirements']),
                'is_active' => true,
                'urutan' => $item['urutan'],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }, [
            [
                'urutan' => 1,
                'kode' => 'DOMISILI',
                'nama' => 'Surat Keterangan Domisili',
                'deskripsi' => 'Surat keterangan tempat tinggal warga.',
                'fields' => [
                    ['name' => 'lama_tinggal', 'label' => 'Lama tinggal', 'type' => 'text', 'required' => true],
                    ['name' => 'status_rumah', 'label' => 'Status rumah', 'type' => 'select', 'required' => true, 'options' => ['Milik sendiri', 'Kontrak', 'Kos']],
                    ['name' => 'tujuan_pembuatan', 'label' => 'Tujuan pembuatan surat', 'type' => 'textarea', 'required' => true],
                ],
                'upload_requirements' => [
                    ['name' => 'bukti_tempat_tinggal', 'label' => 'Bukti tempat tinggal', 'required' => true],
                    ['name' => 'surat_kontrak', 'label' => 'Surat kontrak', 'required' => false],
                ],
            ],
            [
                'urutan' => 2,
                'kode' => 'PENGANTAR_RT_RW',
                'nama' => 'Surat Pengantar RT/RW',
                'deskripsi' => 'Surat pengantar umum untuk kebutuhan administrasi warga.',
                'fields' => [
                    ['name' => 'tujuan_pengantar', 'label' => 'Tujuan pengantar', 'type' => 'text', 'required' => true],
                    ['name' => 'instansi_tujuan', 'label' => 'Instansi tujuan', 'type' => 'text', 'required' => true],
                    ['name' => 'keperluan_surat', 'label' => 'Keperluan surat', 'type' => 'select', 'required' => true, 'options' => ['Pembuatan SKCK', 'Pengajuan kerja', 'BPJS', 'Kelurahan', 'Bank', 'Lainnya']],
                ],
                'upload_requirements' => [],
            ],
            [
                'urutan' => 3,
                'kode' => 'USAHA',
                'nama' => 'Surat Keterangan Usaha',
                'deskripsi' => 'Surat keterangan usaha milik warga.',
                'fields' => [
                    ['name' => 'nama_usaha', 'label' => 'Nama usaha', 'type' => 'text', 'required' => true],
                    ['name' => 'jenis_usaha', 'label' => 'Jenis usaha', 'type' => 'text', 'required' => true],
                    ['name' => 'alamat_usaha', 'label' => 'Alamat usaha', 'type' => 'textarea', 'required' => true],
                    ['name' => 'lama_usaha', 'label' => 'Lama usaha', 'type' => 'text', 'required' => true],
                    ['name' => 'omzet_perkiraan', 'label' => 'Omzet perkiraan', 'type' => 'number', 'required' => false],
                ],
                'upload_requirements' => [
                    ['name' => 'foto_usaha', 'label' => 'Foto usaha', 'required' => true],
                    ['name' => 'bukti_usaha', 'label' => 'Bukti usaha', 'required' => true],
                ],
            ],
            [
                'urutan' => 4,
                'kode' => 'TIDAK_MAMPU',
                'nama' => 'Surat Keterangan Tidak Mampu',
                'deskripsi' => 'Surat keterangan kondisi ekonomi warga.',
                'fields' => [
                    ['name' => 'penghasilan_per_bulan', 'label' => 'Penghasilan per bulan', 'type' => 'number', 'required' => true],
                    ['name' => 'jumlah_tanggungan', 'label' => 'Jumlah tanggungan', 'type' => 'number', 'required' => true],
                    ['name' => 'alasan_pengajuan', 'label' => 'Alasan pengajuan', 'type' => 'textarea', 'required' => true],
                    ['name' => 'keperluan_bantuan', 'label' => 'Keperluan bantuan', 'type' => 'textarea', 'required' => true],
                ],
                'upload_requirements' => [
                    ['name' => 'foto_rumah', 'label' => 'Foto rumah', 'required' => true],
                    ['name' => 'slip_gaji', 'label' => 'Slip gaji', 'required' => false],
                    ['name' => 'bukti_bantuan_sosial', 'label' => 'Bukti bantuan sosial', 'required' => true],
                ],
            ],
            [
                'urutan' => 5,
                'kode' => 'PINDAH',
                'nama' => 'Surat Keterangan Pindah',
                'deskripsi' => 'Surat keterangan pindah domisili.',
                'fields' => [
                    ['name' => 'alamat_tujuan_pindah', 'label' => 'Alamat tujuan pindah', 'type' => 'textarea', 'required' => true],
                    ['name' => 'alasan_pindah', 'label' => 'Alasan pindah', 'type' => 'textarea', 'required' => true],
                    ['name' => 'jumlah_anggota_ikut', 'label' => 'Jumlah anggota keluarga ikut pindah', 'type' => 'number', 'required' => true],
                    ['name' => 'tanggal_pindah', 'label' => 'Tanggal pindah', 'type' => 'date', 'required' => true],
                ],
                'upload_requirements' => [
                    ['name' => 'kk', 'label' => 'KK', 'required' => true],
                    ['name' => 'ktp_anggota', 'label' => 'KTP seluruh anggota keluarga', 'required' => true],
                ],
            ],
            [
                'urutan' => 6,
                'kode' => 'KEMATIAN',
                'nama' => 'Surat Keterangan Kematian',
                'deskripsi' => 'Surat keterangan kematian anggota keluarga/warga.',
                'fields' => [
                    ['name' => 'nama_almarhum', 'label' => 'Nama almarhum', 'type' => 'text', 'required' => true],
                    ['name' => 'tanggal_meninggal', 'label' => 'Tanggal meninggal', 'type' => 'date', 'required' => true],
                    ['name' => 'tempat_meninggal', 'label' => 'Tempat meninggal', 'type' => 'text', 'required' => true],
                    ['name' => 'penyebab_meninggal', 'label' => 'Penyebab meninggal', 'type' => 'textarea', 'required' => true],
                    ['name' => 'hubungan_pemohon', 'label' => 'Hubungan dengan pemohon', 'type' => 'text', 'required' => true],
                ],
                'upload_requirements' => [
                    ['name' => 'surat_rumah_sakit', 'label' => 'Surat rumah sakit', 'required' => true],
                    ['name' => 'ktp_almarhum', 'label' => 'KTP almarhum', 'required' => true],
                    ['name' => 'kk', 'label' => 'KK', 'required' => true],
                ],
            ],
            [
                'urutan' => 7,
                'kode' => 'BELUM_MENIKAH',
                'nama' => 'Surat Keterangan Belum Menikah',
                'deskripsi' => 'Surat keterangan status belum menikah.',
                'fields' => [
                    ['name' => 'keperluan_surat', 'label' => 'Keperluan surat', 'type' => 'textarea', 'required' => true],
                    ['name' => 'status_pernikahan', 'label' => 'Status pernikahan', 'type' => 'select', 'required' => true, 'options' => ['Belum menikah', 'Pernah menikah']],
                ],
                'upload_requirements' => [
                    ['name' => 'ktp', 'label' => 'KTP', 'required' => true],
                    ['name' => 'kk', 'label' => 'KK', 'required' => true],
                ],
            ],
            [
                'urutan' => 8,
                'kode' => 'IZIN_KERAMAIAN',
                'nama' => 'Surat Izin Keramaian',
                'deskripsi' => 'Surat pengantar izin keramaian atau kegiatan warga.',
                'fields' => [
                    ['name' => 'jenis_acara', 'label' => 'Jenis acara', 'type' => 'text', 'required' => true],
                    ['name' => 'lokasi_acara', 'label' => 'Lokasi acara', 'type' => 'textarea', 'required' => true],
                    ['name' => 'tanggal_acara', 'label' => 'Tanggal acara', 'type' => 'date', 'required' => true],
                    ['name' => 'jam_acara', 'label' => 'Jam acara', 'type' => 'time', 'required' => true],
                    ['name' => 'jumlah_peserta', 'label' => 'Jumlah peserta', 'type' => 'number', 'required' => true],
                ],
                'upload_requirements' => [
                    ['name' => 'proposal_acara', 'label' => 'Proposal acara', 'required' => false],
                ],
            ],
            [
                'urutan' => 9,
                'kode' => 'NIKAH',
                'nama' => 'Surat Pengantar Nikah',
                'deskripsi' => 'Surat pengantar nikah dari RT.',
                'fields' => [
                    ['name' => 'nama_pasangan', 'label' => 'Nama pasangan', 'type' => 'text', 'required' => true],
                    ['name' => 'tempat_menikah', 'label' => 'Tempat menikah', 'type' => 'text', 'required' => true],
                    ['name' => 'tanggal_menikah', 'label' => 'Tanggal menikah', 'type' => 'date', 'required' => true],
                ],
                'upload_requirements' => [
                    ['name' => 'ktp_kedua_pihak', 'label' => 'KTP kedua pihak', 'required' => true],
                    ['name' => 'kk', 'label' => 'KK', 'required' => true],
                    ['name' => 'pas_foto', 'label' => 'Pas foto', 'required' => true],
                ],
            ],
            [
                'urutan' => 10,
                'kode' => 'BANTUAN_SOSIAL',
                'nama' => 'Pengajuan Bantuan Sosial',
                'deskripsi' => 'Pengajuan rekomendasi/pendataan bantuan sosial.',
                'fields' => [
                    ['name' => 'jenis_bantuan', 'label' => 'Jenis bantuan', 'type' => 'text', 'required' => true],
                    ['name' => 'penghasilan_keluarga', 'label' => 'Penghasilan keluarga', 'type' => 'number', 'required' => true],
                    ['name' => 'jumlah_tanggungan', 'label' => 'Jumlah tanggungan', 'type' => 'number', 'required' => true],
                ],
                'upload_requirements' => [
                    ['name' => 'foto_rumah', 'label' => 'Foto rumah', 'required' => true],
                    ['name' => 'kartu_bantuan', 'label' => 'Kartu bantuan', 'required' => false],
                ],
            ],
            [
                'urutan' => 11,
                'kode' => 'PENGADUAN_WARGA',
                'nama' => 'Pengaduan Warga',
                'deskripsi' => 'Pengaduan masalah lingkungan atau pelayanan warga.',
                'fields' => [
                    ['name' => 'judul_pengaduan', 'label' => 'Judul pengaduan', 'type' => 'text', 'required' => true],
                    ['name' => 'deskripsi_masalah', 'label' => 'Deskripsi masalah', 'type' => 'textarea', 'required' => true],
                    ['name' => 'lokasi_kejadian', 'label' => 'Lokasi kejadian', 'type' => 'text', 'required' => true],
                    ['name' => 'tingkat_prioritas', 'label' => 'Tingkat prioritas', 'type' => 'select', 'required' => true, 'options' => ['Rendah', 'Sedang', 'Tinggi', 'Darurat']],
                ],
                'upload_requirements' => [
                    ['name' => 'foto_bukti', 'label' => 'Foto bukti', 'required' => false],
                    ['name' => 'video', 'label' => 'Video', 'required' => false],
                ],
            ],
            [
                'urutan' => 12,
                'kode' => 'RENOVASI',
                'nama' => 'Permohonan Izin Renovasi Rumah',
                'deskripsi' => 'Permohonan izin renovasi yang berdampak ke lingkungan sekitar.',
                'fields' => [
                    ['name' => 'jenis_renovasi', 'label' => 'Jenis renovasi', 'type' => 'text', 'required' => true],
                    ['name' => 'estimasi_waktu', 'label' => 'Estimasi waktu pengerjaan', 'type' => 'text', 'required' => true],
                    ['name' => 'dampak_lingkungan', 'label' => 'Dampak lingkungan', 'type' => 'textarea', 'required' => true],
                ],
                'upload_requirements' => [
                    ['name' => 'foto_rumah', 'label' => 'Foto rumah', 'required' => true],
                    ['name' => 'rencana_renovasi', 'label' => 'Rencana renovasi', 'required' => true],
                ],
            ],
            [
                'urutan' => 13,
                'kode' => 'PENDUDUK_SEMENTARA',
                'nama' => 'Pendataan Penduduk Sementara',
                'deskripsi' => 'Pendataan pendatang atau penghuni sementara di lingkungan RT.',
                'fields' => [
                    ['name' => 'nama_pendatang', 'label' => 'Nama pendatang', 'type' => 'text', 'required' => true],
                    ['name' => 'asal_daerah', 'label' => 'Asal daerah', 'type' => 'text', 'required' => true],
                    ['name' => 'lama_tinggal', 'label' => 'Lama tinggal', 'type' => 'text', 'required' => true],
                    ['name' => 'tujuan_tinggal', 'label' => 'Tujuan tinggal', 'type' => 'textarea', 'required' => true],
                ],
                'upload_requirements' => [
                    ['name' => 'ktp', 'label' => 'KTP', 'required' => true],
                    ['name' => 'surat_jaminan', 'label' => 'Surat jaminan', 'required' => true],
                ],
            ],
        ]);
    }
};
