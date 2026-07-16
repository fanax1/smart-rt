<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $requirements = [
            'DOMISILI' => [
                ['name' => 'ktp', 'label' => 'Scan KTP (Kartu Tanda Penduduk)', 'required' => true],
                ['name' => 'kk', 'label' => 'Scan Kartu Keluarga (KK)', 'required' => true],
                ['name' => 'surat_pengantar', 'label' => 'Scan Surat Pengantar RT/RW', 'required' => true],
                ['name' => 'bukti_domisili', 'label' => 'Bukti Kepemilikan Rumah / Perjanjian Sewa (Opsional)', 'required' => false],
            ],
            'PENGANTAR_RT_RW' => [
                ['name' => 'ktp', 'label' => 'Scan KTP (Kartu Tanda Penduduk)', 'required' => true],
                ['name' => 'kk', 'label' => 'Scan Kartu Keluarga (KK)', 'required' => true],
            ],
            'USAHA' => [
                ['name' => 'ktp', 'label' => 'Scan KTP (Kartu Tanda Penduduk)', 'required' => true],
                ['name' => 'kk', 'label' => 'Scan Kartu Keluarga (KK)', 'required' => true],
                ['name' => 'foto_usaha', 'label' => 'Foto Tempat Usaha / Produk Usaha', 'required' => true],
                ['name' => 'surat_pengantar', 'label' => 'Scan Surat Pengantar RT/RW (Opsional)', 'required' => false],
            ],
            'TIDAK_MAMPU' => [
                ['name' => 'ktp', 'label' => 'Scan KTP (Kartu Tanda Penduduk)', 'required' => true],
                ['name' => 'kk', 'label' => 'Scan Kartu Keluarga (KK)', 'required' => true],
                ['name' => 'foto_rumah', 'label' => 'Foto Rumah Tampak Depan', 'required' => true],
                ['name' => 'slip_gaji', 'label' => 'Slip Gaji / Surat Pernyataan Penghasilan', 'required' => true],
            ],
            'PINDAH' => [
                ['name' => 'ktp', 'label' => 'Scan KTP (Kartu Tanda Penduduk)', 'required' => true],
                ['name' => 'kk', 'label' => 'Scan Kartu Keluarga (KK)', 'required' => true],
                ['name' => 'pas_foto', 'label' => 'Pas Foto Terbaru (3x4)', 'required' => true],
            ],
            'KEMATIAN' => [
                ['name' => 'ktp_almarhum', 'label' => 'Scan KTP Almarhum/Almarhumah', 'required' => true],
                ['name' => 'ktp_pelapor', 'label' => 'Scan KTP Pelapor', 'required' => true],
                ['name' => 'kk_almarhum', 'label' => 'Scan KK Almarhum & Pelapor', 'required' => true],
                ['name' => 'surat_kematian_rs', 'label' => 'Surat Kematian dari RS / Puskesmas', 'required' => true],
            ],
            'BELUM_MENIKAH' => [
                ['name' => 'ktp', 'label' => 'Scan KTP (Kartu Tanda Penduduk)', 'required' => true],
                ['name' => 'kk', 'label' => 'Scan Kartu Keluarga (KK)', 'required' => true],
                ['name' => 'surat_pernyataan_belum_nikah', 'label' => 'Surat Pernyataan Belum Menikah (Bermaterai)', 'required' => true],
            ],
            'IZIN_KERAMAIAN' => [
                ['name' => 'ktp', 'label' => 'Scan KTP Pemohon', 'required' => true],
                ['name' => 'persetujuan_tetangga', 'label' => 'Surat Pernyataan Persetujuan Tetangga Sekitar', 'required' => true],
                ['name' => 'proposal_acara', 'label' => 'Proposal Acara / Susunan Acara (Opsional)', 'required' => false],
            ],
            'NIKAH' => [
                ['name' => 'ktp_suami_istri', 'label' => 'Scan KTP Calon Suami & Calon Istri', 'required' => true],
                ['name' => 'kk_suami_istri', 'label' => 'Scan KK Calon Suami & Calon Istri', 'required' => true],
                ['name' => 'ktp_orang_tua', 'label' => 'Scan KTP Orang Tua / Wali', 'required' => true],
                ['name' => 'pas_foto', 'label' => 'Pas Foto Calon Pengantin (3x4 & 4x6)', 'required' => true],
            ],
            'BANTUAN_SOSIAL' => [
                ['name' => 'ktp', 'label' => 'Scan KTP (Kartu Tanda Penduduk)', 'required' => true],
                ['name' => 'kk', 'label' => 'Scan Kartu Keluarga (KK)', 'required' => true],
                ['name' => 'foto_rumah', 'label' => 'Foto Kondisi Rumah Tampak Depan', 'required' => true],
                ['name' => 'surat_keterangan_penghasilan', 'label' => 'Surat Keterangan Penghasilan / Slip Gaji', 'required' => true],
            ],
            'PENGADUAN_WARGA' => [
                ['name' => 'bukti_kejadian', 'label' => 'Foto / Video Bukti Kejadian', 'required' => true],
                ['name' => 'ktp_pelapor', 'label' => 'Scan KTP Pelapor (Opsional)', 'required' => false],
            ],
            'RENOVASI' => [
                ['name' => 'ktp', 'label' => 'Scan KTP Pemilik Rumah', 'required' => true],
                ['name' => 'bukti_kepemilikan', 'label' => 'Bukti Kepemilikan Rumah (PBB/Sertifikat)', 'required' => true],
                ['name' => 'persetujuan_tetangga', 'label' => 'Surat Persetujuan Tetangga Kiri/Kanan/Depan/Belakang', 'required' => true],
                ['name' => 'foto_rencana', 'label' => 'Foto Rencana / Desain Renovasi (Opsional)', 'required' => false],
            ],
            'PENDUDUK_SEMENTARA' => [
                ['name' => 'ktp', 'label' => 'Scan KTP Asal', 'required' => true],
                ['name' => 'kk', 'label' => 'Scan Kartu Keluarga (KK) Asal', 'required' => true],
                ['name' => 'surat_keterangan_domisili', 'label' => 'Surat Keterangan Domisili Asal / Tugas Kerja', 'required' => true],
                ['name' => 'jaminan_pemilik', 'label' => 'Surat Jaminan/Keterangan Pemilik Kos/Kontrakan', 'required' => true],
            ],
        ];

        foreach ($requirements as $kode => $reqList) {
            DB::table('jenis_surats')
                ->where('kode', $kode)
                ->update(['upload_requirements' => json_encode($reqList)]);
        }
    }

    public function down(): void
    {
        // No-op
    }
};
